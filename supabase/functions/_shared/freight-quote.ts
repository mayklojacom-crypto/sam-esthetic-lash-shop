export const FREIGHT_VERSION = 'local-1.20-v1';
export interface FreightQuote {
  version: string;
  expiresAt: number;
  cep: string;
  number: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  distanceMeters: number;
}
export function routePrice(meters: number) {
  if (!Number.isFinite(meters) || meters < 0 || meters > 100_000) throw new Error('Distância inválida');
  const km = meters / 1000;
  return Math.round(((km < 5 ? 7 : km * 1.2) + Number.EPSILON) * 100) / 100;
}
const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const decode = (v: string) => Uint8Array.from(atob(v.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const key = (secret: string) => crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
export async function signQuote(quote: FreightQuote, secret: string) {
  const payload = encode(new TextEncoder().encode(JSON.stringify(quote)));
  const signature = await crypto.subtle.sign('HMAC', await key(secret), new TextEncoder().encode(payload));
  return `${payload}.${encode(new Uint8Array(signature))}`;
}
export async function verifyQuote(token: string, secret: string, cep: string, number: string, now = Date.now()): Promise<FreightQuote> {
  try {
    if (typeof token !== 'string' || token.length > 6000) throw new Error();
    const parts = token.split('.');
    if (parts.length !== 2 || !await crypto.subtle.verify('HMAC', await key(secret), decode(parts[1]), new TextEncoder().encode(parts[0]))) throw new Error();
    const q = JSON.parse(new TextDecoder().decode(decode(parts[0]))) as FreightQuote;
    const city = typeof q.city === 'string' ? q.city.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() : '';
    if (q.version !== FREIGHT_VERSION || !Number.isFinite(q.expiresAt) || q.expiresAt <= now || q.expiresAt > now + 6 * 3600_000 ||
        q.cep !== cep || !/^\d{8}$/.test(q.cep) || q.number !== number || q.state !== 'GO' ||
        !['goiania', 'aparecida de goiania'].includes(city) || typeof q.street !== 'string' || !q.street.trim() || typeof q.neighborhood !== 'string') throw new Error();
    routePrice(q.distanceMeters);
    return q;
  } catch {
    throw new Error('O frete expirou ou o endereço mudou. Calcule o frete novamente antes de pagar.');
  }
}