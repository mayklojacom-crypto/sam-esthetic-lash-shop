import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function validateToken(req: Request): boolean {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  try {
    const payload = JSON.parse(atob(auth.replace("Bearer ", "")));
    if (Date.now() - payload.ts > 86400000) return false;
    return !!payload.id;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (!validateToken(req)) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (action === "list") {
      const status = url.searchParams.get("status");
      const search = url.searchParams.get("search");
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = 20;
      const offset = (page - 1) * limit;

      let query = supabase.from("leads").select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (status && status !== "todos") query = query.eq("status", status);
      if (search) query = query.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);

      const { data, count, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ leads: data, total: count }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "update") {
      const body = await req.json();
      const { id, status, notes } = body;
      const updates: Record<string, unknown> = {};
      if (status) updates.status = status;
      if (notes !== undefined) updates.notes = notes;
      const { data, error } = await supabase.from("leads").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "delete") {
      const body = await req.json();
      const { error } = await supabase.from("leads").delete().eq("id", body.id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
