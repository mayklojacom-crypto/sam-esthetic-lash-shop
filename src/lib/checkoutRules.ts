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

// No linked, usable route service or server-revalidated quote exists yet.
// Never hydrate a payable price from browser/session storage.
export interface LocalDelivery {
  address: DeliveryAddress;
  service: 'Entrega por aplicativo';
  price: null;
  // Display-only road-route quote from the server; not trusted for payment.
  quote?: { distanceKm: number; price: number; number?: string };
}

export function checkoutTotals(subtotal: number, discountRate = 0, freight: number | null = null) {
  const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
  const discount = round(subtotal * discountRate);
  const productsTotal = round(subtotal - discount);
  const validFreight = freight !== null && Number.isFinite(freight) && freight >= 0 ? round(freight) : null;
  return { subtotal: round(subtotal), discount, productsTotal, freight: validFreight,
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