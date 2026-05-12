# Planning: BOPIS Real Scanner + CMS Banner Admin
**Tanggal**: 12 Mei 2026  
**Status**: In Progress  
**Total tasks**: 26 tasks, 5 PR

---

## Konteks

Laporan audit dari Spark production (via GPT-mini) memberikan referensi konkret untuk:
- **BOPIS**: `html5-qrcode` scanner, status classifier, order detail modal, complete pickup flow
- **CMS Banner**: `CmsAssetField` pattern (preview + upload + paste URL), slot-based grouping, fallback default di frontend

Prinsip: **adapt, jangan copy-paste**. Schema kita berbeda dari Spark.

---

## PR 1 — BOPIS Real Scanner (6 tasks) 🔥 Priority 0

| # | Task | Status |
|---|---|---|
| T01 | Install `html5-qrcode` di frontend | ⬜ |
| T02 | Build `QrScannerModal` component — rear camera, fallback environment, lifecycle cleanup, debounce | ⬜ |
| T03 | Build `useQrScanner` hook — encapsulate start/stop/error state | ⬜ |
| T04 | Rewrite `PickupVerificationCard`: scanner aktif + manual input + order detail setelah scan/input | ⬜ |
| T05 | Setelah scan/input → query order by pickup code, tampilkan detail (customer, items, total, invoice) | ⬜ |
| T06 | Tombol "Verify & Complete" → `verify_pickup_code` RPC, success UX + invalidate queries | ⬜ |

---

## PR 2 — Orders Section Real Data (5 tasks) 🔥 Priority 0

| # | Task | Status |
|---|---|---|
| T07 | Add `classifyOrder()` helper — map status enum ke pending/active/history | ⬜ |
| T08 | `OrdersSection` — tabs: Pending Payment, Pending Pickup, Completed, All | ⬜ |
| T09 | `OrdersCard` — invoice, customer, total, pickup code, line items | ⬜ |
| T10 | Query dengan filter per tab + badge count | ⬜ |
| T11 | Auto-refresh setelah BOPIS verification sukses | ⬜ |

---

## PR 3 — Banner/Hero CMS (7 tasks) 🔥 Priority 0

| # | Task | Status |
|---|---|---|
| T12 | Migration: RLS policies admin write ke `site-assets` Storage bucket | ⬜ |
| T13 | Build `uploadSiteAsset(file, slot)` helper — upload ke Storage, update `site_assets.public_url` | ⬜ |
| T14 | Build `CmsAssetField` reusable component — preview + file picker + paste URL | ⬜ |
| T15 | Extend admin: tambah `'cms'` ke `ADMIN_VIEWS` + route `/admin/cms` | ⬜ |
| T16 | Build `CmsSection.tsx` — fetch semua `site_assets`, group by prefix | ⬜ |
| T17 | Per slot: `CmsAssetField` + tombol Save; support image dan video | ⬜ |
| T18 | Invalidate `useSiteAssets` query setelah save → frontend auto-update | ⬜ |

---

## PR 4 — Customer Order History (5 tasks) Priority 1

| # | Task | Status |
|---|---|---|
| T19 | Fix edge function `create-doku-checkout` v4 — populate `orders.user_id` dari session | ⬜ |
| T20 | Service `listMyOrders()` — query orders by `user_id = auth.uid()` | ⬜ |
| T21 | New page `/my-orders` — protected route (customer) | ⬜ |
| T22 | Tabs: Pending Payment / Active (dengan QR) / History | ⬜ |
| T23 | Link "My Orders" di `UserHeaderActions` untuk customer | ⬜ |

---

## PR 5 — Admin Polish (3 tasks) Priority 2

| # | Task | Status |
|---|---|---|
| T24 | `AdminSidebar` totalStock dari shared query, bukan hardcode 0 | ⬜ |
| T25 | `DokuSection` — pindah ke dev-only atau drop | ⬜ |
| T26 | Dashboard metrics — total revenue, pending pickup aging | ⬜ |

---

## Dependency Map

```
T01 → T02 → T03 → T04 → T05 → T06   (PR1, sequential)
T07 → T08 → T09 → T10 → T11          (PR2, sequential)
T12 → T13 → T14 → T15 → T16 → T17 → T18  (PR3, sequential)
T19 → T20 → T21 → T22 → T23          (PR4, sequential)
T24, T25, T26                          (PR5, independent)

PR1 + PR2 dapat dikerjakan paralel (tidak saling depend)
PR3 dapat dikerjakan paralel dengan PR1+PR2
PR4 depend pada PR1 selesai (butuh order detail pattern)
PR5 independent
```

## Risiko

| Risiko | Mitigasi |
|---|---|
| `html5-qrcode` tidak support browser tertentu | Fallback ke manual input (sudah ada) |
| Storage RLS admin write — salah config bisa expose bucket | Test dengan akun non-admin sebelum deploy |
| `orders.user_id` null untuk order lama | `listMyOrders` filter hanya order setelah fix deployed |
| PR3 upload langsung dari browser butuh auth session valid | Pakai Supabase client dengan user session, bukan service role |

---

## Catatan Implementasi

### BOPIS Status Mapping
Spark pakai 3 kolom (`payment_status`, `pickup_status`, `status`).
Kita pakai 2 kolom (`payment_status`, `status`). Mapping:

| Spark | Kita |
|---|---|
| `payment_status=paid + pickup_status=pending_pickup` | `status=pending_pickup` |
| `pickup_status=completed` | `status=picked_up` |
| `payment_status=pending` | `status=pending_payment` |

### CMS Asset Upload Flow
```
Admin pilih file → uploadSiteAsset(file, slot)
  → supabase.storage.from('site-assets').upload(storagePath, file, { upsert: true })
  → supabase.from('site_assets').update({ public_url: storagePublicUrl }).eq('slot', slot)
  → queryClient.invalidateQueries(['site-assets'])
  → useSiteAssets() re-fetch → frontend update otomatis
```

### QR Scanner Flow (adapted from Spark)
```
Admin buka BOPIS tab
  → klik "Aktifkan Scanner"
  → QrScannerModal: pilih rear camera → start scan
  → onScanSuccess(code) → setPickupCode(code) → tutup modal
  → query order by pickup code → tampilkan detail
  → admin klik "Verify & Complete"
  → verify_pickup_code RPC → status = picked_up
  → success toast + invalidate orders query
```
