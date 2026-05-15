# Payment Verification Checklist

Date: 2026-05-13 (updated 2026-05-14)

Scope: DOKU checkout auth, webhook payload mapping, reconcile/check-status behavior, and checkout result visibility.

## Current Deployment Status

- Remote migrations synced through `20260513110000_fix_payment_event_digest_ambiguity.sql`.
- `create-doku-checkout` deployed — authenticated order ownership + inventory reservation.
- `doku-webhook` deployed — signature verify + `process_doku_payment_event`.
- `get-checkout-result` deployed — customer-safe RLS result lookup.
- `reconcile-doku-payment` deployed v5 — service-role bypass, normalized error detail, phase tagging.
- `process_doku_payment_event` fixed — `extensions.digest()` schema qualification + `ON CONFLICT ON CONSTRAINT` (no more ambiguous column reference).

## ✅ Verified End-to-End (14 Mei 2026)

Full sandbox flow confirmed working:

1. Login sebagai `pelanggan@gmail.com`
2. Add to cart → checkout → DOKU hosted page (BCA VA)
3. Bayar di DOKU sandbox simulator
4. Redirect ke `/checkout-result?invoice=...`
5. Halaman otomatis hijau dalam ~12 detik (auto-reconcile)
6. Animated green checkmark, "Payment Successful", pickup code, order summary tampil

**Bukti**: `INV1778744188922D3BD5F59` — status `pending_pickup`, payment `paid`, pickup code generated.

## Known Behavior

- **Webhook vs reconcile**: Webhook dari DOKU dikirim tapi sebelumnya selalu gagal karena bug `digest()`. Setelah fix, webhook seharusnya langsung sukses. Auto-reconcile di frontend (~12 detik) adalah fallback kalau webhook delay/miss.
- **Idempotency**: Kalau DOKU response identik (timestamp sama), idempotency key sama → function return early. Untuk force re-process, gunakan `event_idempotency_key` custom.
- **Append-only `payment_events`**: Trigger `prevent_payment_event_mutation` blokir DELETE dan UPDATE. Untuk reset testing, disable trigger dulu.

## Manual Sandbox Verification Checklist

- [x] Authenticate as storefront customer
- [x] Add active product variant with stock to cart
- [x] Start checkout — DOKU hosted page opens
- [x] Checkout creation fails with 401 without real user token
- [x] Complete payment in DOKU sandbox simulator
- [ ] Confirm DOKU HTTP Notification reaches `doku-webhook` directly (without reconcile fallback)
- [x] `orders.invoice_number` moves from `pending_payment` to `pending_pickup` with pickup code
- [ ] Replay same paid notification — confirm no duplicate pickup code
- [ ] Simulate expired payment — confirm `orders.status = expired`
- [x] `/checkout-result?invoice=<invoice>` as owning user shows paid state clearly
- [ ] Same URL logged out or as different user — confirm RLS-denied vs missing distinction

## Reconcile Function — Verified Behavior

- ✅ Accepts service-role JWT (system/operator recovery)
- ✅ Accepts admin user JWT
- ✅ Accepts owning customer JWT
- ✅ Rejects anon key / unauthenticated
- ✅ Rejects non-owner non-admin user (403)
- ✅ Calls DOKU Check Status by invoice number
- ✅ Normalizes DOKU SUCCESS → `paid`, maps to `process_doku_payment_event`
- ✅ Idempotent — repeated paid reconciliation does not duplicate pickup codes
- ✅ Returns full order detail including pickup code on success

## Deployment Health Checks

- `DOKU_NOTIFICATION_URL` set in Supabase secrets → `https://xyhdnprncjvhtdfyovpx.functions.supabase.co/doku-webhook`
- `GET` to webhook URL returns `200` ✅
- Signed sandbox notification accepted ✅
- Invalid signature returns `401` ✅
- No DOKU signature headers returns `CONTINUE` ✅
