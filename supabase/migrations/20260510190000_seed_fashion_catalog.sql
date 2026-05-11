-- Seed the fashion catalog with 30 reference products harvested from Prada.com.
-- Categories:
--   WOMEN_NEW_ARRIVALS  (9)
--   MEN_NEW_ARRIVALS    (9)
--   WOMEN_DRESSES       (3)
--   WOMEN_TOPS          (3)
--   WOMEN_OUTERWEAR     (3)
--   WOMEN_TROUSERS      (3)
--
-- Images point to `/assets/reference/prada/...` so the frontend can render them
-- directly via Vite's /public. When we migrate to Supabase Storage the same
-- paths can be swapped for public bucket URLs without touching the schema.

with product_seed as (
  insert into public.products (name, slug, sku, description, category, status, base_price_idr, sort_order)
  values
    -- WOMEN_NEW_ARRIVALS
    ('Ribbed cotton top', 'ribbed-cotton-top', 'WNA001', 'Ribbed cotton top with a soft fitted silhouette.', 'WOMEN_NEW_ARRIVALS', 'active', 1890000, 10),
    ('Embroidered linen skirt', 'embroidered-linen-skirt', 'WNA002', 'Lightweight linen skirt with hand-guided embroidery.', 'WOMEN_NEW_ARRIVALS', 'active', 4290000, 20),
    ('Antiqued leather sandals', 'antiqued-leather-sandals', 'WNA003', 'Antiqued leather sandals finished with a natural patina.', 'WOMEN_NEW_ARRIVALS', 'active', 9890000, 30),
    ('Prada Fold large leather shoulder bag', 'prada-fold-large-leather-shoulder-bag', 'WNA004', 'Large folded leather shoulder bag with smooth hardware.', 'WOMEN_NEW_ARRIVALS', 'active', 38900000, 40),
    ('Striped pique polo shirt', 'striped-pique-polo-shirt', 'WNA005', 'Striped pique knit polo with contrast trim.', 'WOMEN_NEW_ARRIVALS', 'active', 5290000, 50),
    ('Prada Bonnie small printed linen and leather handbag', 'prada-bonnie-small-printed-linen-leather-handbag', 'WNA006', 'Small printed linen and leather handbag, softly structured.', 'WOMEN_NEW_ARRIVALS', 'active', 29900000, 60),
    ('Shuffle antiqued leather boat shoes', 'shuffle-antiqued-leather-boat-shoes', 'WNA007', 'Classic boat shoes in antiqued leather.', 'WOMEN_NEW_ARRIVALS', 'active', 12900000, 70),
    ('Suede jacket', 'suede-jacket-women', 'WNA008', 'Suede jacket with online early access styling.', 'WOMEN_NEW_ARRIVALS', 'active', 39900000, 80),
    ('Old denim blouson jacket', 'old-denim-blouson-jacket', 'WNA009', 'Vintage wash denim blouson with a relaxed shape.', 'WOMEN_NEW_ARRIVALS', 'active', 15900000, 90),

    -- MEN_NEW_ARRIVALS
    ('Prada Route canvas and leather tote bag', 'prada-route-canvas-leather-tote-bag', 'MNA001', 'Canvas and leather tote bag with a minimal silhouette.', 'MEN_NEW_ARRIVALS', 'active', 24900000, 10),
    ('Suede bomber jacket', 'suede-bomber-jacket', 'MNA002', 'Suede bomber jacket with a clean ribbed trim.', 'MEN_NEW_ARRIVALS', 'active', 49900000, 20),
    ('Sunglasses with the iconic metal plaque', 'sunglasses-iconic-metal-plaque', 'MNA003', 'Sunglasses with the iconic metal plaque. Virtual try-on ready.', 'MEN_NEW_ARRIVALS', 'active', 6290000, 30),
    ('Leather mules', 'leather-mules', 'MNA004', 'Leather mules in sienna and black colorways.', 'MEN_NEW_ARRIVALS', 'active', 8290000, 40),
    ('Prada Explore leather shoulder bag', 'prada-explore-leather-shoulder-bag', 'MNA005', 'Explore leather shoulder bag, compact and travel-ready.', 'MEN_NEW_ARRIVALS', 'active', 27900000, 50),
    ('Suede band sandals', 'suede-band-sandals', 'MNA006', 'Suede band sandals across four colorways.', 'MEN_NEW_ARRIVALS', 'active', 9290000, 60),
    ('Striped cotton pique polo shirt', 'striped-cotton-pique-polo-shirt', 'MNA007', 'Cotton pique polo shirt with striped details.', 'MEN_NEW_ARRIVALS', 'active', 5290000, 70),
    ('Old denim five-pocket jeans', 'old-denim-five-pocket-jeans', 'MNA008', 'Vintage denim five-pocket jeans, straight fit.', 'MEN_NEW_ARRIVALS', 'active', 6890000, 80),
    ('Bull denim zipper shirt', 'bull-denim-zipper-shirt', 'MNA009', 'Bull denim zipper shirt with a clean workwear edge.', 'MEN_NEW_ARRIVALS', 'active', 7290000, 90),

    -- WOMEN_DRESSES
    ('Embroidered linen mini-dress', 'embroidered-linen-mini-dress', 'WDR001', 'Embroidered linen mini-dress with a fitted cut.', 'WOMEN_DRESSES', 'active', 48900000, 10),
    ('Embroidered linen dress', 'embroidered-linen-dress', 'WDR002', 'Embroidered linen dress with an elegant floor-skimming line.', 'WOMEN_DRESSES', 'active', 48900000, 20),
    ('Embroidered canvas mini-dress', 'embroidered-canvas-mini-dress', 'WDR003', 'Embroidered canvas mini-dress with structured shoulders.', 'WOMEN_DRESSES', 'active', 42900000, 30),

    -- WOMEN_TOPS
    ('Embroidered linen top', 'embroidered-linen-top', 'WTO001', 'Embroidered linen top.', 'WOMEN_TOPS', 'active', 18900000, 10),
    ('Linen top with floral motif', 'linen-top-floral-motif', 'WTO002', 'Linen top with a painted floral motif.', 'WOMEN_TOPS', 'active', 21900000, 20),
    ('Sleeveless polka-dot silk shirt', 'sleeveless-polka-dot-silk-shirt', 'WTO003', 'Sleeveless polka-dot silk shirt.', 'WOMEN_TOPS', 'active', 24900000, 30),

    -- WOMEN_OUTERWEAR
    ('Embroidered gabardine blouson', 'embroidered-gabardine-blouson', 'WOU001', 'Embroidered gabardine blouson jacket.', 'WOMEN_OUTERWEAR', 'active', 58900000, 10),
    ('Washed Re-Nylon jacket', 'washed-re-nylon-jacket', 'WOU002', 'Washed Re-Nylon jacket with eco-conscious fabric.', 'WOMEN_OUTERWEAR', 'active', 39900000, 20),
    ('Silk faille blouson jacket', 'silk-faille-blouson-jacket', 'WOU003', 'Silk faille blouson jacket with a fluid drape.', 'WOMEN_OUTERWEAR', 'active', 45900000, 30),

    -- WOMEN_TROUSERS
    ('Floral print linen skirt', 'floral-print-linen-skirt', 'WTR001', 'Floral print linen skirt in a mid-length cut.', 'WOMEN_TROUSERS', 'active', 15900000, 10),
    ('Pleated silk faille skirt', 'pleated-silk-faille-skirt', 'WTR002', 'Pleated silk faille skirt with polished folds.', 'WOMEN_TROUSERS', 'active', 14900000, 20),
    ('Poplin shorts', 'poplin-shorts', 'WTR003', 'Poplin shorts with sharp tailoring.', 'WOMEN_TROUSERS', 'active', 12900000, 30)
  on conflict (sku) do update
  set
    name = excluded.name,
    slug = excluded.slug,
    description = excluded.description,
    category = excluded.category,
    status = excluded.status,
    base_price_idr = excluded.base_price_idr,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id, name, sku, base_price_idr
)
insert into public.product_variants (product_id, name, sku, price_idr, stock_quantity)
select id, name, sku, base_price_idr, 25
from product_seed
on conflict (sku) do update
set
  name = excluded.name,
  price_idr = excluded.price_idr,
  stock_quantity = excluded.stock_quantity,
  updated_at = now();

