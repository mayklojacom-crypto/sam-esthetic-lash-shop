export const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const normalizeCity = (value: string) =>
  value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export const isServedCity = (city: string, state: string) =>
  state.toUpperCase() === 'GO' && ['goiania', 'aparecida de goiania'].includes(normalizeCity(city));

export const LOCAL_FREIGHT_RULE = Object.freeze({
  originCep: '74963580',
  thresholdKm: 5,
  belowThresholdPrice: 7,
  pricePerKm: 1.2,
});

// Use unrounded road-route kilometres; round the final monetary result only.
export function calculateLocalFreight(distanceKm: number): number | null {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return null;
  const price = distanceKm < LOCAL_FREIGHT_RULE.thresholdKm
    ? LOCAL_FREIGHT_RULE.belowThresholdPrice
    : distanceKm * LOCAL_FREIGHT_RULE.pricePerKm;
  if (!Number.isFinite(price) || price > Number.MAX_SAFE_INTEGER / 100) return null;
  return Math.round((price + Number.EPSILON) * 100) / 100;
}

export interface RoadRouteResult {
  status: 'ok' | 'unavailable';
  kind: 'road';
  originCep: string;
  destinationCep: string;
  distanceMeters: number;
}

// Pure validation boundary, not a route provider or a trusted payment quote.
export function freightForRoadRoute(address: DeliveryAddress, route: RoadRouteResult | null): number | null {
  if (!isServedCity(address.city, address.state) || !route || route.status !== 'ok' ||
      route.kind !== 'road' || route.originCep !== LOCAL_FREIGHT_RULE.originCep ||
      !/^\d{8}$/.test(address.cep) || route.destinationCep !== address.cep) return null;
  return calculateLocalFreight(route.distanceMeters / 1000);
}

export interface DeliveryAddress {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

// Never hydrate a payable price from browser/session storage.
export interface LocalDelivery {
  address: DeliveryAddress;
  service: 'Entrega por aplicativo';
  price: null;
  // Browser values are display-only; payment verifies the signed token server-side.
  quote?: { distanceKm: number; price: number; number?: string; quoteToken?: string; expiresAt?: number };
}

export function canRequestPix(delivery: LocalDelivery | null, number: string, now = Date.now()) {
  const quote = delivery?.quote;
  return !!delivery && isServedCity(delivery.address.city, delivery.address.state) && !!quote &&
    Number.isFinite(quote.price) && quote.price >= 0 && !!quote.quoteToken &&
    typeof quote.expiresAt === 'number' && quote.expiresAt > now &&
    !!number.trim() && quote.number === number.trim();
}

/** Owner rule: free delivery strictly ABOVE this products total (after discount); same value as server payment-pricing. */
export const FREE_FREIGHT_ABOVE = 270;

export function checkoutTotals(subtotal: number, discountRate = 0, freight: number | null = null) {
  const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
  const discount = round(subtotal * discountRate);
  const productsTotal = round(subtotal - discount);
  const routeFreight = freight !== null && Number.isFinite(freight) && freight >= 0 ? round(freight) : null;
  // Free only with a valid route quote: unknown freight stays null.
  const freeFreight = routeFreight !== null && productsTotal > FREE_FREIGHT_ABOVE;
  const validFreight = freeFreight ? 0 : routeFreight;
  return { subtotal: round(subtotal), discount, productsTotal, freight: validFreight, freeFreight,
    total: validFreight === null ? null : round(productsTotal + validFreight) };
}

export interface ConfirmedOrder {
  external_reference: string;
  payment_status: string;
  total: number;
}

export function confirmedPurchase(order: ConfirmedOrder | null, reference: string) {
  if (!order || !reference || order.external_reference !== reference ||
      order.payment_status !== 'approved' || !Number.isFinite(order.total) || order.total < 0) return null;
  return { transaction_id: order.external_reference, currency: 'BRL' as const, value: order.total };
}