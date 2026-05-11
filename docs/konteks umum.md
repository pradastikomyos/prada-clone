# Konteks Umum Proyek Skripsi

Dokumen ini mencatat konteks awal untuk proyek dummy skripsi berbasis clone Prada.com yang nantinya akan diarahkan menjadi Spark Stage commerce experience. Tujuannya agar scope, alasan teknis, dan alasan akademik tetap konsisten selama pengembangan.

## Latar Belakang

Spark Stage 55 adalah website live yang sudah dikembangkan sendiri oleh pemilik proyek, dari fase development sampai optimization dan refactoring. Website tersebut sudah digunakan oleh real user dan memiliki fitur produksi yang berjalan, termasuk autentikasi, booking, e-commerce, dan payment gateway.

Namun untuk kebutuhan sempro, semhas, dan skripsi, memakai repository asli Spark Stage secara langsung berisiko membuat scope terlalu luas dan sulit dijelaskan. Spark Stage saat ini bersifat "palugada", mencakup banyak lini:

- Booking tiket untuk photo studio / stage experience.
- Penjualan produk seperti baju, bracelets, charm/accessories, glasses, makeup, dan merchandise.
- Login dan user account.
- Cart dan checkout.
- Integrasi Supabase.
- Integrasi DOKU live production.
- Banyak edge case bisnis yang sudah berjalan di produksi.

Karena scope tersebut terlalu kompleks untuk narasi skripsi Sistem Informasi, proyek di folder ini diposisikan sebagai **dummy/prototype skripsi**. Clone Prada.com dipakai sebagai titik awal visual untuk membuat pengalaman toko fashion yang lebih fokus, premium, dan mudah dipahami dosen.

## Posisi Proyek Ini

Repository ini bukan clone final Spark Stage production. Repository ini adalah tempat membangun versi dummy yang lebih terkunci scopenya:

- Fokus ke **toko jualan baju / fashion commerce**.
- Target pengguna: **Gen Z**.
- Brand akhir akan diganti menjadi **Spark Stage** menggunakan aset logo Spark Stage yang sudah tersedia.
- Referensi visual awal memakai Prada.com karena cocok dengan arah premium fashion.
- Fitur booking photo studio tidak masuk scope utama skripsi.
- Fitur jualan produk dibuat lebih jelas sebagai fashion store, bukan bisnis campuran.

Dengan pendekatan ini, skripsi bisa dijelaskan sebagai sistem e-commerce fashion dengan payment gateway, bukan platform hybrid yang mencampur booking experience, event, makeup/glam, accessories, dan merchandise sekaligus.

## Alasan Tidak Menggunakan Fork Repo Spark Production

Tidak memakai clone/fork repo Spark production untuk skripsi karena:

- Perlu menyembunyikan terlalu banyak fitur yang tidak masuk batas masalah.
- Linked Supabase production akan lebih ribet dan berisiko.
- Banyak logic production yang tidak perlu dibahas di skripsi.
- Scope Spark asli terlalu luas sehingga bisa membingungkan dosen.
- Dummy project memberi ruang untuk membuat batas masalah yang lebih bersih.

Repo ini menjadi cara untuk membangun ulang bagian yang relevan saja dengan narasi akademik yang lebih fokus.

## Scope Skripsi Yang Diusulkan

Judul/tema dapat diarahkan ke:

- Perancangan dan pengembangan website e-commerce fashion untuk target Gen Z.
- Implementasi payment gateway DOKU pada website penjualan fashion.
- Penggunaan Supabase sebagai backend-as-a-service untuk katalog produk, akun, cart, order, dan payment status.

Batas masalah:

- Produk utama: baju/fashion item.
- Tidak membahas booking tiket photo studio.
- Tidak membahas event management yang luas.
- Tidak membahas semua kategori Spark production.
- Fulfillment memakai BOPIS: buy online, pick up in store.
- Tidak membahas pengiriman kurir/shipping karena pada pengalaman production izin dan operasional kurir membutuhkan waktu lebih panjang, sehingga dipotong dari scope development.
- Payment gateway memakai DOKU sandbox untuk demo akademik.
- Admin panel dibuat minimal untuk produk, stok, dan verifikasi pickup order.

