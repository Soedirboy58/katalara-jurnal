# 🔧 Panduan Perbaikan Suppliers & Customers

## 🚨 Masalah yang Ditemukan

Dari screenshot error console:

### 1. **Supplier Error**
```
Could not find the 'owner_id' column of 'suppliers' in the schema cache
```
**Root Cause**: Database masih pakai kolom `user_id`, tapi kode sudah pakai `owner_id`

### 2. **Customer Error**
```
Error adding customer: Terjadi kesalahan saat menambahkan pelanggan
POST /api/customers - 405 (Method Not Allowed)
```
**Root Cause**: API `/api/customers` tidak punya POST method

---

## ✅ Perbaikan yang Sudah Dilakukan

### 1. **API Customers - Ditambahkan Methods**
File: `src/app/api/customers/route.ts`

**Sebelum**: ❌ Hanya GET
**Sesudah**: ✅ GET + POST + PATCH + DELETE

Sekarang CustomerModal bisa:
- ✅ Fetch customers (GET)
- ✅ Add new customer (POST)
- ✅ Update customer (PATCH)
- ✅ Delete customer (DELETE)

### 2. **Migration Script Created**
File: `sql/migrations/fix_suppliers_customers_owner_id.sql`

Script ini akan:
- 🔄 Rename `user_id` → `owner_id` (jika ada)
- ➕ Add `owner_id` column (jika belum ada)
- 🔒 Set NOT NULL constraint
- 📑 Fix indexes
- 🔄 Reload PostgREST schema cache

---

## 📋 Langkah-langkah Perbaikan

### **LANGKAH 1: Diagnostik Dulu**

Jalankan query ini di **Supabase SQL Editor** untuk cek kondisi saat ini:

```sql
-- File: sql/diagnostics/check_suppliers_customers_columns.sql
SELECT 
  'SUPPLIERS' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'suppliers'
  AND column_name IN ('id', 'user_id', 'owner_id', 'name');

SELECT 
  'CUSTOMERS' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'customers'
  AND column_name IN ('id', 'user_id', 'owner_id', 'name');
```

**Hasil yang Diharapkan:**
- ✅ Jika ada `user_id` → perlu rename
- ✅ Jika sudah `owner_id` → sudah benar, mungkin cache issue
- ❌ Jika tidak ada keduanya → ada masalah serius

---

### **LANGKAH 2: Jalankan Migration**

Copy **seluruh isi** file `sql/migrations/fix_suppliers_customers_owner_id.sql` dan paste ke **Supabase SQL Editor**, lalu **RUN**.

Script akan otomatis:
1. Cek kondisi saat ini
2. Perbaiki struktur
3. Reload schema cache
4. Tampilkan summary hasil

**Output yang Diharapkan:**
```
========================================
MIGRATION SUMMARY
========================================
✅ suppliers.owner_id = READY
✅ customers.owner_id = READY
========================================

🔄 Please refresh your browser to clear cache
📝 PostgREST schema has been reloaded
```

---

### **LANGKAH 3: Clear Cache Browser**

Setelah migration berhasil:

1. **Hard Refresh** browser:
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. Atau **Clear Cache** manual:
   - Buka DevTools (F12)
   - Klik kanan tombol Refresh
   - Pilih "Empty Cache and Hard Reload"

3. **Logout & Login** ulang di aplikasi

---

### **LANGKAH 4: Test Ulang**

#### Test Customer Modal:
1. Buka halaman Input Pendapatan
2. Klik "Tambah Pelanggan Baru"
3. Isi form:
   - Nama: `Test Pelanggan`
   - Phone/Email: (optional)
4. Klik "Simpan Pelanggan"
5. **Harusnya**: ✅ Tersimpan tanpa error

#### Test Supplier Modal:
1. Buka halaman Input Pengeluaran
2. Klik "Tambah Supplier Baru"
3. Isi form:
   - Nama: `Test Supplier`
   - Tipe: Pilih salah satu
   - Phone/Email: (optional)
4. Klik "Simpan Supplier"
5. **Harusnya**: ✅ Tersimpan tanpa error

---

## 🔍 Troubleshooting

### Jika Masih Error Setelah Migration:

#### **Error: "owner_id not found in schema cache"**

**Solusi A: Restart PostgREST**
```sql
-- Jalankan di SQL Editor:
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
```

**Solusi B: Restart Supabase Project**
- Buka Supabase Dashboard
- Project Settings → Database → "Restart Database"
- Tunggu 1-2 menit

**Solusi C: Manual Verify**
```sql
-- Cek apakah kolom benar-benar ada
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'suppliers' 
  AND column_name = 'owner_id';
```

---

#### **Error: "Method Not Allowed" masih muncul**

**Kemungkinan penyebab:**
1. Code belum ter-deploy
2. Dev server belum restart

**Solusi:**
```bash
# Stop development server (Ctrl + C)
# Restart
cd katalara-nextjs
npm run dev
```

---

#### **Error: "column does not exist"**

Jika migration gagal, manual fix:

```sql
-- Check current structure
\d suppliers;
\d customers;

-- Manual rename jika perlu
ALTER TABLE suppliers RENAME COLUMN user_id TO owner_id;
ALTER TABLE customers RENAME COLUMN user_id TO owner_id;

-- Reload
NOTIFY pgrst, 'reload schema';
```

---

## 📊 Verification Checklist

Setelah semua langkah dilakukan, pastikan:

- [ ] Query diagnostic berhasil dan tampilkan `owner_id`
- [ ] Migration script selesai tanpa error
- [ ] Browser cache sudah di-clear
- [ ] Dev server sudah restart
- [ ] Customer Modal bisa simpan data baru
- [ ] Supplier Modal bisa simpan data baru
- [ ] Console browser tidak ada error merah
- [ ] Data tersimpan di Supabase Table Editor

---

## 🎯 Summary

| Item | Sebelum | Sesudah |
|------|---------|---------|
| **API Customers** | ❌ GET only | ✅ GET + POST + PATCH + DELETE |
| **API Suppliers** | ⚠️ Pakai `owner_id` | ✅ Konsisten `owner_id` |
| **DB Suppliers** | ❌ Pakai `user_id` | ✅ Pakai `owner_id` |
| **DB Customers** | ❌ Pakai `user_id` | ✅ Pakai `owner_id` |
| **Schema Cache** | ❌ Outdated | ✅ Reloaded |

---

## 🆘 Jika Masih Gagal

Kirim screenshot dari:
1. Output query diagnostik
2. Output migration script
3. Error di console browser
4. Error di Network tab (F12 → Network)

Untuk analisa lebih lanjut.
