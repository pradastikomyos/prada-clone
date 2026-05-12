# Session Log — 11–12 Mei 2026

Sesi panjang multi-topik. Dicatat untuk referensi sesi berikutnya dan sebagai handoff context.

---

## Status Akhir Sesi

- **Typecheck**: hijau
- **Build**: hijau (5293 modules, ~1.3s)
- **Vercel deployment**: `prada-clone-rho.vercel.app` (project `prada-clone`)
- **Supabase**: project `backendsparkecommerce` (ref `xyhdnprncjvhtdfyovpx`), semua migration applied
- **GitHub**: `pradastikomyos/prada-clone`, branch `main`, siap untuk commit berisi PR 1 (BOPIS scanner), PR 2 (Orders tabs), PR 3 (CMS Banner)

---

## Yang Dikerjakan Hari Ini

### 1. Supabase MCP Setup
- Tambah Supabase MCP server ke `~/.kiro/settings/mcp.json` via HTTP transport
- URL: `https://mcp.supabase.com/mcp?project_ref=xyhdnprncjvhtdfyovpx`
- Auth: PAT via Authorization header
- Verified: MCP terhubung, bisa query DB, apply migration

### 2. Storage Buckets + CMS site_assets
- Buat tabel `site_assets` via migration `20260511100000_site_assets_cms.sql`
- 6 slot CMS: `home.hero.video`, `home.spring-summer.women/men.mosaic`, `women/men.new-arrivals.hero.video`, `login.editorial`
- Upload 36 asset lokal ke Supabase Storage (`site-assets` + `product-images` buckets)
- Update `product_images.image_url` dan `site_assets.public_url` ke Storage URLs
- Buat `frontend/src/services/siteAssets.ts` + `frontend/src/hooks/useSiteAssets.ts`
- `HomePage`, `ListingPage`, `LoginPage` sekarang baca media URL dari `site_assets` via hook
- Fallback ke `/assets/reference/...` kalau Supabase tidak configured

### 3. Vercel Deployment
- Deploy ke project baru `prada-clone` (bukan `prada-clone-frontend` yang lama)
- Set env vars `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` via Vercel dashboard
- Fix double-load asset: tambah `isReady` flag di `useSiteAssets()` — komponen tidak render media sampai Storage URL sudah resolved dari DB

### 4. Migrasi React Router v7 (18 tasks)
- Install `react-router-dom@^7`
- `vite.config.js`: hapus multi-entry `rollupOptions.input`, jadi single-entry SPA
- `vercel.json`: SPA rewrite rule `/(.*) → /index.html`
- `src/app/router.tsx`: `createBrowserRouter` dengan semua routes + legacy `.html` redirects
- `src/components/ProtectedRoute.tsx`: auth + admin guard
- `src/components/AuthGate.tsx`: tunggu session sebelum render
- `App.tsx`: `RouterProvider` + providers
- Semua `<a href="*.html">` → `<Link to="*">`
- Semua `window.location.href` internal → `useNavigate`
- `resolvePostLoginPath` return clean paths (`/admin`, `/`)
- Admin routing: `/admin/:tab` via `useParams`
- ProductPage: baca slug dari `useParams`
- Hapus 6 `.html` entry files (hanya `index.html` tersisa)
- URL sekarang: `/`, `/women`, `/men`, `/new-arrivals`, `/product/:slug`, `/login`, `/admin/:tab`

### 5. Fix CSS Pipeline Error (Tailwind v4)
- Root cause: `import '../styles/login.css'` dari `LoginPage.tsx` membuat CSS biasa masuk ke Vite module graph dan di-process Tailwind v4 plugin
- Fix: semua CSS biasa di-load via `<link>` di `index.html`, hanya `tailwind.css` di-import dari `main.tsx`
- `tailwind.css` tambah `@source not` directives sebagai defensive guard
- Diskusi panjang tentang tiga level CSS validity: spec-valid, lint-valid, pipeline-valid

### 6. Opsi C Styling Architecture (4 PR)
- **PR 1** ✅: `docs/styling-guide.md` + update `README.md`
- **PR 2** ✅: CSS loading audit — sudah clean, tidak ada perubahan
- **PR 3** ✅: Admin Tailwind boundary audit — Tailwind hanya di `components/admin/` dan `components/ui/select.tsx`
- **PR 4A** ✅: Safe inline style cleanup:
  - `router.tsx` `PageFallback` → `.page-fallback` class
  - `ListingHeader.tsx` `marginLeft: '16px'` → CSS class
  - `ProductPage.tsx` image filters → `.zara-image-item--dim/--contrast`
  - `ProductPage.tsx` `width: '394px'` dihapus (redundant, sudah ada di shop.css)

