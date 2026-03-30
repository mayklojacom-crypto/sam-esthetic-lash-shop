import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generatePdfContent(order: any): Uint8Array {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR');

  const lines: string[] = [];
  lines.push('SAM ESTHETIC - PEDIDO CONFIRMADO');
  lines.push('');
  lines.push(`Data: ${dateStr} ${timeStr}`);
  lines.push(`Pedido: ${order.external_reference}`);
  lines.push(`Pagamento ID: ${order.payment_id}`);
  lines.push(`Status: APROVADO`);
  lines.push('');
  lines.push('--- DADOS DO CLIENTE ---');
  lines.push(`Nome: ${order.customer_name}`);
  lines.push(`Telefone: ${order.customer_phone}`);
  lines.push(`Endereco: ${order.customer_address}`);
  if (order.customer_notes) lines.push(`Obs: ${order.customer_notes}`);
  lines.push('');
  lines.push('--- ITENS DO PEDIDO ---');

  let total = 0;
  const items = order.items as any[];
  for (const item of items) {
    const subtotal = item.price * item.quantity;
    total += subtotal;
    lines.push(`${item.quantity}x ${item.name} - R$ ${subtotal.toFixed(2)}`);
  }

  lines.push('');
  lines.push(`TOTAL: R$ ${total.toFixed(2)}`);
  lines.push('');
  lines.push('Obrigada pela compra!');
  lines.push('Sam Esthetic - Lash Design');

  const streamContent = `BT\n/F1 11 Tf\n50 750 Td\n14 TL\n${lines.map(l => `(${l.replace(/[()\\]/g, '\\$&')}) '`).join('\n')}\nET`;

  const objects: string[] = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  objects.push(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj`);
  objects.push(`4 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj`);
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdf.length);
    pdf += objects[i] + '\n';
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Webhook received:', JSON.stringify(body));

    // Mercado Pago sends different notification types
    // We only care about payment notifications
    if (body.type !== 'payment' && body.action !== 'payment.updated' && body.action !== 'payment.created') {
      return new Response(JSON.stringify({ received: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      console.log('No payment ID in webhook');
      return new Response(JSON.stringify({ received: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch payment details from Mercado Pago
    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN');
    if (!MP_ACCESS_TOKEN) {
      throw new Error('MP_ACCESS_TOKEN not configured');
    }

    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
    });
    const payment = await paymentResponse.json();
    console.log('Payment status:', payment.status, 'Reference:', payment.external_reference);

    if (payment.status !== 'approved') {
      // Update order status but don't generate PDF
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.from('orders').update({
        payment_id: String(paymentId),
        payment_status: payment.status,
        updated_at: new Date().toISOString(),
      }).eq('external_reference', payment.external_reference);

      return new Response(JSON.stringify({ received: true, status: payment.status }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Payment approved! Fetch order from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('external_reference', payment.external_reference)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', payment.external_reference, orderError);
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Skip if already processed
    if (order.payment_status === 'approved' && order.pdf_url) {
      console.log('Order already processed:', order.external_reference);
      return new Response(JSON.stringify({ received: true, already_processed: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate PDF
    const orderWithPayment = { ...order, payment_id: String(paymentId) };
    const pdfBytes = generatePdfContent(orderWithPayment);
    const fileName = `pedido_${paymentId}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('order-pdfs')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('order-pdfs')
      .getPublicUrl(fileName);
    const pdfUrl = urlData.publicUrl;

    // Update order in database
    await supabase.from('orders').update({
      payment_id: String(paymentId),
      payment_status: 'approved',
      pdf_url: pdfUrl,
      updated_at: new Date().toISOString(),
    }).eq('external_reference', payment.external_reference);

    // Send WhatsApp notification to store owner
    const WHATSAPP_NUMBER = '5562998755213';
    const items = order.items as any[];
    let total = 0;
    const itemsList = items.map((i: any) => {
      const sub = i.price * i.quantity;
      total += sub;
      return `▪️ ${i.quantity}x ${i.name} — R$ ${sub.toFixed(2)}`;
    }).join('\n');

    const message = `🛍️ *PEDIDO PAGO — Sam Esthetic*\n\n` +
      `✅ *Pagamento APROVADO via Mercado Pago*\n` +
      `*Payment ID:* ${paymentId}\n\n` +
      `*Cliente:* ${order.customer_name}\n` +
      `*Telefone:* ${order.customer_phone}\n` +
      `*Endereço:* ${order.customer_address}\n` +
      `${order.customer_notes ? `*Obs:* ${order.customer_notes}\n` : ''}` +
      `\n*Itens:*\n${itemsList}\n\n` +
      `💰 *Total: R$ ${total.toFixed(2)}*\n\n` +
      `📄 *PDF do pedido:* ${pdfUrl}`;

    // Log the WhatsApp URL (actual sending would need WhatsApp Business API)
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    console.log('WhatsApp notification URL:', whatsappUrl);

    return new Response(JSON.stringify({ 
      received: true, 
      processed: true,
      pdfUrl,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
