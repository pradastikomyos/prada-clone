with product_seed as (
  insert into public.products (name, slug, sku, description, category, status, base_price_idr, sort_order)
  values
    ('Spark Boxy Crop Shirt', 'spark-boxy-crop-shirt', 'SPK101', 'Relaxed crop shirt for everyday styling.', 'CLOTHING', 'active', 199000, 10),
    ('Spark Pleated Mini Skirt', 'spark-pleated-mini-skirt', 'SPK102', 'Pleated mini skirt with a clean stage-ready silhouette.', 'CLOTHING', 'active', 249000, 20),
    ('Spark Oversized Denim Jacket', 'spark-oversized-denim-jacket', 'SPK103', 'Oversized denim jacket for layered Gen Z styling.', 'CLOTHING', 'active', 399000, 30)
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
select id, name, sku, base_price_idr, 12
from product_seed
on conflict (sku) do update
set
  name = excluded.name,
  price_idr = excluded.price_idr,
  stock_quantity = excluded.stock_quantity,
  updated_at = now();
