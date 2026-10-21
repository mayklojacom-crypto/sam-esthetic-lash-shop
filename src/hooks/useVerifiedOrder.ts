import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { confirmedPurchase, type ConfirmedOrder } from '@/lib/checkoutRules';

// This lookup only reads the order; unlike check-payment-status it has no payment/PDF side effects.
export function useVerifiedOrder(reference: string) {
  const [order, setOrder] = useState<ConfirmedOrder | null>(null);
  const [loading, setLoading] = useState(Boolean(reference));
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setOrder(null);
    setError('');
    if (!reference) { setLoading(false); return; }
    setLoading(true);
    void (async () => {
      const { data, error: lookupError } = await supabase.rpc('search_orders_by_reference', { ref_query: reference });
      if (!active) return;
      if (lookupError) setError('Não foi possível confirmar o pagamento agora. Consulte novamente.');
      else {
        const row = data?.find(item => item.external_reference === reference);
        if (row) setOrder({ external_reference: row.external_reference, payment_status: row.payment_status || '', total: Number(row.total) });
        else setError('Pedido não encontrado. Confira o número do pedido.');
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [reference, attempt]);
  return { order, purchase: confirmedPurchase(order, reference), loading, error, retry: () => setAttempt(value => value + 1) };
}