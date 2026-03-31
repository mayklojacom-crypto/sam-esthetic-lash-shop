
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Allow uploads to product images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow delete product images"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'product-images');
