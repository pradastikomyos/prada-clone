/**
 * upload-assets-to-storage.mjs
 *
 * Uploads all local reference assets to Supabase Storage and updates:
 *   1. public.site_assets.public_url  — for CMS-managed slots (hero, mosaic, etc.)
 *   2. public.product_images.image_url — for product catalog images
 *
 * Usage:
 *   node scripts/upload-assets-to-storage.mjs
 *
 * Requires frontend/.env.local with:
 *   VITE_SUPABASE_URL=https://xyhdnprncjvhtdfyovpx.supabase.co
 *   VITE_SUPABASE_ANON_KEY=...
 *   SUPABASE_SERVICE_ROLE_KEY=...   ← needed to bypass RLS for updates
 *
 * Idempotent: already-uploaded files are skipped unless --force is passed.
 */

import { readFile, stat } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const publicRoot = resolve(repoRoot, 'public');

// ── Load env ──────────────────────────────────────────────────────────────
const envPath = resolve(repoRoot, '.env.local');
let envContent = '';
try {
  envContent = await readFile(envPath, 'utf8');
} catch {
  console.error('Missing frontend/.env.local — cannot connect to Supabase.');
  process.exit(1);
}

function readEnv(key) {
  const match = envContent.match(new RegExp(`^${key}=(.+)$`, 'm'));
  return match ? match[1].trim() : null;
}

const supabaseUrl = readEnv('VITE_SUPABASE_URL');
const serviceRoleKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in frontend/.env.local',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const force = process.argv.includes('--force');

// ── Asset manifest ────────────────────────────────────────────────────────
// Each entry: { localPath, bucket, storagePath, slot?, productSku? }
// slot → update site_assets.public_url
// productSku → update product_images.image_url for that product

