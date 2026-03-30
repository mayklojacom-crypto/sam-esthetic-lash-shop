
CREATE OR REPLACE FUNCTION public.search_orders_by_phone(phone_query text)
RETURNS TABLE(
  id uuid,
  external_reference text,
  customer_name text,
  payment_status text,
  total numeric,
  items jsonb,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.external_reference, o.customer_name, o.payment_status, o.total, o.items, o.created_at
  FROM public.orders o
  WHERE replace(replace(replace(replace(o.customer_phone, '(', ''), ')', ''), '-', ''), ' ', '') 
        ILIKE '%' || phone_query || '%'
  ORDER BY o.created_at DESC
  LIMIT 10;
$$;

CREATE OR REPLACE FUNCTION public.search_orders_by_reference(ref_query text)
RETURNS TABLE(
  id uuid,
  external_reference text,
  customer_name text,
  payment_status text,
  total numeric,
  items jsonb,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.external_reference, o.customer_name, o.payment_status, o.total, o.items, o.created_at
  FROM public.orders o
  WHERE o.external_reference = ref_query
  ORDER BY o.created_at DESC
  LIMIT 5;
$$;
