import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let session_id: string | null = null;
    let firstOfDay = false;
    try {
      const body = await req.json();
      session_id = body?.session_id ?? null;
      firstOfDay = !!body?.firstOfDay;
    } catch {
      // no body
    }

    const today = new Date().toISOString().split("T")[0];

    // Live presence upsert
    if (session_id) {
      await supabase
        .from("live_visitors")
        .upsert({ session_id, last_seen: new Date().toISOString() }, { onConflict: "session_id" });
    }

    // Daily visits: increment only when the client says it's the first ping of the day for this session
    if (firstOfDay || !session_id) {
      const { data: existing } = await supabase
        .from("daily_visits")
        .select("id, visit_count")
        .eq("visit_date", today)
        .limit(1);

      if (existing && existing.length > 0) {
        await supabase
          .from("daily_visits")
          .update({ visit_count: existing[0].visit_count + 1 })
          .eq("id", existing[0].id);
      } else {
        await supabase.from("daily_visits").insert({ visit_date: today, visit_count: 1 });
      }
    }

    // Cleanup stale rows (> 5min) & update peak
    const cutoff = new Date(Date.now() - 5 * 60_000).toISOString();
    await supabase.from("live_visitors").delete().lt("last_seen", cutoff);

    const since = new Date(Date.now() - 2 * 60_000).toISOString();
    const { count: online } = await supabase
      .from("live_visitors")
      .select("*", { count: "exact", head: true })
      .gte("last_seen", since);

    if (online !== null) {
      const { data: peak } = await supabase
        .from("visitor_peaks")
        .select("id, peak_count")
        .eq("peak_date", today)
        .limit(1);
      if (peak && peak.length > 0) {
        if (online > peak[0].peak_count) {
          await supabase.from("visitor_peaks").update({ peak_count: online, updated_at: new Date().toISOString() }).eq("id", peak[0].id);
        }
      } else {
        await supabase.from("visitor_peaks").insert({ peak_date: today, peak_count: online });
      }
    }

    return new Response(JSON.stringify({ ok: true, online }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
