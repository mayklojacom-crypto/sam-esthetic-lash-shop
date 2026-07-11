import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const since = new Date(Date.now() - 2 * 60_000).toISOString();
    const today = new Date().toISOString().split("T")[0];

    const { count: online } = await supabase
      .from("live_visitors")
      .select("*", { count: "exact", head: true })
      .gte("last_seen", since);

    const { data: peakRow } = await supabase
      .from("visitor_peaks")
      .select("peak_count")
      .eq("peak_date", today)
      .maybeSingle();

    return new Response(
      JSON.stringify({ online: online || 0, peakToday: peakRow?.peak_count || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
