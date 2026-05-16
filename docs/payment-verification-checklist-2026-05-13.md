# Payment Verification Checklist

Date: 2026-05-13 (updated 2026-05-15)

Scope: DOKU checkout auth, webhook payload mapping, reconcile/check-status behavior, and checkout result visibility.

## Current Deployment Status

- Remote migrations synced through `20260514073336_fix_on_conflict_ambiguity`.
- `create-doku-checkout` v7 — authenticated, inventory reservation, DOKU SDK callback.
- `doku-webhook` v8 — signature verify + `process_doku_payment_event` with error normalization.
- `get-checkout-result` v1 — customer-safe RLS result lookup.
- `reconcile-doku-payment` v6 — service-role bypass, normalized error detail, phase tagging.
- `verify-pickup-code` v1 — admin-only RPC, atomic DB update.
- `process_doku_payment_event` — fixed: `extensions.digest()` + `ON CONFLICT ON CONSTRAINT`.

## ✅ Verified End-to-End (15 Mei 2026 — Happy Path Test)

Full sandbox flow confirmed working on production (Vercel):

1. Login sebagai `pelanggan@gmail.com`
2. Add to cart → checkout → DOKU SDK overlay (BCA VA)
3. Bayar di DOKU sandbox simulator
4. Redirect ke `/checkout-result?invoice=...`
5. Auto-reconcile ~12 detik → halaman hijau + confetti
6. QR pickup code muncul di checkout result dan `/my-orders`
7. Admin login di HP (Android Chrome) → `/admin/bopis`
8. Scan QR → preview modal → konfirmasi → `picked_up` ✅

**Invoice:** `INV17788236015604D96D671`  
**Timeline:** 12:40:01 order dibuat → 12:41:10 picked_up (1 menit 9 detik total)

## Manual Sandbox Verification Checklist

- [x] Authenticate as storefront customer
- [x] Add active product variant with stock to cart
- [x] Start checkout — DOKU SDK overlay opens (not new tab)
- [x] Checkout creation fails with 401 without real user token
- [x] Complete payment in DOKU sandbox simulator
- [x] `/checkout-result` auto-reconcile → paid state without manual click
- [x] `orders.invoice_number` moves from `pending_payment` to `pending_pickup` with pickup code
- [x] QR code visible in checkout result page
- [x] QR code visible in `/my-orders` card (tab "Siap Diambil")
- [x] QR code visible in `/my-orders/:invoice` detail page
- [x] Admin scan QR on mobile → preview modal → confirm → `picked_up`
- [x] Admin manual input pickup code → same flow as scan
- [x] `pickup_codes.verified_at` and `orders.picked_up_at` recorded correctly
- [x] Inventory reservation finalized after payment
- [ ] Replay same paid notification — confirm no duplicate pickup code
- [ ] Simulate expired payment — confirm `orders.status = expired`
- [ ] DOKU HTTP Notification direct (without reconcile fallback)

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

- `DOKU_NOTIFICATION_URL` set → `https://xyhdnprncjvhtdfyovpx.functions.supabase.co/doku-webhook` ✅
- `GET` to webhook URL returns `200` ✅
- `product-images` storage bucket — admin INSERT/UPDATE/DELETE policies ✅
- `banners` table + RLS ✅
- `product_categories` table + RLS ✅
