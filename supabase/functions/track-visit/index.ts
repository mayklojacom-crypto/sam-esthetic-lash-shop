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

    const today = new Date().toISOString().split("T")[0];

    // Upsert: increment visit_count or create new row
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
      await supabase
        .from("daily_visits")
        .insert({ visit_date: today, visit_count: 1 });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
