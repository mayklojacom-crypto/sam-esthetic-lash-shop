import { useEffect, useState } from 'react';
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
  category: r.category,
  description: r.description || '',
  featured: !!r.featured,
  sizes: r.sizes || undefined,
  weight: r.weight ?? undefined,
});

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (!active) return;
      if (!error && data) setProducts(data.map(mapRow));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { products, loading };
}

export function useProductBySlug(slug: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('active', true)
        .maybeSingle();
      if (!active) return;
      if (!error && data) setProduct(mapRow(data));
      else setProduct(null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  return { product, loading };
}
