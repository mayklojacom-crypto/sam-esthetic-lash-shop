// Central ecommerce measurement. Never put customer name, CPF, e-mail, phone or address in params.
// Destinations are explicit and disabled until the owner supplies real IDs and a consent integration exists.

export interface AnalyticsConfig {
  /** GA4 measurement ID (G-...). Not configured: no ID exists in this project. */
  ga4MeasurementId: string | null;
  /** Google Ads purchase conversion send_to (AW-18052419500/<label>). Not configured: label unknown. */
  adsPurchaseSendTo: string | null;
  /** Advertising/analytics consent. No consent banner/CMP exists, so this stays false. */
  consentGranted: () => boolean;
}

export const analyticsConfig: AnalyticsConfig = {
  ga4MeasurementId: null,
  adsPurchaseSendTo: null,
  consentGranted: () => false,
};

export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  item_variant?: string;
  item_category?: string;
  price: number;
  quantity: number;
}

type Params = Record<string, unknown>;
type Sender = (command: 'event', name: string, params: Params) => void;

const round = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
const PURCHASE_KEY = 'sam_analytics_purchases';
const sentOnce = new Set<string>();

let sender: Sender | null = null;
/** Test hook: replace window.gtag. */
export function setAnalyticsSender(next: Sender | null) { sender = next; }
export function resetAnalyticsMemory() { sentOnce.clear(); }

function gtagSender(): Sender | null {
  if (sender) return sender;
  const g = typeof window !== 'undefined' ? (window as unknown as { gtag?: Sender }).gtag : undefined;
  return typeof g === 'function' ? g : null;
}

export function analyticsEnabled(config = analyticsConfig) {
  return !!config.ga4MeasurementId && config.consentGranted();
}

export function toAnalyticsItem(product: { id: string; name: string; price: number; category?: string }, quantity = 1, size?: string): AnalyticsItem {
  return {
    item_id: product.id,
    item_name: product.name,
    ...(size ? { item_variant: size } : {}),
    ...(product.category ? { item_category: product.category } : {}),
    price: round(product.price),
    quantity,
  };
}

export function itemsValue(items: AnalyticsItem[]) {
  return round(items.reduce((sum, i) => sum + i.price * i.quantity, 0));
}

function send(name: string, params: Params, config = analyticsConfig) {
  const gtag = gtagSender();
  if (!gtag || !analyticsEnabled(config)) return false;
  gtag('event', name, { ...params, send_to: config.ga4MeasurementId });
  return true;
}

/** Fires at most once per key in this page session (guards rerenders / StrictMode). */
function once(key: string, fn: () => void) {
  if (sentOnce.has(key)) return;
  sentOnce.add(key);
  fn();
}

export const track = {
  viewItem(item: AnalyticsItem, onceKey: string) {
    once(`view_item:${onceKey}`, () => send('view_item', { currency: 'BRL', value: itemsValue([item]), items: [item] }));
  },
  addToCart(item: AnalyticsItem) {
    send('add_to_cart', { currency: 'BRL', value: itemsValue([item]), items: [item] });
  },
  beginCheckout(items: AnalyticsItem[], onceKey: string) {
    if (!items.length) return;
    once(`begin_checkout:${onceKey}`, () => send('begin_checkout', { currency: 'BRL', value: itemsValue(items), items }));
  },
  addShippingInfo(items: AnalyticsItem[], quoteKey: string) {
    if (!items.length || !quoteKey) return;
    once(`add_shipping_info:${quoteKey}`, () => send('add_shipping_info', { currency: 'BRL', value: itemsValue(items), shipping_tier: 'Entrega por aplicativo', items }));
  },
  /** Pix QR generated: payment info only, never a purchase. */
  addPaymentInfo(items: AnalyticsItem[], reference: string) {
    if (!items.length || !reference) return;
    once(`add_payment_info:${reference}`, () => send('add_payment_info', { currency: 'BRL', value: itemsValue(items), payment_type: 'pix', items }));
  },
  /** WhatsApp contact: a lead signal, never a purchase. */
  whatsappContact(source: 'checkout' | 'botao_flutuante', mode: 'order' | 'contact') {
    send('contato_whatsapp', { source, mode });
  },
};

function storedPurchases(): string[] {
  try { const v = JSON.parse(localStorage.getItem(PURCHASE_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}

/**
 * Only call with the result of confirmedPurchase (approved, exact reference, database total).
 * Each transaction_id is handled once per browser, also when destinations are disabled,
 * so a later configuration never replays old confirmations.
 */
export function trackPurchase(purchase: { transaction_id: string; currency: 'BRL'; value: number } | null, config = analyticsConfig) {
  if (!purchase || !purchase.transaction_id || purchase.currency !== 'BRL' || !Number.isFinite(purchase.value) || purchase.value <= 0) return false;
  const key = `purchase:${purchase.transaction_id}`;
  const handled = storedPurchases();
  if (sentOnce.has(key) || handled.includes(purchase.transaction_id)) return false;
  sentOnce.add(key);
  try { localStorage.setItem(PURCHASE_KEY, JSON.stringify([...handled, purchase.transaction_id].slice(-50))); } catch { /* ignore */ }
  const params = { transaction_id: purchase.transaction_id, currency: 'BRL', value: round(purchase.value) };
  const sent = send('purchase', params, config);
  const gtag = gtagSender();
  if (gtag && config.adsPurchaseSendTo && config.consentGranted()) {
    gtag('event', 'conversion', { ...params, send_to: config.adsPurchaseSendTo });
    return true;
  }
  return sent;
}
