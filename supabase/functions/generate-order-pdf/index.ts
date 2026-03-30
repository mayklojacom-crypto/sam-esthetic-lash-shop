import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generatePdfContent(order: any): Uint8Array {
  // Generate a simple PDF manually (PDF 1.4 spec)
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR');

  const lines: string[] = [];
  lines.push('SAM ESTHETIC - PEDIDO CONFIRMADO');
  lines.push('');
  lines.push(`Data: ${dateStr} ${timeStr}`);
  lines.push(`Pedido: ${order.payment_id || order.reference}`);
  lines.push(`Status: ${order.status === 'approved' ? 'APROVADO' : order.status?.toUpperCase()}`);
  lines.push('');
  lines.push('--- DADOS DO CLIENTE ---');
  lines.push(`Nome: ${order.customer.name}`);
  lines.push(`Telefone: ${order.customer.phone}`);
  lines.push(`Endereco: ${order.customer.address}`);
  if (order.customer.notes) lines.push(`Obs: ${order.customer.notes}`);
  lines.push('');
  lines.push('--- ITENS DO PEDIDO ---');

  let total = 0;
  for (const item of order.items) {
    const subtotal = item.price * item.quantity;
    total += subtotal;
    lines.push(`${item.quantity}x ${item.name} - R$ ${subtotal.toFixed(2)}`);
  }

  lines.push('');
  lines.push(`TOTAL: R$ ${total.toFixed(2)}`);
  lines.push('');
  lines.push('Obrigada pela compra!');
  lines.push('Sam Esthetic - Lash Design');

  // Build a minimal valid PDF
  const textContent = lines.join('\n');
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
    const { items, customer, payment_id, status, reference } = await req.json();

    if (!items || !customer) {
      return new Response(JSON.stringify({ error: 'Items and customer data required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const order = { items, customer, payment_id, status, reference };
    const pdfBytes = generatePdfContent(order);

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const fileName = `pedido_${payment_id || Date.now()}.pdf`;

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

    // Build WhatsApp message
    const WHATSAPP_NUMBER = '5562998755213';
    let total = 0;
    const itemsList = items.map((i: any) => {
      const sub = i.price * i.quantity;
      total += sub;
      return `▪️ ${i.quantity}x ${i.name} — R$ ${sub.toFixed(2)}`;
    }).join('\n');

    const message = `🛍️ *PEDIDO PAGO — Sam Esthetic*\n\n` +
      `✅ *Pagamento confirmado via Mercado Pago*\n` +
      `*ID:* ${payment_id}\n\n` +
      `*Cliente:* ${customer.name}\n` +
      `*Telefone:* ${customer.phone}\n` +
      `*Endereço:* ${customer.address}\n` +
      `${customer.notes ? `*Obs:* ${customer.notes}\n` : ''}` +
      `\n*Itens:*\n${itemsList}\n\n` +
      `💰 *Total: R$ ${total.toFixed(2)}*\n\n` +
      `📄 *PDF do pedido:* ${pdfUrl}`;

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    return new Response(JSON.stringify({ 
      success: true, 
      pdfUrl,
      whatsappUrl,
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