const ASSETS = [
  // ── site-assets: home ──────────────────────────────────────────────────
  {
    localPath: 'assets/reference/prada/home/hero/days-of-summer-loop.mp4',
    bucket: 'site-assets',
    storagePath: 'home/hero/days-of-summer-loop.mp4',
    slot: 'home.hero.video',
  },
  {
    localPath: 'assets/reference/prada/home/mosaic/spring-summer-women-landscape.avif',
    bucket: 'site-assets',
    storagePath: 'home/mosaic/spring-summer-women-landscape.avif',
    slot: 'home.spring-summer.women.mosaic',
  },
  {
    localPath: 'assets/reference/prada/home/mosaic/spring-summer-men-landscape.avif',
    bucket: 'site-assets',
    storagePath: 'home/mosaic/spring-summer-men-landscape.avif',
    slot: 'home.spring-summer.men.mosaic',
  },

  // ── site-assets: listing hero videos ──────────────────────────────────
  {
    localPath: 'assets/reference/prada/women-new-arrivals/hero/new-arrivals-loop.webm',
    bucket: 'site-assets',
    storagePath: 'women/new-arrivals/hero/new-arrivals-loop.webm',
    slot: 'women.new-arrivals.hero.video',
  },
  {
    localPath: 'assets/reference/prada/men-new-arrivals/hero/new-arrivals-loop.webm',
    bucket: 'site-assets',
    storagePath: 'men/new-arrivals/hero/new-arrivals-loop.webm',
    slot: 'men.new-arrivals.hero.video',
  },

  // ── site-assets: login editorial ───────────────────────────────────────
  {
    localPath: 'assets/reference/zara/login/editorial.jpg',
    bucket: 'site-assets',
    storagePath: 'login/editorial/editorial.jpg',
    slot: 'login.editorial',
  },

  // ── product-images: women new arrivals ────────────────────────────────
  { localPath: 'assets/reference/prada/women-new-arrivals/products/ribbed-cotton-top.avif',                          bucket: 'product-images', storagePath: 'women/new-arrivals/ribbed-cotton-top.avif',                          productSku: 'WNA001' },
  { localPath: 'assets/reference/prada/women-new-arrivals/products/embroidered-linen-skirt.avif',                    bucket: 'product-images', storagePath: 'women/new-arrivals/embroidered-linen-skirt.avif',                    productSku: 'WNA002' },
  { localPath: 'assets/reference/prada/women-new-arrivals/products/antiqued-leather-sandals.avif',                   bucket: 'product-images', storagePath: 'women/new-arrivals/antiqued-leather-sandals.avif',                   productSku: 'WNA003' },
  { localPath: 'assets/reference/prada/women-new-arrivals/products/prada-fold-large-leather-shoulder-bag.avif',      bucket: 'product-images', storagePath: 'women/new-arrivals/prada-fold-large-leather-shoulder-bag.avif',      productSku: 'WNA004' },
  { localPath: 'assets/reference/prada/women-new-arrivals/products/striped-pique-polo-shirt.avif',                   bucket: 'product-images', storagePath: 'women/new-arrivals/striped-pique-polo-shirt.avif',                   productSku: 'WNA005' },
  { localPath: 'assets/reference/prada/women-new-arrivals/products/prada-bonnie-small-printed-linen-leather-handbag.avif', bucket: 'product-images', storagePath: 'women/new-arrivals/prada-bonnie-small-printed-linen-leather-handbag.avif', productSku: 'WNA006' },
  { localPath: 'assets/reference/prada/women-new-arrivals/products/shuffle-antiqued-leather-boat-shoes.avif',        bucket: 'product-images', storagePath: 'women/new-arrivals/shuffle-antiqued-leather-boat-shoes.avif',        productSku: 'WNA007' },
  { localPath: 'assets/reference/prada/women-new-arrivals/products/suede-jacket.avif',                               bucket: 'product-images', storagePath: 'women/new-arrivals/suede-jacket.avif',                               productSku: 'WNA008' },
  { localPath: 'assets/reference/prada/women-new-arrivals/products/old-denim-blouson-jacket.avif',                   bucket: 'product-images', storagePath: 'women/new-arrivals/old-denim-blouson-jacket.avif',                   productSku: 'WNA009' },

  // ── product-images: men new arrivals ──────────────────────────────────
  { localPath: 'assets/reference/prada/men-new-arrivals/products/prada-route-canvas-leather-tote-bag.jpg',  bucket: 'product-images', storagePath: 'men/new-arrivals/prada-route-canvas-leather-tote-bag.jpg',  productSku: 'MNA001' },
  { localPath: 'assets/reference/prada/men-new-arrivals/products/suede-bomber-jacket.jpg',                  bucket: 'product-images', storagePath: 'men/new-arrivals/suede-bomber-jacket.jpg',                  productSku: 'MNA002' },
  { localPath: 'assets/reference/prada/men-new-arrivals/products/sunglasses-iconic-metal-plaque.jpg',       bucket: 'product-images', storagePath: 'men/new-arrivals/sunglasses-iconic-metal-plaque.jpg',       productSku: 'MNA003' },
  { localPath: 'assets/reference/prada/men-new-arrivals/products/leather-mules.jpg',                        bucket: 'product-images', storagePath: 'men/new-arrivals/leather-mules.jpg',                        productSku: 'MNA004' },
  { localPath: 'assets/reference/prada/men-new-arrivals/products/prada-explore-leather-shoulder-bag.jpg',   bucket: 'product-images', storagePath: 'men/new-arrivals/prada-explore-leather-shoulder-bag.jpg',   productSku: 'MNA005' },
  { localPath: 'assets/reference/prada/men-new-arrivals/products/suede-band-sandals.jpg',                   bucket: 'product-images', storagePath: 'men/new-arrivals/suede-band-sandals.jpg',                   productSku: 'MNA006' },
  { localPath: 'assets/reference/prada/men-new-arrivals/products/striped-cotton-pique-polo-shirt.jpg',      bucket: 'product-images', storagePath: 'men/new-arrivals/striped-cotton-pique-polo-shirt.jpg',      productSku: 'MNA007' },
  { localPath: 'assets/reference/prada/men-new-arrivals/products/old-denim-five-pocket-jeans.jpg',          bucket: 'product-images', storagePath: 'men/new-arrivals/old-denim-five-pocket-jeans.jpg',          productSku: 'MNA008' },
  { localPath: 'assets/reference/prada/men-new-arrivals/products/bull-denim-zipper-shirt.jpg',              bucket: 'product-images', storagePath: 'men/new-arrivals/bull-denim-zipper-shirt.jpg',              productSku: 'MNA009' },

  // ── product-images: women dresses ─────────────────────────────────────
  { localPath: 'assets/reference/prada/women-categories/dresses/embroidered-linen-mini-dress.avif',  bucket: 'product-images', storagePath: 'women/dresses/embroidered-linen-mini-dress.avif',  productSku: 'WDR001' },
  { localPath: 'assets/reference/prada/women-categories/dresses/embroidered-linen-dress.avif',       bucket: 'product-images', storagePath: 'women/dresses/embroidered-linen-dress.avif',       productSku: 'WDR002' },
  { localPath: 'assets/reference/prada/women-categories/dresses/embroidered-canvas-mini-dress.avif', bucket: 'product-images', storagePath: 'women/dresses/embroidered-canvas-mini-dress.avif', productSku: 'WDR003' },

  // ── product-images: women tops ────────────────────────────────────────
  { localPath: 'assets/reference/prada/women-categories/tops/embroidered-linen-top.avif',          bucket: 'product-images', storagePath: 'women/tops/embroidered-linen-top.avif',          productSku: 'WTO001' },
  { localPath: 'assets/reference/prada/women-categories/tops/linen-top-floral-motif.avif',         bucket: 'product-images', storagePath: 'women/tops/linen-top-floral-motif.avif',         productSku: 'WTO002' },
  { localPath: 'assets/reference/prada/women-categories/tops/sleeveless-polka-dot-silk-shirt.avif', bucket: 'product-images', storagePath: 'women/tops/sleeveless-polka-dot-silk-shirt.avif', productSku: 'WTO003' },

  // ── product-images: women outerwear ───────────────────────────────────
  { localPath: 'assets/reference/prada/women-categories/outerwear/embroidered-gabardine-blouson.avif', bucket: 'product-images', storagePath: 'women/outerwear/embroidered-gabardine-blouson.avif', productSku: 'WOU001' },
  { localPath: 'assets/reference/prada/women-categories/outerwear/washed-re-nylon-jacket.avif',        bucket: 'product-images', storagePath: 'women/outerwear/washed-re-nylon-jacket.avif',        productSku: 'WOU002' },
  { localPath: 'assets/reference/prada/women-categories/outerwear/silk-faille-blouson-jacket.avif',    bucket: 'product-images', storagePath: 'women/outerwear/silk-faille-blouson-jacket.avif',    productSku: 'WOU003' },

  // ── product-images: women trousers ────────────────────────────────────
  { localPath: 'assets/reference/prada/women-categories/trousers/floral-print-linen-skirt.avif',  bucket: 'product-images', storagePath: 'women/trousers/floral-print-linen-skirt.avif',  productSku: 'WTR001' },
  { localPath: 'assets/reference/prada/women-categories/trousers/pleated-silk-faille-skirt.avif', bucket: 'product-images', storagePath: 'women/trousers/pleated-silk-faille-skirt.avif', productSku: 'WTR002' },
  { localPath: 'assets/reference/prada/women-categories/trousers/poplin-shorts.avif',             bucket: 'product-images', storagePath: 'women/trousers/poplin-shorts.avif',             productSku: 'WTR003' },
];

