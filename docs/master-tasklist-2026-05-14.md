# Master Task List — Post-Brainstorming
**Tanggal**: 14 Mei 2026  
**Status**: Siap implementasi

---

## Alur User yang Diimplementasikan

```
[BROWSE] Katalog produk
    ↓
[CART] Add to cart → CartDrawer
    ↓
[CHECKOUT] Klik Bayar → create-doku-checkout edge function
    ↓
[PAYMENT] DOKU SDK overlay (bukan tab baru) → user bayar
    ↓
[REDIRECT] DOKU auto-redirect → /checkout-result?invoice=...&pending=1
    ↓
[PENDING] Halaman polling/realtime menunggu webhook/reconcile
    ↓
[SUCCESS] Status paid → confetti + animasi hijau + QR pickup muncul
    ↓
[MY ORDERS] User bisa akses /my-orders kapan saja → QR ada di card order
    ↓
[STORE] User datang ke toko, tunjukkan QR
    ↓
[ADMIN SCAN] Admin scan QR di /admin → preview order → konfirmasi
    ↓
[DONE] Order jadi picked_up ✅
```

---

## SPRINT 1 — Fix Payment Opening (Priority: CRITICAL)
*Masalah: saat ini buka tab baru, bikin UX jelek dan susah testing*

| ID | Task | File | Status |
|---|---|---|---|
| S1-T1 | Buat `frontend/src/utils/dokuCheckout.ts` — load DOKU SDK script + `openDokuCheckout(url)` | `utils/dokuCheckout.ts` (baru) | ⬜ |
| S1-T2 | Ubah checkout flow: ganti `window.open` → `loadDokuCheckoutScript()` + `openDokuCheckout()` | `services/commerce.ts` atau komponen checkout | ⬜ |
| S1-T3 | Setelah `openDokuCheckout()`, navigate ke `/checkout-result?invoice=...&pending=1` | Komponen checkout | ⬜ |
| S1-T4 | Verifikasi `callback_url` di edge function sudah mengarah ke `/checkout-result?invoice=...` | `supabase/functions/create-doku-checkout/index.ts` | ⬜ |

---

## SPRINT 2 — Improve Checkout Result Page (Priority: HIGH)
*Masalah: transisi pending→sukses kurang smooth, QR payload format salah, tidak ada confetti*

| ID | Task | File | Status |
|---|---|---|---|
| S2-T1 | Tambah `canvas-confetti` — trigger saat status berubah dari `pending_payment` → `pending_pickup` | `CheckoutResultPage.tsx` | ⬜ |
| S2-T2 | Ganti flat polling 4s → escalating delays `[0, 4s, 8s, 15s, 30s, 60s]` | `CheckoutResultPage.tsx` | ⬜ |
| S2-T3 | Simplify QR payload: ganti JSON object → string mentah pickup code (ikut Spark) | Migration + `CheckoutResultPage.tsx` | ⬜ |
| S2-T4 | Tambah smooth CSS transition saat state berubah pending → success (fade/slide, bukan hard replace) | `CheckoutResultPage.tsx` + CSS | ⬜ |
| S2-T5 | Tambah instruksi pickup yang jelas: "Tunjukkan QR ini saat ambil barang di toko" | `CheckoutResultPage.tsx` | ⬜ |
| S2-T6 | Tambah tombol "Lihat Pesanan Saya" → `/my-orders` di halaman sukses | `CheckoutResultPage.tsx` | ⬜ |

---

## SPRINT 3 — Customer Order History `/my-orders` (Priority: HIGH)
*Belum ada sama sekali. Ini penting agar user bisa akses QR kapan saja*

| ID | Task | File | Status |
|---|---|---|---|
| S3-T1 | Buat `classifyOrder()` helper — map status ke `pending / active / history` | `src/utils/orderHelpers.ts` (baru) | ⬜ |
| S3-T2 | Buat `useMyOrders()` hook — fetch orders by `user_id`, optional realtime subscription | `src/hooks/useMyOrders.ts` (baru) | ⬜ |
| S3-T3 | Buat `MyOrdersPage.tsx` — layout dengan tabs + empty state | `src/pages/MyOrdersPage.tsx` (baru) | ⬜ |
| S3-T4 | Buat `MyOrdersTabs` — tabs Pending / Aktif / Selesai dengan badge count | `src/pages/my-orders/MyOrdersTabs.tsx` (baru) | ⬜ |
| S3-T5 | Buat `MyOrderCard` — invoice, status badge, tanggal, total, item count, QR jika pickup ready | `src/pages/my-orders/MyOrderCard.tsx` (baru) | ⬜ |
| S3-T6 | QR di card: tampil hanya kalau `payment_status=paid` dan `pickup_codes` ada | `MyOrderCard.tsx` | ⬜ |
| S3-T7 | Tombol aksi per card: "Lihat Detail" → `/checkout-result?invoice=...` | `MyOrderCard.tsx` | ⬜ |
| S3-T8 | Tambah route `/my-orders` ke router (protected, customer only) | `src/app/router.tsx` | ⬜ |
| S3-T9 | Tambah link "Pesanan Saya" di `UserHeaderActions` untuk customer (bukan admin) | `src/components/UserHeaderActions.tsx` | ⬜ |

