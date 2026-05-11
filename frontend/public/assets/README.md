# Frontend Public Assets

This folder contains app-facing static assets served by Vite from `/assets/...`.

## Structure

- `reference/`: curated reference assets used by the current Prada-style prototype.
- `harvested/`: raw captured assets from browser/network harvesting. This folder is ignored by git by default.

## Current Buckets Mapping

- `reference/prada/men-new-arrivals/hero/`: campaign hero poster and video.
- `reference/prada/men-new-arrivals/products/`: curated product images used by `men.html`.
- `reference/prada/metadata/`: asset manifests or mapping files.

Future Spark Stage assets should use product/site separation that mirrors Supabase Storage:

- site/banner/video/logo assets -> `site-assets`
- product catalog images -> `product-images`
