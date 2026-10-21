import { describe, it, expect } from 'vitest';
import { calculateLocalFreight, checkoutTotals, confirmedPurchase, formatBRL, freightForRoadRoute, isServedCity, LOCAL_FREIGHT_RULE, type RoadRouteResult } from '@/lib/checkoutRules';

describe('owner-defined road-distance tariff', () => {
  it('uses the exact origin CEP', () => expect(LOCAL_FREIGHT_RULE.originCep).toBe('74963580'));
  it('charges R$7 at 4.99 km', () => expect(calculateLocalFreight(4.99)).toBe(7));
  it('charges R$6 at exactly 5 km', () => expect(calculateLocalFreight(5)).toBe(6));
  it('charges R$6.01 at 5.01 km', () => expect(calculateLocalFreight(5.01)).toBe(6.01));
  it('charges R$12 for the total 10 km, not the excess', () => expect(calculateLocalFreight(10)).toBe(12));
  it('does not round distance before choosing the tier', () => expect(calculateLocalFreight(4.9999)).toBe(7));
  it('rounds only the final price', () => expect(calculateLocalFreight(5.006)).toBe(6.01));
  it('charges R$7 for an actual zero-distance route', () => expect(calculateLocalFreight(0)).toBe(7));
  it.each([-1, -0.001, NaN, Infinity, -Infinity, Number.MAX_VALUE])('rejects invalid distance %s', km => expect(calculateLocalFreight(km)).toBeNull());
});

describe('road-route validation', () => {
  const address = { cep: '74000000', street: '', neighborhood: '', city: 'Goiânia', state: 'GO' };
  const route: RoadRouteResult = { status: 'ok', kind: 'road', originCep: '74963580', destinationCep: address.cep, distanceMeters: 5010 };
  it('calculates from unrounded provider metres', () => expect(freightForRoadRoute(address, route)).toBe(9.02));
  it('accepts Aparecida with matching destination', () => expect(freightForRoadRoute({ ...address, city: 'Aparecida de Goiânia' }, route)).toBe(9.02));
  it('rejects a destination outside the served cities', () => expect(freightForRoadRoute({ ...address, city: 'Trindade' }, route)).toBeNull());
  it('rejects a destination outside GO', () => expect(freightForRoadRoute({ ...address, state: 'SP' }, route)).toBeNull());
  it('keeps freight pending on route failure', () => expect(freightForRoadRoute(address, { ...route, status: 'unavailable' })).toBeNull());
  it('does not invent a route when missing', () => expect(freightForRoadRoute(address, null)).toBeNull());
  it('rejects a different origin', () => expect(freightForRoadRoute(address, { ...route, originCep: '74000000' })).toBeNull());
  it('rejects a different destination', () => expect(freightForRoadRoute(address, { ...route, destinationCep: '74900000' })).toBeNull());
  it('rejects invalid destination CEP', () => expect(freightForRoadRoute({ ...address, cep: '' }, { ...route, destinationCep: '' })).toBeNull());
  it('rejects straight-line distance', () => expect(freightForRoadRoute(address, { ...route, kind: 'straight-line' } as unknown as RoadRouteResult)).toBeNull());
  it.each([-1, NaN, Infinity, -Infinity])('rejects invalid route metres %s', distanceMeters => expect(freightForRoadRoute(address, { ...route, distanceMeters })).toBeNull());
  it('adds rule-based freight after product discount', () => expect(checkoutTotals(100, .1, freightForRoadRoute(address, route)).total).toBe(99.02));
  it('leaves total pending after route failure', () => expect(checkoutTotals(100, .1, freightForRoadRoute(address, null)).total).toBeNull());
});

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
  it.each([-7, NaN, Infinity, -Infinity])('never accepts invalid freight %s as payable', freight => {
    expect(checkoutTotals(100, 0, freight).freight).toBeNull();
    expect(checkoutTotals(100, 0, freight).total).toBeNull();
  });
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