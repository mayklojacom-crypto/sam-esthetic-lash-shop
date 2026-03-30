insert into storage.buckets (id, name, public)
values ('order-pdfs', 'order-pdfs', true)
on conflict (id) do nothing;

create policy "Public read access for order PDFs"
on storage.objects for select
using (bucket_id = 'order-pdfs');

create policy "Service role can upload order PDFs"
on storage.objects for insert
with check (bucket_id = 'order-pdfs');
