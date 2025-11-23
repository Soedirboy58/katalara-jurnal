# 🎯 PANDUAN INSERT DEMO DATA

## Data yang Akan Dibuat

### 📊 Ringkasan Data
- **10 Pelanggan** dengan profil lengkap (PT, CV, Hotel, RS, Mall, Apartemen, Pabrik, Restoran, Gedung, Pribadi)
- **20 Produk HVAC** (10 Jasa + 10 Barang)
- **20 Transaksi Pendapatan** dari 3 model:
  - 8 Penjualan Langsung
  - 7 Service/Maintenance
  - 5 Proyek/Kontrak
- **15 Transaksi Pengeluaran** dari 3 model:
  - 5 Pembelian Inventory
  - 8 Operasional
  - 2 Biaya Proyek

### 💰 Total Transaksi
- **Total Pendapatan**: Rp 362,950,000
- **Total Pengeluaran**: Rp 142,050,000
- **Profit Bersih**: Rp 220,900,000

---

## 📝 CARA PENGGUNAAN

### Langkah 1: Login ke Supabase Dashboard
1. Buka https://supabase.com/dashboard
2. Pilih project Katalara
3. Klik **SQL Editor** di menu sebelah kiri

### Langkah 2: Dapatkan User ID
Jalankan query ini terlebih dahulu:

```sql
SELECT id, email FROM auth.users WHERE email = 'aris.serdadu3g@gmail.com';
```

