CREATE TABLE public.pos_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'pix',
  notes text NOT NULL DEFAULT '',
  cancelled boolean NOT NULL DEFAULT false,
  cancelled_at timestamptz,
  created_by text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.pos_sales TO service_role;
ALTER TABLE public.pos_sales ENABLE ROW LEVEL SECURITY;
CREATE INDEX pos_sales_created_at_idx ON public.pos_sales (created_at DESC);

CREATE OR REPLACE FUNCTION public.pos_register_sale(p_items jsonb, p_discount numeric, p_payment_method text, p_notes text, p_created_by text)
RETURNS public.pos_sales
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  it jsonb; prod record; qty int; lines jsonb := '[]'::jsonb; sub numeric := 0; sale public.pos_sales;
BEGIN
  IF p_payment_method NOT IN ('pix','dinheiro','credito','debito') THEN RAISE EXCEPTION 'Forma de pagamento inválida'; END IF;
  IF jsonb_array_length(p_items) = 0 THEN RAISE EXCEPTION 'Venda sem produtos'; END IF;
  FOR it IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    qty := (it->>'quantity')::int;
    IF qty IS NULL OR qty < 1 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
    SELECT id, name, price, stock INTO prod FROM public.products WHERE id = (it->>'product_id')::uuid FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Produto não encontrado'; END IF;
    IF prod.stock < qty THEN RAISE EXCEPTION 'Estoque insuficiente: % (restam %)', prod.name, prod.stock; END IF;
    UPDATE public.products SET stock = stock - qty, updated_at = now() WHERE id = prod.id;
    lines := lines || jsonb_build_object('product_id', prod.id, 'name', prod.name, 'unit_price', prod.price, 'quantity', qty, 'line_total', round(prod.price * qty, 2));
    sub := sub + round(prod.price * qty, 2);
  END LOOP;
  IF p_discount < 0 OR p_discount > sub THEN RAISE EXCEPTION 'Desconto inválido'; END IF;
  INSERT INTO public.pos_sales (items, subtotal, discount, total, payment_method, notes, created_by)
  VALUES (lines, sub, round(p_discount,2), round(sub - p_discount, 2), p_payment_method, coalesce(p_notes,''), coalesce(p_created_by,''))
  RETURNING * INTO sale;
  RETURN sale;
END; $$;

CREATE OR REPLACE FUNCTION public.pos_cancel_sale(p_id uuid)
RETURNS public.pos_sales
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sale public.pos_sales; it jsonb;
BEGIN
  SELECT * INTO sale FROM public.pos_sales WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Venda não encontrada'; END IF;
  IF sale.cancelled THEN RAISE EXCEPTION 'Venda já cancelada'; END IF;
  FOR it IN SELECT * FROM jsonb_array_elements(sale.items) LOOP
    UPDATE public.products SET stock = stock + (it->>'quantity')::int, updated_at = now() WHERE id = (it->>'product_id')::uuid;
  END LOOP;
  UPDATE public.pos_sales SET cancelled = true, cancelled_at = now() WHERE id = p_id RETURNING * INTO sale;
  RETURN sale;
END; $$;

REVOKE ALL ON FUNCTION public.pos_register_sale(jsonb, numeric, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pos_cancel_sale(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pos_register_sale(jsonb, numeric, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.pos_cancel_sale(uuid) TO service_role;