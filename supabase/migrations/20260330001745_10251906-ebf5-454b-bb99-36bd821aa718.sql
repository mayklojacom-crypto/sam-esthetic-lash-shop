
-- Orders table to store order data for webhook retrieval
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_reference TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_notes TEXT DEFAULT '',
  items JSONB NOT NULL,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No RLS needed - only edge functions access this table via service role
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Storage bucket for order PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('order-pdfs', 'order-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for PDFs
CREATE POLICY "Public read access for order PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-pdfs');

-- Service role upload access
CREATE POLICY "Service role upload for order PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'order-pdfs');
