export const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const normalizeCity = (value: string) =>
  value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export const isServedCity = (city: string, state: string) =>
  state.toUpperCase() === 'GO' && ['goiania', 'aparecida de goiania'].includes(normalizeCity(city));

export interface DeliveryAddress {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

// The existing local service is arranged via Uber/99Pop, with no automatic tariff.
export interface LocalDelivery {
  address: DeliveryAddress;
  service: 'Entrega por aplicativo';
  price: null;
}

export function checkoutTotals(subtotal: number, discountRate = 0, freight: number | null = null) {
  const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
  const discount = round(subtotal * discountRate);
  const productsTotal = round(subtotal - discount);
  return { subtotal: round(subtotal), discount, productsTotal, freight,
    total: freight === null ? null : round(productsTotal + freight) };
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