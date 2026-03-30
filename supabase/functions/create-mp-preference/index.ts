import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const mpItems = items.map((item: any) => ({
      title: item.name,
      quantity: Number(item.quantity),
      unit_price: Number(item.price),
      currency_id: 'BRL',
    }));

    const baseUrl = siteUrl || 'https://id-preview--e6490a71-39f9-4221-ade0-cd00fc5d911d.lovable.app';

    // Encode customer data in the back_url so we can use it on the status page
    const customerParam = encodeURIComponent(JSON.stringify(customer));
    const itemsParam = encodeURIComponent(JSON.stringify(items));

    const preference = {
      items: mpItems,
      back_urls: {
        success: `${baseUrl}/pagamento/status?customer=${customerParam}&items=${itemsParam}`,
        failure: `${baseUrl}/pagamento/status?status=failure`,
        pending: `${baseUrl}/pagamento/status?status=pending`,
      },
      auto_return: 'approved',
      payer: {
        name: customer.name,
        phone: { number: customer.phone },
        address: { street_name: customer.address },
      },
      external_reference: `order_${Date.now()}`,
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
