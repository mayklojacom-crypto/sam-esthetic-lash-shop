-- Normalize invalid slugs (accents, spaces, quotes) so image uploads work
UPDATE public.products
SET slug = trim(both '-' from regexp_replace(lower(unaccent_slug), '[^a-z0-9]+', '-', 'g')),
    updated_at = now()
FROM (SELECT id AS pid, translate(slug,
  'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç',
  'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc') AS unaccent_slug FROM public.products) s
WHERE products.id = s.pid
  AND products.slug ~ '[^a-z0-9-]';

INSERT INTO public.products (slug, name, price, category, description, image, stock, active, weight, sort_order)
VALUES
  ('fio-bella-moca-mix-y', 'Fio Bella Moça Mix Y', 19, 'cilios', '', '/placeholder.svg', 0, true, 50, 0),
  ('cola-salon-pro-16', 'Cola Salon Pro 16', 16, 'colas', '', '/placeholder.svg', 0, true, 50, 0)
ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price, active = true, updated_at = now();