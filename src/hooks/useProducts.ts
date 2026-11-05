import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '@/data/products';

// Mapeia row do banco para o formato Product usado nos componentes
const mapRow = (r: any): Product => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  price: Number(r.price) || 0,
  originalPrice: r.original_price != null ? Number(r.original_price) : undefined,
  image: r.image || '/placeholder.svg',
  images: Array.isArray(r.images) && r.images.length > 0
    ? r.images.filter((url: unknown): url is string => typeof url === 'string' && url.length > 0).slice(0, 3)
    : [r.image || '/placeholder.svg'],
  category: r.category,
  description: r.description || '',
  featured: !!r.featured,
  sizes: r.sizes || undefined,
  weight: r.weight ?? undefined,
  promoActive: !!r.promo_active,
  promoEndsAt: r.promo_ends_at ?? null,
  stock: typeof r.stock === 'number' ? r.stock : 999,
});

export type ProductsStatus = 'loading' | 'ready' | 'error';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<ProductsStatus>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    (async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (!active) return;
      if (error || !data) {
        // Keep the real error visible to the UI instead of showing an empty store.
        console.error('Falha ao carregar produtos:', error);
        setStatus('error');
        return;
      }
      setProducts(data.map(mapRow));
      setStatus('ready');
    })();
    return () => {
      active = false;
    };
  }, [attempt]);

  const reload = useCallback(() => setAttempt(a => a + 1), []);
  return { products, loading: status === 'loading', status, error: status === 'error', reload };
}

export function useProductBySlug(slug: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(false);
    (async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('active', true)
        .maybeSingle();
      if (!active) return;
      if (error) console.error('Falha ao carregar produto:', error);
      setError(!!error);
      setProduct(!error && data ? mapRow(data) : null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [slug, attempt]);

  const reload = useCallback(() => setAttempt(a => a + 1), []);
  return { product, loading, error, reload };
}
