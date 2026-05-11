# Tech Stack Skripsi: Spark Stage Fashion Commerce

Tanggal revisi: 7 Mei 2026  
Konteks: dummy project skripsi berbasis visual clone Prada.com yang nantinya diarahkan menjadi Spark Stage fashion commerce. Fokus sistem adalah katalog fashion, cart, checkout, payment gateway DOKU sandbox, BOPIS (buy online, pick up in store), dan backend Supabase. Kanal promosi utama Spark Stage adalah Instagram/social media, sehingga mobile experience, visual quality, fast interaction, dan social sharing lebih prioritas daripada SEO kompleks.

## Executive Recommendation

Gunakan **React + TypeScript + Vite** sebagai stack utama skripsi.

Alasan utamanya bukan sekadar preferensi. Stack ini sudah terbukti di project Spark Stage production yang live, punya real user, memakai Supabase, Google OAuth, DOKU Checkout production, webhook, sync/reconciliation, dan edge cases yang sudah dirapikan.

Next.js tetap layak disebut sebagai alternatif, terutama untuk SSR/SEO/server routing. Namun untuk skripsi ini, biaya migrasi dan risiko rework lebih besar daripada manfaatnya. Karena target promosi utama adalah Instagram dan direct/social links, kebutuhan utama bukan organic SEO yang berat, melainkan:

- mobile-first loading dari in-app browser;
- visual premium dan responsive fluid UI;
- product discovery yang cepat;
- cart dan checkout yang stabil;
- pickup code / QR verification di store;
- Open Graph/social preview yang rapi;
- payment flow DOKU yang aman melalui backend function.

## Stack Spark Stage Production Reference

Repo referensi production: `C:\Users\prada\Documents\sparkstage`

| Area | Stack |
|---|---|
| Frontend | React 18, TypeScript |
| Build tool | Vite 6 |
| Styling | Tailwind CSS 4, PostCSS, custom CSS di `frontend/src/index.css` |
| Routing | React Router DOM 7 |
| Server state | TanStack Query 5 |
| Backend/BaaS | Supabase |
| Database | Supabase Postgres |
| Auth | Supabase Auth |
| Backend functions | Supabase Edge Functions, Deno runtime |
| DB workflow | Supabase migrations, RLS, RPC |
| Payments | DOKU Checkout, webhook, sync/reconciliation functions |
| Image/media | ImageKit, Supabase Storage legacy, planned Cloudflare R2 migration |
| Localization | i18next, react-i18next |
| UI/icons/UX libs | lucide-react, framer-motion, canvas-confetti |
| Drag and drop | dnd-kit |
| QR | qrcode, react-qr-code, html5-qrcode |
| Testing | Vitest, Testing Library, jsdom, fast-check |
| Linting | ESLint 9, typescript-eslint |
| Deployment | Vercel for frontend, Supabase CLI for backend/functions |

Struktur utama Spark production:

- `frontend/`: React app
- `supabase/migrations/`: schema, RLS, RPC
- `supabase/functions/`: Edge Functions
- `scripts/`: migration/audit/helper scripts
- `docs/`: architecture, runbooks, decisions, migration notes

## Recommended Stack Untuk Skripsi

| Area | Rekomendasi |
|---|---|
| Frontend | React + TypeScript |
| Build tool | Vite |
| Routing | React Router |
| Styling | Tailwind CSS + custom CSS tokens |
| Server state | TanStack Query |
| Client/UI state | React state first, Zustand only if needed |
| Backend/BaaS | Supabase |
| Database | Supabase Postgres |
| Auth | Supabase Auth, optional Google OAuth |
| Backend functions | Supabase Edge Functions |
| Payment | DOKU Checkout sandbox + webhook |
| Fulfillment | BOPIS / pickup in store |
| QR/Pickup verification | QR code + pickup code verified by admin |
| Media | Local assets for prototype, ImageKit/R2 optional later |
| Forms/validation | React Hook Form + Zod if form complexity grows |
| Motion | Framer Motion or CSS transitions, used sparingly |
| Icons | lucide-react |
| Testing | Playwright for end-to-end, Vitest for business logic |
| Deployment | Vercel frontend + Supabase backend/functions |

## Repository Structure Decision

Gunakan **monorepo-lite dengan npm workspaces**.

Struktur saat ini dipertahankan:

```txt
prada-clone/
  frontend/
  supabase/
  docs/
  package.json
```

Root `package.json` hanya menjadi entrypoint command lint/build/test/dev. Aplikasi utama tetap berada di `frontend/`, sedangkan Supabase tetap berada di root agar struktur backend mudah dipahami dan selaras dengan Supabase CLI.

Admin feature seperti tambah produk, stok, daftar order, dan scan BOPIS tidak perlu dipisah menjadi aplikasi baru pada fase skripsi. Admin cukup menjadi protected route/module di dalam frontend yang sama:

