# Prompt untuk GPT — Audit Detail Alur Payment & Post-Payment di Spark Production

## Konteks

Kamu berada di projek Spark Stage production (`C:\Users\prada\Documents\sparkstage`). Saya butuh kamu mengintip dan mendokumentasikan **super detail** (baris demi baris jika perlu) alur berikut dari projek Spark asli. Hasilnya akan dipakai sebagai contekan arsitektur untuk projek clone skripsi (`prada-clone`).

---

## TASK 1 — Arsitektur Payment Opening (BUKAN new tab)

Di projek clone, saat user klik "Bayar", DOKU payment URL dibuka di **tab baru** (`window.open` atau `<a target="_blank">`). Ini bikin UX jelek karena user harus pindah-pindah tab, terutama saat pakai DOKU sandbox simulator.

**Yang perlu kamu cari di Spark production:**

1. Bagaimana `payment_url` dari DOKU ditampilkan ke user? Apakah:
   - Redirect full-page (`window.location.href = payment_url`)?
   - Iframe/embed di dalam halaman?
   - Modal/popup window?
   - Atau cara lain?

2. Cari di file-file ini (atau yang relevan):
   - Komponen checkout / cart yang memanggil edge function `create-doku-checkout` atau equivalent
   - Bagian yang menerima `payment_url` dari response dan melakukan navigasi
   - Apakah ada `callback_url` / `callback_url_result` yang dikirim ke DOKU? Apa isinya?

3. Setelah user selesai bayar di halaman DOKU, bagaimana user kembali ke Spark?
   - Apakah DOKU redirect otomatis ke URL tertentu?
   - Apakah ada parameter di URL redirect (invoice, status, session_id)?
   - Halaman apa yang ditampilkan setelah redirect?

**Output yang diharapkan:**
- Nama file + baris kode yang handle payment URL opening
- Nama file + baris kode yang handle redirect back dari DOKU
- Arsitektur keputusan: kenapa pakai cara itu (full-page redirect vs popup vs iframe)

---

## TASK 2 — Alur Setelah Bayar (Post-Payment UX)

Setelah payment sukses dan user kembali ke Spark:

1. **Halaman apa yang ditampilkan?** Cari:
   - Route/path-nya (misal `/checkout-result`, `/order-confirmation`, `/payment-success`)
   - Komponen React-nya
   - Props/state yang dipakai

2. **Apa yang ditampilkan di halaman itu?**
   - Apakah ada animasi sukses (checkmark, confetti, dll)?
   - Apakah ada QR code pickup?
   - Apakah ada pickup code text?
   - Apakah ada order summary (items, total, invoice)?
   - Apakah ada instruksi pickup ("bawa QR ini ke store")?
   - Apakah ada tombol "Lihat Pesanan Saya" atau "Kembali Belanja"?

3. **Bagaimana status payment di-resolve?**
   - Apakah halaman polling ke backend?
   - Apakah ada reconcile/check-status call?
   - Berapa interval polling? Berapa max retry?
   - Apakah ada state "menunggu konfirmasi" sebelum hijau?
   - Transisi dari pending → sukses: animasi apa yang dipakai?

4. **Pickup code:**
   - Format pickup code (misal `PRX-XXX-YYY`)
   - Kapan pickup code di-generate? (saat webhook masuk? saat reconcile? saat order dibuat?)
   - QR code: library apa yang dipakai? Payload QR-nya apa?
   - Apakah QR ditampilkan langsung di halaman sukses atau di halaman terpisah?

**Output yang diharapkan:**
- Screenshot mental (deskripsi layout halaman sukses)
- Nama file + komponen + baris kode untuk setiap elemen di atas
- Flow diagram: user bayar → redirect → halaman X → polling → hijau → QR muncul

---

## TASK 3 — Alur Admin Scan & Verifikasi Pickup

Setelah customer punya pickup code/QR:

1. **Halaman admin mana yang handle verifikasi?**
   - Route/path
   - Komponen React
   - Apakah ada tab khusus "BOPIS" atau "Pickup"?

2. **Flow scan QR:**
   - Library scanner apa? (`html5-qrcode`? `react-qr-reader`? lainnya?)
   - Bagaimana scanner di-trigger? (tombol? auto-start?)
   - Setelah scan berhasil, apa yang terjadi?
   - Apakah ada preview order sebelum verify?
   - Apakah ada konfirmasi "Yakin serahkan barang?"

3. **Flow manual input:**
   - Apakah ada input text untuk ketik pickup code manual?
   - Validasi apa yang dilakukan?
   - Apakah ada autocomplete/search?

4. **Proses verifikasi:**
   - Edge function / RPC apa yang dipanggil?
   - Parameter apa yang dikirim?
   - Apa yang berubah di database setelah verify?
   - Response apa yang dikembalikan?
   - UX setelah verify sukses (toast? animasi? redirect?)

5. **Order list di admin:**
   - Bagaimana order dikelompokkan? (tabs? filter? sort?)
   - Status apa saja yang ditampilkan?
   - Apakah ada badge/count per status?
   - Apakah ada auto-refresh/polling?

**Output yang diharapkan:**
- Nama file + komponen + baris kode untuk scanner, verify, order list
- Flow diagram: admin buka tab → scan/input → preview → verify → sukses
- Database changes: kolom apa yang berubah saat verify

---

## TASK 4 — Customer Order History

1. **Halaman "Pesanan Saya" untuk customer:**
   - Route/path
   - Komponen React
   - Bagaimana order di-fetch? (RLS? edge function?)
   - Tabs/filter apa yang ada?

2. **Per order, apa yang ditampilkan?**
   - Invoice number
   - Status (pending payment, pending pickup, completed, expired)
   - Items + total
   - Pickup code + QR (kalau sudah paid)
   - Tanggal order
   - Tombol aksi (bayar ulang? cancel? lihat detail?)

3. **Apakah ada notifikasi/realtime update?**
   - Supabase realtime subscription?
   - Polling?
   - Push notification?

**Output yang diharapkan:**
- Nama file + komponen + baris kode
- Layout/struktur halaman order history

---

## FORMAT OUTPUT

Untuk setiap task, berikan:

```
### [Nama Task]

**File:** `path/to/file.tsx`
**Baris:** 42-78
**Kode relevan:**
```tsx
// paste kode yang relevan
```

**Penjelasan:**
[Jelaskan apa yang terjadi dan kenapa]

**Rekomendasi untuk clone:**
[Apa yang harus diadaptasi vs yang bisa di-skip]
```

---

## CATATAN PENTING

- Projek Spark production ada di `C:\Users\prada\Documents\sparkstage`
- Stack: React 18, TypeScript, Vite 6, Tailwind 4, React Router 7, TanStack Query 5, Supabase, DOKU
- Fokus ke **kode yang sudah jalan di production**, bukan draft/TODO
- Kalau ada beberapa versi/approach, pilih yang paling baru/aktif
- Jangan skip detail — saya butuh baris kode spesifik supaya bisa langsung adaptasi
- Perhatikan: apakah Spark pakai DOKU Checkout (hosted page) atau DOKU Direct API? Ini penting untuk arsitektur payment opening
