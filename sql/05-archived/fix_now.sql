-- =====================================================
-- SOLUSI CEPAT: Hapus Semua Profile + Fix Schema
-- Copy-paste SEMUA script ini ke Supabase SQL Editor
-- =====================================================

-- Step 1: Hapus SEMUA profile (fresh start)
TRUNCATE TABLE user_profiles CASCADE;

-- Step 2: Tambah kolom yang missing
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS kecamatan TEXT,
ADD COLUMN IF NOT EXISTS kabupaten TEXT,
ADD COLUMN IF NOT EXISTS provinsi TEXT,
ADD COLUMN IF NOT EXISTS business_start_year INT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS number_of_employees TEXT;

-- Step 3: Verify hasil
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- =====================================================
-- SELESAI! Sekarang:
-- 1. Refresh halaman business-info
-- 2. Isi form lengkap
-- 3. Submit → SUKSES! ✅
-- =====================================================
