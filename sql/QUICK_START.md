# 🚀 QUICK START: Demo Data Setup

## ⚡ 3 Langkah Cepat

### 1. Dapatkan User ID
```sql
-- Jalankan di Supabase SQL Editor
SELECT id FROM auth.users WHERE email = 'aris.serdadu3g@gmail.com';
```
**Copy UUID yang muncul**

### 2. Edit & Jalankan Script
1. Buka `sql/insert_demo_data_aris.sql`
2. Line 15: Ganti `'YOUR_USER_ID'` dengan UUID tadi
3. Copy seluruh isi file
4. Paste ke Supabase SQL Editor
5. Klik **RUN**

### 3. Refresh Browser
- Login ke app sebagai `aris.serdadu3g@gmail.com`
- Password: `123456`
- **Hard refresh**: `Ctrl+Shift+R`

## ✅ Hasil

- ✅ 10 Pelanggan HVAC (PT, Hotel, RS, Mall, dll)
- ✅ 20 Produk (10 Jasa + 10 Barang)
- ✅ 20 Transaksi Pendapatan (Rp 362,950,000)
- ✅ 15 Transaksi Pengeluaran (Rp 142,050,000)
- ✅ Profit: Rp 220,900,000
- ✅ Semua data saling terintegrasi

## 📖 Dokumentasi Lengkap

- **README Detail**: `sql/DEMO_DATA_README.md`
- **Testing Checklist**: `sql/TESTING_CHECKLIST.md`

## 🎯 Test Cepat

1. Dashboard → Lihat overview cards & grafik
2. Pelanggan → 10 pelanggan muncul (mobile: card view)
3. Produk → 20 produk muncul (alert stok Kabel NYM habis)
4. Input Pendapatan → Search "PT Maju" → Autocomplete
5. Sync Data → Klik sync → "0 baru" (already synced)

**Done! 🎉**