## Justifikasi Bisnis

Alasan website sendiri tetap sah walaupun marketplace seperti Tokopedia/Shopee tersedia:

- Marketplace memiliki fee dan aturan platform.
- Brand dapat menjaga pengalaman visual dan customer journey sendiri.
- Data pelanggan dan transaksi lebih privat dan terkendali.
- Bisnis dapat mengintegrasikan payment gateway langsung.
- Website dibuat sebagai sistem yang dibayar/dibutuhkan oleh pihak bisnis, bukan sekadar alternatif marketplace tanpa alasan.

Untuk skripsi jurusan Sistem Informasi, urgency dapat dibingkai sebagai kebutuhan bisnis fashion lokal untuk memiliki kanal penjualan digital yang lebih terkontrol, branded, dan sesuai target Gen Z.

## Tech Stack Spark Production

Spark Stage production menggunakan pendekatan React modern. Stack repo magang/production berada di `C:\Users\prada\Documents\sparkstage`.

| Area | Stack |
|---|---|
| Frontend | React 18, TypeScript |
| Build tool | Vite 6 |
| Styling | Tailwind CSS 4, PostCSS, custom CSS di `frontend/src/index.css` |
| Routing | React Router DOM 7 |
| Server state | TanStack Query 5 |
| Backend/BaaS | Supabase |
| Database | Supabase Postgres |
| Auth | Supabase Auth |
| Backend functions | Supabase Edge Functions, Deno runtime |
| DB workflow | Supabase migrations, RLS, RPC |
| Payments | DOKU Checkout, webhook, sync/reconciliation functions |
| Image/media | ImageKit, Supabase Storage legacy, planned Cloudflare R2 migration |
| Localization | i18next, react-i18next |
| UI/icons/UX libs | lucide-react, framer-motion, canvas-confetti |
| Drag and drop | dnd-kit |
| QR | qrcode, react-qr-code, html5-qrcode |
| Testing | Vitest, Testing Library, jsdom, fast-check |
| Linting | ESLint 9, typescript-eslint |
| Deployment | Vercel for frontend, Supabase CLI for backend/functions |

Struktur utama:

- `frontend/`: React app
- `supabase/migrations/`: schema, RLS, RPC
- `supabase/functions/`: Edge Functions
- `scripts/`: migration/audit/helper scripts
- `docs/`: architecture, runbooks, decisions, migration notes

Alasan Vite dipilih saat development Spark:

- Development cepat.
- Hot reload ringan dan produktif.
- Cocok untuk kebutuhan magang / delivery cepat.
- Lebih sederhana untuk iterasi UI.

Tradeoff yang sudah disadari:

- SEO lebih sulit dibanding Next.js.
- Perlu setup tambahan untuk indexing/metadata.
- Tidak se-plug-and-play Next.js untuk SSR, routing metadata, dan server-side backend boundary.

## Observasi Website Live Spark Stage

URL observasi: <https://www.sparkstage55.com/>  
Screenshot Playwright:

- `docs/screenshots/sparkstage-reference/sparkstage55-home.png`
- `docs/screenshots/sparkstage-reference/sparkstage55-shop.png`

### Fitur Yang Terlihat Di Homepage

- Language switcher English/Indonesian.
- Header dengan logo Spark dan Stage 55.
- Sign In.
- Cart.
- Search.
- Navigasi utama:
  - ON STAGE
  - GLAM
  - CHARM BAR
  - SPARK CLUB
  - CELEBRATE
  - NEWS
- Hero / ticket CTA: "BE A STAR Ticket".
- Carousel stage/photo experience.
- Stage cards seperti:
  - STAGE 14 - MAKEUP BACKSTAGE
  - STAGE 05 - PILLOW TALK
  - STAGE 07 - POWER ZONE
  - STAGE 11 - FOX
  - STAGE 15 - LOVE'S IN THE AIR
  - The Star is Born
