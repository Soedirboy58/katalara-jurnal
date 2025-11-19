# 🚨 URGENT FIX: Error 500 & 409 Saat Submit Business Info

## ❌ Error yang Muncul

```
GET /rest/v1/user_profiles 500 (Internal Server Error)
POST /rest/v1/user_profiles 409 (Conflict)
Error code: 23505 - duplicate key value violates unique constraint "user_profiles_user_id_key"
```

## 🔍 Root Cause

1. **Kolom database belum ditambahkan** (`kecamatan`, `kabupaten`, `provinsi`, dll)
2. **Profile user sudah ada** di database dengan schema lama yang incomplete

## ✅ SOLUSI CEPAT (5 Menit)

### STEP 1: Tambah Kolom Database (WAJIB!)

1. Buka **Supabase Dashboard**: https://supabase.com/dashboard
2. Klik project Anda
3. Klik **SQL Editor** di sidebar kiri
4. Copy-paste script ini:

```sql
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS kecamatan TEXT,
ADD COLUMN IF NOT EXISTS kabupaten TEXT,
ADD COLUMN IF NOT EXISTS provinsi TEXT,
ADD COLUMN IF NOT EXISTS business_start_year INT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS number_of_employees TEXT;
```

5. Klik **Run** (atau Ctrl+Enter)
6. Lihat result: "Success. No rows returned"

### STEP 2: Hapus Profile Lama (Untuk Testing)

Karena profile lama ada tapi incomplete, hapus dulu:

```sql
-- Ganti 'your-email@example.com' dengan email Anda
DELETE FROM user_profiles 
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email = 'your-email@example.com'
);
```

### STEP 3: Test Lagi

1. Refresh halaman: https://supabase-migration-gamma.vercel.app/register/business-info
2. Isi form lengkap:
   - Nama: Aris Irhamni (atau nama Anda)
   - Provinsi: Jawa Tengah
   - Kabupaten: Kabupaten Banjarnegara
   - Kecamatan: Banjarnegara (atau pilih dari 20 kecamatan)
   - Isi field lainnya
3. Submit
4. **Seharusnya berhasil!** ✅

---

## 🔧 ALTERNATIF: Gunakan Email Baru

Cara tercepat untuk test tanpa SQL:

1. Logout dari akun current
2. Daftar dengan email fresh yang belum pernah digunakan
3. Verifikasi email
4. Login
5. Isi business info

⚠️ **CATATAN**: Cara ini hanya untuk testing. User lama tetap akan error sampai kolom ditambahkan.

---

## 📊 Verifikasi Database

Setelah jalankan ALTER TABLE, verifikasi dengan query ini:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;
```

Expected columns:
- ✅ id
- ✅ user_id
- ✅ full_name
- ✅ phone
- ✅ address
- ✅ **kecamatan** ← baru
- ✅ **kabupaten** ← baru
- ✅ **provinsi** ← baru
- ✅ business_name
- ✅ business_category_id
- ✅ **business_start_year** ← baru
- ✅ **business_type** ← baru
- ✅ **number_of_employees** ← baru
- ✅ role
- ✅ is_approved
- ✅ created_at
- ✅ updated_at

---

## 🐛 Debugging

Jika masih error setelah ALTER TABLE:

### 1. Cek apakah kolom benar-benar ada:

```sql
SELECT * FROM user_profiles LIMIT 1;
```

Jika error "column does not exist", berarti ALTER TABLE belum berhasil.

### 2. Cek user_id yang duplicate:

```sql
SELECT user_id, COUNT(*) 
FROM user_profiles 
GROUP BY user_id 
HAVING COUNT(*) > 1;
```

Jika ada duplicate, hapus dengan:

```sql
DELETE FROM user_profiles 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM user_profiles 
    GROUP BY user_id
);
```

### 3. Cek RLS Policy:

```sql
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
```

Pastikan ada policy untuk INSERT dan UPDATE.

---

## 📁 File SQL Reference

| File | Fungsi |
|------|--------|
| `sql/10_add_business_details.sql` | Original migration |
| `sql/FIX_DATABASE_SCHEMA.sql` | Fix schema + verifikasi |
| `sql/QUICK_FIX_DATABASE.sql` | Quick fix + hapus duplicate |

---

## ✅ Checklist

- [ ] Jalankan ALTER TABLE di Supabase SQL Editor
- [ ] Verifikasi kolom baru muncul di tabel
- [ ] Hapus profile lama untuk email testing
- [ ] Refresh halaman business-info
- [ ] Submit form lagi
- [ ] Berhasil tanpa error ✅

---

## 🎯 Summary

**Problem**: Database schema outdated + duplicate profile  
**Root Cause**: Migration SQL belum dijalankan di Supabase  
**Solution**: ALTER TABLE + DELETE old profile  
**Duration**: < 5 menit  
**Impact**: Fix error 500 & 409 permanently  

**Status**: ⚠️ BUTUH ACTION dari Anda - Jalankan SQL di Supabase!
