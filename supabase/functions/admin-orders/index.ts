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
      const now = new Date();
      const toParam = url.searchParams.get("to");
      const fromParam = url.searchParams.get("from");
      const to = toParam ? new Date(toParam + "T23:59:59.999Z") : now;
      const from = fromParam ? new Date(fromParam + "T00:00:00.000Z") : new Date(now.getTime() - 6 * 86400000);
      const spanMs = to.getTime() - from.getTime();
      const prevTo = new Date(from.getTime() - 1);
      const prevFrom = new Date(from.getTime() - spanMs - 1);

      const today = new Date().toISOString().split("T")[0];

      // Totals lifetime (kept for reference)
      const { count: totalOrdersLifetime } = await supabase.from("orders").select("*", { count: "exact", head: true });

      // Orders in period
      const { data: periodOrders } = await supabase
        .from("orders")
        .select("total, payment_status, created_at")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString());
      const totalOrders = periodOrders?.length || 0;
      const totalRevenue = periodOrders?.filter(o => ["approved", "paid"].includes(o.payment_status || "")).reduce((s, o) => s + Number(o.total), 0) || 0;

      // Previous period for comparison
      const { data: prevOrders } = await supabase
        .from("orders")
        .select("total, payment_status")
        .gte("created_at", prevFrom.toISOString())
        .lte("created_at", prevTo.toISOString());
      const prevTotalOrders = prevOrders?.length || 0;
      const prevRevenue = prevOrders?.filter(o => ["approved", "paid"].includes(o.payment_status || "")).reduce((s, o) => s + Number(o.total), 0) || 0;

      const pct = (curr: number, prev: number) => prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;
      const revenueDelta = pct(totalRevenue, prevRevenue);
      const ordersDelta = pct(totalOrders, prevTotalOrders);

      const { count: todayOrders } = await supabase.from("orders").select("*", { count: "exact", head: true }).gte("created_at", today);

      // Visits in period
      const fromDate = from.toISOString().split("T")[0];
      const toDate = to.toISOString().split("T")[0];
      const { data: visitData } = await supabase
        .from("daily_visits")
        .select("visit_date, visit_count")
        .gte("visit_date", fromDate)
        .lte("visit_date", toDate)
        .order("visit_date", { ascending: true });

      const todayVisits = visitData?.find(v => v.visit_date === today)?.visit_count || 0;
      const totalVisits = visitData?.reduce((s, v) => s + v.visit_count, 0) || 0;

      // Prev visits
      const prevFromDate = prevFrom.toISOString().split("T")[0];
      const prevToDate = prevTo.toISOString().split("T")[0];
      const { data: prevVisitData } = await supabase
        .from("daily_visits")
        .select("visit_count")
        .gte("visit_date", prevFromDate)
        .lte("visit_date", prevToDate);
      const prevTotalVisits = prevVisitData?.reduce((s, v) => s + v.visit_count, 0) || 0;
      const visitsDelta = pct(totalVisits, prevTotalVisits);

      // Orders per day in period
      const ordersByDay: Record<string, number> = {};
      const days = Math.max(1, Math.ceil(spanMs / 86400000) + 1);
      for (let i = 0; i < days; i++) {
        const d = new Date(from.getTime() + i * 86400000).toISOString().split("T")[0];
        ordersByDay[d] = 0;
      }
      periodOrders?.forEach(o => {
        const d = o.created_at.split("T")[0];
        if (ordersByDay[d] !== undefined) ordersByDay[d]++;
      });

      const visitsByDay = visitData || [];

      const { data: latestOrders } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(5);

      return new Response(JSON.stringify({
        totalOrders,
        totalOrdersLifetime: totalOrdersLifetime || 0,
        todayOrders: todayOrders || 0,
        totalRevenue,
        totalVisits,
        todayVisits,
        revenueDelta,
        ordersDelta,
        visitsDelta,
        visits: visitsByDay,
        ordersByDay,
        latestOrders: latestOrders || [],
        period: { from: fromDate, to: toDate },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }


    return new Response(JSON.stringify({ error: "Ação inválida" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
