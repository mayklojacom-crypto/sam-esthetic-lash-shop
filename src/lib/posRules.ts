export type PosPayment = 'pix' | 'dinheiro' | 'credito' | 'debito';
export const POS_PAYMENT_LABELS: Record<PosPayment, string> = { pix: 'Pix', dinheiro: 'Dinheiro', credito: 'Crédito', debito: 'Débito' };
export const POS_EXPENSE_LABELS = { anuncios: 'Anúncios', produtos: 'Compra de produtos', aluguel: 'Aluguel', transporte: 'Transporte', outros: 'Outros' };
export interface PosExpenseLike { amount: number | string; cancelled: boolean; payment_method: string }
export function posBalance(sales: PosSaleLike[], expenses: PosExpenseLike[]) {
  const sold = posSummary(sales);
  const costs = posSummary(expenses.map(e => ({ total: e.amount, cancelled: e.cancelled, payment_method: e.payment_method })));
  return { expenses: costs.total, balance: r2(sold.total - costs.total), byMethod: Object.fromEntries(Object.keys(POS_PAYMENT_LABELS).map(m => [m, r2((sold.byMethod[m] || 0) - (costs.byMethod[m] || 0))])) };
}
export interface PosShareData {
  id?: string; cancelled?: boolean; created_at?: string;
  items: { name: string; quantity: number; unit_price: number; line_total: number }[];
  subtotal: number; discount: number; total: number; payment_method: string | null;
}
export function posShareUrl(sale: PosShareData) {
  const money = (v: number) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const title = sale.id ? `Venda ${sale.cancelled ? 'cancelada' : 'registrada'} #${sale.id.slice(0, 8)}` : 'Resumo do pedido — ainda não registrado';
  const text = ['SAM ESTHETIC', title,
    ...(sale.created_at ? [new Date(sale.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })] : []),
    ...sale.items.map(i => `${i.quantity}× ${i.name} · ${money(i.unit_price)} cada · ${money(i.line_total)}`),
    `Subtotal: ${money(sale.subtotal)}`, `Desconto: ${money(sale.discount)}`, `Total: ${money(sale.total)}`,
    `Forma de pagamento: ${POS_PAYMENT_LABELS[sale.payment_method as PosPayment] || 'Não escolhida'}`,
  ].join('\n');
  return `https://wa.me/5562998755213?text=${encodeURIComponent(text)}`;
}

export interface PosSaleLike { total: number | string; payment_method: string; cancelled: boolean; }

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Preview of the server total: subtotal minus discount, discount capped to [0, subtotal]. */
export function posTotals(lines: { price: number; quantity: number }[], discount: number) {
  const subtotal = r2(lines.reduce((s, l) => s + r2(l.price * l.quantity), 0));
  const d = r2(Math.min(Math.max(discount || 0, 0), subtotal));
  return { subtotal, discount: d, total: r2(subtotal - d) };
}

/** Totals per payment method, ignoring cancelled sales. */
export function posSummary(sales: PosSaleLike[]) {
  const byMethod: Record<string, number> = {};
  let total = 0; let count = 0;
  for (const s of sales) {
    if (s.cancelled) continue;
    const v = Number(s.total);
    byMethod[s.payment_method] = r2((byMethod[s.payment_method] || 0) + v);
    total = r2(total + v); count++;
  }
  return { total, count, byMethod };
}
