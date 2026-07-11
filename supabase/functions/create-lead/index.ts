import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LeadSchema = z.object({
  customer_name: z.string().trim().min(2).max(120),
  customer_phone: z.string().trim().min(8).max(30),
  items: z.array(z.object({
    name: z.string().max(200),
    quantity: z.number().int().positive(),
    price: z.number().nonnegative(),
    size: z.string().max(30).optional().nullable(),
  })).max(50).default([]),
  total: z.number().nonnegative().default(0),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const body = await req.json();
    const parsed = LeadSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase.from("leads").insert({
      customer_name: parsed.data.customer_name,
      customer_phone: parsed.data.customer_phone,
      items: parsed.data.items,
      total: parsed.data.total,
    }).select("id").single();

    if (error) throw error;

    return new Response(JSON.stringify({ id: data.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