---

## SPRINT 4 — Admin Pickup Verification Improvement (Priority: MEDIUM)
*Masalah: saat ini langsung verify tanpa preview, tidak ada guard status*

| ID | Task | File | Status |
|---|---|---|---|
| S4-T1 | Tambah `OrderPreviewModal` — tampilkan customer name, items, total, pickup code sebelum verify | `src/components/admin/OrderPreviewModal.tsx` (baru) | ⬜ |
| S4-T2 | Flow: scan/input → lookup order → buka preview modal → admin klik "Konfirmasi & Serah Barang" | `BopisSection.tsx` atau `PickupVerificationCard.tsx` | ⬜ |
| S4-T3 | Guard sebelum verify: tolak kalau `payment_status !== 'paid'` atau `status === 'picked_up'` | `services/commerce.ts` + UI | ⬜ |
| S4-T4 | Toast sukses setelah verify: "Barang berhasil diserahkan ✅" | `BopisSection.tsx` | ⬜ |
| S4-T5 | Auto-refresh order list setelah verify sukses | `AdminPage.tsx` / orders query | ⬜ |

---

## SPRINT 5 — Admin Orders Section Polish (Priority: MEDIUM)
*Sudah ada tapi perlu polish*

| ID | Task | File | Status |
|---|---|---|---|
| S5-T1 | Pastikan tab "Pending Pickup" menampilkan pickup code per order | `OrdersCard.tsx` | ⬜ |
| S5-T2 | Tambah badge count yang akurat per tab (realtime) | `OrdersSection.tsx` | ⬜ |
| S5-T3 | Tambah kolom `paid_at` di tab Pending Pickup (berapa lama sudah menunggu) | `OrdersCard.tsx` | ⬜ |

---

## SPRINT 6 — Cleanup & Polish (Priority: LOW)
*Nice to have setelah semua sprint utama selesai*

| ID | Task | File | Status |
|---|---|---|---|
| S6-T1 | Hapus `DokuSection` dari admin (dev-only, tidak perlu di production) | `AdminPage.tsx` | ⬜ |
| S6-T2 | `AdminSidebar` total stock dari query, bukan hardcode 0 | `AdminSidebar.tsx` | ⬜ |
| S6-T3 | `useSearchParamState` hook cleanup (tidak dipakai) | Codebase | ⬜ |
| S6-T4 | Push semua perubahan ke GitHub + redeploy Vercel | Git | ⬜ |

---

## Ringkasan Total

| Sprint | Jumlah Task | Priority | Estimasi |
|---|---|---|---|
| S1 — Fix Payment Opening | 4 | CRITICAL | ~1.5 jam |
| S2 — Checkout Result Page | 6 | HIGH | ~2 jam |
| S3 — Customer Order History | 9 | HIGH | ~3 jam |
| S4 — Admin Verify Improvement | 5 | MEDIUM | ~1.5 jam |
| S5 — Admin Orders Polish | 3 | MEDIUM | ~1 jam |
| S6 — Cleanup | 4 | LOW | ~1 jam |
| **TOTAL** | **31 tasks** | | **~10 jam** |

---

## Dependency Map

```
S1 (payment opening) → harus selesai dulu sebelum testing apapun
S2 (checkout result) → bisa paralel dengan S3
S3 (my-orders) → depend pada S2 selesai (butuh QR payload fix dari S2-T3)
S4 (admin verify) → independent, bisa kapan saja
S5 (admin polish) → independent
S6 (cleanup) → terakhir
```

---

## Catatan Implementasi

- **DOKU SDK URL sandbox**: `https://sandbox.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js`
- **DOKU SDK function**: `window.loadJokulCheckout(paymentUrl)` — buka overlay di atas halaman
- **QR payload**: cukup string pickup code mentah (misal `PRX-AB5-480`), bukan JSON
- **QR library**: sudah ada `qrcode` di project, bisa pakai `react-qr-code` untuk display
- **Confetti**: install `canvas-confetti` + `@types/canvas-confetti`
- **Realtime**: Supabase `channel().on('postgres_changes')` untuk my-orders