// ── Helpers ───────────────────────────────────────────────────────────────

function publicUrl(bucket, storagePath) {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;
}

async function fileExists(localPath) {
  try {
    const info = await stat(localPath);
    return info.size > 0;
  } catch {
    return false;
  }
}

function mimeFromPath(p) {
  if (p.endsWith('.mp4')) return 'video/mp4';
  if (p.endsWith('.webm')) return 'video/webm';
  if (p.endsWith('.avif')) return 'image/avif';
  if (p.endsWith('.jpg') || p.endsWith('.jpeg')) return 'image/jpeg';
  if (p.endsWith('.png')) return 'image/png';
  if (p.endsWith('.webp')) return 'image/webp';
  return 'application/octet-stream';
}

// ── Main ──────────────────────────────────────────────────────────────────

const results = { uploaded: 0, skipped: 0, failed: 0 };
const errors = [];

for (const asset of ASSETS) {
  const absPath = join(publicRoot, asset.localPath);

  if (!(await fileExists(absPath))) {
    console.log(`MISSING  ${asset.localPath}`);
    errors.push({ path: asset.localPath, error: 'File not found locally' });
    results.failed++;
    continue;
  }

  // Check if already uploaded (unless --force)
  if (!force) {
    const { data: existing } = await supabase.storage
      .from(asset.bucket)
      .list(asset.storagePath.split('/').slice(0, -1).join('/'), {
        search: asset.storagePath.split('/').at(-1),
      });
    if (existing && existing.length > 0) {
      console.log(`SKIP     ${asset.storagePath} (already in bucket)`);
      results.skipped++;
      // Still update DB URL in case it was wrong
      await updateDbUrl(asset);
      continue;
    }
  }

  try {
    const buffer = await readFile(absPath);
    const contentType = mimeFromPath(asset.localPath);

    const { error: uploadError } = await supabase.storage
      .from(asset.bucket)
      .upload(asset.storagePath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    await updateDbUrl(asset);

    console.log(`OK       ${asset.bucket}/${asset.storagePath}`);
    results.uploaded++;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`FAIL     ${asset.storagePath}: ${msg}`);
    errors.push({ path: asset.storagePath, error: msg });
    results.failed++;
  }
}

async function updateDbUrl(asset) {
  const url = publicUrl(asset.bucket, asset.storagePath);

  if (asset.slot) {
    const { error } = await supabase
      .from('site_assets')
      .update({ public_url: url, updated_at: new Date().toISOString() })
      .eq('slot', asset.slot);
    if (error) console.warn(`  DB update failed for slot ${asset.slot}: ${error.message}`);
  }

  if (asset.productSku) {
    // Update product_images.image_url for the matching product SKU
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('sku', asset.productSku)
      .maybeSingle();

    if (product?.id) {
      const { error } = await supabase
        .from('product_images')
        .update({ image_url: url })
        .eq('product_id', product.id)
        .eq('sort_order', 0);
      if (error) console.warn(`  DB update failed for SKU ${asset.productSku}: ${error.message}`);
    }
  }
}

console.log('');
console.log(`Done. uploaded=${results.uploaded} skipped=${results.skipped} failed=${results.failed}`);
if (errors.length) {
  console.log('\nErrors:');
  for (const e of errors) console.log(`  ${e.path}: ${e.error}`);
  process.exitCode = 1;
}
