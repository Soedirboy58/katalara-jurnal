# ✅ CHECKLIST: Persiapan Akun Demo

## 1️⃣ Verifikasi Akun

### Login ke Platform
```
Email: aris.serdadu3g@gmail.com
Password: 123456
```

- [ ] Akun sudah terdaftar di Supabase Auth
- [ ] Bisa login ke aplikasi
- [ ] Dashboard muncul (walau masih kosong)
- [ ] Profile user tersimpan di tabel `user_profiles`

### Cek User ID
Di Supabase SQL Editor, jalankan:
```sql
SELECT id, email, created_at FROM auth.users 
WHERE email = 'aris.serdadu3g@gmail.com';
```

- [ ] User ID didapatkan
- [ ] Copy UUID untuk digunakan di script

---

## 2️⃣ Eksekusi Script Demo Data

### Langkah-langkah:
1. [ ] Edit file `sql/insert_demo_data_aris.sql`
2. [ ] Ganti `'YOUR_USER_ID'` dengan UUID yang benar
3. [ ] Copy seluruh isi file
4. [ ] Paste ke Supabase SQL Editor
5. [ ] Klik RUN
6. [ ] Tunggu hingga selesai (~5 detik)

### Verifikasi Output:
```
✅ 10 Customers inserted
✅ 20 Products inserted (10 services + 10 goods)
✅ 20 Income transactions inserted
✅ 15 Expense transactions inserted
✅ Product stock levels updated
✅ Customer statistics updated
```

- [ ] Semua checklist di atas muncul
- [ ] Tidak ada error message

---

## 3️⃣ Verifikasi Data di Database

Jalankan query ini di Supabase SQL Editor:

### Cek Customers
```sql
SELECT COUNT(*) as total FROM customers 
WHERE user_id = 'YOUR_USER_ID';
-- Expected: 10
```
- [ ] Total: 10 pelanggan

### Cek Products
```sql
SELECT COUNT(*) as total FROM products 
WHERE user_id = 'YOUR_USER_ID';
-- Expected: 20
```
- [ ] Total: 20 produk

### Cek Incomes
```sql
SELECT COUNT(*) as total, SUM(total_amount) as total_income 
FROM incomes WHERE user_id = 'YOUR_USER_ID';
-- Expected: 20 transaksi, Rp 362,950,000
```
- [ ] Total: 20 transaksi
- [ ] Total amount: ~362,950,000

### Cek Expenses
```sql
SELECT COUNT(*) as total, SUM(amount) as total_expense 
FROM expenses WHERE user_id = 'YOUR_USER_ID';
-- Expected: 15 transaksi, Rp 142,050,000
```
- [ ] Total: 15 transaksi
- [ ] Total amount: ~142,050,000

---

## 4️⃣ Testing di Aplikasi

### A. Dashboard Overview
Login ke aplikasi dan cek:
- [ ] Card "Total Pendapatan": Rp 362,950,000
- [ ] Card "Total Pengeluaran": Rp 142,050,000
- [ ] Card "Profit": Rp 220,900,000
- [ ] Grafik terisi data bulan November
- [ ] "Recent Transactions" menampilkan data

### B. Menu Pelanggan (`/dashboard/customers`)
- [ ] Menampilkan 10 pelanggan
- [ ] Stats card: Total Pelanggan = 10
- [ ] Stats card: Total Pembelian = Rp 362,950,000
- [ ] Search berfungsi (coba search "PT Maju")
- [ ] **Desktop**: Table view muncul
- [ ] **Mobile**: Card view muncul (TIDAK ada horizontal scroll)

### C. Menu Produk (`/dashboard/products`)
- [ ] Menampilkan 20 produk
- [ ] Filter "Semua Produk" berfungsi
- [ ] Filter "Jasa" menampilkan 10 jasa
- [ ] Filter "Barang" menampilkan 10 barang
- [ ] Stok produk benar (AC Split 1PK = 5 unit)
- [ ] Alert stok rendah: "Kabel NYM" berwarna merah (habis)
- [ ] **Desktop**: Table view dengan sorting
- [ ] **Mobile**: Card view sempurna

