import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CheckoutTotals from '@/components/CheckoutTotals';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));
import { supabase } from '@/integrations/supabase/client';
import { fetchRouteQuote } from '@/lib/routeQuote';

describe('checkout funnel', () => {
  it('without freight shows products total + frete, never "a combinar"', () => {
    const { container } = render(<CheckoutTotals subtotal={50} />);
    expect(screen.getByText('R$ 50,00 + frete')).toBeTruthy();
    expect(container.textContent).not.toMatch(/a combinar/i);
  });

  it('with a calculated freight shows the real total', () => {
    render(<CheckoutTotals subtotal={50} estimate={9.48} />);
    expect(screen.getByText('R$ 59,48')).toBeTruthy();
  });

  it('route calculator failure returns null instead of an invented price', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({ data: null, error: new Error('down') } as never);
    expect(await fetchRouteQuote('74000000', '10')).toBeNull();
  });

  it('valid route answer is kept as a signed quote', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({ data: { distanceKm: 3, price: 7, quoteToken: 't', expiresAt: 1 }, error: null } as never);
    expect(await fetchRouteQuote('74000000', ' 10 ')).toEqual({ distanceKm: 3, price: 7, number: '10', quoteToken: 't', expiresAt: 1 });
  });
});
