# Courve API

Backend Express + Prisma untuk website Courve (sesuai tech stack di dokumen
perencanaan proyek: Node.js + Express, database relasional).

Database lokal memakai **SQLite** (file `prisma/dev.db`) karena tidak ada
PostgreSQL/Docker terpasang di lingkungan pengembangan ini — jalan tanpa
instalasi tambahan. Untuk produksi, sesuai rencana awal, pindah ke
PostgreSQL: ubah `provider` di `prisma/schema.prisma` menjadi `"postgresql"`
dan set `DATABASE_URL` ke instance Postgres (Railway/Supabase/Neon/dll),
lalu jalankan ulang `npx prisma migrate dev`.

## Menjalankan

```bash
npm install
npx prisma migrate dev --name init   # buat tabel
npm run seed                          # isi 3 produk contoh + akun admin
npm run dev                           # jalan di http://localhost:4000
```

Sebelum menjalankan server, isi `JWT_SECRET` di `.env` (wajib, minimal 32 karakter;
server menolak start jika kosong). Buat nilainya dengan:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Akun demo (development only, direset setiap `npm run seed`):

| Peran | Email | Password | Login lewat |
|---|---|---|---|
| Admin | `admin@courve.co` | `Courve!Admin2026` (atau `SEED_ADMIN_PASSWORD`) | `/admin/masuk` |
| User | `user@courve.co` | `user12345` | `/masuk` |

## Endpoint utama

Publik:
- `GET /api/products` (`?search=`, `?category=`) dan `GET /api/products/:slug` — hanya produk yang ditampilkan; tiap produk memuat `sizes` dan `stock` per ukuran
- `GET /api/uploads/:id` — foto produk yang diunggah admin (di frontend diakses lewat `/uploads/:id`)
- `POST /api/orders` — buat pesanan. Harga dihitung ulang dari database dan stok dikurangi secara atomik (dua pembeli tidak bisa mengambil stok terakhir bersamaan)

Pelanggan (token pelanggan):
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` (login ini menolak akun admin)
- `GET /api/orders/mine` — riwayat pesanan sendiri

Admin (token admin dari `POST /api/admin/auth/login`):
- `GET /api/admin/stats` — angka umum toko: total pesanan, pendapatan semua waktu, pelanggan, produk, pesanan per status, stok menipis
- `GET /api/admin/reports/sales?range=` — laporan penjualan per rentang: `1d` (24 jam, per jam), `7d` (per hari), `1m` (30 hari, per hari), `3m` (13 minggu), `6m` / `9m` / `1y` (per bulan kalender). Berisi ringkasan (pendapatan, pesanan, rata-rata, item terjual, pesanan batal), perbandingan dengan periode sebelumnya, data grafik, produk terlaris, dan jumlah pesanan per status. Hari dan bulan dihitung dalam WIB (UTC+7). Pesanan batal tidak dihitung sebagai pendapatan.
- `GET /api/admin/reports/sales.csv?range=` — unduh pesanan pada rentang itu sebagai CSV (UTF-8 dengan BOM untuk Excel; sel berawalan `=`, `+`, `-`, `@` dinetralkan agar tidak dijalankan sebagai rumus)
- `GET /api/admin/products` — semua produk termasuk yang disembunyikan
- `POST /api/products`, `PUT /api/products/:slug`, `DELETE /api/products/:slug` — kelola produk (nama, harga, kategori, bahan, stok per ukuran, foto, tampil/sembunyi)
- `POST /api/admin/uploads` — unggah foto (body = isi gambar JPG/PNG/WebP, maks 3 MB; isi file diperiksa, SVG ditolak)
- `GET /api/orders` (`?status=`, `?q=`, `?page=`, `?pageSize=`) — daftar pesanan dengan pencarian, filter, pagination, dan jumlah per status
- `PATCH /api/orders/:orderNumber/status` — alur status: PENDING → PAID → SHIPPED → COMPLETED; PENDING/PAID bisa → CANCELLED (stok dikembalikan); COMPLETED & CANCELLED final
- `GET /api/admin/users`, `PATCH /api/admin/users/:id` — daftar pelanggan (jumlah pesanan, total belanja) dan aktif/nonaktifkan akun

Frontend Next.js membaca `NEXT_PUBLIC_API_URL` (lihat `.env.local` di root
proyek) untuk memanggil API ini.

## Keamanan

- Login admin dan pelanggan terpisah; akun yang salah pintu ditolak dengan pesan yang sama seperti password salah.
- Token punya `scope` (`user` / `admin`). Token admin tidak bisa dipakai belanja, token pelanggan tidak bisa mengakses endpoint admin.
- Setiap request admin memeriksa ulang peran ke database, jadi mencabut/menghapus admin langsung berlaku walau token belum kedaluwarsa.
- Token admin berlaku 8 jam (disimpan di `sessionStorage` frontend), token pelanggan 7 hari.
- Pendaftaran publik hanya membuat akun pelanggan; password minimal 8 karakter.
- Foto produk disimpan di database (tabel `Upload`), jadi tetap ada di hosting dengan disk sementara. Foto yang dilepas dari produk atau produknya dihapus ikut dibersihkan.
- Percobaan login gagal dibatasi (5x per akun per IP, 15 menit; admin juga dibatasi per IP). Penghitung disimpan di memori server, jadi reset saat server restart dan hanya cocok untuk satu instance.
- Untuk produksi: pakai HTTPS, `JWT_SECRET` unik, ganti semua password demo, dan pertimbangkan cookie `httpOnly` menggantikan penyimpanan token di browser.
