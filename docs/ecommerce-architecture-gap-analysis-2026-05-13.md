# E-commerce Architecture Gap Analysis

Date: 2026-05-13

Scope: storefront cart, DOKU Checkout sandbox, payment confirmation, order ownership, BOPIS pickup, admin operations, and verification coverage.

## References Used

- DOKU Checkout can use a hosted payment page that is redirected or embedded: https://docs.doku.com/accept-payments/integration-tools/doku-checkout
- DOKU payment simulation separates customer redirect from HTTP Notification: https://developers.doku.com/accept-payments/doku-checkout/integration-guide/simulate-payment-and-notification
- DOKU override notification URL requires the configured notification URL path to match: https://developers.doku.com/getting-started-with-doku-api/notification/override-notification-url
- DOKU Check Status API can query status by `order.invoice_number` or request ID: https://developers.doku.com/get-started-with-doku-api/check-status-api/non-snap
- Supabase recommends RLS with least privilege and server-side Edge Functions for secret-backed logic: https://supabase.com/docs/guides/database/secure-data
- Supabase service role keys bypass RLS and must not be exposed to frontend: https://supabase.com/docs/guides/api/api-keys
- Stripe fulfillment guidance is payment-provider-agnostic in principle: webhooks are required for reliable fulfillment; redirects are not enough: https://docs.stripe.com/checkout/fulfillment
- OWASP payment testing highlights business-logic risks such as basket modification after checkout: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/10-Business_Logic_Testing/10-Test-Payment-Functionality

## Current Verified State

| Area | Current State | Evidence |
| --- | --- | --- |
| DOKU checkout ownership patch | Deployed | `supabase functions list` shows `create-doku-checkout` ACTIVE version 5 updated `2026-05-12 18:10:35 UTC`. |
| Auth guard for checkout function | Active | Anonymous/anon-token function invoke returns `401` with `You must be logged in before checkout`. |
| Latest screenshot invoice | Exists and now mapped | `INV1778606834545247D859F` exists and was backfilled to `user_id=1b39a896-d50f-492c-a2e9-015e21b4a5be`; status remains `pending_payment`. |
| DOKU notification secret | Present | `supabase secrets list` includes `DOKU_NOTIFICATION_URL`, `DOKU_CLIENT_ID`, `DOKU_SECRET_KEY`, `SITE_URL`, and Supabase secrets. |
| Frontend checkout UX patch | Local code applied | `CartDrawer` opens a 520x760 popup and navigates it to the DOKU payment URL. |
| TypeScript health | Passing | `npm run typecheck` passes. |
| Dirty worktree unrelated to payment | Present | Existing modified files: `CmsAssetField.tsx`, `CmsSection.tsx`, `shop.css`; not part of this payment patch except `shop.css` was already dirty. |
| Payment hardening migration | Deployed | Remote migration history is synced through `20260513010000_payment_hardening.sql`. |
| Reconciliation function | Deployed | `reconcile-doku-payment` is ACTIVE version 1 and rejects non-owner anon access with `403`. |

## Priority Map

