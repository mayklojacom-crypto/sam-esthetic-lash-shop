import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { FREIGHT_VERSION, routePrice, signQuote, type FreightQuote } from '../_shared/freight-quote.ts';
const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_maps';
const ORIGIN = '74963-580, Aparecida de Goiânia - GO, Brasil';
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const norm = (v: string) => v.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const served = (city: string, uf: string) => uf.toUpperCase() === 'GO' && ['goiania', 'aparecida de goiania'].includes(norm(city));
// Same owner tariff as src/lib/checkoutRules.ts.
const cache = new Map<string, { quote: FreightQuote; at: number }>();
async function quoteResponse(quote: FreightQuote, secret: string) {
  const current = { ...quote, expiresAt: Date.now() + 6 * 3600_000 };
  return json({ distanceKm: current.distanceMeters / 1000, price: routePrice(current.distanceMeters),
    quoteToken: await signQuote(current, secret), expiresAt: current.expiresAt });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método inválido' }, 405);
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    const signingSecret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!signingSecret) return json({ error: 'Confirmação de frete indisponível' }, 503);
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) return json({ error: 'Cálculo de rota não configurado' }, 500);
    const body = await req.json().catch(() => ({}));
    const cep = String(body.cep ?? '').replace(/\D/g, '');
    const number = String(body.number ?? '').replace(/[^\w\s-]/g, '').trim().slice(0, 10);
    if (cep.length !== 8) return json({ error: 'CEP inválido' }, 400);
    const key = `${cep}|${number}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < 6 * 3600_000) return quoteResponse(hit.quote, signingSecret);

    const viaRes = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const addr = viaRes.ok ? await viaRes.json() : null;
    if (!addr || addr.erro || !addr.localidade) return json({ error: 'CEP não encontrado' }, 404);
    if (!served(addr.localidade, addr.uf)) return json({ error: 'Fora da área de entrega' }, 422);
    const destination = [addr.logradouro && `${addr.logradouro}${number ? `, ${number}` : ''}`, addr.bairro,
      `${addr.localidade} - ${addr.uf}`, `${cep.slice(0, 5)}-${cep.slice(5)}`, 'Brasil'].filter(Boolean).join(', ');

    const res = await fetch(`${GATEWAY_URL}/routes/directions/v2:computeRoutes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'X-Connection-Api-Key': GOOGLE_MAPS_API_KEY,
        'Content-Type': 'application/json', 'X-Goog-FieldMask': 'routes.distanceMeters' },
      body: JSON.stringify({ origin: { address: ORIGIN }, destination: { address: destination },
        travelMode: 'DRIVE', routingPreference: 'TRAFFIC_UNAWARE', languageCode: 'pt-BR', regionCode: 'BR' }),
    });
    if (!res.ok) {
      const details = await res.text();
      console.error(`Routes failed [${res.status}]: ${details}`);
      let message = 'Rota indisponível';
      if (res.status === 403) {
        const reason = JSON.parse(details)?.error?.details?.find((d: { reason?: string }) => d.reason)?.reason;
        message = reason === 'API_KEY_HTTP_REFERRER_BLOCKED' ? 'A chave de servidor do Google Maps precisa permitir requisições do servidor (restrição None ou IP addresses no Google Cloud).'
          : reason === 'API_KEY_SERVICE_BLOCKED' ? 'Ative e permita a Routes API na chave de servidor no Google Cloud.' : 'Google Maps negou a rota. Confira as restrições da chave de servidor no Google Cloud.';
      }
      return json({ error: message, status: res.status, details }, 502);
    }
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route) return json({ error: 'Rota não encontrada' }, 404);
    const meters = Number(route.distanceMeters ?? 0);
    if (!Number.isFinite(meters) || meters < 0 || meters > 100_000) return json({ error: 'Rota inválida' }, 422);
    const quote: FreightQuote = { version: FREIGHT_VERSION, expiresAt: Date.now() + 6 * 3600_000,
      cep, number, street: addr.logradouro || '', neighborhood: addr.bairro || '', city: addr.localidade, state: addr.uf, distanceMeters: meters };
    if (cache.size >= 500) cache.clear();
    cache.set(key, { quote, at: Date.now() });
    return quoteResponse(quote, signingSecret);
  } catch (e) {
    console.error('local-route-freight error', e);
    return json({ error: 'Erro ao calcular a rota' }, 500);
  }
});