### 7. Fix RootLayout — Link di luar RouterContext
- Bug: `CartDrawer`, `HomepageMenu`, `SearchOverlay` di-mount di `App.tsx` sebelum `RouterProvider` → `<Link>` crash karena tidak ada RouterContext
- Fix: buat `src/components/layout/RootLayout.tsx` sebagai persistent shell di dalam router
- `App.tsx` sekarang hanya mount `RouterProvider` + providers yang tidak butuh router context
- `router.tsx` wrap semua routes di bawah `RootLayout` sebagai root layout route

### 8. Admin Dashboard Link di Header
- `useAuthUser()` extend untuk return `role` dari `profiles` table
- `UserHeaderActions`: kalau `role === 'admin'`, tampilkan link Dashboard (icon + text) di antara nama dan sign out icon
- CSS: `.user-header-admin-link`, `.user-header-admin-label`

### 9. Fix Select Dropdown (Admin Status)
- Root cause: `select.tsx` pakai shadcn CSS custom properties (`--popover`, `--accent`, `--border`, dll) yang tidak pernah didefinisikan di project
- Fix: ganti semua shadcn tokens dengan nilai konkret (`bg-white`, `border-neutral-200`, `focus:bg-neutral-100`, dll)

### 10. Update Harga Produk
- Semua 33 produk + 33 variant di-update ke `IDR 399.999` via Supabase MCP SQL
- Siap untuk testing DOKU sandbox

### 11. DOKU Payment Gateway (Sandbox)
- Cart flow end-to-end: CartDrawer + `addItemToCart` + checkout mutation
- Fix 502: DOKU sandbox reject `phone: ''`. Edge function v3 pakai conditional spread (hanya kirim phone/email kalau non-empty)
- Test sandbox VA BCA: sukses
- DOKU hosted-page redirect full-page adalah by-design (Checkout hosted page, bukan popup) — diterima user

### 12. Checkout Result Page (`/checkout-result?invoice=...`)
- Animated green SVG checkmark (CSS stroke-dashoffset keyframes)
- Heading "Payment Successful" + body copy Bahasa
- Pickup code card + QR code via `qrcode` library
- Order summary (items, subtotal, total)
- Polling setiap 4s (max 15 attempts) untuk transisi `pending_payment → pending_pickup`
- Query: `getOrderByInvoice(invoiceNumber)` di `services/commerce.ts`

### 13. Price + Size Variants untuk Dev
- Semua 33 produk → IDR 399.999
- `EMBROIDERED LINEN SKIRT` (WNA002) → IDR 10.000 untuk testing sandbox cepat
- Stock semua variant → 100
- 25 apparel products dapat S/M/L/XL variants (100 variant rows baru via MCP SQL)
- Accessories/bags/shoes tetap single-variant
- `ProductPage.tsx`: size picker UI (buttons S/M/L/XL, sold-out strikethrough, "SELECT SIZE" prompt)
- `getProductBySlug()` sekarang include `product_variants`

### 14. PR 1 — BOPIS Real QR Scanner (clean chat session)
- Install `html5-qrcode@2.3.8`
- **New** `frontend/src/hooks/useQrScanner.ts` — encapsulates `Html5Qrcode` instance, rear-camera detection, 1500ms debounce, cleanup on unmount
- **New** `frontend/src/components/admin/QrScannerModal.tsx` — full-screen modal dengan camera lifecycle, error fallback, retry button
- **New** `services/commerce.ts :: getOrderByPickupCode()` — join `pickup_codes` → `orders` untuk preview sebelum verify
- Update `PickupVerificationCard` — tambah props `onOpenScanner`, `orderDetail`, `isLoadingOrder`; tampilkan Pre-Verify preview (invoice, customer, items, total, pickup code)
- Update `BopisSection` — state `isScannerOpen`, `pickupCode`, orderQuery (enabled kalau code ≥ 3 chars), verifyMutation

### 15. PR 2 — Orders Section Real Data (clean chat session)
- **New** `frontend/src/pages/admin/orderHelpers.ts` — `classifyOrder()`, `getPendingPaymentOrders()`, `getPendingPickupOrders()`, `getCompletedOrders()`, `getCancelledOrders()`. Map 6-state `OrderStatus` enum → 4 UI kategori
- `OrdersSection` — tabs (Pending Payment / Pending Pickup / Completed / All), `refetchInterval: 15_000`, tab counts, selected order auto-reset saat switch tab
- `OrdersCard` — tab-aware timestamps (paid_at untuk Pending Pickup, picked_up_at untuk Completed), status badges dengan color tokens, order items list dengan line totals

