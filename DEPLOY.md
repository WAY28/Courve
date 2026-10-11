# Panduan hosting gratis Courve

Susunan: **Vercel** (web Next.js) + **Render** (API Express) + **Neon** (database PostgreSQL).
Semua punya paket gratis, tetapi masing-masing perlu akunmu. Total waktu sekitar 30 menit.

```
Pembeli -> Vercel (web) -> Render (API) -> Neon (PostgreSQL)
```

## 0. Siapkan akun
Daftar dengan GitHub di: github.com, neon.tech, render.com, vercel.com.

## 1. Taruh kode di GitHub (repo private)
Di folder proyek (yang berisi `package.json` dan folder `server`):

```bash
git init
git add .
git commit -m "Courve"
git branch -M main
git remote add origin https://github.com/USERNAME/courve.git
git push -u origin main
```

Buat repo kosong **private** di GitHub dulu (tanpa README). File `.env*` sudah di-ignore, jadi
password dan kunci tidak ikut terunggah. Cek sekali di GitHub bahwa tidak ada file `.env`.

## 2. Database di Neon
1. Buat project baru, pilih region terdekat (Singapore).
2. Di **Connection Details**, **matikan** toggle "Pooled connection", lalu salin connection string
   (`postgresql://...neon.tech/neondb?sslmode=require`). Ini nilai `DATABASE_URL`.

## 3. API di Render
1. **New > Blueprint**, pilih repo `courve`. Render membaca `render.yaml`.
2. Isi variabel yang diminta:
   | Variabel | Isi |
   |---|---|
   | `DATABASE_URL` | connection string Neon dari langkah 2 |
   | `FRONTEND_URL` | isi sementara `https://courve.vercel.app`, **ganti** setelah langkah 4 |
   | `ADMIN_EMAIL` | email admin pertama |
   | `ADMIN_PASSWORD` | password admin, **minimal 12 karakter** |
   `JWT_SECRET` dibuat otomatis. `TRUST_PROXY` sudah diisi.
3. Tunggu deploy selesai. Buka `https://NAMA-API.onrender.com/api/health/db`, harus `{"status":"ok"}`.
   Saat start pertama, tabel dibuat otomatis, admin dibuat, dan 3 produk contoh dimuat.

## 4. Web di Vercel
1. **Add New > Project**, pilih repo yang sama. Root Directory biarkan root proyek.
2. Environment Variables: `NEXT_PUBLIC_API_URL` = alamat API Render (tanpa garis miring di akhir).
   Variabel ini dibaca saat **build**, jadi isi **sebelum** menekan Deploy.
3. Deploy. Catat alamat webnya, misal `https://courve-xxx.vercel.app`.
4. Kembali ke Render > `courve-api` > Environment, ubah `FRONTEND_URL` ke alamat Vercel tadi
   (persis, tanpa garis miring), lalu simpan. Render akan deploy ulang.

## 5. Setelah online
1. Buka `https://ALAMAT-VERCEL/admin/masuk`, masuk dengan `ADMIN_EMAIL` dan `ADMIN_PASSWORD`.
2. **Hapus `ADMIN_PASSWORD`** dari Environment Render (hanya dipakai saat admin pertama dibuat).
3. Di **Admin > Pengaturan**, isi nomor WhatsApp toko.
4. Di **Admin > Produk**, ubah stok dan foto produk sesuai kondisi asli.

## 6. Agar API tidak "tertidur" (opsional)
Render gratis tidur setelah 15 menit tanpa kunjungan dan butuh sekitar 1 menit untuk bangun. Pengunjung
pertama bisa melihat halaman kosong/lambat. Solusinya ping gratis tiap 5 menit, misalnya UptimeRobot,
ke `https://NAMA-API.onrender.com/api/health`. Pakai alamat itu, **bukan** `/api/health/db`, supaya
database Neon tetap boleh tidur dan jam komputasi gratisnya tidak habis.

## Batasan paket gratis
- **Vercel Hobby hanya untuk non-komersial.** Aman untuk tugas kuliah dan demo. Kalau toko mulai
  berjualan sungguhan, pindahkan web ke hosting yang mengizinkan penggunaan komersial.
- **Render gratis**: tidur saat sepi (lihat bagian 6) dan disk sementara. Karena itu foto produk
  disimpan di database, bukan di disk.
- **Neon gratis**: tidur otomatis saat sepi (permintaan pertama sedikit lebih lambat) dan kuota
  penyimpanan kecil. Foto produk maksimal 3 MB, kompres dulu agar muat banyak.
- Batas login dan rate limit disimpan di memori, jadi ter-reset saat API restart.

## Update berikutnya
Cukup `git push`. Vercel dan Render deploy ulang otomatis. Perubahan skema database diterapkan
saat API start (`prisma db push`); perubahan yang berpotensi menghapus data akan ditolak, jadi
tangani manual lewat Neon.

## Menjalankan lokal (tetap pakai SQLite)
```bash
cd server && npm run dev      # API :4000
npm run build && npm start    # web :3000
```
