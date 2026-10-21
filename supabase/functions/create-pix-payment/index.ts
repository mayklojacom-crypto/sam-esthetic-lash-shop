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
    if (Math.round(priced.expectedTotal * 100) !== Math.round(total * 100)) return new Response(JSON.stringify({ error: 'O valor foi atualizado. Confira o total e confirme novamente.', code: 'TOTAL_CHANGED', pricing: priced }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const externalReference = `order_${crypto.randomUUID()}`;

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

    // Clean CPF for MP API
    const cpfClean = customer.cpf.replace(/\D/g, '');

    // Create Pix payment via Mercado Pago API
    const description = items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ');

    const paymentBody = {
      transaction_amount: total,
      description: description.slice(0, 200),
      payment_method_id: 'pix',
      payer: {
        email: customer.email,
        first_name: customer.name.split(' ')[0],
        last_name: customer.name.split(' ').slice(1).join(' ') || customer.name,
        identification: {
          type: 'CPF',
          number: cpfClean,
        },
      },
      external_reference: externalReference,
      notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
    };

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'X-Idempotency-Key': externalReference,
      },
      body: JSON.stringify(paymentBody),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Mercado Pago error:', JSON.stringify(mpData));
      return new Response(JSON.stringify({ error: 'Failed to create Pix payment', details: mpData }), {
        status: mpResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update order with payment_id
    await supabase.from('orders').update({
      payment_id: String(mpData.id),
      payment_status: mpData.status,
    }).eq('external_reference', externalReference);

    const transactionData = mpData.point_of_interaction?.transaction_data;

    return new Response(JSON.stringify({
      payment_id: mpData.id,
      status: mpData.status,
      qr_code_base64: transactionData?.qr_code_base64 || null,
      qr_code: transactionData?.qr_code || null,
      ticket_url: transactionData?.ticket_url || null,
      external_reference: externalReference,
      total,
      freight: priced.freight,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Não foi possível gerar o Pix' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