### D. Input Pendapatan (`/dashboard/input-income`)
- [ ] Form muncul dengan baik
- [ ] Search customer: ketik "PT Maju" → autocomplete
- [ ] Search product: ketik "AC Split" → autocomplete
- [ ] Tambah item baru berfungsi
- [ ] Hapus item berfungsi
- [ ] Total amount terhitung otomatis
- [ ] Payment method dropdown tersedia
- [ ] Payment status dropdown tersedia
- [ ] Button "Simpan" berfungsi
- [ ] **Print Modal** muncul setelah save

### E. Menu Transaksi Pendapatan (`/dashboard/incomes`)
- [ ] Menampilkan 20 transaksi
- [ ] Filter by tanggal berfungsi
- [ ] Filter by tipe pendapatan: Penjualan Langsung (8), Service (7), Proyek (5)
- [ ] Filter by payment status: Paid, Partial, Unpaid
- [ ] Search by customer name berfungsi
- [ ] Detail transaksi bisa diklik
- [ ] Print invoice individual berfungsi

### F. Input Pengeluaran (`/dashboard/input-expense`)
- [ ] Form pengeluaran muncul
- [ ] Dropdown tipe pengeluaran: Pembelian Inventory, Operasional, Biaya Proyek
- [ ] Input supplier, amount, payment method
- [ ] Kategori pengeluaran tersedia
- [ ] Button "Simpan" berfungsi

### G. Menu Transaksi Pengeluaran (`/dashboard/expenses`)
- [ ] Menampilkan 15 transaksi
- [ ] Filter by tanggal berfungsi
- [ ] Filter by tipe pengeluaran
- [ ] Total pengeluaran terhitung: Rp 142,050,000
- [ ] Search by supplier berfungsi

### H. Sync Data (`/dashboard/sync-data`)
- [ ] Banner informasi muncul
- [ ] Button "Jalankan Sinkronisasi"
- [ ] Klik button → Loading state
- [ ] Result: "0 pelanggan baru, 0 produk baru" (karena sudah ada)
- [ ] Pesan "Sudah ada di database: (skipped)" muncul

### I. Laporan (`/dashboard/reports`)
- [ ] Grafik Pendapatan vs Pengeluaran terisi
- [ ] Date range filter berfungsi
- [ ] Top 5 Products muncul
- [ ] Top 5 Customers muncul
- [ ] Export button tersedia
- [ ] Profit margin terhitung

---

## 5️⃣ Testing Integrasi Fitur

### Scenario 1: Input Pendapatan Baru
1. [ ] Buka `/dashboard/input-income`
2. [ ] Pilih customer existing: "PT Maju Bersama"
3. [ ] Tambah produk: "Service AC Split Ringan" x 5
4. [ ] Total: Rp 750,000
5. [ ] Simpan transaksi
6. [ ] Cek di `/dashboard/incomes` → transaksi baru muncul
7. [ ] Cek di `/dashboard/customers` → PT Maju Bersama total transaksi +1
8. [ ] Print invoice berfungsi

### Scenario 2: Stok Produk Update
1. [ ] Cek stok "AC Split Daikin 1 PK" (seharusnya 5 unit)
2. [ ] Buka `/dashboard/input-income`
3. [ ] Buat transaksi baru: Jual 2 unit AC Split Daikin 1 PK
4. [ ] Simpan
5. [ ] Kembali ke `/dashboard/products`
6. [ ] Cek stok AC Split Daikin 1 PK
7. [ ] **Expected**: Masih 5 (belum auto-update) - fitur auto-update stok belum ada

### Scenario 3: Customer Baru dari Sync
1. [ ] Buat transaksi pendapatan dengan customer baru: "PT Baru Jaya"
2. [ ] Phone: 08123456789
3. [ ] Simpan transaksi
4. [ ] Buka `/dashboard/sync-data`
5. [ ] Klik "Jalankan Sinkronisasi"
6. [ ] Result: "1 pelanggan baru ditambahkan"
7. [ ] Cek `/dashboard/customers` → "PT Baru Jaya" muncul

### Scenario 4: Mobile Responsiveness
1. [ ] Buka browser dev tools (F12)
2. [ ] Toggle device toolbar (Ctrl+Shift+M)
3. [ ] Pilih device: iPhone 12 Pro
4. [ ] Navigate ke `/dashboard/customers`
5. [ ] **Expected**: Card grid, TIDAK ada horizontal scroll
6. [ ] Navigate ke `/dashboard/products`
7. [ ] **Expected**: Card view sempurna
8. [ ] Test semua menu lain di mobile

