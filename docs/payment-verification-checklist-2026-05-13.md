# Payment Verification Checklist

Date: 2026-05-13

Scope: DOKU checkout auth, webhook payload mapping, future reconcile/check-status behavior, and checkout result visibility risks from `docs/ecommerce-architecture-gap-analysis-2026-05-13.md`.

## Current Deployment Status

- Remote migrations are synced through `20260513010000_payment_hardening.sql`.
- `create-doku-checkout` is deployed with authenticated order ownership and inventory reservation support.
- `doku-webhook` is deployed with `process_doku_payment_event` event processing.
- `get-checkout-result` is deployed for customer-safe result lookup.
- `reconcile-doku-payment` is deployed for owner/admin-triggered DOKU Check Status reconciliation.

## Automated Checks

Run from `frontend`:

```bash
npm run test:e2e -- payment-contract.spec.js
```

This contract spec verifies:

- `create-doku-checkout` has a bearer-token auth path, rejects the anon key/no user, and checks auth before inserting into `orders`.
- `doku-webhook` still reads known DOKU invoice/status shapes used by the fixtures.
- Webhook fixtures normalize `SUCCESS`, `EXPIRED`, and `CANCELED` to the expected local payment/order states.
- Check-status fixtures use the same invoice/status/request-id contract expected by a future `reconcile-doku-payment` function.
- Reconcile source is contract-checked now that `supabase/functions/reconcile-doku-payment/index.ts` exists.

Fixtures live in `frontend/tests/fixtures/payment`.

## Manual Sandbox Verification

1. Authenticate as a storefront customer.
2. Add an active product variant with enough stock to the cart.
3. Start checkout and confirm the DOKU popup opens.
4. Confirm checkout creation fails with HTTP `401` and `You must be logged in before checkout` when the function is invoked without a real user token.
5. Complete payment in the DOKU sandbox simulator.
6. Confirm the DOKU HTTP Notification reaches the deployed `doku-webhook` URL, not only the browser redirect.
7. Confirm the matching `orders.invoice_number` moves from `pending_payment` to the paid pickup-ready state and has a pickup code.
8. Replay the same paid notification and confirm no duplicate pickup code or duplicate business side effect occurs.
9. Simulate an expired payment and confirm `orders.status = expired` and `payment_status = expired`.
10. Open `/checkout-result?invoice=<invoice>` as the owning user and confirm the paid/pending/expired state is clear.
11. Open the same result URL while logged out or as another user and record whether the UI distinguishes RLS-denied from truly missing.

## Reconcile Function Expectations

When `reconcile-doku-payment` is added, it should be verified with the check-status fixtures and a live sandbox invoice:

- Requires authenticated admin or a server-owned trusted caller.
- Calls DOKU Check Status by `order.invoice_number` or request ID.
- Normalizes DOKU status using the same contract as webhook notifications.
- Reuses the same paid activation path as `doku-webhook`.
- Stores raw check-status payloads without overwriting the original checkout attempt payload.
- Treats repeated paid reconciliation as idempotent.

## Deployment Health Checks

- `DOKU_NOTIFICATION_URL` is present in Supabase secrets.
- DOKU Back Office notification URL path matches the deployed webhook path.
- `GET` or `HEAD` to the webhook URL returns `200`.
- A signed sandbox notification with the expected `Client-Id`, `Request-Id`, `Request-Timestamp`, and `Signature` is accepted.
- An invalid signed notification returns `401`.
- A notification with no DOKU signature headers returns `CONTINUE` for DOKU path validation.
