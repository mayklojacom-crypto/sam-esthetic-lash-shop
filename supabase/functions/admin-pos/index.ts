import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function adminEmail(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const p = JSON.parse(atob(auth.slice(7)));
    if (Date.now() - p.ts > 86400000 || !p.id) return null;
    return String(p.email ?? p.id);
  } catch { return null; }
}

const SaleSchema = z.object({
  items: z.array(z.object({ product_id: z.string().uuid(), quantity: z.number().int().min(1).max(999) })).min(1).max(100),
  discount: z.number().min(0).max(100000).default(0),
  payment_method: z.enum(["pix", "dinheiro", "credito", "debito"]),
  notes: z.string().max(500).default(""),
});
const IdSchema = z.object({ id: z.string().uuid() });
const RangeSchema = z.object({ from: z.string().datetime(), to: z.string().datetime() });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const who = adminEmail(req);
  if (!who) return json({ error: "Não autorizado" }, 401);
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const action = new URL(req.url).searchParams.get("action");
  try {
    if (action === "products") {
      const { data, error } = await sb.from("products").select("id,name,price,stock,image,active,category").order("name");
      if (error) throw error;
      return json({ products: data });
    }
    const body = await req.json().catch(() => ({}));
    if (action === "sale") {
      const p = SaleSchema.safeParse(body);
      if (!p.success) return json({ error: "Dados inválidos", fields: p.error.flatten() }, 400);
      const { data, error } = await sb.rpc("pos_register_sale", {
        p_items: p.data.items, p_discount: p.data.discount, p_payment_method: p.data.payment_method,
        p_notes: p.data.notes, p_created_by: who,
      });
      if (error) return json({ error: error.message }, 400);
      return json({ sale: data });
    }
    if (action === "cancel") {
      const p = IdSchema.safeParse(body);
      if (!p.success) return json({ error: "Dados inválidos" }, 400);
      const { data, error } = await sb.rpc("pos_cancel_sale", { p_id: p.data.id });
      if (error) return json({ error: error.message }, 400);
      return json({ sale: data });
    }
    if (action === "sales") {
      const p = RangeSchema.safeParse(body);
      if (!p.success) return json({ error: "Período inválido" }, 400);
      const { data, error } = await sb.from("pos_sales").select("*")
        .gte("created_at", p.data.from).lt("created_at", p.data.to).order("created_at", { ascending: false }).limit(1000);
      if (error) throw error;
      return json({ sales: data });
    }
    return json({ error: "Ação inválida" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