-- Attach one primary image per SKU (idempotent via delete+insert to allow re-seeding).
delete from public.product_images where product_id in (select id from public.products where sku like 'WNA%' or sku like 'MNA%' or sku like 'WDR%' or sku like 'WTO%' or sku like 'WOU%' or sku like 'WTR%');

insert into public.product_images (product_id, image_url, alt, sort_order)
select p.id, image_map.image_url, p.name, 0
from public.products p
join (values
  ('WNA001', '/assets/reference/prada/women-new-arrivals/products/ribbed-cotton-top.avif'),
  ('WNA002', '/assets/reference/prada/women-new-arrivals/products/embroidered-linen-skirt.avif'),
  ('WNA003', '/assets/reference/prada/women-new-arrivals/products/antiqued-leather-sandals.avif'),
  ('WNA004', '/assets/reference/prada/women-new-arrivals/products/prada-fold-large-leather-shoulder-bag.avif'),
  ('WNA005', '/assets/reference/prada/women-new-arrivals/products/striped-pique-polo-shirt.avif'),
  ('WNA006', '/assets/reference/prada/women-new-arrivals/products/prada-bonnie-small-printed-linen-leather-handbag.avif'),
  ('WNA007', '/assets/reference/prada/women-new-arrivals/products/shuffle-antiqued-leather-boat-shoes.avif'),
  ('WNA008', '/assets/reference/prada/women-new-arrivals/products/suede-jacket.avif'),
  ('WNA009', '/assets/reference/prada/women-new-arrivals/products/old-denim-blouson-jacket.avif'),
  ('MNA001', '/assets/reference/prada/men-new-arrivals/products/prada-route-canvas-leather-tote-bag.jpg'),
  ('MNA002', '/assets/reference/prada/men-new-arrivals/products/suede-bomber-jacket.jpg'),
  ('MNA003', '/assets/reference/prada/men-new-arrivals/products/sunglasses-iconic-metal-plaque.jpg'),
  ('MNA004', '/assets/reference/prada/men-new-arrivals/products/leather-mules.jpg'),
  ('MNA005', '/assets/reference/prada/men-new-arrivals/products/prada-explore-leather-shoulder-bag.jpg'),
  ('MNA006', '/assets/reference/prada/men-new-arrivals/products/suede-band-sandals.jpg'),
  ('MNA007', '/assets/reference/prada/men-new-arrivals/products/striped-cotton-pique-polo-shirt.jpg'),
  ('MNA008', '/assets/reference/prada/men-new-arrivals/products/old-denim-five-pocket-jeans.jpg'),
  ('MNA009', '/assets/reference/prada/men-new-arrivals/products/bull-denim-zipper-shirt.jpg'),
  ('WDR001', '/assets/reference/prada/women-categories/dresses/embroidered-linen-mini-dress.avif'),
  ('WDR002', '/assets/reference/prada/women-categories/dresses/embroidered-linen-dress.avif'),
  ('WDR003', '/assets/reference/prada/women-categories/dresses/embroidered-canvas-mini-dress.avif'),
  ('WTO001', '/assets/reference/prada/women-categories/tops/embroidered-linen-top.avif'),
  ('WTO002', '/assets/reference/prada/women-categories/tops/linen-top-floral-motif.avif'),
  ('WTO003', '/assets/reference/prada/women-categories/tops/sleeveless-polka-dot-silk-shirt.avif'),
  ('WOU001', '/assets/reference/prada/women-categories/outerwear/embroidered-gabardine-blouson.avif'),
  ('WOU002', '/assets/reference/prada/women-categories/outerwear/washed-re-nylon-jacket.avif'),
  ('WOU003', '/assets/reference/prada/women-categories/outerwear/silk-faille-blouson-jacket.avif'),
  ('WTR001', '/assets/reference/prada/women-categories/trousers/floral-print-linen-skirt.avif'),
  ('WTR002', '/assets/reference/prada/women-categories/trousers/pleated-silk-faille-skirt.avif'),
  ('WTR003', '/assets/reference/prada/women-categories/trousers/poplin-shorts.avif')
) as image_map(sku, image_url) on image_map.sku = p.sku;
