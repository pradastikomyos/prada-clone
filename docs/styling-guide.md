# Styling Guide

Dokumen ini mendefinisikan boundary dan aturan styling untuk proyek Spark Stage fashion commerce.
Tujuannya: mencegah konflik antara Tailwind v4, custom CSS, dan Vite pipeline — terutama setelah
pengalaman error `Missing opening {` yang terjadi saat migrasi ke React Router SPA.

---

## Styling Strategy

Proyek ini menggunakan **hybrid approach** yang disengaja:

| Layer | Tool | Dipakai untuk |
|---|---|---|
| Visual pages | Custom CSS (class-based) | Homepage, shop, listing, PDP, login, cart |
| Admin / UI components | Tailwind v4 utility classes | AdminButton, AdminCard, AdminMetric, AdminInput, AdminSidebarItem |
| Inline styles | Hanya untuk nilai dinamis | Warna dari data, dimensi dari props |

Hybrid ini dipertahankan karena:
- Custom CSS sudah dominan dan stabil untuk halaman visual besar
- Tailwind berguna untuk admin dashboard yang butuh utility cepat
- Rewrite penuh ke salah satu arah terlalu mahal untuk scope skripsi

---

## Tailwind Boundary

**Tailwind dipakai untuk:**
- Komponen admin baru (`src/components/admin/`)
- Komponen UI utility baru yang tidak punya visual page context

**Tailwind tidak dipakai untuk:**
- Halaman visual besar (homepage, shop, listing, PDP, login)
- Komponen yang sudah punya class-based CSS di `shop.css` atau `style.css`
- Mengganti class yang sudah ada (jangan campur `.listing-page` dengan `flex min-h-screen`)

**Entry point Tailwind:**
- Satu-satunya file: `src/styles/tailwind.css` yang berisi `@import "tailwindcss"`
- Di-import dari `src/main.tsx` — masuk ke Vite module graph via JS
- Tidak ada file lain yang boleh berisi `@import "tailwindcss"`

---

## Legacy CSS Boundary

**Custom CSS dipakai untuk:**
- Semua halaman visual yang sudah ada class-based CSS-nya
- Komponen yang punya banyak state visual (hover, active, scrolled, open/closed)
- Animasi dan transisi yang butuh kontrol penuh

**Aturan loading:**
- CSS biasa (non-Tailwind) **harus** di-load via `<link>` di `index.html`
- CSS biasa **tidak boleh** di-import dari JS/TSX files (`import './foo.css'`)
- Pengecualian: `tailwind.css` boleh di-import dari `main.tsx` karena dia adalah Tailwind entry

**Kenapa aturan ini ada:**
Vite + `@tailwindcss/vite` plugin intercept CSS yang masuk ke module graph via JS imports.
CSS biasa yang di-import dari JS akan melewati Tailwind's CSS transform pipeline.
Jika CSS tersebut tidak pipeline-valid (bukan hanya spec-valid atau lint-valid), akan error.
Loading via `<link>` di HTML menghindari pipeline ini secara konsisten.

---

## CSS Validity — Tiga Level

Penting untuk dibedakan:

1. **Spec-valid** — valid menurut CSS specification. Contoh: `@font-face { ... }` adalah spec-valid.
2. **Lint-valid** — lolos stylelint atau tool lint yang dikonfigurasi. Bisa berbeda dari spec.
3. **Pipeline-valid** — tidak menyebabkan error saat diproses oleh Vite + plugin chain aktif
   (Tailwind v4, PostCSS, dll). Ini yang paling penting untuk project ini.

**Sumber kebenaran final adalah pipeline-valid**, bukan lint-valid.
`npm run build` adalah cara paling reliable untuk memverifikasi pipeline-valid.

---

## CSS Loading Rules

```
index.html
  ├── /src/styles/style.css      ← base styles, fonts, header, mega menu
  ├── /src/styles/shop.css       ← shop, listing, PDP, admin CSS classes
  ├── /src/styles/login.css      ← login page layout
  └── /src/styles/cart.css       ← cart drawer

main.tsx
  └── ./styles/tailwind.css      ← Tailwind v4 entry (SATU-SATUNYA import CSS dari JS)
```

**Jangan:**
```tsx
// ❌ Jangan import CSS biasa dari component
import '../styles/login.css';
import '../../styles/cart.css';
```

**Boleh:**
```tsx
// ✅ Tailwind entry boleh di-import dari main.tsx
import './styles/tailwind.css';
```

---

## Inline Styles

Inline styles (`style={{ ... }}`) boleh dipakai **hanya untuk nilai yang benar-benar dinamis**:
- Warna dari data (color swatches dari produk)
- Dimensi dari props
- CSS custom properties yang di-set dari JS

Jangan pakai inline styles untuk nilai statis yang bisa jadi class.

---

## Verification Commands

Sebelum commit atau deploy, jalankan dalam urutan ini:

```bash
# 1. Typecheck — pastikan tidak ada TypeScript error
npm run typecheck

# 2. Build — ini adalah sumber kebenaran final untuk CSS pipeline
npm run build

# 3. Test (opsional tapi dianjurkan)
npm run test:e2e
```

`npm run build` harus selalu hijau sebelum push ke `main`.

---

## Examples: Allowed vs Avoided

### ✅ Allowed

```tsx
// Component pakai class dari shop.css
<div className="listing-page">
  <header className="listing-header">...</header>
</div>

// Admin component pakai Tailwind utility
<div className="flex items-center gap-3 rounded-md border border-neutral-200">
  ...
</div>

// Inline style untuk nilai dinamis
<div className="prada-swatch" style={{ backgroundColor: color }} />
```

### ❌ Avoided

```tsx
// Campur Tailwind dan custom CSS di satu komponen tanpa alasan
<div className="listing-page flex min-h-screen">...</div>

// Import CSS biasa dari component
import '../styles/login.css'; // ❌

// Inline style untuk nilai statis
<div style={{ display: 'flex', alignItems: 'center' }}>...</div>
// Harusnya: <div className="admin-user-card">...</div>

// Tambah file CSS global baru tanpa alasan
// src/styles/new-feature.css  ← tanya dulu apakah perlu
```

---

## Menambah CSS Baru

Sebelum menambah file CSS baru atau class baru, tanya:

1. Apakah class ini sudah ada di `shop.css` atau `style.css`?
2. Apakah ini untuk halaman visual besar (→ custom CSS) atau admin/UI utility (→ Tailwind)?
3. Apakah ini nilai statis (→ class) atau dinamis (→ inline style)?
4. Kalau file CSS baru, apakah sudah ditambahkan ke `<link>` di `index.html`?

---

*Dokumen ini dibuat berdasarkan pengalaman error CSS pipeline saat migrasi ke React Router SPA.*
*Update dokumen ini kalau ada keputusan styling baru yang disepakati.*
