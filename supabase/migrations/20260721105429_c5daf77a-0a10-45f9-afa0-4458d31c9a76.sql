ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 0;
UPDATE public.products SET stock = 999 WHERE stock = 0;