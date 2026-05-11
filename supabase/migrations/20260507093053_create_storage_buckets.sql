insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'site-assets',
    'site-assets',
    true,
    52428800,
    array[
      'image/avif',
      'image/gif',
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/webm'
    ]
  ),
  (
    'product-images',
    'product-images',
    true,
    10485760,
    array[
      'image/avif',
      'image/jpeg',
      'image/png',
      'image/webp'
    ]
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public read access for site assets"
on storage.objects
for select
to public
using (bucket_id = 'site-assets');

create policy "Public read access for product images"
on storage.objects
for select
to public
using (bucket_id = 'product-images');
