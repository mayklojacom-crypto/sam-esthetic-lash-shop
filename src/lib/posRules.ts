export type PosPayment = 'pix' | 'dinheiro' | 'credito' | 'debito';
export const POS_PAYMENT_LABELS: Record<PosPayment, string> = { pix: 'Pix', dinheiro: 'Dinheiro', credito: 'Crédito', debito: 'Débito' };

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
