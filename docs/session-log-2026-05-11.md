# Session Log — 11 Mei 2026

Sesi panjang multi-topik. Dicatat untuk referensi sesi berikutnya dan sebagai handoff context.

---

## Status Akhir Sesi

- **Typecheck**: hijau
- **Build**: hijau
- **Vercel deployment**: `prada-clone-rho.vercel.app` (project `prada-clone`)
- **Supabase**: project `backendsparkecommerce` (ref `xyhdnprncjvhtdfyovpx`), semua migration applied
- **GitHub**: `pradastikomyos/prada-clone`, branch `main`, commit terakhir belum di-push (beberapa perubahan sore ini masih local)

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
| PR 4 lanjutan (inline style cleanup) | MEDIUM | `ProductPage` meta margin/error, `InventoryDetailCard`, `PickupVerificationCard` |
| PR 5 CSS validation guardrail (opsional) | LOW | stylelint evaluation |
| Admin total stock di sidebar (hardcode 0) | MEDIUM | Feed dari query atau shared state |
| Cart flow manual QA | HIGH | Belum dikonfirmasi end-to-end di production |
| M4: migrate product images ke Supabase Storage | MEDIUM | Upload sudah done, tapi `product_images.image_url` perlu verified di production |
| React Router URL di Playwright tests | DONE | Sudah diupdate ke clean URLs |
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