### Scenario 5: Search & Filter
1. [ ] Di `/dashboard/customers`: Search "081234567803" → Hotel Grand Paradise
2. [ ] Di `/dashboard/products`: Search "Freon" → 2 produk muncul
3. [ ] Di `/dashboard/products`: Filter "Jasa" → 10 jasa muncul
4. [ ] Di `/dashboard/incomes`: Filter "Service" → 7 transaksi
5. [ ] Di `/dashboard/expenses`: Filter "Operasional" → 8 transaksi

---

## 6️⃣ Performance Check

- [ ] Halaman dashboard load < 2 detik
- [ ] List customers load < 1 detik
- [ ] List products load < 1 detik
- [ ] Search/filter responsif (< 500ms)
- [ ] Tidak ada error di browser console
- [ ] Tidak ada error di network tab

---

## 7️⃣ Data Quality Check

### Customer Data
```sql
SELECT name, total_transactions, total_spent 
FROM customers 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY total_spent DESC
LIMIT 5;
```
- [ ] Hotel Grand Paradise: 2 transaksi, Rp 57,000,000
- [ ] Pabrik Elektronik: 2 transaksi, Rp 154,800,000
- [ ] RS Sehat Sentosa: 2 transaksi, Rp 48,000,000
- [ ] Data konsisten dengan transaksi

### Product Stock
```sql
SELECT name, stock, min_stock, 
  CASE 
    WHEN stock = 0 THEN 'HABIS'
    WHEN stock <= min_stock THEN 'RENDAH'
    ELSE 'SEHAT'
  END as status
FROM products 
WHERE user_id = 'YOUR_USER_ID' AND track_inventory = true
ORDER BY stock ASC;
```
- [ ] Kabel NYM: 0 (HABIS)
- [ ] AC Split 2 PK: 2 (RENDAH)
- [ ] Status alert sesuai stok

---

## 8️⃣ Edge Cases Testing

### Test Empty State
1. [ ] Buat user baru (bukan aris.serdadu3g)
2. [ ] Login dengan user baru
3. [ ] Dashboard: Semua card = 0
4. [ ] Customers: Empty state dengan banner sync
5. [ ] Products: Empty state

### Test Large Numbers
- [ ] Angka Rp 362,950,000 format dengan benar (titik pemisah ribuan)
- [ ] Decimal tidak muncul untuk IDR
- [ ] Grafik handle angka besar dengan baik

### Test Long Text
- [ ] Notes panjang di transaksi tidak overflow
- [ ] Alamat pelanggan panjang tidak rusak layout
- [ ] Mobile: Text truncate dengan benar

---

## 9️⃣ Security Check

- [ ] Tidak bisa akses data user lain
- [ ] RLS policy berfungsi (user hanya lihat data sendiri)
- [ ] Logout berfungsi
- [ ] Session management bekerja
- [ ] API routes protected

---

## 🎯 FINAL CHECKLIST

- [ ] Semua 20 transaksi pendapatan tampil
- [ ] Semua 15 transaksi pengeluaran tampil
- [ ] Semua 10 pelanggan tampil dengan stats benar
- [ ] Semua 20 produk tampil dengan stok benar
- [ ] Dashboard overview akurat
- [ ] Mobile responsive sempurna (no horizontal scroll)
- [ ] Search & filter berfungsi semua
- [ ] Print invoice berfungsi
- [ ] Sync data berfungsi
- [ ] Tidak ada error di console
- [ ] Performa load cepat

---

## 🚨 Jika Ada Masalah

### Data Tidak Muncul
1. Hard refresh browser (Ctrl+Shift+R)
2. Cek browser console untuk error
3. Verify user_id di script benar
4. Cek RLS policies di Supabase

### Error saat Insert
1. Cek apakah user sudah terdaftar
2. Pastikan tidak ada duplicate data
3. Cek foreign key constraints
4. Lihat Supabase logs untuk detail error

### Stok Tidak Update
- **Normal**: Auto-update stok belum diimplementasi
- Stok hanya update manual atau via sync

---

## ✅ COMPLETION

Jika semua checklist di atas **PASS**, maka:

🎉 **DATA DEMO SIAP 100%**
🎉 **SEMUA FITUR TERINTEGRASI**
🎉 **READY FOR TESTING & DEMO**

---

**Next Steps:**
1. Demo ke stakeholder
2. User acceptance testing
3. Production deployment preparation
4. Documentation finalization