| Priority | Gap | Why It Matters | Current Evidence | Recommended Architecture |
| --- | --- | --- | --- | --- |
| Urgent | No reconciliation/check-status function for DOKU payments | If HTTP Notification fails or DOKU dashboard webhook path is wrong, orders stay `pending_payment` even when DOKU says paid. This is the exact class of failure observed. | Docs mention `reconcile-payments`, but no `supabase/functions/reconcile-payments` exists. Checkout result only polls Supabase. | Add `reconcile-doku-payment` Edge Function that calls DOKU Check Status API by invoice/request ID, verifies status, and reuses the same server-side activation path as webhook. Trigger manually from admin/result page and optionally by scheduled job. |
| Urgent | Webhook is not idempotency-first | Duplicate or retried payment notifications can execute business logic multiple times unless the DB layer guarantees one-time side effects. Pickup code has `order_id unique`, but payment event receipt is not uniquely recorded. | `payment_attempts` has no unique provider event/request constraint; `doku-webhook` updates by invoice only. | Add `payment_events` or harden `payment_attempts` with unique provider event/request key, raw payload, processing status, and replay-safe transaction. |
| Urgent | Checkout creation is not atomic | Order is inserted before DOKU creation. If order items insert or DOKU call fails, orphan pending orders can remain. | `create-doku-checkout` inserts `orders`, then `order_items`, then calls DOKU; no DB transaction/RPC wraps the order write. | Move order creation into an RPC transaction or add cleanup/failed state and a deterministic checkout session state machine. |
| Urgent | Inventory is only checked, not reserved/decremented | Two users can pay for the last unit because stock is checked before payment but not reserved or atomically decremented. | `create-doku-checkout` checks `variant.stock_quantity < quantity`; `activate_paid_order` does not decrement stock. | Introduce inventory reservation rows at checkout creation, expiration release, and final decrement on paid activation. |
| Urgent | Callback/result page cannot distinguish RLS-denied from truly missing | A valid order hidden by RLS appears as "not found", causing misleading debugging and user flow. | `getOrderByInvoice(...).maybeSingle()` returns null; page renders "Pesanan tidak ditemukan". | Add server-owned `get-checkout-result` Edge Function or RPC that validates ownership explicitly and returns typed outcomes: `found`, `not_owner`, `not_found`, `pending`, `paid`. |
| Urgent | DOKU Notification URL dependency not programmatically verified | DOKU override URL only works when Back Office configured path matches. If dashboard config diverges, payment status never arrives. | Secret exists, endpoint responds to GET, but no automated assertion against DOKU dashboard/channel config. | Add a deployment checklist plus admin health check that pings webhook URL and documents required DOKU dashboard path per payment channel. |
| Medium | No automated payment contract tests | Current tests load pages but do not simulate webhook/check-status/order activation. Bugs are discovered manually. | `frontend/tests` are UI-oriented; no function-level tests for DOKU payload mapping or RPC activation. | Add function tests with fixture payloads: valid paid, duplicate paid, expired, invalid signature, missing invoice, RLS result page access. |
| Medium | `payment_attempts` mixes attempt and final event data | Attempt creation payload and notification payload are stored in the same row, making audit/replay weaker. | `payment_attempts.raw_payload` stores DOKU create response, then `activate_paid_order` overwrites with notification payload for paid cases. | Separate `payment_attempts` from `payment_events`; keep immutable append-only event history. |
| Medium | Cart remains active after checkout creation | User can continue editing cart after a pending order has been created, which can confuse order/cart totals. | `CartDrawer` sends items but does not mark cart `checked_out`; schema supports cart status. | Mark cart `checked_out` on successful checkout creation and create a new active cart afterward. |
| Medium | `SITE_URL` and local callback behavior need environment strategy | Hosted checkout returns to configured site URL; local popup/result flows can differ from deployed site. | `create-doku-checkout` uses `SITE_URL` fallback to request origin. | Define separate sandbox callback URLs for local, staging, and deployed demo; avoid relying on localhost for external gateway callbacks. |
| Medium | Admin payment observability is thin | Admin sees orders, but not webhook failures, DOKU request IDs, notification raw payloads, or reconciliation action. | `payment_attempts` is admin-readable, but no dedicated UI. | Add admin "Payment Health" panel: attempts, events, last webhook time, raw status, reconcile button, and error states. |
| Medium | CORS is permissive on Edge Functions | Current `Access-Control-Allow-Origin: *` is okay for sandbox demos but weak for production posture. | All functions use wildcard CORS. | Restrict origin to configured frontend origins for browser calls; keep DOKU webhook server-to-server path separate. |
| Nice to have | Popup is a browser window, not embedded checkout | UX is closer to ecommerce popup, but not a true in-page modal. | `CartDrawer` opens `window.open` 520x760. | If DOKU embedded mode is desired, implement the official embedded integration pattern instead of iframe-loading the hosted redirect URL. |
| Nice to have | Customer order history is planned but not present | Useful for customer support and self-service. | Planning docs list `listMyOrders` and `/my-orders` as TODO. | Add protected `/my-orders` after result/reconciliation is stable. |
| Nice to have | Better pending-payment messaging | The current page says pending, but does not explain VA/manual payment timing or provide recovery actions beyond refetch. | `CheckoutResultPage` only polls Supabase. | Add "Cek status ke DOKU" action after 60 seconds via reconciliation function. |

## Recommended Implementation Order

1. Add `reconcile-doku-payment` Edge Function and reuse one DB activation path for webhook and manual status check.
2. Add DB-backed idempotency/event log for DOKU notifications and check-status responses.
3. Move paid activation into a stricter RPC transaction that handles payment event, order status, pickup code, and inventory finalization.
4. Add inventory reservation or decrement strategy before treating checkout as production-grade.
5. Add payment contract tests using fixed DOKU payload fixtures and invalid signature cases.
6. Add admin payment health UI and a customer-safe status endpoint.
