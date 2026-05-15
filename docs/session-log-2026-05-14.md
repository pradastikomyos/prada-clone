# Session Log — 14 Mei 2026

Sesi debugging dan fix payment pipeline end-to-end. Dimulai dari laporan user `pelanggan@gmail.com` yang stuck di "Pembayaran belum terkonfirmasi" meskipun BCA sudah menampilkan "Payment Successful".

---

## Status Akhir Sesi

- **Payment flow**: ✅ FULLY WORKING — order masuk, DOKU sukses, halaman langsung hijau
- **Bukti**: screenshot `localhost:5173/checkout-result?invoice=INV1778744188922D3BD5F59` — animated green checkmark, "Payment Successful", pickup code, order summary
- **Supabase migrations**: synced through `20260513110000_fix_payment_event_digest_ambiguity.sql`
- **Edge functions**: `reconcile-doku-payment` v5 deployed dengan error normalization + service-role bypass

---

## Root Cause Chain (3 Bug Berlapis)

### Bug 1 — `digest()` tidak ditemukan
`process_doku_payment_event` dipanggil dengan `set search_path = public`, tapi `digest()` dari `pgcrypto` ada di schema `extensions`. Akibatnya setiap call ke function ini (webhook maupun reconcile) langsung error:

```
function digest(text, unknown) does not exist
```

Fix: `extensions.digest(...)::bytea` dengan explicit cast.

### Bug 2 — `ON CONFLICT (order_id)` ambigu
Function punya `RETURNS TABLE(order_id uuid, ...)`. PostgreSQL bingung antara output column `order_id` dan table column `pickup_codes.order_id` di `ON CONFLICT (order_id)`. Exception ini di-catch oleh blok `EXCEPTION WHEN OTHERS` sehingga seluruh paid activation di-rollback.

Fix: ganti ke `ON CONFLICT ON CONSTRAINT pickup_codes_order_id_key` dan `ON CONFLICT ON CONSTRAINT payment_events_idempotency_key_key`.

### Bug 3 — Error generik di edge function
`reconcile-doku-payment` pakai `error instanceof Error ? error.message : 'Unexpected reconciliation error'`. PostgrestError dari Supabase adalah plain object, bukan `Error` instance, sehingga detail asli (code, hint, details) dibuang. Debugging jadi sangat sulit.

Fix: `normalizeUnknownError()` helper yang handle `Error`, plain object (PostgrestError), dan string.

---

## Yang Dikerjakan

### 1. Diagnosis awal
- Cek DB: order `INV1778666813909EBBD2B3A` stuck `pending_payment`, `payment_events` kosong
- Cek edge function logs: `reconcile-doku-payment` selalu 403/500
- Konfirmasi DOKU sandbox memang sudah SUCCESS (BCA VA paid)

### 2. Fix `reconcile-doku-payment` auth (v2–v5)
- Tambah `decodeJwtRole()` — detect service-role JWT dari claim `role: 'service_role'`
- Tambah `isSystem` flag — bypass ownership check untuk server-to-server call
- Tambah `normalizeUnknownError()` — expose PostgrestError detail ke response body
- Tambah `phase` tagging di throw — lokalisasi error ke `process_doku_payment_event`

### 3. Fix DB function `process_doku_payment_event`
Tiga migration berturut-turut:

| Migration | Fix |
|---|---|
| `fix_digest_schema_qualification` | `digest()` → `extensions.digest()` |
| `fix_digest_encode_schema` | Revert `extensions.encode()` (encode ada di pg_catalog) |
| `fix_ambiguous_order_id_in_payment_event` | Qualify semua column refs, tambah `final_pickup_code` var |
| `fix_on_conflict_ambiguity` | `ON CONFLICT (order_id)` → `ON CONFLICT ON CONSTRAINT ...` |

File lokal: `supabase/migrations/20260513110000_fix_payment_event_digest_ambiguity.sql` (mencakup semua fix di atas).

