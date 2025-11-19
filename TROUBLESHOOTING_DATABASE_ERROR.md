# 🔧 FIX ERROR 500 & 409 - Database Schema Issue

## 📋 Masalah yang Terjadi

Saat submit form business info, muncul error:
```
GET /rest/v1/user_profiles?select=id&user_id=eq.xxx 500 (Internal Server Error)
POST /rest/v1/user_profiles 409 (Conflict)
```

## 🔍 Penyebab

1. **Error 500**: Kolom baru (`kecamatan`, `kabupaten`, `provinsi`, `business_start_year`, `business_type`, `number_of_employees`) **belum ditambahkan ke database Supabase**
2. **Error 409**: Data user sudah ada di database (duplicate key), tapi dengan schema lama yang tidak lengkap

## ✅ Solusi

### Opsi 1: Jalankan SQL Migration (RECOMMENDED) ⭐

1. Buka **Supabase Dashboard**: https://supabase.com/dashboard
2. Pilih project Anda
3. Klik **SQL Editor** di sidebar kiri
4. Copy paste script dari file `sql/FIX_DATABASE_SCHEMA.sql` atau script di bawah:

```sql
-- Tambah kolom yang missing
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS kecamatan TEXT,
ADD COLUMN IF NOT EXISTS kabupaten TEXT,
ADD COLUMN IF NOT EXISTS provinsi TEXT,
ADD COLUMN IF NOT EXISTS business_start_year INT,
ADD COLUMN IF NOT EXISTS business_type TEXT CHECK (business_type IN ('perorangan', 'cv', 'pt', 'koperasi', 'lainnya')),
ADD COLUMN IF NOT EXISTS number_of_employees TEXT CHECK (number_of_employees IN ('1-5', '6-20', '21-50', '51-100', '100+'));

-- Verify kolom sudah ada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;
```

5. Klik **Run** (atau tekan Ctrl+Enter)
6. Refresh halaman registration dan test lagi

### Opsi 2: Hapus Data User Lama (Untuk Testing)

Jika Anda hanya testing dan ingin mulai fresh:

```sql
-- Lihat dulu user_id Anda
SELECT user_id, full_name, email 
FROM user_profiles 
ORDER BY created_at DESC;

-- Hapus profile user tertentu
DELETE FROM user_profiles WHERE user_id = 'YOUR_USER_ID_HERE';
```

⚠️ **PERHATIAN**: Ini akan menghapus data permanent. Hanya untuk testing!

### Opsi 3: Gunakan Email Baru (Quick Test)

Daftar dengan email baru yang belum pernah digunakan. Ini cara tercepat untuk test, tapi **masalah schema tetap ada** untuk user lama.

## 📊 Verifikasi Schema

Setelah jalankan migration, verifikasi dengan query ini:

```sql
-- Cek struktur tabel
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- Expected columns:
-- id, user_id, full_name, phone, address, kecamatan, kabupaten, 
-- provinsi, business_name, business_category_id, business_start_year, 
-- business_type, number_of_employees, role, is_approved, created_at, updated_at
```

## 🎯 Testing Setelah Fix

1. Login dengan akun yang sudah ada
2. Navigasi ke `/register/business-info`
3. Isi form lengkap:
   - Provinsi: **Jawa Tengah**
   - Kabupaten: **Kabupaten Banjarnegara**
   - Kecamatan: **Banjarnegara** (atau salah satu dari 20 kecamatan)
   - Isi field lainnya
4. Submit form
5. Seharusnya berhasil dan redirect ke dashboard

## 🛡️ Error Handling (Sudah Ditambahkan)

Aplikasi sekarang sudah punya error handling yang lebih baik:

- **Error 409 (Duplicate)**: Auto-refresh untuk load data yang ada
- **Error 500 (Schema)**: Pesan informatif untuk admin jalankan migration
- **Console error**: Detailed error log untuk debugging

## 📝 Summary

**Root Cause**: Database schema outdated, missing new columns  
**Fix**: Run SQL migration to add missing columns  
**Duration**: < 1 minute  
**Impact**: Fix error 500 & 409, enable location cascading dropdowns

---

**File SQL Migration**:
- `sql/10_add_business_details.sql` - Original migration
- `sql/FIX_DATABASE_SCHEMA.sql` - Quick fix script dengan verifikasi

**Production URL**: https://supabase-migration-gamma.vercel.app
