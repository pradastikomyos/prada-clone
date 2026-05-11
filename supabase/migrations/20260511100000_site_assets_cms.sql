-- site_assets: CMS-managed asset slots.
-- Each row represents one named "slot" (e.g. home.hero.video) whose URL
-- can be updated by an admin without a code deploy.
-- The frontend reads these rows to resolve media URLs at runtime.

create table if not exists public.site_assets (
  id          uuid primary key default gen_random_uuid(),
  slot        text not null unique,          -- e.g. 'home.hero.video'
  bucket      text not null,                 -- 'site-assets' | 'product-images'
  storage_path text not null,               -- path inside the bucket
  public_url  text not null,                -- full public URL (computed on insert/update)
  mime_type   text,                         -- e.g. 'video/mp4', 'image/avif'
  label       text,                         -- human-readable label for CMS UI
  updated_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- updated_at trigger
drop trigger if exists set_site_assets_updated_at on public.site_assets;
create trigger set_site_assets_updated_at
before update on public.site_assets
for each row execute function public.set_updated_at();

-- RLS
alter table public.site_assets enable row level security;

-- Anyone can read (public storefront needs to fetch asset URLs)
drop policy if exists "Public can read site assets" on public.site_assets;
create policy "Public can read site assets"
on public.site_assets
for select
using (true);

-- Only admins can insert/update/delete
drop policy if exists "Admins manage site assets" on public.site_assets;
create policy "Admins manage site assets"
on public.site_assets
for all
using (public.is_admin())
with check (public.is_admin());

-- ── Seed initial slots ────────────────────────────────────────────────────
-- Storage paths follow the convention:
--   site-assets/
--     home/hero/                  ← homepage hero video
--     home/mosaic/                ← homepage mosaic images
--     women/new-arrivals/hero/    ← women listing hero video
--     men/new-arrivals/hero/      ← men listing hero video
--     login/editorial/            ← login page editorial image
--
-- product-images/
--     women/new-arrivals/         ← WNA product images
--     women/dresses/              ← WDR product images
--     women/tops/                 ← WTO product images
--     women/outerwear/            ← WOU product images
--     women/trousers/             ← WTR product images
--     men/new-arrivals/           ← MNA product images

-- Helper: build public URL from bucket + path
-- Format: https://<project-ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
-- We use a placeholder that the upload script will replace with real URLs.
-- For now we seed with the local /assets/reference/... paths so the app
-- still works before the upload is done.

insert into public.site_assets (slot, bucket, storage_path, public_url, mime_type, label)
values
  -- ── Homepage hero ──────────────────────────────────────────────────────
  ('home.hero.video',
   'site-assets',
   'home/hero/days-of-summer-loop.mp4',
   '/assets/reference/prada/home/hero/days-of-summer-loop.mp4',
   'video/mp4',
   'Homepage — Hero video (Days of Summer)'),

  ('home.spring-summer.women.mosaic',
   'site-assets',
   'home/mosaic/spring-summer-women-landscape.avif',
   '/assets/reference/prada/home/mosaic/spring-summer-women-landscape.avif',
   'image/avif',
   'Homepage — Spring Summer Women mosaic'),

  ('home.spring-summer.men.mosaic',
   'site-assets',
   'home/mosaic/spring-summer-men-landscape.avif',
   '/assets/reference/prada/home/mosaic/spring-summer-men-landscape.avif',
   'image/avif',
   'Homepage — Spring Summer Men mosaic'),

  -- ── Listing hero videos ────────────────────────────────────────────────
  ('women.new-arrivals.hero.video',
   'site-assets',
   'women/new-arrivals/hero/new-arrivals-loop.webm',
   '/assets/reference/prada/women-new-arrivals/hero/new-arrivals-loop.webm',
   'video/webm',
   'Women New Arrivals — Hero video'),

  ('men.new-arrivals.hero.video',
   'site-assets',
   'men/new-arrivals/hero/new-arrivals-loop.webm',
   '/assets/reference/prada/men-new-arrivals/hero/new-arrivals-loop.webm',
   'video/webm',
   'Men New Arrivals — Hero video'),

  -- ── Login editorial ────────────────────────────────────────────────────
  ('login.editorial',
   'site-assets',
   'login/editorial/editorial.jpg',
   '/assets/reference/zara/login/editorial.jpg',
   'image/jpeg',
   'Login page — Editorial image')

on conflict (slot) do update
set
  bucket       = excluded.bucket,
  storage_path = excluded.storage_path,
  public_url   = excluded.public_url,
  mime_type    = excluded.mime_type,
  label        = excluded.label,
  updated_at   = now();
