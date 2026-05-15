# Priority Todolist

Dokumen ini memetakan sisa pekerjaan setelah frontend dipindah ke React data-driven. Prioritas dibagi menjadi urgent, medium, dan nice-to-have agar urutan kerja tidak melebar.

## Urgent

- [x] Implement motion dasar untuk burger menu.
  - Status: drawer homepage dan listing menu sudah tidak memakai pola `display: none` / `hidden` untuk transisi utama.
  - Area: `frontend/style.css`, `frontend/shop.css`, `frontend/src/App.tsx`.

- [x] Perbaiki keyboard behavior homepage menu.
  - Status: homepage menu sudah bisa close dengan `Escape`, focus masuk ke tombol Close, focus dikembalikan ke tombol Menu, dan kategori menu memakai native `button`.
  - Area: `frontend/src/App.tsx`, `frontend/style.css`.

- [x] DOKU payment flow end-to-end.
  - Status: ✅ FULLY WORKING per 14 Mei 2026. Order masuk → BCA VA → redirect → halaman hijau otomatis ~12 detik. Pickup code generated.
  - Fix: `extensions.digest()` schema qualification + `ON CONFLICT ON CONSTRAINT` di `process_doku_payment_event`. Auto-reconcile di `CheckoutResultPage` setelah 3 polls.

- [ ] Konfirmasi webhook DOKU langsung sukses (tanpa fallback reconcile).
  - Alasan: semua test sejauh ini pakai auto-reconcile sebagai fallback. Perlu verifikasi webhook path murni.
  - Area: `supabase/functions/doku-webhook`, DOKU Back Office notification URL.

- [ ] Deploy semua fix ke GitHub + Vercel.
  - Alasan: semua fix 13–14 Mei masih di local/Supabase, belum di-push ke GitHub dan belum di-deploy ke Vercel production.
  - Area: `git add -A && git commit && git push`, Vercel redeploy.

- [ ] Hilangkan hotlink asset dan font yang masih bergantung ke domain eksternal.
  - Alasan: reliabilitas lokal masih bergantung ke `www.prada.com`, font remote, dan image remote.
  - Area: `frontend/src/App.tsx`, `frontend/style.css`, `frontend/shop.css`, `frontend/login.css`, `frontend/public/assets/`.

- [ ] Ganti fake controls dan `href="#"` yang terlihat interaktif.
  - Alasan: Search, Cart, Contact, product card, filter, sort, privacy/help masih belum punya behavior lokal.
  - Area: `frontend/src/App.tsx`.

- [ ] Buat video controls benar atau nonaktifkan tombol pause.
  - Alasan: tombol pause hero masih visual-only; beberapa video belum punya poster/fallback.
  - Area: `ListingPage`, `homeSections`, `frontend/shop.css`.

- [ ] Kencangkan Playwright untuk menangkap asset/media failure.
  - Alasan: test sekarang masih bisa false pass ketika asset eksternal gagal.
  - Area: `frontend/tests/smoke.spec.js`, `frontend/tests/visual.spec.js`, `frontend/playwright.config.js`.

## Medium

- [ ] Pecah `frontend/src/App.tsx` menjadi struktur fitur.
  - Target: `src/pages/`, `src/components/`, `src/data/`, `src/types/`.

- [ ] Ekstrak data statis ke modul data.
  - Target: `src/data/navigation.ts`, `src/data/products.ts`, `src/data/heroSections.ts`.

- [ ] Rapikan model data produk dan asset.
  - Target: shape product konsisten untuk transisi ke Supabase.

- [ ] Buat layer route sederhana sebelum React Router.
  - Target: isolasi `window.location.pathname` dari `App.tsx`.

- [ ] Ekstrak shared UI component.
  - Target: logo, header, menu, product card, listing toolbar, icon.

- [ ] Definisikan state management boundary.
  - Target: local React state untuk UI kecil, URL params untuk filter/sort, TanStack Query untuk Supabase, Zustand hanya jika cart/search/global UI mulai lintas halaman.

- [ ] Tambahkan skeleton components.
  - Target: product grid, cart, checkout, payment, pickup/admin order.

- [ ] Pisahkan CSS token/base dari page CSS.
  - Target: `src/styles/tokens.css`, `src/styles/base.css`, page styles.

- [ ] Tambah coverage interaksi menu dan login.
  - Target: focus trap, Escape close homepage menu, password toggle, signup/login mode.

- [ ] Tambah test untuk data/render contract.
  - Target: produk punya `name`, `note`, `image`; menu link valid; asset lokal ada.

## Nice To Have

- [ ] Tambahkan poster/fallback untuk semua video hero.
- [ ] Rapikan focus trap lengkap dan focus-return untuk semua overlay.
- [ ] Bersihkan karakter mojibake di CSS.
- [ ] Tambahkan filter/sort UI dummy yang stabil.
- [ ] Dokumentasikan visual audit per viewport.
- [ ] Polish login UX lokal: inline validation, status, dan icon password yang benar.
- [ ] Update README dengan status migrasi React data-driven.