**Copy UUID** yang muncul (contoh: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

### Langkah 3: Edit File SQL
1. Buka file: `katalara-nextjs/sql/insert_demo_data_aris.sql`
2. **CARI** baris ini di line 15:
   ```sql
   v_user_id UUID := 'YOUR_USER_ID'; -- REPLACE WITH ACTUAL USER ID
   ```
3. **GANTI** `'YOUR_USER_ID'` dengan UUID yang sudah di-copy
   Contoh hasil:
   ```sql
   v_user_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
   ```
4. **SAVE** file

### Langkah 4: Jalankan Script
1. Kembali ke **Supabase SQL Editor**
2. Copy **SELURUH ISI** file `insert_demo_data_aris.sql` yang sudah diedit
3. Paste ke SQL Editor
4. Klik **RUN** atau tekan `Ctrl+Enter`

### Langkah 5: Verifikasi
Jika berhasil, akan muncul pesan:
```
✅ 10 Customers inserted
✅ 20 Products inserted (10 services + 10 goods)
✅ 20 Income transactions inserted
✅ 15 Expense transactions inserted
✅ Product stock levels updated
✅ Customer statistics updated
```

---

## 🎨 DATA DEMO YANG DIBUAT

### 👥 10 PELANGGAN

1. **PT Maju Bersama** - Perusahaan kantor
2. **CV Sejahtera Abadi** - Perusahaan trading
3. **Hotel Grand Paradise** - Hospitality
4. **RS Sehat Sentosa** - Healthcare
5. **Mall Central Plaza** - Retail/Mall
6. **Apartemen Green View** - Property
7. **Pabrik Elektronik Nusantara** - Manufacturing
8. **Restoran Seafood King** - F&B
9. **Gedung Perkantoran Plaza 88** - Office building
10. **Ibu Siti Rumah Pribadi** - Residential

### 🛠️ 10 JASA HVAC

1. Instalasi AC Split 1 PK - Rp 500,000
2. Instalasi AC Split 2 PK - Rp 700,000
3. Service AC Split Ringan - Rp 150,000
4. Service AC Split Berat - Rp 300,000
5. Instalasi Ducting AC Central - Rp 450,000/meter
6. Maintenance AC Rutin Bulanan - Rp 200,000
7. Perbaikan Kompresor AC - Rp 1,500,000
8. Isi Freon R32 - Rp 200,000/kg
9. Isi Freon R410A - Rp 300,000/kg
10. Konsultasi Sistem HVAC - Rp 1,000,000

### 📦 10 BARANG HVAC

1. AC Split Daikin 1 PK - Rp 4,500,000 (Stok: 5 unit)
2. AC Split Daikin 2 PK - Rp 7,000,000 (Stok: 2 unit)
3. AC Cassette Daikin 3 PK - Rp 15,000,000 (Stok: 2 unit)
4. Pipa Tembaga 1/4 inch - Rp 120,000/meter (Stok: 20 meter)
5. Pipa Tembaga 3/8 inch - Rp 180,000/meter (Stok: 10 meter)
6. Freon R32 1kg - Rp 400,000 (Stok: 10 kg)
7. Freon R410A 1kg - Rp 550,000 (Stok: 5 kg)
8. Remote AC Universal - Rp 100,000 (Stok: 28 pcs)
9. Filter AC Washable - Rp 60,000 (Stok: 15 pcs)
10. Kabel NYM 2x1.5mm - Rp 25,000/meter (Stok: HABIS - untuk test alert)

### 💵 HIGHLIGHTS TRANSAKSI PENDAPATAN

**Terbesar:**
- Hotel Grand Paradise: Rp 45,000,000 (Instalasi 10 AC Cassette)
- Pabrik Elektronik: Rp 150,000,000 (DP Proyek instalasi AC pabrik)
- RS Sehat Sentosa: Rp 45,000,000 (DP Renovasi sistem AC)

**Recurring:**
- Apartemen Green View: Kontrak maintenance 30 unit/bulan
- Hotel Grand Paradise: Kontrak maintenance tahunan

**Retail:**
- Ibu Siti: Rp 5,200,000 (Instalasi AC rumah)
- Restoran Seafood King: Service & instalasi

### 💸 HIGHLIGHTS TRANSAKSI PENGELUARAN

**Pembelian Stok:**
- AC Daikin: Rp 62,500,000
- Freon: Rp 7,250,000
- Material: Rp 8,000,000

**Operasional:**
- Gaji Teknisi: Rp 15,000,000
- BBM: Rp 2,500,000
- Tools: Rp 3,500,000

**Subkon:**
- Tim Instalasi Pro: Rp 33,000,000

---

## 🔗 INTEGRASI DATA

### ✅ Data Terintegrasi Sempurna

1. **Dashboard → Pendapatan**
   - 20 transaksi akan muncul di halaman Input Pendapatan
   - Filter by type: Penjualan Langsung, Service, Proyek
   - Total: Rp 362,950,000

2. **Dashboard → Pengeluaran**
   - 15 transaksi akan muncul di halaman Pengeluaran
   - Filter by type: Pembelian Inventory, Operasional, Biaya Proyek
   - Total: Rp 142,050,000

3. **Dashboard → Pelanggan**
   - 10 pelanggan dengan data transaksi terupdate
   - Total pembelian per pelanggan sudah dihitung
   - Jumlah transaksi per pelanggan tercatat

4. **Dashboard → Produk**
   - 20 produk (10 service + 10 product)
   - Stok barang updated sesuai penjualan
   - Alert stok minimum aktif (Kabel NYM habis)

5. **Dashboard → Laporan**
   - Grafik pendapatan vs pengeluaran terisi
   - Top products akan muncul
   - Top customers akan muncul
   - Profit margin per bulan terhitung

6. **Sync Data**
   - Jika dijalankan lagi, akan skip (karena data sudah ada)
   - Customer dari transaksi pendapatan sudah match

---

## 🧪 SKENARIO TESTING

### Test 1: Cek Dashboard Overview
✅ Total pendapatan: Rp 362,950,000
✅ Total pengeluaran: Rp 142,050,000
✅ Profit: Rp 220,900,000
✅ Grafik trend terisi

### Test 2: Cek List Pelanggan
✅ 10 pelanggan muncul
✅ Total transaksi masing-masing pelanggan benar
✅ Search pelanggan by nama/phone
✅ Mobile view: card layout (bukan horizontal scroll)

### Test 3: Cek List Produk
✅ 20 produk muncul (10 jasa + 10 barang)
✅ Stok barang update
✅ Alert "Kabel NYM" habis stok (merah)
✅ Filter by kategori
✅ Mobile view: card layout sempurna

### Test 4: Input Pendapatan Baru
✅ Search customer "PT Maju Bersama" → autocomplete
✅ Search product "Service AC" → autocomplete
✅ Multi items berfungsi
✅ Print invoice button
✅ Payment method selection

### Test 5: Laporan
✅ Filter by date range
✅ Export PDF/Excel
✅ Grafik terisi data
✅ Top 5 products muncul
✅ Top 5 customers muncul

### Test 6: Sync Data
✅ Jalankan sync → "0 pelanggan baru" (sudah ada)
✅ "0 produk baru" (sudah ada)

---

## 🚀 CARA RESET DATA (Jika Perlu)

Jika ingin **mulai dari awal**, jalankan query ini di Supabase SQL Editor:

```sql
-- HATI-HATI! Ini akan HAPUS SEMUA data user ini
DELETE FROM incomes WHERE user_id = 'YOUR_USER_ID';
DELETE FROM expenses WHERE user_id = 'YOUR_USER_ID';
DELETE FROM customers WHERE user_id = 'YOUR_USER_ID';
DELETE FROM products WHERE user_id = 'YOUR_USER_ID';
```

Lalu jalankan ulang script insert demo data.

---

## 📞 SUPPORT

Jika ada error atau data tidak muncul:

1. **Cek User ID** - Pastikan UUID benar
2. **Cek RLS Policies** - Pastikan policy `user_id = auth.uid()` aktif
3. **Refresh Browser** - Hard refresh (Ctrl+Shift+R)
4. **Cek Console** - Lihat error di browser console
5. **Cek Supabase Logs** - Lihat di Supabase Dashboard → Logs

---

## ✨ FITUR YANG BISA DITEST

### ✅ Dashboard
- Overview cards (total pendapatan, pengeluaran, profit)
- Grafik trend bulanan
- Top 5 products
- Top 5 customers
- Recent transactions

### ✅ Input Pendapatan
- Multi-items invoice
- Customer autocomplete
- Product autocomplete
- Payment method: Cash, Transfer, Tempo
- Payment status: Paid, Partial, Unpaid
- Print invoice modal
- 3 tipe pendapatan: Penjualan Langsung, Service, Proyek

### ✅ Input Pengeluaran
- Form pengeluaran
- 3 tipe pengeluaran: Pembelian Inventory, Operasional, Biaya Proyek
- Kategori pengeluaran
- Supplier tracking

### ✅ List Pelanggan
- 10 pelanggan dengan data lengkap
- Stats: total transaksi, total pembelian
- Search by nama/phone/email
- **Mobile responsive**: Card view (TIDAK ada horizontal scroll)
- Desktop: Table view profesional

### ✅ List Produk
- 20 produk (10 jasa + 10 barang)
- Filter by kategori
- Stock alert (merah/kuning/hijau)
- Search by nama produk
- **Mobile responsive**: Card view sempurna
- Desktop: Table view dengan sorting

### ✅ Sync Data
- Extract customer dari transaksi pendapatan
- Extract product dari line_items
- Deduplikasi otomatis
- Skip data yang sudah ada

### ✅ Laporan
- Filter by date range
- Pendapatan vs Pengeluaran chart
- Profit margin
- Export data
- Top performing products/customers

---

## 🎉 SELAMAT!

Data demo siap digunakan untuk testing semua fitur platform Katalara! 🚀
