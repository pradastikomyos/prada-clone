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

| ID | Task | File | Status |
|---|---|---|---|
| S1-T1 | Buat `frontend/src/utils/dokuCheckout.ts` | `utils/dokuCheckout.ts` | ✅ |
| S1-T2 | Ganti `window.open` → SDK overlay | `CartDrawer.tsx` | ✅ |
| S1-T3 | Navigate ke checkout-result sebelum openDokuCheckout | `CartDrawer.tsx` | ✅ |
| S1-T4 | Verifikasi `callback_url` di edge function | `create-doku-checkout/index.ts` | ✅ |

---

## SPRINT 2 — Improve Checkout Result Page (Priority: HIGH)

| ID | Task | File | Status |
|---|---|---|---|
| S2-T1 | Confetti saat `pending_payment` → `pending_pickup` | `CheckoutResultPage.tsx` | ✅ |
| S2-T2 | Escalating poll delays `[0, 4s, 8s, 15s, 30s, 60s]` | `CheckoutResultPage.tsx` | ✅ |
| S2-T3 | Normalize QR payload (JSON → string) | `orderHelpers.ts` | ✅ |
| S2-T4 | Rotating pending messages dengan animated dots | `CheckoutResultPage.tsx` | ✅ |
| S2-T5 | Instruksi pickup + tombol "Lihat Semua Pesanan" | `CheckoutResultPage.tsx` | ✅ |
| S2-T6 | Fix pickup_codes PostgREST object vs array | `CheckoutResultPage.tsx` | ✅ |

---

## SPRINT 3 — Customer Order History `/my-orders` (Priority: HIGH)

| ID | Task | File | Status |
|---|---|---|---|
| S3-T1 | `classifyOrder()` + `isPickupReady()` + `normalizeQrPayload()` | `orderHelpers.ts` | ✅ |
| S3-T2 | `useMyOrders()` hook + normalize pickup_codes | `useMyOrders.ts` | ✅ |
| S3-T3 | `MyOrdersPage.tsx` — layout + tabs + empty state | `MyOrdersPage.tsx` | ✅ |
| S3-T4 | `MyOrdersTabs` — tabs dengan badge count | `my-orders/MyOrdersTabs.tsx` | ✅ |
| S3-T5 | `MyOrderCard` — QR di card kalau pickup ready | `my-orders/MyOrderCard.tsx` | ✅ |
| S3-T6 | `MyOrderDetailPage` — QR besar + order summary | `MyOrderDetailPage.tsx` | ✅ |
| S3-T7 | Fix pickup_codes normalize di detail page | `MyOrderDetailPage.tsx` | ✅ |
| S3-T8 | Route `/my-orders` + `/my-orders/:invoice` | `router.tsx` | ✅ |
| S3-T9 | Link "Pesanan Saya" di header untuk customer | `UserHeaderActions.tsx` | ✅ |

---

## SPRINT 4 — Admin Pickup Verification Improvement (Priority: MEDIUM)

| ID | Task | File | Status |
|---|---|---|---|
| S4-T1 | `OrderPreviewModal` — redesign dengan CSS proper, hitam | `OrderPreviewModal.tsx` | ✅ |
| S4-T2 | Flow: scan/input → preview modal → konfirmasi | `BopisSection.tsx` | ✅ |
| S4-T3 | Guard `payment_status !== 'paid'` + `status === 'picked_up'` | `BopisSection.tsx` | ✅ |
| S4-T4 | Toast sukses + not-found feedback | `PickupVerificationCard.tsx` | ✅ |
| S4-T5 | Invalidate queries setelah verify | `BopisSection.tsx` | ✅ |

---

## SPRINT 5 — Admin Orders Polish (Priority: MEDIUM)

| ID | Task | File | Status |
|---|---|---|---|
| S5-T1 | Pickup code di tab Pending Pickup | `OrdersCard.tsx` | ✅ |
| S5-T2 | Badge count akurat dari data | `OrdersSection.tsx` | ✅ |
| S5-T3 | `paid_at` di tab Pending Pickup | `OrdersCard.tsx` | ✅ |

---

## SPRINT 6 — Cleanup & Polish (Priority: LOW)

| ID | Task | File | Status |
|---|---|---|---|
| S6-T1 | DokuSection hidden dari sidebar | `AdminPage.tsx` | ✅ |
| S6-T2 | Total stock dari DB query | `AdminPage.tsx` | ✅ |
| S6-T3 | `useSearchParamState` dihapus | — | ✅ |
| S6-T4 | Push ke GitHub + Vercel | Git | ✅ |

---

## SPRINT A — CMS Product Management (Priority: HIGH)

| ID | Task | File | Status |
|---|---|---|---|
| A1 | Product image upload ke Supabase Storage | `uploadProductImage.ts`, `ProductImageUploader.tsx` | ✅ |
| A2 | Edit produk modal (nama, harga, deskripsi, kategori, status) | `ProductEditModal.tsx` | ✅ |
| A3 | Multi-variant stock edit (semua variant) | `InventoryDetailCard.tsx` | ✅ |

---

## SPRINT B — CMS Banner + Category (Priority: MEDIUM)

| ID | Task | File | Status |
|---|---|---|---|
| B1 | Banner Manager (CRUD per halaman, toggle aktif) | `BannerSection.tsx`, `banners.ts` | ✅ |
| B2 | Category Manager (CRUD flat, toggle aktif) | `CategorySection.tsx`, `productCategories.ts` | ✅ |
| B3 | DB: tabel banners + product_categories + RLS | Migration | ✅ |

---

## SPRINT M — Mobile Responsiveness (Priority: CRITICAL)

| ID | Task | File | Status |
|---|---|---|---|
| M1 | QR scanner modal CSS (qr-modal-* semua missing) | `shop.css` | ✅ |
| M2 | Admin layout mobile (block, bukan grid overflow) | `shop.css` | ✅ |
| M3 | AdminMobileNav bottom tab bar | `AdminRail.tsx`, `AdminPage.tsx` | ✅ |
| M4 | admin-detail-pane static di mobile | `shop.css` | ✅ |
| M5 | BOPIS header/input stack vertikal di mobile | `shop.css` | ✅ |
| M6 | OrderPreviewModal slide up dari bawah | `shop.css` | ✅ |

---

## SPRINT UI — UI Polish (Priority: MEDIUM)

| ID | Task | File | Status |
|---|---|---|---|
| UI1 | Site footer Prada-style | `SiteFooter.tsx` | ✅ |
| UI2 | Tombol pink → hitam di OrderPreviewModal | `OrderPreviewModal.tsx` | ✅ |
| UI3 | Tombol "Aktifkan Pemindai" olive → hitam | `shop.css` | ✅ |
| UI4 | Rotating pending messages di checkout result | `CheckoutResultPage.tsx` | ✅ |
| UI5 | Greeting admin time-aware | `AdminProductListPane.tsx` | ✅ |

---

## Ringkasan Total

| Sprint | Tasks | Status |
|---|---|---|
| S1 — Payment Opening | 4 | ✅ Done |
| S2 — Checkout Result | 6 | ✅ Done |
| S3 — Customer Orders | 9 | ✅ Done |
| S4 — Admin Verify | 5 | ✅ Done |
| S5 — Admin Orders | 3 | ✅ Done |
| S6 — Cleanup | 4 | ✅ Done |
| A — CMS Product | 3 | ✅ Done |
| B — CMS Banner/Category | 3 | ✅ Done |
| M — Mobile | 6 | ✅ Done |
| UI — Polish | 5 | ✅ Done |
| **TOTAL** | **48 tasks** | **✅ All Done** |
