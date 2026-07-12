ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS promo_active boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS promo_ends_at timestamptz;