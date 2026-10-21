import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Pencil, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDelivery } from '@/contexts/DeliveryContext';
import { supabase } from '@/integrations/supabase/client';
import { formatBRL, isServedCity, type LocalDelivery } from '@/lib/checkoutRules';

export default function DeliveryConsultation() {
  const { delivery, selectDelivery } = useDelivery();
  const [cep, setCep] = useState(delivery?.address.cep || '');
  const [number, setNumber] = useState(delivery?.quote?.number || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(0);
  useEffect(() => () => { request.current += 1; }, []);

  const consult = async () => {
    const digits = cep.replace(/\D/g, '');
    const id = ++request.current;
    selectDelivery(null);
    setError('');
    if (digits.length !== 8) { setError('Digite um CEP com 8 números.'); return; }
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
      const { data, error: routeError } = await supabase.functions.invoke('local-route-freight', { body: { cep: digits, number: number.trim() } });
      if (id !== request.current) return;
      if (!routeError && data && Number.isFinite(data.distanceKm) && data.distanceKm >= 0 && Number.isFinite(data.price) && data.price >= 0) {
        next.quote = { distanceKm: data.distanceKm, price: data.price, number: number.trim() || undefined,
          quoteToken: data.quoteToken, expiresAt: data.expiresAt };
      }
      selectDelivery(next);
    } catch {
      if (id === request.current) setError('Não foi possível consultar a entrega agora. Tente novamente; o frete continua pendente.');
    } finally {
      if (id === request.current) setLoading(false);
    }
  };

  const km = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

  return (
    <section aria-label="Consulta de entrega" className="border-y border-border py-5 space-y-3">
      <h2 className="font-bold flex items-center gap-2"><Truck className="w-5 h-5 text-primary" /> Sua entrega</h2>
      <p className="text-sm text-muted-foreground">Exclusiva para Goiânia e Aparecida de Goiânia. Entrega em até 30 minutos. Prazo sujeito ao endereço e à disponibilidade.</p>
      {delivery ? (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm min-w-0"><MapPin className="inline w-4 h-4 text-primary mr-1" />
              {delivery.address.street && `${delivery.address.street}${delivery.quote?.number ? `, ${delivery.quote.number}` : ''}, `}{delivery.address.neighborhood && `${delivery.address.neighborhood} — `}
              {delivery.address.city} / GO<br />CEP {delivery.address.cep.slice(0, 5)}-{delivery.address.cep.slice(5)}
            </p>
            <Button variant="ghost" size="sm" onClick={() => { selectDelivery(null); setError(''); }}><Pencil /> Editar</Button>
          </div>
          {delivery.quote ? (
            <div className="rounded-lg bg-secondary p-3">
              <p className="text-sm">Distância pela rota: <strong>{km(delivery.quote.distanceKm)} km</strong></p>
              <p className="text-base font-bold text-primary">Frete: {formatBRL(delivery.quote.price)}</p>
              <p className="text-xs text-muted-foreground mt-1">{delivery.quote.quoteToken ? 'Frete incluído no total e conferido antes do pagamento.' : 'Calcule o frete novamente para pagar com Pix.'}</p>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-primary">Frete pendente · Confirmar pelo WhatsApp</p>
              <p className="text-xs text-muted-foreground">Não conseguimos calcular a rota agora. O frete será confirmado no atendimento pelo WhatsApp. Não é frete grátis.</p>
            </>
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
