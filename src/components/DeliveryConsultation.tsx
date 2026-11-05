import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, MapPin, Pencil, RefreshCw, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDelivery } from '@/contexts/DeliveryContext';
import { formatBRL, isServedCity, type LocalDelivery } from '@/lib/checkoutRules';
import { fetchRouteQuote } from '@/lib/routeQuote';

export default function DeliveryConsultation() {
  const { delivery, selectDelivery } = useDelivery();
  const [cep, setCep] = useState(delivery?.address.cep || '');
  const [number, setNumber] = useState(delivery?.quote?.number || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(0);
  useEffect(() => () => { request.current += 1; }, []);

  // A saved quote from an older visit may lack a valid signature or be expired:
  // silently refresh it in place so Pix becomes available without re-entering the address.
  const refreshed = useRef(false);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    const q = delivery?.quote;
    if (refreshed.current || !delivery || !q?.number) return;
    if (q.quoteToken && typeof q.expiresAt === 'number' && q.expiresAt > Date.now() + 5 * 60_000) return;
    refreshed.current = true;
    const current = delivery;
    setRefreshing(true);
    fetchRouteQuote(current.address.cep, q.number)
      .then(quote => { if (quote?.quoteToken) selectDelivery({ ...current, quote }); })
      .finally(() => setRefreshing(false));
  }, [delivery, selectDelivery]);

  const retryQuote = async () => {
    if (!delivery) return;
    const current = delivery;
    setRefreshing(true);
    const quote = await fetchRouteQuote(current.address.cep, number || current.quote?.number || '');
    setRefreshing(false);
    if (quote) selectDelivery({ ...current, quote });
  };

  const consult = async () => {
    const digits = cep.replace(/\D/g, '');
    const numberArg = number.trim();
    const id = ++request.current;
    selectDelivery(null);
    setError('');
    if (digits.length !== 8) { setError('Digite um CEP com 8 números.'); return; }
    if (!numberArg) { setError('Informe o número do endereço para calcular o frete.'); return; }
    setLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error('Consulta indisponível');
      const address = await response.json();
      if (id !== request.current) return;
      if (address.erro || !address.localidade || !address.uf) {
        setError('CEP não encontrado. Confira o número e consulte novamente.'); return;
      }
      if (!isServedCity(address.localidade, address.uf)) {
        setError('Este endereço está fora da nossa área de entrega. Atendemos somente Goiânia e Aparecida de Goiânia, GO.'); return;
      }
      const next: LocalDelivery = {
        service: 'Entrega por aplicativo', price: null,
        address: { cep: digits, street: address.logradouro || '', neighborhood: address.bairro || '', city: address.localidade, state: address.uf },
      };
      const quote = await fetchRouteQuote(digits, numberArg);
      if (id !== request.current) return;
      next.quote = quote ?? { distanceKm: NaN, price: NaN, number: numberArg } as never;
      if (!quote) delete next.quote;
      selectDelivery(next);
    } catch {
      if (id === request.current) setError('Não foi possível consultar o CEP agora. Confira sua conexão e tente novamente.');
    } finally {
      if (id === request.current) setLoading(false);
    }
  };

  return (
    <section aria-label="Consulta de entrega" className="border-y border-border py-5 space-y-3">
      <h2 className="font-bold flex items-center gap-2"><Truck className="w-5 h-5 text-primary" /> Sua entrega</h2>
      <p className="text-sm text-muted-foreground">
        Entregamos em Goiânia e Aparecida de Goiânia. Informe o CEP e o número para ver o frete antes de pagar.{' '}
        <Link to="/entrega" className="text-primary underline">Como funciona a entrega</Link>
      </p>
      {delivery ? (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm min-w-0"><MapPin className="inline w-4 h-4 text-primary mr-1" />
              {delivery.address.street && `${delivery.address.street}${delivery.quote?.number || number ? `, ${delivery.quote?.number || number}` : ''}, `}{delivery.address.neighborhood && `${delivery.address.neighborhood} — `}
              {delivery.address.city} / GO<br />CEP {delivery.address.cep.slice(0, 5)}-{delivery.address.cep.slice(5)}
            </p>
            <Button variant="ghost" size="sm" onClick={() => { selectDelivery(null); setError(''); }}><Pencil /> Editar</Button>
          </div>
          {delivery.quote ? (
            <div className="rounded-lg bg-secondary p-3">
              <p className="text-base font-bold text-primary">Frete: {formatBRL(delivery.quote.price)}</p>
              <p className="text-xs text-muted-foreground mt-1">{refreshing ? 'Atualizando o frete…' : 'Frete incluído no total e conferido novamente antes do pagamento.'}</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card p-3 space-y-2" role="status">
              <p className="text-sm font-semibold text-foreground">Endereço atendido ✓ · frete ainda não calculado</p>
              <p className="text-xs text-muted-foreground">
                Nosso cálculo de rota não respondeu agora. Você pode seguir preenchendo seus dados — tentaremos calcular de novo antes do pagamento, e o valor só é cobrado depois de aparecer para você.
              </p>
              <Button type="button" variant="outline" size="sm" disabled={refreshing} onClick={() => void retryQuote()}>
                {refreshing ? <Loader2 className="animate-spin" /> : <RefreshCw />} Tentar calcular de novo
              </Button>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={e => { e.preventDefault(); void consult(); }} className="space-y-3">
          <div className="flex gap-2">
            <div className="min-w-0 flex-1 space-y-1">
              <label htmlFor="delivery-cep" className="block text-sm font-medium">CEP de entrega</label>
              <Input id="delivery-cep" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" maxLength={9}
                value={cep.length > 5 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep}
                onChange={e => { request.current += 1; setLoading(false); setError(''); setCep(e.target.value.replace(/\D/g, '').slice(0, 8)); }} />
            </div>
            <div className="w-24 space-y-1">
              <label htmlFor="delivery-number" className="block text-sm font-medium">Número</label>
              <Input id="delivery-number" inputMode="numeric" placeholder="Nº" maxLength={10} value={number}
                onChange={e => setNumber(e.target.value)} />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full">{loading ? <Loader2 className="animate-spin" /> : <Truck />} Calcular frete</Button>
          <a className="text-xs text-primary underline" href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener noreferrer">Não sei meu CEP</a>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </form>
      )}
    </section>
  );
}
