-- =====================================================
-- FIX RLS POLICY INFINITE RECURSION + CLEANUP
-- =====================================================
-- Run this ENTIRE script in Supabase SQL Editor

-- Step 1: DROP semua RLS policies yang bermasalah
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON user_profiles;

-- Step 2: Hapus semua data profile (fresh start)
TRUNCATE TABLE user_profiles CASCADE;

-- Step 3: Tambah kolom yang missing
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS kecamatan TEXT,
ADD COLUMN IF NOT EXISTS kabupaten TEXT,
ADD COLUMN IF NOT EXISTS provinsi TEXT,
ADD COLUMN IF NOT EXISTS business_start_year INT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS number_of_employees TEXT;

-- Step 4: Buat RLS policies BARU yang BENAR (tanpa infinite recursion)
CREATE POLICY "Enable read for users based on user_id"
ON user_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users"
ON user_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id"
ON user_profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Step 5: Pastikan RLS enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- Step 7: Verify policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- =====================================================
-- SELESAI! 
-- 1. Refresh halaman business-info
-- 2. Isi form lengkap
-- 3. Submit → SUKSES! ✅
-- 4. Logout dan login lagi → Langsung ke dashboard! ✅
-- =====================================================