- Booking section:
  - Calendar per bulan.
  - Pilih tanggal.
  - Pilih sesi.
  - Session time slot.
  - Kuota tersisa per sesi.
  - Booking summary.
  - Ticket price.
  - Total price.
  - Proceed to Payment.
  - Secure encrypted checkout.
  - Booking terms and conditions.
- Spark map.
- Footer:
  - About Spark.
  - Social media Instagram.
  - Find your store via Google Maps.
  - Contact via WhatsApp.

### Fitur Yang Terlihat Di Shop / Spark Club

URL observasi: <https://www.sparkstage55.com/shop>

- Product listing.
- Product search.
- Category filter:
  - All Products
  - BANGLE
  - BRACELET
  - GLASSES
  - GLASSES CASE
  - HAIRCLIP
  - KEYCHAIN
  - Makeup
  - NECKLACE
  - Paper Bag
  - RING
  - Spark club
- Product cards dengan:
  - Product image.
  - Product name.
  - Description.
  - Price in IDR.
  - Add to cart icon/action.
  - Link to product detail.
- Pagination:
  - Page indicator.
  - Prev / Next.
  - Contoh terobservasi: page 1 of 35, 683 products.

### Fitur Yang Terlihat Di Login

URL observasi: <https://www.sparkstage55.com/login>

- Email/password login.
- Show password toggle.
- Remember me.
- Forgot password.
- Google OAuth login.
- Link sign up.
- Brand panel / marketing copy.
- Stats display seperti events, members, artists.

### Cart/Auth Behavior

URL `/cart` redirect ke `/login`, sehingga cart termasuk route yang diproteksi autentikasi.

### BOPIS / Pickup Order Behavior

Scope fulfillment yang dipakai untuk skripsi adalah **BOPIS (buy online, pick up in store)**. Flow ini mengikuti keputusan development Spark production: user membeli produk secara online, masuk ke cart, membayar melalui DOKU, lalu mengambil barang langsung di store.

Alasan BOPIS dipilih:

- Tidak perlu integrasi kurir.
- Tidak perlu membahas izin/operasional shipping yang memakan waktu.
- Lebih sederhana untuk batas masalah skripsi.
- Tetap merepresentasikan transaksi e-commerce nyata.
- Cocok untuk bisnis yang punya lokasi fisik dan promosi utama lewat Instagram/direct link.

Flow yang diharapkan:

1. User melihat katalog produk.
2. User memasukkan produk ke cart.
3. User login jika diperlukan.
4. User checkout dan membayar melalui DOKU.
5. Setelah payment sukses, order memiliki status seperti `pending_pickup`.
6. Sistem menampilkan pickup code dan/atau QR code.
7. User datang ke store membawa QR/pickup code.
8. Admin scan QR atau input pickup code untuk verifikasi.
9. Admin menyerahkan barang dan order berubah menjadi `picked_up` / `completed`.

Contoh pattern dari Spark production:

- Halaman admin "Pesanan Produk" memiliki scan QR dan input cari kode.
- Order produk dapat tampil dengan status seperti pending payment, pending pickup, hari ini, dan selesai.
- Kode pickup terlihat seperti format `PRX-9C1-984` atau `PRX-171-284`.
- Produk memiliki kode/SKU seperti `GLS034`.
- Saat admin add/edit product, kode produk/SKU/slug dapat dibuat otomatis atau dikelola sebagai identifier produk.

Untuk skripsi, istilah yang bisa dipakai:

- `product_sku`: kode produk atau SKU, contoh `PROD-01`, `GLS034`.
- `product_slug`: slug URL produk, contoh `the-sweetheart-oval-frames-gls034`.
- `pickup_code`: kode unik order pickup, contoh `PRX-9C1-984`.
- `pickup_qr_payload`: isi QR yang mengarah ke pickup code/order verification.

