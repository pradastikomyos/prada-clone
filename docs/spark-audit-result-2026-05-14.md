# Hasil Audit Spark Production — Payment & Post-Payment Flow

**Tanggal**: 14 Mei 2026  
**Sumber**: GPT agent di projek `sparkstage`  
**Tujuan**: Contekan arsitektur untuk adaptasi ke `prada-clone`

---

## Ringkasan Arsitektur Spark vs Clone Saat Ini

| Aspek | Spark Production | Clone Saat Ini | Yang Perlu Diubah |
|---|---|---|---|
| Payment opening | DOKU SDK overlay (loadJokulCheckout) | `window.open` tab baru | Ganti ke SDK overlay |
| Post-payment route | `/order/product/success/:orderNumber?pending=1` | `/checkout-result?invoice=...` | Refactor route + state |
| Pending → Success | Redirect bolak-balik + realtime | Polling 4s × 15 + manual reconcile | Tambah realtime, perbaiki transisi |
| Pickup code display | QR langsung di success page | QR di success page (sudah ada) | ✅ Sudah mirip |
| QR payload | Pickup code mentah (string) | JSON object | Simplify ke string mentah |
| Admin verify | Scan → Preview → Confirm modal | Scan → Verify langsung | Tambah preview step |
| Customer order history | `/my-orders` + tabs + realtime | Belum ada | Buat baru |

---

## Task 1 — Payment Opening (DOKU SDK Overlay)

### Arsitektur Spark

```
User klik Bayar
  → Edge function create-doku-product-checkout → return payment_url
  → loadDokuCheckoutScript() → load SDK dari DOKU CDN
  → openDokuCheckout(payment_url) → SDK buka overlay/popup hosted page
  → User bayar di overlay DOKU
  → DOKU auto_redirect ke callback_url
  → navigate('/order/product/success/:orderNumber?pending=1')
```

### File Kunci Spark

| File | Fungsi |
|---|---|
| `frontend/src/utils/dokuCheckout.ts` | Load SDK script + panggil `window.loadJokulCheckout(url)` |
| `useProductCheckoutController.ts:81-85` | `loadDokuCheckoutScript().then(() => setCheckoutReady(true))` |
| `useProductCheckoutController.ts:339-361` | `openDokuCheckout(payload.payment_url)` lalu navigate ke success |
| Edge function | `callback_url` dan `callback_url_result` = URL success page |

### Adaptasi untuk Clone

**Buat file baru**: `frontend/src/utils/dokuCheckout.ts`

```typescript
const DOKU_CHECKOUT_JS = 'https://sandbox.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js';
// Production: 'https://jokul.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js'

let scriptLoaded = false;

export function loadDokuCheckoutScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = DOKU_CHECKOUT_JS;
    script.onload = () => { scriptLoaded = true; resolve(); };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function openDokuCheckout(paymentUrl: string): void {
  if (typeof (window as any).loadJokulCheckout === 'function') {
    (window as any).loadJokulCheckout(paymentUrl);
  } else {
    // Fallback: full-page redirect (bukan tab baru)
    window.location.href = paymentUrl;
  }
}
```

**Ubah di checkout flow** (saat terima `payment_url` dari edge function):

```typescript
// SEBELUM (tab baru — jelek):
// window.open(data.payment_url, '_blank');

// SESUDAH (SDK overlay):
await loadDokuCheckoutScript();
openDokuCheckout(data.payment_url);
// Navigate ke success page setelah SDK dipanggil
navigate(`/checkout-result?invoice=${data.invoice_number}&pending=1`);
```

**Ubah di edge function** `create-doku-checkout`:
- `callback_url` dan `callback_url_result` sudah benar (mengarah ke `/checkout-result?invoice=...`)
- `auto_redirect: true` sudah ada ✅

---

## Task 2 — Post-Payment UX (Success + Pending Flow)

### Arsitektur Spark

```
/order/product/success/:orderNumber?pending=1
  → Load order data
  → Cek: payment_status === 'paid'?
    → YES: tampilkan success (confetti, QR, pickup instructions)
    → NO: redirect ke /order/product/pending/:orderNumber

/order/product/pending/:orderNumber
  → Polling dengan delay escalation: [0, 15s, 30s, 60s, 90s, 120s]
  → Realtime subscription ke order table
  → Begitu paid: redirect balik ke success page
  → Success page: confetti + toast "Payment confirmed!"
```

### Perbedaan dengan Clone

Clone saat ini sudah punya `CheckoutResultPage` yang handle semua state (pending, success, failed) di satu halaman. Ini **lebih sederhana** dari Spark yang pakai 2 halaman terpisah. Kita bisa tetap pakai 1 halaman tapi perbaiki transisinya.

### Adaptasi untuk Clone

**Yang perlu ditambah di `CheckoutResultPage.tsx`:**

1. **Confetti saat transisi pending → paid**:
```typescript
import confetti from 'canvas-confetti';

// Di dalam useEffect yang watch order status change:
useEffect(() => {
  if (order?.status === 'pending_pickup' && previousStatus.current === 'pending_payment') {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  }
  previousStatus.current = order?.status;
}, [order?.status]);
```

2. **Delay escalation polling** (bukan flat 4s):
```typescript
// Spark pakai: [0, 5s, 15s, 35s, 60s, 90s, 120s]
// Clone bisa pakai: [0, 4s, 8s, 15s, 30s, 60s]
const POLL_DELAYS = [0, 4000, 8000, 15000, 30000, 60000];
```

