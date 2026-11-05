import { supabase } from '@/integrations/supabase/client';
import type { LocalDelivery } from '@/lib/checkoutRules';

export type RouteQuote = NonNullable<LocalDelivery['quote']>;

/**
 * Asks the existing local-route-freight calculator for a signed quote.
 * Returns null when the route cannot be calculated; never invents a price.
 */
export async function fetchRouteQuote(cep: string, number: string): Promise<RouteQuote | null> {
  const num = number.trim();
  try {
    const { data, error } = await supabase.functions.invoke('local-route-freight', { body: { cep, number: num } });
    if (error || !data || !Number.isFinite(data.distanceKm) || data.distanceKm < 0 ||
        !Number.isFinite(data.price) || data.price < 0) return null;
    return { distanceKm: data.distanceKm, price: data.price, number: num || undefined, quoteToken: data.quoteToken, expiresAt: data.expiresAt };
  } catch {
    return null;
  }
}
