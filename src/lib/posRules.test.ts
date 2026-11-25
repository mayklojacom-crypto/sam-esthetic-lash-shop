import { describe, it, expect } from 'vitest';
import { posTotals, posSummary } from './posRules';

describe('posRules', () => {
  it('subtracts discount from subtotal', () => {
    expect(posTotals([{ price: 21, quantity: 2 }, { price: 7, quantity: 1 }], 5)).toEqual({ subtotal: 49, discount: 5, total: 44 });
  });
  it('never lets discount exceed subtotal', () => {
    expect(posTotals([{ price: 10, quantity: 1 }], 50).total).toBe(0);
  });
  it('cancelled sales do not count in the cash report', () => {
    const s = posSummary([
      { total: 30, payment_method: 'pix', cancelled: false },
      { total: 20, payment_method: 'dinheiro', cancelled: false },
      { total: 99, payment_method: 'pix', cancelled: true },
    ]);
    expect(s).toEqual({ total: 50, count: 2, byMethod: { pix: 30, dinheiro: 20 } });
  });
});
