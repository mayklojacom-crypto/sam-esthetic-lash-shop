const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_maps';
const ORIGIN = '74963-580, Aparecida de Goiânia - GO, Brasil';
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const norm = (v: string) => v.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const served = (city: string, uf: string) => uf.toUpperCase() === 'GO' && ['goiania', 'aparecida de goiania'].includes(norm(city));
// Same owner tariff as src/lib/checkoutRules.ts.
const tariff = (km: number) => Math.round(((km < 5 ? 7 : km * 1.8) + Number.EPSILON) * 100) / 100;
const cache = new Map<string, { distanceKm: number; price: number; at: number }>();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método inválido' }, 405);
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) return json({ error: 'Cálculo de rota não configurado' }, 500);
    const body = await req.json().catch(() => ({}));
    const cep = String(body.cep ?? '').replace(/\D/g, '');
    const number = String(body.number ?? '').replace(/[^\w\s-]/g, '').trim().slice(0, 10);
    if (cep.length !== 8) return json({ error: 'CEP inválido' }, 400);
    const key = `${cep}|${number}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < 6 * 3600_000) return json({ distanceKm: hit.distanceKm, price: hit.price });

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
      return json({ error: 'Rota indisponível', status: res.status }, 502);
    }
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route) return json({ error: 'Rota não encontrada' }, 404);
    const meters = Number(route.distanceMeters ?? 0);
    if (!Number.isFinite(meters) || meters < 0 || meters > 100_000) return json({ error: 'Rota inválida' }, 422);
    const distanceKm = meters / 1000;
    const result = { distanceKm: Math.round(distanceKm * 100) / 100, price: tariff(distanceKm) };
    cache.set(key, { ...result, at: Date.now() });
    return json(result);
  } catch (e) {
    console.error('local-route-freight error', e);
    return json({ error: 'Erro ao calcular a rota' }, 500);
  }
});
