import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { trackPurchase, track, setAnalyticsSender, resetAnalyticsMemory, analyticsConfig, toAnalyticsItem, type AnalyticsConfig } from '@/lib/analytics';
import { saveConsent, readConsent, CONSENT_KEY } from '@/lib/consent';
import { confirmedPurchase } from '@/lib/checkoutRules';

const lookup = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: (...a: unknown[]) => lookup(...a) } }));
vi.mock('@/components/Header', () => ({ default: () => null }));
vi.mock('@/components/BottomNav', () => ({ default: () => null }));

const enabled: AnalyticsConfig = { ga4MeasurementId: 'G-TEST', adsPurchaseSendTo: 'AW-1/test', consentGranted: () => true };
const calls: [string, Record<string, unknown>][] = [];
const real = { ...analyticsConfig };

beforeEach(() => {
  calls.length = 0; localStorage.clear(); resetAnalyticsMemory(); lookup.mockReset();
  setAnalyticsSender((_c, name, params) => { calls.push([name, params]); });
  Object.assign(analyticsConfig, { ga4MeasurementId: null, adsPurchaseSendTo: null, consentGranted: () => false });
});

describe('purchase', () => {
  it('approved order sends purchase with reference, BRL and confirmed value', () => {
    const p = confirmedPurchase({ external_reference: 'order_a', payment_status: 'approved', total: 39.48 }, 'order_a');
    expect(trackPurchase(p, enabled)).toBe(true);
    expect(calls).toEqual([
      ['purchase', { transaction_id: 'order_a', currency: 'BRL', value: 39.48, send_to: 'G-TEST' }],
      ['conversion', { transaction_id: 'order_a', currency: 'BRL', value: 39.48, send_to: 'AW-1/test' }],
    ]);
  });
  it('pending order sends nothing', () => {
    const p = confirmedPurchase({ external_reference: 'order_a', payment_status: 'pending', total: 39.48 }, 'order_a');
    expect(trackPurchase(p, enabled)).toBe(false);
    expect(calls).toEqual([]);
  });
  it('repeated confirmation is sent once, even after a reload', () => {
    const p = { transaction_id: 'order_b', currency: 'BRL' as const, value: 10 };
    trackPurchase(p, enabled); trackPurchase(p, enabled);
    resetAnalyticsMemory(); trackPurchase(p, enabled);
    expect(calls.filter(c => c[0] === 'purchase')).toHaveLength(1);
  });
  it('without consent or IDs nothing is sent and the order is not replayed later', () => {
    const p = { transaction_id: 'order_c', currency: 'BRL' as const, value: 10 };
    expect(trackPurchase(p)).toBe(false);
    expect(calls).toEqual([]);
    expect(trackPurchase(p, enabled)).toBe(false);
  });
});

describe('separate destinations and consent', () => {
  const p = { transaction_id: 'order_ads', currency: 'BRL' as const, value: 25 };
  it('real config: Ads send_to is the verified Compra (1) value and GA4 stays unset', () => {
    expect(real.adsPurchaseSendTo).toBe('AW-18052419500/xk4JCPjmp5McEKyfiKBD');
    expect(real.ga4MeasurementId).toBeNull();
  });
  it('Ads purchase is sent without a GA4 ID when cookies are accepted', () => {
    saveConsent('granted');
    expect(trackPurchase(p, real)).toBe(true);
    expect(calls).toEqual([['conversion', { transaction_id: 'order_ads', currency: 'BRL', value: 25, send_to: 'AW-18052419500/xk4JCPjmp5McEKyfiKBD' }]]);
  });
  it('refused cookies: no purchase sent', () => {
    saveConsent('denied');
    expect(trackPurchase(p, real)).toBe(false);
    expect(calls.filter(c => c[0] === 'conversion' || c[0] === 'purchase')).toEqual([]);
  });
  it('no choice yet: nothing sent', () => {
    expect(trackPurchase(p, real)).toBe(false);
    expect(calls).toEqual([]);
  });
  it('choice is stored with time and version, and can be changed', () => {
    saveConsent('granted'); saveConsent('denied');
    expect(readConsent()).toMatchObject({ choice: 'denied', version: expect.any(String), at: expect.any(String) });
    expect(localStorage.getItem(CONSENT_KEY)).not.toBeNull();
  });
});

describe('other events', () => {
  it('view_item and begin_checkout are deduplicated per key', () => {
    Object.assign(analyticsConfig, enabled);
    const item = toAnalyticsItem({ id: 'p1', name: 'Cola', price: 59.9, category: 'colas' }, 2, 'M');
    track.viewItem(item, 'p1:k'); track.viewItem(item, 'p1:k');
    track.beginCheckout([item], 'k'); track.beginCheckout([item], 'k');
    expect(calls.map(c => c[0])).toEqual(['view_item', 'begin_checkout']);
    expect(calls[1][1]).toMatchObject({ currency: 'BRL', value: 119.8 });
  });
  it('WhatsApp contact and Pix generated are never purchase', () => {
    Object.assign(analyticsConfig, enabled);
    track.whatsappContact('checkout', 'order');
    track.addPaymentInfo([toAnalyticsItem({ id: 'p1', name: 'Cola', price: 10 })], 'order_x');
    expect(calls.map(c => c[0])).toEqual(['contato_whatsapp', 'add_payment_info']);
    expect(JSON.stringify(calls)).not.toMatch(/purchase|conversion/);
  });
});

describe('/obrigado page', () => {
  const renderPage = async (url: string) => {
    const { default: ThankYou } = await import('@/pages/ThankYou');
    return render(<MemoryRouter initialEntries={[url]}><ThankYou /></MemoryRouter>);
  };
  beforeEach(() => Object.assign(analyticsConfig, enabled));

  it('direct visit without reference sends no purchase', async () => {
    await renderPage('/obrigado');
    await screen.findByText(/Pagamento ainda não confirmado/);
    expect(calls).toEqual([]);
  });
  it('pending order sends no purchase', async () => {
    lookup.mockResolvedValue({ data: [{ external_reference: 'order_p', payment_status: 'pending', total: 20 }], error: null });
    await renderPage('/obrigado?pedido=order_p');
    await screen.findByText(/Pagamento ainda não confirmado/);
    expect(calls).toEqual([]);
  });
  it('approved order sends purchase once across rerender', async () => {
    lookup.mockResolvedValue({ data: [{ external_reference: 'order_ok', payment_status: 'approved', total: 49.9 }], error: null });
    const view = await renderPage('/obrigado?pedido=order_ok');
    await screen.findByText(/confirmado/);
    const { default: ThankYou } = await import('@/pages/ThankYou');
    view.rerender(<MemoryRouter initialEntries={['/obrigado?pedido=order_ok']}><ThankYou /></MemoryRouter>);
    expect(calls.filter(c => c[0] === 'purchase')).toEqual([['purchase', { transaction_id: 'order_ok', currency: 'BRL', value: 49.9, send_to: 'G-TEST' }]]);
  });
});