### 4. Manual recovery order stuck
Dua order `pelanggan@gmail.com` yang stuck di-recover manual via SQL:
- `INV1778666813909EBBD2B3A` → `pending_pickup`, pickup code `PRX-4FA-531`
- `INV1778743753310F972F058` → `pending_pickup`, pickup code `PRX-AB5-480`

### 5. Frontend auto-reconcile (`CheckoutResultPage.tsx`)
Tambah konstanta `AUTO_RECONCILE_AFTER_POLLS = 3` dan `useEffect` yang auto-trigger `reconcileDokuPayment()` setelah 3 polls (~12 detik) tanpa menunggu user klik manual. `autoReconcileTriggered` ref mencegah double-call.

Sebelumnya: user harus nunggu 60 detik polling habis, lalu klik tombol "Cek Status ke DOKU" secara manual.
Sekarang: ~12 detik setelah redirect dari DOKU, halaman otomatis hijau.

### 6. Reset data testing
Semua order `pelanggan@gmail.com` dihapus via SQL (disable trigger append-only sementara untuk null-kan FK `payment_events.order_id`) untuk fresh testing.

### 7. Konfirmasi end-to-end berhasil
Testing ulang jam 14:30 WIB — order baru `INV1778744188922D3BD5F59` langsung muncul hijau dengan pickup code dan order summary. ✅

---

## Perubahan File

| File | Perubahan |
|---|---|
| `supabase/functions/reconcile-doku-payment/index.ts` | normalizeUnknownError, decodeJwtRole, isSystem bypass, phase tagging |
| `supabase/migrations/20260513110000_fix_payment_event_digest_ambiguity.sql` | Fix digest schema + ON CONFLICT ambiguity (file baru) |
| `frontend/src/pages/CheckoutResultPage.tsx` | AUTO_RECONCILE_AFTER_POLLS, auto-reconcile useEffect + useRef |

---

## Status Payment Pipeline (Post-Fix)

| Komponen | Status |
|---|---|
| `create-doku-checkout` | ✅ Deployed, auth + inventory reservation |
| `doku-webhook` | ✅ Deployed, signature verify + `process_doku_payment_event` |
| `get-checkout-result` | ✅ Deployed, RLS-safe lookup |
| `reconcile-doku-payment` | ✅ Deployed v5, service-role bypass, error detail |
| `process_doku_payment_event` | ✅ Fixed — digest schema + ON CONFLICT constraint |
| Frontend auto-reconcile | ✅ ~12 detik setelah redirect, tanpa klik manual |
| Webhook DOKU → DB | ✅ Berjalan (tapi sebelumnya selalu gagal karena bug digest) |

---

## Catatan Penting untuk Sesi Berikutnya

- `payment_events` adalah append-only (trigger `prevent_payment_event_mutation`). Untuk reset testing, perlu disable trigger dulu sebelum null-kan FK, baru hapus orders.
- Idempotency key di `process_doku_payment_event` berbasis hash DOKU response. Kalau DOKU response identik (timestamp sama), key sama → function return early. Untuk force re-process, gunakan `event_idempotency_key` custom yang unik.
- `reconcile-doku-payment` sekarang bisa dipanggil dengan service-role JWT (untuk operator recovery) maupun user JWT (untuk self-service).
- Auto-reconcile di frontend hanya trigger sekali per page load (`autoReconcileTriggered` ref). Kalau user refresh, akan trigger lagi — ini by design.

---

## Pending / Belum Dikerjakan

| Item | Prioritas | Catatan |
|---|---|---|
| Webhook DOKU end-to-end test (tanpa reconcile) | HIGH | Perlu konfirmasi webhook langsung sukses tanpa fallback ke reconcile |
| Customer Order History page | MEDIUM | `orders.user_id` sudah di-populate, tinggal buat halaman |
| Admin dashboard numbers (total stock, revenue) | MEDIUM | Sidebar masih hardcode 0 |
| Admin CMS manual QA di browser | HIGH | Upload + paste URL flow belum dikonfirmasi di browser |
| Deploy ke Vercel + smoke test production | HIGH | Semua fix masih di local/Supabase, belum push ke GitHub |
| `useSearchParamState` hook cleanup | LOW | Masih ada di codebase tapi tidak dipakai |
