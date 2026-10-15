# V_R STORE — WEBSITE KATALOG TOKO & SISTEM MANAJEMEN KEUANGAN BRILINK

Sistem aplikasi web modern untuk **V_R Store** yang menggabungkan dua fungsi esensial:
1. **Katalog Publik Pelanggan**: Menyediakan etalase produk toko (ATK, perlengkapan sekolah, cetak dokumen, aksesoris gawai, parfum) beserta 11 kartu layanan unggulan, pencarian cerdas, filter kelompok barang, informasi kontak, dan lokasi Google Maps.
2. **Dashboard Owner & Keuangan BRILink**: Panel manajemen terpadu untuk pengelolaan produk (CRUD + upload foto), pencatatan modal masuk, lembar kerja transaksi harian BRILink gaya spreadsheet Excel dengan formula mandiri, pembagian dividen investor (0,5% per bulan penuh), laporan tahunan 12 bulan dengan grafik komparasi, serta ekspor file Excel (`.xlsx`) dan PDF (`.pdf`).

---

## 🚀 Teknologi Utama

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/) dengan TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) dengan palet warna hijau emerald, putih bersih, dan aksen oranye/amber
- **Database & Autentikasi**: [Supabase](https://supabase.com/) (PostgreSQL relasional, Row Level Security, Supabase Auth, Storage)
- **Visualisasi & Grafik**: [Recharts](https://recharts.org/)
- **Ekspor Dokumen**: [SheetJS (xlsx)](https://sheetjs.com/) dan [jsPDF + AutoTable](https://github.com/parallax/jsPDF)
- **Ikon**: [Lucide React](https://lucide.dev/)
- **Zona Waktu**: Asia/Makassar (WITA)
- **Mata Uang**: Rupiah (IDR), diformat sesuai standar perbankan Indonesia (misal: `Rp10.000`)

---

## 📁 Struktur Direktori Proyek

```text
V_R Store/
├── src/
│   ├── app/
│   │   ├── (public)/                 # Halaman Publik Pelanggan
│   │   │   ├── layout.tsx            # Header & Footer publik
│   │   │   ├── page.tsx              # Dashboard Pelanggan & 11 Layanan
│   │   │   ├── barang/page.tsx       # Katalog Produk, Pencarian & Filter
│   │   │   ├── alamat/page.tsx       # Alamat, Jam Buka & Google Maps
│   │   │   └── login/page.tsx        # Portal Masuk Khusus Owner
│   │   ├── admin/                    # Panel Manajemen Owner Terproteksi
│   │   │   ├── layout.tsx            # Admin Sidebar & Header
│   │   │   ├── page.tsx              # Dashboard Owner & Statistik Riil
│   │   │   ├── barang/page.tsx       # CRUD Produk, Kategori & Upload Foto
│   │   │   ├── brilink/
│   │   │   │   ├── modal/page.tsx    # Pencatatan Pemasukan Modal
│   │   │   │   ├── transaksi/page.tsx# Lembar Kerja Transaksi Harian Excel-Style
│   │   │   │   ├── dividen/page.tsx  # Dividen Investor (Bulan Penuh 0,5%)
│   │   │   │   └── tahunan/page.tsx  # Rekap 12 Bulan, Grafik & Ekspor
│   │   │   └── pengaturan/page.tsx   # Pengaturan Identitas & Profil Toko
│   │   ├── globals.css               # Styling global & scrollbar Excel
│   │   └── layout.tsx                # Root layout
│   ├── components/
│   │   ├── public/                   # Navbar & Footer publik
│   │   └── admin/                    # Sidebar & Header admin
│   └── lib/
│       ├── services/dataService.ts   # Layer data terpusat (Supabase + Local State Fallback)
│       ├── supabase/client.ts        # Client Supabase browser
│       ├── types/database.ts         # Definisi interface TypeScript
│       └── utils/                    # Helper format rupiah, tanggal WITA, rumus keuangan, ekspor Excel & PDF
├── supabase/
│   └── migrations/
│       └── 20261014_vr_store_init.sql# Skema lengkap PostgreSQL, RLS, & seed kategori
├── .env.example                      # Contoh konfigurasi Supabase
├── .env.local                        # Konfigurasi lokal
├── tailwind.config.ts                # Konfigurasi warna & tema
├── tsconfig.json                     # Konfigurasi TypeScript
└── package.json                      # Dependensi proyek
```

---

## ⚙️ Langkah Instalasi & Menjalankan Proyek

### 1. Instal Dependensi
Pastikan Node.js (versi 18 ke atas) sudah terpasang. Jalankan perintah di terminal:

```bash
npm install --legacy-peer-deps
```

### 2. Jalankan Server Development
```bash
npm run dev
```
Buka browser dan akses [http://localhost:3000](http://localhost:3000). Website langsung siap digunakan!

---

## 🗄️ Konfigurasi Supabase (Database & Autentikasi Cloud)

Aplikasi V_R Store dilengkapi dengan **Adapter Data Cerdas**:
- Jika kredensial Supabase di `.env.local` belum diisi, aplikasi tetap dapat dijalankan dan diuji menggunakan **Persistent Local Store** yang aman.
- Untuk menghubungkan ke database cloud Supabase, ikuti langkah berikut:

### 1. Buat Proyek di [Supabase.com](https://supabase.com/)
1. Masuk ke dashboard Supabase dan buat proyek baru (misal: `vr-store-db`).
2. Salin **Project URL** dan **Anon API Key** dari menu **Project Settings > API**.

### 2. Isi Variabel Lingkungan di `.env.local`
Buka file `.env.local` dan masukkan kredensial:
```env
NEXT_PUBLIC_SUPABASE_URL=https://proyek-anda.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Eksekusi Skema Database SQL
1. Buka menu **SQL Editor** di dashboard Supabase.
2. Salin seluruh isi file [`supabase/migrations/20261014_vr_store_init.sql`](./supabase/migrations/20261014_vr_store_init.sql).
3. Jalankan (**Run**). Seluruh tabel, constraint unik, tipe data `NUMERIC`, Row Level Security (RLS), dan kategori default akan terbuat otomatis.

### 4. Buat Akun Owner Pertama Kali
1. Buka menu **Authentication > Users** di dashboard Supabase.
2. Klik **Add user** > **Create user**.
3. Masukkan email owner (misal: `owner@vrstore.com`) dan buat kata sandi yang kuat.
4. Akun tersebut langsung dapat digunakan untuk masuk melalui halaman `/login`.

---

## 📊 Ketentuan Rumus & Logika Finansial V_R Store

### A. Transaksi Harian BRILink (Excel Spreadsheet Style)
- Setiap baris mewakili **1 tanggal transaksi**.
- **Rumus Pendapatan Hari Ini**:
  $$\text{Pendapatan Hari Ini} = \text{Tunai} + \text{BRIMO} + \text{Payfazz} + \text{Brilian} + \text{Catatan Utang} - \text{Modal Hari Ini} - \text{Uang Nasabah}$$
- Murni dihitung otomatis per baris secara mandiri tanpa mengambil tanggal lain.
- **Pendapatan Bulanan**: Penjumlahan seluruh nilai `Pendapatan Hari Ini` dalam periode bulan terpilih.
- Baris bawah tabel menampilkan jumlah total masing-masing kolom operasional.

### B. Dividen & Komisi Investasi (Bulan Penuh)
- Komisi dihitung berdasarkan **bulan penuh**, bukan harian.
- **Rumus Komisi 1 Bulan Penuh**:
  $$\text{Komisi Bulanan} = \text{Pokok Investasi} \times 0{,}5\% \quad (\text{Pokok} \times 0{,}005)$$
- Jika belum mencapai 1 bulan penuh sejak tanggal masuk, komisi periode tersebut adalah **Rp0**.
- Setelah 1 bulan penuh tercapai (misal tgl 15 ke tgl 15 bulan berikutnya), komisi diakui 1 kali.
- Pokok investasi dipisahkan secara ketat dari pendapatan toko.

### C. Laporan Tahunan (3 Pilar Terpisah)
- Menjumlahkan hasil bulanan tanpa duplikasi:
  1. **Modal Masuk**: Akumulasi dana modal yang disetor.
  2. **Pendapatan Transaksi**: Laba bersih dari transaksi harian.
  3. **Komisi Dividen**: Hak investor dari hasil bagi hasil per bulan penuh.
- Ketiga komponen di atas tidak pernah dicampur aduk.

---

## 📥 Fitur Ekspor Dokumen
- **Ekspor Excel (`.xlsx`)**: Menghasilkan spreadsheet lengkap dengan baris total, siap diolah di Microsoft Excel / Google Sheets.
- **Ekspor PDF (`.pdf`)**: Menghasilkan dokumen A4 rapi dengan kop resmi toko, penomoran, format Rupiah, dan border tabel proporsional.

---

## 🛡️ Hak Akses & Keamanan
- Halaman publik (`/`, `/barang`, `/alamat`) dapat diakses langsung oleh masyarakat.
- Seluruh halaman manajemen (`/admin/*`) dilindungi oleh pengecekan sesi autentikasi.
- Tidak ada form pendaftaran publik di halaman login; akun Owner hanya dibuat secara terpusat oleh administrator.
