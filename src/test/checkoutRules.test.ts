import { describe, it, expect } from 'vitest';
import { checkoutTotals, confirmedPurchase, formatBRL, isServedCity } from '@/lib/checkoutRules';

describe('local delivery', () => {
  it('serves Goiânia in GO without a CEP prefix condition', () => expect(isServedCity('Goiânia', 'GO')).toBe(true));
  it('serves Aparecida de Goiânia in GO', () => expect(isServedCity('Aparecida de Goiania', 'GO')).toBe(true));
  it('rejects other municipalities', () => expect(isServedCity('Brasília', 'DF')).toBe(false));
  it('rejects matching city names outside GO', () => expect(isServedCity('Goiânia', 'SP')).toBe(false));
});
describe('totals', () => {
  it('never turns pending freight into a zero total', () => {
    expect(checkoutTotals(100)).toEqual({ subtotal: 100, discount: 0, productsTotal: 100, freight: null, total: null });
  });
  it('adds confirmed freight without discounting it', () => expect(checkoutTotals(100, .1, 12).total).toBe(102));
  it('allows zero freight only when explicitly confirmed', () => expect(checkoutTotals(100, 0, 0).total).toBe(100));
  it('rounds coupon savings in cents', () => expect(checkoutTotals(19.99, .1, 8).total).toBe(25.99));
  it('formats BRL with Brazilian decimal and thousands separators', () => expect(formatBRL(1234.5).replace(/\s/g, ' ')).toBe('R$ 1.234,50'));
});
describe('verified purchases', () => {
  it('does not accept a success URL without an order', () => expect(confirmedPurchase(null, 'approved')).toBeNull());
  it.each(['pending', 'rejected', 'cancelled'])('does not count %s as purchase', payment_status => {
    expect(confirmedPurchase({ external_reference: 'order_1', payment_status, total: 100 }, 'order_1')).toBeNull();
  });
  it('requires the exact reference', () => expect(confirmedPurchase({ external_reference: 'order_2', payment_status: 'approved', total: 100 }, 'order_1')).toBeNull());
  it('returns an approved reference as the stable deduplication ID, BRL and verified value', () => {
    expect(confirmedPurchase({ external_reference: 'order_1', payment_status: 'approved', total: 102 }, 'order_1')).toEqual({ transaction_id: 'order_1', currency: 'BRL', value: 102 });
  });
  it('rejects invalid values', () => expect(confirmedPurchase({ external_reference: 'order_1', payment_status: 'approved', total: NaN }, 'order_1')).toBeNull());
});