### 16. PR 3 — Banner/Hero CMS Admin (clean chat session)
- **New** `frontend/src/components/admin/CmsAssetField.tsx` — reusable slot UI: preview (img/video), file picker, paste URL, Save button dengan pending state
- **New** `frontend/src/services/uploadSiteAsset.ts` — upload file → `site-assets` bucket, get publicUrl, update `site_assets` row (public_url, storage_path, mime_type)
- **New** `services/siteAssets.ts :: fetchSiteAssetsAdmin()` + `updateSiteAssetUrl()`
- **New** `frontend/src/pages/admin/CmsSection.tsx` — group slots by prefix (home/women/men/login), render `CmsAssetField` per slot, invalidate `site-assets` + `site-assets-admin` queries on save
- Update `AdminRail` + `AdminSidebar` — tambah CMS nav item (ImageAdd02Icon)
- Update `admin/types.ts` — `ADMIN_VIEWS` include `'cms'`
- Update `AdminPage.tsx` — lazy import `CmsSection` + `cms` tab route
- Update `shop.css` — styles untuk QR modal, orders tabs, CMS fields, orders list

### 17. RLS Verification
- `storage.objects` policies untuk `site-assets` bucket: admin SELECT/INSERT/UPDATE/DELETE via `profiles.role = 'admin'`. Public SELECT allowed.
- `public.site_assets` policies: `Admins manage site assets` (ALL via `is_admin()`), `Public can read site assets` (SELECT).
- Admin CMS upload flow akan bekerja dengan auth session biasa (tanpa service role).

---

## Perubahan yang Belum Di-commit/Push

~~Beberapa perubahan sore ini (PR 4A, RootLayout fix, Dashboard link, Select fix, harga produk) belum di-commit ke GitHub. Perlu `git add -A && git commit && git push` sebelum sesi berikutnya.~~

**UPDATE**: Semua perubahan sudah di-commit dan di-push di akhir sesi (commit terakhir sore 11 Mei 2026).

---

## Pending / Belum Dikerjakan

| Item | Prioritas | Catatan |
|---|---|---|
| Testing DOKU sandbox end-to-end | ✅ DONE | VA BCA berhasil, 502 phone fix deployed |
| Payment status page (post-DOKU redirect) | ✅ DONE | `/checkout-result` dengan animated checkmark, QR, polling |
| PR 1 BOPIS scanner (html5-qrcode) | ✅ DONE | 12 Mei 2026 (clean chat) |
| PR 2 Orders tabs + 15s refetch | ✅ DONE | 12 Mei 2026 (clean chat) |
| PR 3 CMS Banner admin | ✅ DONE | 12 Mei 2026 (clean chat), RLS verified |
| PR 4 Customer Order History | TODO | Blocked: `orders.user_id` belum di-populate oleh `create-doku-checkout` edge function |
| PR 5 Admin Polish (total stock, dashboard numbers) | TODO | Sidebar total stock masih hardcode 0 |
| Admin CMS manual QA di browser (real admin login) | HIGH | Upload + paste URL flow belum dikonfirmasi di browser |
| PR 4 lanjutan (inline style cleanup) | MEDIUM | `ProductPage` meta margin/error, `InventoryDetailCard`, `PickupVerificationCard` |
| PR 5 CSS validation guardrail (opsional) | LOW | stylelint evaluation |
| Cart flow manual QA | HIGH | Belum dikonfirmasi end-to-end di production |
| `useSearchParamState` hook | CLEANUP | Masih ada di codebase tapi tidak dipakai lagi setelah admin pakai `useParams` |

---

## Catatan Teknis Penting

### CSS Loading Rules (Opsi C)
- CSS biasa → `<link>` di `index.html`
- `tailwind.css` → `import` dari `main.tsx` (satu-satunya)
- Jangan pernah `import './foo.css'` dari component kecuali Tailwind entry
- `npm run build` adalah sumber kebenaran final untuk CSS pipeline

### Router Architecture
```
App (QueryClient, UIStateContext, AuthGate)
└── RouterProvider
    └── RootLayout (HomepageMenu, SearchOverlay, CartDrawer, <Outlet />)
        ├── / → HomePage
        ├── /login → LoginPage
        ├── /women → WomenPage
        ├── /men → ListingPage kind="men"
        ├── /new-arrivals → ListingPage kind="women"
        ├── /product/:slug → ProductPage
        └── /admin/:tab → ProtectedRoute → AdminPage
```

### Supabase Storage Structure
```
site-assets/
  home/hero/days-of-summer-loop.mp4
  home/mosaic/spring-summer-{women,men}-landscape.avif
  women/new-arrivals/hero/new-arrivals-loop.webm
  men/new-arrivals/hero/new-arrivals-loop.webm
  login/editorial/editorial.jpg

product-images/
  women/{new-arrivals,dresses,tops,outerwear,trousers}/
  men/new-arrivals/
```

### Env Vars yang Diperlukan
- `VITE_SUPABASE_URL` — di Vercel + `.env.local`
- `VITE_SUPABASE_ANON_KEY` — di Vercel + `.env.local`
- `SUPABASE_SERVICE_ROLE_KEY` — hanya di `.env.local` (tidak di Vercel, tidak di git)
