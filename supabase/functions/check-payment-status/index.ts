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

    const { payment_id } = await req.json();

    if (!payment_id) {
      return new Response(JSON.stringify({ error: 'payment_id is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check payment status on Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      },
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('MP status check error:', mpData);
      return new Response(JSON.stringify({ error: 'Failed to check payment status' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // If approved, update order in database
    if (mpData.status === 'approved') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.from('orders').update({
        payment_status: 'approved',
        payment_id: String(mpData.id),
      }).eq('external_reference', mpData.external_reference);

      // Generate PDF
      try {
        await fetch(`${supabaseUrl}/functions/v1/generate-order-pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({ external_reference: mpData.external_reference }),
        });
      } catch (e) {
        console.error('PDF generation error (non-blocking):', e);
      }
    }

    return new Response(JSON.stringify({
      status: mpData.status,
      status_detail: mpData.status_detail,
      external_reference: mpData.external_reference,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
