
CREATE TABLE public.banners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  link text NOT NULL DEFAULT '/catalogo',
  alt text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.banners TO anon, authenticated;
GRANT ALL ON public.banners TO service_role;

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active banners"
  ON public.banners FOR SELECT
  USING (active = true);

CREATE OR REPLACE FUNCTION public.update_banners_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_banners_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.update_banners_updated_at();

-- Seed with the current 3 banners
INSERT INTO public.banners (title, image_url, link, alt, sort_order) VALUES
  ('Agenda continuar', '/__l5e/assets-v1/placeholder-agenda/banner-agenda.png', '/catalogo', 'Tudo para sua agenda continuar', 0),
  ('Pede e recebe hoje', '/__l5e/assets-v1/placeholder-pede/banner-pede.png', '/catalogo', 'Pede agora e recebe hoje', 1),
  ('Queridinhas colas', '/__l5e/assets-v1/placeholder-colas/banner-colas.png', '/catalogo?cat=colas', 'As queridinhas da lash', 2);