```txt
frontend/src/routes/admin/
  products/
  orders/
  pickup-scan/
```

Alasannya:

- admin dan customer memakai domain, auth, Supabase client, design system, dan data model yang sama;
- scope admin skripsi masih terbatas pada produk, stok, order, dan pickup verification;
- Supabase RLS serta role admin cukup untuk memisahkan akses;
- satu frontend lebih mudah diuji dan didemo untuk semhas/skripsi;
- memisahkan `apps/web` dan `apps/admin` sekarang akan menambah overhead deployment, env, auth sharing, dan routing sebelum manfaatnya terasa.

Struktur dapat berkembang menjadi `apps/web`, `apps/admin`, dan `packages/*` jika admin panel menjadi besar, butuh subdomain/deployment terpisah, atau shared UI/types/validators mulai banyak.

## Why React + Vite Fits This Skripsi

React + Vite is the pragmatic choice because it aligns with existing production experience. The strongest academic argument is not "Vite is easier", but:

- The stack has already been validated in a live Spark Stage system.
- Development speed is high, which matters for iterative UI and skripsi deadlines.
- Hot reload and Vite DX are useful for polishing premium responsive UI.
- Supabase Edge Functions provide the required backend boundary for payment secrets.
- DOKU integration does not require Next.js; secrets and signatures can live in Edge Functions.
- The system can still implement SEO basics through metadata, sitemap, robots, Open Graph tags, and Google Search Console.
- The main acquisition channel is Instagram/social media, so UX from social links is more important than advanced SSR.

This gives a clean story: the thesis system is built with a stack that is already proven in production, then scoped down into a clearer fashion-commerce case study.

## Where Next.js Is Still Better

Next.js remains technically stronger for:

- server-rendered product pages;
- route-level metadata;
- advanced SEO;
- first-class full-stack route handlers;
- app-level loading boundaries;
- server components and streaming.

If this project were started from zero with SEO as the primary acquisition channel, Next.js would be a strong recommendation. But for this case, the user acquisition story is social-first, and the production proof already sits on React + Vite.

## Decision: Why Not Next.js For The Main Skripsi Build

Next.js is not rejected because it is bad. It is rejected for this phase because:

- Migration cost is real.
- App Router introduces new server/client component boundaries.
- Supabase SSR patterns require additional care.
- DOKU can already be handled safely by Supabase Edge Functions.
- The existing Spark production stack gives stronger continuity and credibility.
- Skripsi risk should be reduced, not increased.

Suggested academic wording:

> Next.js memiliki keunggulan pada SSR dan SEO, namun penelitian ini memprioritaskan pengembangan sistem e-commerce yang stabil, cepat dikembangkan, dan terintegrasi dengan BaaS serta payment gateway. React + Vite dipilih karena telah terbukti digunakan pada sistem Spark Stage production, mendukung pengembangan UI responsif secara cepat, dan tetap dapat memenuhi kebutuhan SEO dasar melalui metadata, sitemap, robots.txt, Open Graph tags, dan Google Search Console.

## SEO And Social Sharing Strategy

SEO is still relevant, but not the primary driver. Since Spark Stage promotion is Instagram/social-first, the minimum viable SEO/social strategy should include:

- static `title` and `description`;
- product/category metadata where possible;
- Open Graph tags for social previews;
- `robots.txt`;
- `sitemap.xml`;
- canonical URLs;
- Google Search Console submission;
- request indexing for important URLs;
- clean product slugs;
- fast mobile loading;
- image dimensions to avoid layout shift.

This is enough for a defensible skripsi scope. Advanced SSR can be listed as future work.

## State Management Decision

Do not start with Redux.

Use this order:

1. React state for small component state.
2. URL/search params for filter, sort, category, and pagination state.
3. TanStack Query for server state: products, cart, orders, payment status.
4. Zustand only if global UI/client state becomes noisy.

Potential Zustand stores:

- `useCartUiStore`: cart drawer open state, temporary checkout step state.
- `useSearchStore`: search overlay state.
- `useUiStore`: menu/modal state.

Do not put source-of-truth product catalog, user profile, order, or payment status in Zustand. Those should come from Supabase and TanStack Query.

## Supabase Architecture

Recommended tables for skripsi scope:

- `profiles`
- `products`
- `product_assets`
- `categories`
- `carts`
- `cart_items`
- `orders`
- `order_items`
- `payment_attempts`
- `pickup_codes`
- `stock_movements`

Storage buckets:

- `site-assets`: aset visual umum seperti banner, campaign image, hero video, logo, dan media halaman.
- `product-images`: gambar katalog produk, variant image, dan product detail gallery.

