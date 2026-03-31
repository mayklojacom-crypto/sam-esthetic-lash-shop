
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  original_price numeric,
  image text NOT NULL DEFAULT '/placeholder.svg',
  category text NOT NULL DEFAULT 'cilios',
  description text NOT NULL DEFAULT '',
  featured boolean NOT NULL DEFAULT false,
  sizes text[],
  weight integer DEFAULT 50,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public read access for active products
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (active = true);

-- No direct write access - managed via edge functions with admin auth
