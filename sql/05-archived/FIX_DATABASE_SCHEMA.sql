-- =====================================================
-- FIX DATABASE SCHEMA
-- Jalankan script ini di Supabase SQL Editor untuk fix error 500 dan 409
-- =====================================================

-- Step 1: Tambah kolom yang missing
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS kecamatan TEXT,
ADD COLUMN IF NOT EXISTS kabupaten TEXT,
ADD COLUMN IF NOT EXISTS provinsi TEXT,
ADD COLUMN IF NOT EXISTS business_start_year INT,
ADD COLUMN IF NOT EXISTS business_type TEXT CHECK (business_type IN ('perorangan', 'cv', 'pt', 'koperasi', 'lainnya')),
ADD COLUMN IF NOT EXISTS number_of_employees TEXT CHECK (number_of_employees IN ('1-5', '6-20', '21-50', '51-100', '100+'));

-- Step 2: Verify semua kolom sudah ada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- Step 3: Cek data yang ada
SELECT 
    user_id,
    full_name,
    phone,
    business_name,
    kecamatan,
    kabupaten,
    provinsi,
    created_at
FROM user_profiles
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- OPTIONAL: Hapus duplicate data jika ada
-- Jalankan hanya jika Anda mau hapus profile lama untuk testing
-- =====================================================

-- Uncomment baris di bawah untuk hapus profile user tertentu:
-- DELETE FROM user_profiles WHERE user_id = 'USER_ID_ANDA';

-- Atau hapus semua profile untuk testing (HATI-HATI!):
-- DELETE FROM user_profiles;
