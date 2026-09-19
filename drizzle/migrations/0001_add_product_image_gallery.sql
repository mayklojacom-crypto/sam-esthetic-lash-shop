ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}'::text[];

UPDATE public.products
SET images = ARRAY[image]
WHERE cardinality(images) = 0
  AND image IS NOT NULL
  AND image <> '';