Bucket `site-assets` mengizinkan image dan video dengan limit awal 50 MB per object. Bucket `product-images` hanya mengizinkan image dengan limit awal 10 MB per object. Keduanya dibuat public-read agar frontend bisa memuat media langsung dari public URL. Upload/update/delete dari browser sebaiknya ditutup sampai role admin dan RLS profile dibuat; untuk fase awal dumping asset dapat dilakukan lewat Supabase dashboard/CLI/service role.

Important backend rules:

- Public product reads can be open.
- Cart/order writes require authenticated user.
- RLS should protect user-owned cart/order rows.
- Payment creation must happen in Supabase Edge Function.
- DOKU secret key must never be exposed to browser code.
- DOKU webhook should update payment and order status server-side.
- Payment status shown to client should be read from Supabase, not trusted from URL params only.
- Fulfillment status should move from `pending_payment` to `pending_pickup` after successful payment.
- Pickup verification should require admin role or staff permission.
- Product SKU/slug and pickup code should be unique and deterministic enough for admin operations.

Suggested order statuses:

- `pending_payment`
- `paid`
- `pending_pickup`
- `picked_up`
- `completed`
- `cancelled`
- `expired`

## DOKU Sandbox And BOPIS Plan

Use **DOKU Checkout sandbox** first.

Reason:

- It matches Spark production experience.
- Hosted checkout reduces payment UI scope.
- It is easier to demo in semhas.
- BOPIS keeps fulfillment scope focused because no courier/shipping integration is needed.
- Direct API can be listed as future improvement.

Suggested flow:

1. User views product listing.
2. User adds item to cart.
3. User signs in or continues through required checkout identity flow.
4. Client calls Supabase Edge Function `create-doku-checkout`.
5. Edge Function validates cart and creates pending order.
6. Edge Function signs request and calls DOKU Checkout API.
7. Client redirects/opens DOKU Checkout sandbox.
8. DOKU webhook hits Supabase Edge Function.
9. Webhook verifies request and updates `payment_attempts` / `orders`.
10. If paid, system creates or activates `pickup_code` and marks the order `pending_pickup`.
11. User sees success page with pickup code and QR code.
12. User comes to store.
13. Admin scans QR or inputs pickup code.
14. Admin verifies order and hands over the product.
15. System marks order as `picked_up` / `completed`.

Out of scope for skripsi:

- courier/shipping integration;
- shipping address management;
- shipping fee calculation;
- courier tracking number/resi;
- return logistics.

## Skeleton And Loading UX

Skeleton should be used because premium commerce must feel stable and polished.

Recommended skeletons:

- Product grid skeleton with fixed media aspect ratio.
- Product detail skeleton.
- Cart item skeleton.
- Checkout summary skeleton.
- Payment status skeleton.
- Pickup QR/code skeleton.

Avoid generic spinners for page-level loading. Use button spinners only for short actions like "Pay now" or "Add to cart".

## UI Direction

The UI should be premium, responsive, and Gen Z-friendly without becoming noisy:

- strong product photography/video;
- clear grid rhythm;
- sticky filters/sort on listing pages;
- mobile-first checkout;
- clear pickup instruction after payment;
- social-preview friendly visuals;
- restrained animation;
- clean typography;
- stable layout dimensions;
- no random generated imagery for product visuals.

## Recommended Project Shape

```txt
frontend/
  src/
    app/
    routes/
      home/
      products/
      product-detail/
      cart/
      checkout/
      pickup/
      auth/
    components/
      layout/
      navigation/
      product/
      cart/
      checkout/
      pickup/
      skeletons/
      ui/
    lib/
      supabase/
      doku/
      seo/
      validators/
    stores/
      cart-ui-store.ts
      ui-store.ts
    styles/
      index.css
      tokens.css
supabase/
  migrations/
  functions/
    create-doku-checkout/
    doku-webhook/
    verify-pickup-code/
    reconcile-payments/
scripts/
docs/
```

## Migration From Current Prada Clone

This repo remains useful as a visual prototype.

Recommended path:

1. Finish Prada-inspired visual clone quality.
2. Replace branding/assets with Spark Stage.
3. Convert static pages into React components.
4. Add product data layer.
5. Add Supabase schema and local seed data.
6. Add cart and checkout flow.
7. Add DOKU sandbox through Supabase Edge Functions.
8. Add BOPIS pickup code / QR verification flow.
9. Add Playwright tests for browse, cart, checkout, payment status, and pickup verification.

## Final Recommendation

Use **React + TypeScript + Vite + TanStack Query + Supabase + DOKU Checkout sandbox + BOPIS pickup verification** for the skripsi implementation.

Next.js should be documented as a technically valid alternative with better SSR/SEO, but not chosen because the real Spark production system already proves the React + Vite stack, the promotion channel is social-first, and Supabase Edge Functions already solve the sensitive backend/payment boundary. Shipping/kurir should stay out of scope; BOPIS is enough to demonstrate a real online purchase and store pickup workflow.
