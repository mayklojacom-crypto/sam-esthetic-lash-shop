
CREATE TABLE public.coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  discount_percent numeric NOT NULL DEFAULT 10 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  title text NOT NULL DEFAULT 'Espera! 🎁',
  subtitle text NOT NULL DEFAULT 'Antes de sair, leve um cupom exclusivo pra você:',
  cta_text text NOT NULL DEFAULT 'Copiar Cupom',
  active boolean NOT NULL DEFAULT true,
  show_in_popup boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.coupons TO anon;
GRANT SELECT ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons"
  ON public.coupons FOR SELECT
  USING (active = true);

CREATE OR REPLACE FUNCTION public.update_coupons_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_coupons_updated_at();

-- Garante apenas 1 cupom marcado como popup ativo por vez
CREATE UNIQUE INDEX coupons_one_popup_idx
  ON public.coupons ((true))
  WHERE show_in_popup = true AND active = true;

INSERT INTO public.coupons (code, discount_percent, title, subtitle, cta_text, active, show_in_popup)
VALUES (
  'RECUPERA10', 10,
  'Espera! 🎁',
  'Não vá embora sem finalizar! Garantimos um desconto especial pra você:',
  'Copiar Cupom',
  true, true
);

INSERT INTO public.coupons (code, discount_percent, active, show_in_popup)
VALUES ('VOLTA15', 15, true, false);