Shipping/kurir tidak masuk scope awal. Jika dosen bertanya, jawabannya: sistem fokus pada BOPIS karena bisnis memiliki titik pengambilan fisik, mengurangi biaya/fee operasional, menghindari kompleksitas izin kurir, dan tetap mendukung transaksi online yang valid.

## Relevansi Untuk Dummy Skripsi

Spark production sudah membuktikan bahwa fitur real-world seperti OAuth, Supabase, DOKU, cart, booking, dan product catalog dapat berjalan. Namun dummy skripsi perlu dibuat lebih sempit:

- Dari Spark multi-purpose experience menjadi Spark fashion commerce.
- Dari booking + shop + event menjadi shop-first.
- Dari produk campuran menjadi fashion/clothing.
- Dari production complexity menjadi academic demonstrable system.

Clone Prada dipakai sebagai alat untuk membangun visual direction premium, sementara logic bisnis akan disederhanakan agar sesuai batas masalah skripsi.

## Narasi Yang Bisa Dipakai Ke Dosen

Spark Stage membutuhkan website e-commerce fashion yang dapat menampilkan katalog produk secara premium, memudahkan pembelian online, dan mengintegrasikan pembayaran digital melalui payment gateway DOKU. Website ini ditujukan untuk pengguna Gen Z yang terbiasa dengan pengalaman visual kuat, responsif, dan mobile-friendly.

Pengembangan sistem difokuskan pada:

- Katalog produk fashion.
- Detail produk.
- Keranjang belanja.
- Checkout.
- Payment gateway DOKU sandbox.
- Manajemen order.
- Pickup code / QR code untuk verifikasi pengambilan barang di store.
- Admin scan/input pickup code untuk menyelesaikan order.
- Autentikasi pengguna.

Fitur booking photo studio, event, produk non-fashion, dan pengiriman kurir tidak dibahas pada penelitian ini agar ruang lingkup tetap jelas dan evaluasi sistem lebih terarah.

## Catatan Arah Implementasi

Untuk versi dummy skripsi:

- Ganti logo Prada menjadi Spark Stage.
- Gunakan aset Spark Stage yang sudah dimiliki.
- Pertahankan layout premium fashion dari clone Prada.
- Fokuskan kategori produk ke baju/fashion.
- Gunakan DOKU sandbox, bukan production key.
- Gunakan flow BOPIS, bukan shipping/kurir.
- Generate SKU/slug produk dan pickup code order secara sistematis.
- Gunakan Supabase project terpisah dari production.
- Hindari membawa semua logic Spark production ke dummy.
- Dokumentasikan batas masalah sejak awal.

## Risiko Scope Creep

Hal yang sebaiknya tidak masuk fase awal:

- Booking tiket photo studio.
- Multi-business vertical.
- Event management.
- News/CMS lengkap.
- Loyalty/community features.
- Full admin dashboard kompleks di luar produk, stok, dan verifikasi pickup.
- Integrasi shipping/kurir.
- Ongkir, alamat pengiriman, tracking resi, dan retur berbasis ekspedisi.
- Direct API DOKU custom checkout jika DOKU Checkout sandbox sudah cukup.

Jika waktu masih ada, fitur tambahan yang paling masuk akal:

- Admin CRUD produk sederhana.
- Order history untuk user.
- Payment status page.
- Pickup QR/code verification page untuk admin.
- Basic wishlist.
- Product search/filter/sort.

## Kesimpulan Konteks

Project ini adalah jembatan antara pengalaman nyata membangun Spark Stage production dan kebutuhan akademik untuk membuat sistem yang lebih fokus. Arah paling kuat adalah membuat dummy Spark Stage fashion commerce dengan visual premium seperti Prada, backend Supabase, dan payment gateway DOKU sandbox.

Kunci narasi: bukan membuat marketplace umum, tetapi membuat kanal e-commerce branded untuk bisnis fashion yang membutuhkan kontrol pengalaman, data, dan pembayaran.
