// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { priceOrder } from '../../supabase/functions/_shared/payment-pricing';
import { FREIGHT_VERSION, routePrice, signQuote, verifyQuote, type FreightQuote } from '../../supabase/functions/_shared/freight-quote';

const product = { id: 'p1', name: 'Cola', price: 20, stock: 5, active: true, sizes: null };
const quote: FreightQuote = { version: FREIGHT_VERSION, cep: '74963580', number: '10', street: 'Rua', neighborhood: 'Centro', city: 'Aparecida de Goiânia', state: 'GO', distanceMeters: 5010, expiresAt: Date.now() + 60_000 };
const secret = 'unit-test-only-signing-key';
describe('server payment totals', () => {
  it('ignores tampered browser price and adds R$6.01 freight', () => {
    const item = { id: 'p1', quantity: 2, price: 0.01 };
    expect(priceOrder([item], [product], 6.01).total).toBe(46.01);
  });
  it('discounts products only and preserves item snapshot total', () => {
    const result = priceOrder([{ id: 'p1', quantity: 2 }], [product], 6.01, 10);
    expect(result.total).toBe(42.01);
    expect(result.items.reduce((sum, i) => sum + i.price * i.quantity, 0)).toBeCloseTo(42.01);
  });
  it.each([0, -1, 1.5, 101, NaN, Infinity])('rejects invalid quantity %s', quantity => expect(() => priceOrder([{ id: 'p1', quantity }], [product], 7)).toThrow());
  it('rejects missing products', () => expect(() => priceOrder([{ id: 'missing', quantity: 1 }], [product], 7)).toThrow());
  it('rejects inactive products', () => expect(() => priceOrder([{ id: 'p1', quantity: 1 }], [{ ...product, active: false }], 7)).toThrow());
  it('sums stock use across repeated lines', () => expect(() => priceOrder([{ id: 'p1', quantity: 3 }, { id: 'p1', quantity: 3 }], [product], 7)).toThrow());
  it('rejects zero stock', () => expect(() => priceOrder([{ id: 'p1', quantity: 1 }], [{ ...product, stock: 0 }], 7)).toThrow());
  it('rejects an invalid model', () => expect(() => priceOrder([{ id: 'p1', quantity: 1, size: '12' }], [{ ...product, sizes: ['10'] }], 7)).toThrow());
  it.each([-1, NaN, Infinity])('rejects freight %s', freight => expect(() => priceOrder([{ id: 'p1', quantity: 1 }], [product], freight)).toThrow());
  it.each([-1, 101, NaN])('rejects invalid coupon %s', percent => expect(() => priceOrder([{ id: 'p1', quantity: 1 }], [product], 7, percent)).toThrow());
});
describe('signed route verification at payment boundary', () => {
  it.each([[4990, 7], [5000, 6], [5010, 6.01], [10000, 12], [4999.9, 7]])('prices %s metres as R$%s', (meters, expected) => expect(routePrice(meters)).toBe(expected));
  it.each([-1, NaN, Infinity, 100001])('rejects invalid metres %s', meters => expect(() => routePrice(meters)).toThrow());
  it('accepts authentic address-bound quote and derives freight from raw metres', async () => {
    const verified = await verifyQuote(await signQuote(quote, secret), secret, quote.cep, quote.number);
    expect(routePrice(verified.distanceMeters)).toBe(6.01);
  });
  it('rejects forged token', async () => expect(verifyQuote(await signQuote(quote, 'wrong-secret'), secret, quote.cep, quote.number)).rejects.toThrow());
  it('rejects missing route token', async () => expect(verifyQuote('', secret, quote.cep, quote.number)).rejects.toThrow());
  it('rejects expired quote', async () => expect(verifyQuote(await signQuote({ ...quote, expiresAt: 1 }, secret), secret, quote.cep, quote.number)).rejects.toThrow());
  it('rejects changed house number', async () => expect(verifyQuote(await signQuote(quote, secret), secret, quote.cep, '11')).rejects.toThrow());
  it('rejects changed CEP', async () => expect(verifyQuote(await signQuote(quote, secret), secret, '74000000', quote.number)).rejects.toThrow());
  it('rejects out-of-area city', async () => expect(verifyQuote(await signQuote({ ...quote, city: 'Trindade' }, secret), secret, quote.cep, quote.number)).rejects.toThrow());
  it('rejects stale tariff version', async () => expect(verifyQuote(await signQuote({ ...quote, version: 'old' }, secret), secret, quote.cep, quote.number)).rejects.toThrow());
});