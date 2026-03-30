import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN');
    if (!MP_ACCESS_TOKEN) {
      throw new Error('MP_ACCESS_TOKEN not configured');
    }

    const { items, customer, siteUrl } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Items are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!customer || !customer.name || !customer.phone || !customer.address) {
      return new Response(JSON.stringify({ error: 'Customer data is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Calculate total
    let total = 0;
    const mpItems = items.map((item: any) => {
      const price = Number(item.price);
      const quantity = Number(item.quantity);
      total += price * quantity;
      return {
        title: item.name,
        quantity,
        unit_price: price,
        currency_id: 'BRL',
      };
    });

    const externalReference = `order_${Date.now()}`;
    const baseUrl = siteUrl || 'https://samestheticlash.shop';

    // Save order to database so webhook can retrieve it
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ init_point: mpData.init_point, id: mpData.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
