import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Pencil, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDelivery } from '@/contexts/DeliveryContext';
import { formatBRL, isServedCity, LOCAL_FREIGHT_RULE } from '@/lib/checkoutRules';

export default function DeliveryConsultation() {
  const { delivery, selectDelivery } = useDelivery();
  const [cep, setCep] = useState(delivery?.address.cep || '');
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
      selectDelivery({
        service: 'Entrega por aplicativo', price: null,
        address: { cep: digits, street: address.logradouro || '', neighborhood: address.bairro || '', city: address.localidade, state: address.uf },
      });
    } catch {
      if (id === request.current) setError('Não foi possível consultar a entrega agora. Tente novamente; o frete continua pendente.');
    } finally {
      if (id === request.current) setLoading(false);
    }
  };

  return (
    <section aria-label="Consulta de entrega" className="border-y border-border py-5 space-y-3">
      <h2 className="font-bold flex items-center gap-2"><Truck className="w-5 h-5 text-primary" /> Sua entrega</h2>
      <p className="text-sm text-muted-foreground">Exclusiva para Goiânia e Aparecida de Goiânia. Prazo sujeito ao endereço e à disponibilidade.</p>
      <div className="space-y-1 text-sm" aria-label="Regra de frete local">
        <p className="font-semibold">Frete por distância da rota rodoviária</p>
        <p className="text-muted-foreground">Saída: CEP {LOCAL_FREIGHT_RULE.originCep.slice(0, 5)}-{LOCAL_FREIGHT_RULE.originCep.slice(5)}.</p>
        <p>Menos de {LOCAL_FREIGHT_RULE.thresholdKm} km: {formatBRL(LOCAL_FREIGHT_RULE.belowThresholdPrice)}.</p>
        <p>A partir de {LOCAL_FREIGHT_RULE.thresholdKm} km: {formatBRL(LOCAL_FREIGHT_RULE.pricePerKm)} por km da distância total.</p>
        <p className="text-muted-foreground">5 km = R$ 9,00 · 10 km = R$ 18,00. Apenas o preço final é arredondado a centavos.</p>
      </div>
      <p className="text-sm text-muted-foreground">O CEP confirma a região atendida, não a distância da rota. Confirme o frete pelo WhatsApp antes de pagar. Sem cotação válida, o pagamento online fica indisponível.</p>
      {delivery ? (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm min-w-0"><MapPin className="inline w-4 h-4 text-primary mr-1" />
              {delivery.address.street && `${delivery.address.street}, `}{delivery.address.neighborhood && `${delivery.address.neighborhood} — `}
              {delivery.address.city} / GO<br />CEP {delivery.address.cep.slice(0, 5)}-{delivery.address.cep.slice(5)}
            </p>
            <Button variant="ghost" size="sm" onClick={() => { selectDelivery(null); setError(''); }}><Pencil /> Editar</Button>
          </div>
          <p className="text-sm font-semibold text-primary">Frete pendente · Confirmar pelo WhatsApp</p>
          <p className="text-xs text-muted-foreground">A rota rodoviária até seu endereço completo precisa ser confirmada no atendimento. O valor segue a regra acima; prazo sujeito à disponibilidade. Não é frete grátis.</p>
        </div>
      ) : (
        <form onSubmit={e => { e.preventDefault(); void consult(); }} className="space-y-3">
          <label htmlFor="delivery-cep" className="block text-sm font-medium">CEP de entrega</label>
          <div className="flex gap-2">
            <Input id="delivery-cep" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" maxLength={9}
              className="min-w-0 flex-1" value={cep.length > 5 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep}
              onChange={e => { request.current += 1; setLoading(false); setError(''); setCep(e.target.value.replace(/\D/g, '').slice(0, 8)); }} />
            <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Truck />} Consultar</Button>
          </div>
          <a className="text-xs text-primary underline" href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener noreferrer">Não sei meu CEP</a>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </form>
      )}
    </section>
  );
}