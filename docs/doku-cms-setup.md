# DOKU Sandbox dan CMS Admin

Dokumen ini mencatat implementasi awal untuk dua task utama:

- integrasi DOKU Checkout sandbox;
- CMS admin untuk produk, stok, order, dan verifikasi BOPIS.

## Status Implementasi

Sudah dibuat:

- Database commerce Supabase:
  - `profiles`
  - `products`
  - `product_variants`
  - `product_images`
  - `carts`
  - `cart_items`
  - `orders`
  - `order_items`
  - `payment_attempts`
  - `pickup_codes`
- RLS dasar:
  - public hanya bisa membaca produk aktif;
  - user hanya membaca cart/order/pickup miliknya;
  - admin bisa mengelola produk, stok, order, dan pickup.
- Trigger auth:
  - user baru otomatis dibuatkan row di `profiles`.
- Seed produk dummy Spark:
  - `SPK101`
  - `SPK102`
  - `SPK103`
- Edge Functions:
  - `create-doku-checkout`
  - `doku-webhook`
  - `verify-pickup-code`
- Frontend CMS:
  - `/admin.html`
  - login admin via Supabase Auth;
  - add product;
  - update status produk;
  - update stok variant;
  - create DOKU checkout sandbox test dari produk aktif;
  - input pickup code untuk verifikasi BOPIS;
  - list latest orders.

## Env Frontend

Local frontend memakai:

```env
VITE_SUPABASE_URL=https://xyhdnprncjvhtdfyovpx.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

File lokal:

```txt
frontend/.env.local
```

File contoh:

```txt
frontend/.env.example
```

## Env Edge Functions

Secrets yang perlu diset di Supabase:

```bash
supabase secrets set DOKU_BASE_URL=https://api-sandbox.doku.com
supabase secrets set DOKU_CLIENT_ID=...
supabase secrets set DOKU_SECRET_KEY=...
supabase secrets set DOKU_NOTIFICATION_URL=https://xyhdnprncjvhtdfyovpx.functions.supabase.co/doku-webhook
supabase secrets set SITE_URL=http://localhost:5173
```

Untuk deploy production/demo Vercel nanti, `SITE_URL` diganti ke URL deploy frontend.

## Membuat Admin

1. Buat user melalui Supabase Auth Dashboard.
2. Promote user tersebut menjadi admin:

```sql
update public.profiles
set role = 'admin'
where email = 'email-admin@example.com';
```

3. Login di:

```txt
http://127.0.0.1:5173/admin.html
```

## Flow DOKU Checkout

1. Admin/customer memilih produk aktif.
2. Client memanggil Edge Function `create-doku-checkout`.
3. Edge Function:
   - membaca produk dan variant dari Supabase;
   - menghitung total server-side;
   - membuat order `pending_payment`;
   - membuat request signature DOKU;
   - hit endpoint DOKU sandbox;
   - menyimpan `payment_url`.
4. User membuka `payment_url`.
5. Setelah pembayaran, DOKU mengirim HTTP Notification ke `doku-webhook`.
6. Webhook:
   - verifikasi signature;
   - update order menjadi `pending_pickup`;
   - membuat pickup code `PRX-XXX-YYY`.
7. Admin input pickup code di CMS.
8. Sistem update order menjadi `picked_up`.

## Catatan Saat Ini

- DOKU checkout belum bisa dipakai sampai `DOKU_CLIENT_ID` dan `DOKU_SECRET_KEY` sandbox diset.
- Webhook URL harus diisi di DOKU Dashboard atau dikirim lewat `DOKU_NOTIFICATION_URL`.
- Full customer cart UI belum disambungkan ke Supabase; CMS dan backend payment foundation sudah siap.
- QR scanner kamera belum dibuat; fase saat ini memakai input pickup code. QR display/scan bisa masuk task berikutnya.