3. **QR payload simplify** — Spark pakai pickup code mentah sebagai QR value:
```typescript
// SEBELUM:
// qr_payload = JSON.stringify({type: 'sparkstage.pickup', order_id, code})

// SESUDAH (ikut Spark):
// qr_payload = pickupCode (string mentah)
<QRCode value={pickupCode.code} size={180} />
```

4. **Transisi animasi smooth** — saat status berubah dari pending ke success, jangan hard-replace seluruh UI. Pakai CSS transition atau framer-motion fade.

---

## Task 3 — Admin Scan & Verifikasi Pickup

### Arsitektur Spark

```
Admin buka /admin/product-orders
  → Klik "Scan QR"
  → QRScannerModal open (html5-qrcode, auto-start rear camera)
  → Scan berhasil → lookup order by pickup_code
  → ProductOrderDetailsModal open:
    - Customer name
    - Items + quantity
    - Total
    - Pickup code
    - Status badge
    - Tombol "Konfirmasi Pembayaran & Serah Barang"
  → Klik confirm → Edge function complete-product-pickup
  → RPC atomic: pickup_status=completed, picked_up_at=now, status=completed
  → Toast sukses + invalidate queries
```

### Yang Sudah Ada di Clone

- ✅ `html5-qrcode` installed
- ✅ `QrScannerModal` component
- ✅ `useQrScanner` hook
- ✅ `PickupVerificationCard` dengan manual input
- ✅ `verify-pickup-code` edge function
- ✅ Order preview setelah scan

### Yang Perlu Diperbaiki

1. **Preview modal sebelum verify** — Spark punya modal terpisah dengan detail lengkap sebelum admin klik confirm. Clone saat ini langsung verify setelah scan. Tambah step konfirmasi.

2. **Tombol confirm yang jelas** — "Konfirmasi & Serah Barang" bukan "Verify".

3. **Guard: cek status sebelum verify** — Spark cek `pickup_status !== 'completed'` dan `payment_status === 'paid'` sebelum allow verify. Kalau belum paid, tolak.

---

## Task 4 — Customer Order History

### Arsitektur Spark

```
/my-orders
  → Fetch order_products WHERE user_id = auth.uid()
  → Realtime subscription ke order_products table
  → Classify orders:
    - pending: payment_status !== 'paid'
    - active: payment_status === 'paid' AND pickup_status !== 'completed'
    - history: pickup_status === 'completed' OR status === 'expired/cancelled'
  → Tabs dengan badge count
  → Per order card:
    - Order number / invoice
    - Status badge (warna)
    - Tanggal
    - Total
    - Item count
    - QR code (kalau pickup ready)
    - Tombol: Pay Now / View Details / Cancel / Refresh
```

### Adaptasi untuk Clone

**Buat halaman baru**: `/my-orders` (protected route, customer only)

**Classify logic** (adaptasi dari Spark `status.ts`):
```typescript
type OrderCategory = 'pending' | 'active' | 'history';

function classifyOrder(order: Order): OrderCategory {
  if (order.payment_status !== 'paid') return 'pending';
  if (order.status === 'pending_pickup') return 'active';
  return 'history'; // picked_up, expired, cancelled
}

function isPickupReady(order: Order): boolean {
  return order.payment_status === 'paid' 
    && order.status === 'pending_pickup'
    && order.pickup_codes?.length > 0;
}
```

**Realtime** (opsional tapi recommended):
```typescript
supabase
  .channel('my-orders')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'orders',
    filter: `user_id=eq.${userId}` 
  }, () => {
    queryClient.invalidateQueries(['my-orders']);
  })
  .subscribe();
```

---

## Action Items untuk Implementasi

### Priority 0 (Fix UX payment yang jelek)

| # | Task | Effort |
|---|---|---|
| 1 | Buat `frontend/src/utils/dokuCheckout.ts` (SDK loader) | 30 min |
| 2 | Ubah checkout flow: ganti `window.open` → `openDokuCheckout()` | 30 min |
| 3 | Tambah confetti di `CheckoutResultPage` saat transisi paid | 15 min |
| 4 | Escalating poll delays (bukan flat 4s) | 15 min |
| 5 | Simplify QR payload ke string mentah | 15 min |

### Priority 1 (Improve admin flow)

| # | Task | Effort |
|---|---|---|
| 6 | Tambah confirmation modal sebelum verify pickup | 1 jam |
| 7 | Guard: tolak verify kalau belum paid | 15 min |

### Priority 2 (Customer order history)

| # | Task | Effort |
|---|---|---|
| 8 | Buat `/my-orders` page + route | 2 jam |
| 9 | Classify orders + tabs + badge count | 1 jam |
| 10 | Realtime subscription (opsional) | 30 min |
| 11 | Link "Pesanan Saya" di header untuk customer | 15 min |

---

## Catatan DOKU SDK

- **Sandbox**: `https://sandbox.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js`
- **Production**: `https://jokul.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js`
- Function: `window.loadJokulCheckout(paymentUrl)` — buka overlay hosted checkout
- Setelah user selesai bayar, DOKU redirect ke `callback_url` yang kita set
- SDK ini yang bikin UX smooth: user tidak pindah tab, overlay muncul di atas halaman kita
