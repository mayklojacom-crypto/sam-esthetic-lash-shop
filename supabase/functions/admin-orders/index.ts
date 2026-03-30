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
    // Token valid for 24h
    if (Date.now() - payload.ts > 86400000) return false;
    return !!payload.id;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

      let query = supabase.from("orders").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(offset, offset + limit - 1);

      if (status && status !== "todos") {
        query = query.eq("order_status", status);
      }
      if (search) {
        query = query.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,external_reference.ilike.%${search}%`);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ orders: data, total: count }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "get") {
      const id = url.searchParams.get("id");
      const { data, error } = await supabase.from("orders").select("*").eq("id", id).single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "update") {
      const body = await req.json();
      const { id, order_status, tracking_code } = body;
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (order_status) updates.order_status = order_status;
      if (tracking_code !== undefined) updates.tracking_code = tracking_code;

      const { data, error } = await supabase.from("orders").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "dashboard") {
      // Stats
      const { count: totalOrders } = await supabase.from("orders").select("*", { count: "exact", head: true });
      
      const today = new Date().toISOString().split("T")[0];
      const { count: todayOrders } = await supabase.from("orders").select("*", { count: "exact", head: true }).gte("created_at", today);

      const { data: revenueData } = await supabase.from("orders").select("total").in("payment_status", ["approved", "paid"]);
      const totalRevenue = revenueData?.reduce((sum, o) => sum + Number(o.total), 0) || 0;

      const { data: visitData } = await supabase.from("daily_visits").select("visit_date, visit_count").order("visit_date", { ascending: false }).limit(30);

      const todayVisits = visitData?.find(v => v.visit_date === today)?.visit_count || 0;

      // Last 7 days orders
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data: recentOrders } = await supabase.from("orders").select("created_at").gte("created_at", sevenDaysAgo);

      const ordersByDay: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
        ordersByDay[d] = 0;
      }
      recentOrders?.forEach(o => {
        const d = o.created_at.split("T")[0];
        if (ordersByDay[d] !== undefined) ordersByDay[d]++;
      });

      const { data: latestOrders } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(5);

      return new Response(JSON.stringify({
        totalOrders: totalOrders || 0,
        todayOrders: todayOrders || 0,
        totalRevenue,
        todayVisits,
        visits: visitData || [],
        ordersByDay,
        latestOrders: latestOrders || [],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
