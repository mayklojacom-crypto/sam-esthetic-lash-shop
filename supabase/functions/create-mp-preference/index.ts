import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { validatedPayment } from '../_shared/validated-payment.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Método inválido' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN');
    if (!MP_ACCESS_TOKEN) {
      throw new Error('MP_ACCESS_TOKEN not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) throw new Error('Pagamento não configurado');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const priced = await validatedPayment(await req.json(), supabase, supabaseKey);
    const { items, customer, total } = priced;
    if (Math.round(priced.expectedTotal * 100) !== Math.round(total * 100)) return new Response(JSON.stringify({ error: 'O valor foi atualizado. Confira o total e confirme novamente.', code: 'TOTAL_CHANGED', pricing: { subtotal: priced.subtotal, discount: priced.discount, freight: priced.freight, total } }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const externalReference = `order_${crypto.randomUUID()}`;
    const baseUrl = 'https://lash-glam-shop.lovable.app';
    const mpItems = [{ title: 'Pedido Sam Esthetic com entrega local', quantity: 1, unit_price: total, currency_id: 'BRL' }];

    const { error: insertError } = await supabase.from('orders').insert({
      external_reference: externalReference,
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_address: customer.address,
      customer_notes: customer.notes || '',
      customer_cpf: customer.cpf || '',
      items: items,
      total,
    });

    if (insertError) {
      console.error('Error saving order:', insertError);
      throw new Error('Failed to save order');
    }

    const preference = {
      items: mpItems,
      back_urls: {
        success: `${baseUrl}/pagamento/status?status=approved&ref=${externalReference}`,
        failure: `${baseUrl}/pagamento/status?status=failure`,
        pending: `${baseUrl}/pagamento/status?status=pending&ref=${externalReference}`,
      },
      auto_return: 'approved',
      payer: {
        name: customer.name,
        phone: { number: customer.phone },
        address: { street_name: customer.address },
      },
      external_reference: externalReference,
      notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
    };

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Mercado Pago error:', mpData);
      return new Response(JSON.stringify({ error: 'Failed to create payment preference', details: mpData }), {
        status: mpResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ init_point: mpData.init_point, id: mpData.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Pagamento indisponível' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
