import { z } from 'npm:zod@3';
import { verifyQuote, routePrice } from './freight-quote.ts';
import { priceOrder } from './payment-pricing.ts';

export const paymentSchema = z.object({
  items: z.array(z.object({ id: z.string().uuid(), quantity: z.number().int().min(1).max(100), size: z.string().max(100).optional() })).min(1).max(50),
  customer: z.object({ name: z.string().trim().min(2).max(100), phone: z.string().trim().min(10).max(20),
    email: z.string().email().max(254), cpf: z.string().min(11).max(14), notes: z.string().max(500).optional(), complement: z.string().max(100).optional() }),
  delivery: z.object({ cep: z.string().regex(/^\d{8}$/), number: z.string().trim().min(1).max(10), quoteToken: z.string().min(20).max(6000) }),
  couponCode: z.string().trim().max(50).optional(),
  expectedTotal: z.number().finite().positive(),
  siteUrl: z.string().url().optional(),
});

export async function validatedPayment(body: unknown, db: any, secret: string) {
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) throw new Error('Confira os produtos, seus dados e o número do endereço antes de pagar.');
  const input = parsed.data;
  const quote = await verifyQuote(input.delivery.quoteToken, secret, input.delivery.cep, input.delivery.number);
  const ids = [...new Set(input.items.map(i => i.id))];
  const { data: products, error } = await db.from('products').select('id,name,price,active,stock,sizes').in('id', ids);
  if (error || !products) throw new Error('Não foi possível conferir os produtos. Tente novamente.');
  let percent = 0;
  if (input.couponCode) {
    const { data: coupon, error: couponError } = await db.from('coupons').select('discount_percent').eq('code', input.couponCode.toUpperCase()).eq('active', true).maybeSingle();
    if (couponError || !coupon) throw new Error('Cupom inválido ou expirado. Remova o cupom e tente novamente.');
    percent = Number(coupon.discount_percent);
  }
  const pricing = priceOrder(input.items, products, routePrice(quote.distanceMeters), percent);
  const customer = { ...input.customer, address: [quote.street, input.delivery.number, input.customer.complement, quote.neighborhood,
    `${quote.city} - ${quote.state}`, `CEP: ${quote.cep}`].filter(Boolean).join(', ') };
  return { ...pricing, customer, expectedTotal: input.expectedTotal, siteUrl: input.siteUrl };
}