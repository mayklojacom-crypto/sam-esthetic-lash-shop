import { createContext, useContext, useState, type ReactNode } from 'react';
import { isServedCity, type LocalDelivery } from '@/lib/checkoutRules';

const STORAGE_KEY = 'sam-selected-local-delivery';
const DeliveryContext = createContext<{
  delivery: LocalDelivery | null;
  selectDelivery: (delivery: LocalDelivery | null) => void;
} | undefined>(undefined);

export function DeliveryProvider({ children }: { children: ReactNode }) {
  const [delivery, setDelivery] = useState<LocalDelivery | null>(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
      if (saved?.service === 'Entrega por aplicativo' && saved.price === null &&
          typeof saved.address?.cep === 'string' && /^\d{8}$/.test(saved.address.cep) &&
          typeof saved.address.city === 'string' && typeof saved.address.state === 'string' &&
          isServedCity(saved.address.city, saved.address.state)) return saved;
    } catch { /* No saved delivery. */ }
    return null;
  });
  const selectDelivery = (next: LocalDelivery | null) => {
    setDelivery(next);
    try {
      if (next) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch { /* In-memory selection remains available. */ }
  };
  return <DeliveryContext.Provider value={{ delivery, selectDelivery }}>{children}</DeliveryContext.Provider>;
}

export function useDelivery() {
  const context = useContext(DeliveryContext);
  if (!context) throw new Error('useDelivery requires DeliveryProvider');
  return context;
}