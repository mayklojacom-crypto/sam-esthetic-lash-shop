import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { verifyAdminSession } from '../_shared/admin-session.ts';

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const SaleSchema = z.object({
  items: z.array(z.object({ product_id: z.string().uuid(), quantity: z.number().int().min(1).max(999) })).min(1).max(100),
  discount: z.number().min(0).max(100000).default(0),
  payment_method: z.enum(["pix", "dinheiro", "credito", "debito"]),
  notes: z.string().max(500).default(""),
});
const IdSchema = z.object({ id: z.string().uuid() });
const RangeSchema = z.object({ from: z.string().datetime(), to: z.string().datetime() });
const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v);
const ExpenseSchema = z.object({
  description: z.string().trim().min(1).max(200),
  category: z.enum(['anuncios', 'produtos', 'aluguel', 'transporte', 'outros']),
  amount: z.number().positive().max(99999999.99).refine(v => Math.abs(v * 100 - Math.round(v * 100)) < 0.00001),
  expense_date: DateSchema,
  payment_method: z.enum(['pix', 'dinheiro', 'credito', 'debito']),
  notes: z.string().max(500).default(''),
});
const ExpenseRangeSchema = z.object({ from: DateSchema, to: DateSchema }).refine(p => p.from <= p.to);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = Deno.env.get('SUPABASE_URL');
  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !secret) return json({ error: 'Serviço indisponível' }, 503);
  const auth = req.headers.get('authorization');
  const who = auth?.startsWith('Bearer ') ? await verifyAdminSession(auth.slice(7), secret) : null;
  if (!who) return json({ error: "Não autorizado" }, 401);
  const sb = createClient(url, secret);
  const action = new URL(req.url).searchParams.get("action");
  try {
    if (action === "products") {
      const { data, error } = await sb.from("products").select("id,name,price,stock,image,active,category").order("name");
      if (error) throw error;
      return json({ products: data });
    }
    const body = await req.json().catch(() => ({}));
    if (action === 'expense') {
      const p = ExpenseSchema.safeParse(body);
      if (!p.success) return json({ error: 'Preencha descrição, data e valor positivo com até dois decimais' }, 400);
      const { data, error } = await sb.from('pos_expenses').insert({ ...p.data, created_by: who }).select().single();
      if (error) throw error;
      return json({ expense: data });
    }
    if (action === 'expenses') {
      const p = ExpenseRangeSchema.safeParse(body);
      if (!p.success) return json({ error: 'Período inválido' }, 400);
      const { data, error } = await sb.from('pos_expenses').select('*').gte('expense_date', p.data.from).lte('expense_date', p.data.to).order('expense_date', { ascending: false });
      if (error) throw error;
      return json({ expenses: data });
    }
    if (action === 'cancel-expense') {
      const p = IdSchema.safeParse(body);
      if (!p.success) return json({ error: 'Despesa inválida' }, 400);
      const { error } = await sb.from('pos_expenses').update({ cancelled: true, cancelled_at: new Date().toISOString() }).eq('id', p.data.id).eq('cancelled', false);
      if (error) throw error;
      return json({ success: true });
    }
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
