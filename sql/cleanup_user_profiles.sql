-- =====================================================
-- CLEANUP USER PROFILES - FIX DUPLICATE & DATABASE ISSUES
-- =====================================================
-- Run this in Supabase SQL Editor if you get 409 or 500 errors

-- 1. Check current user_profiles
SELECT user_id, full_name, business_name, phone, address 
FROM user_profiles
ORDER BY created_at DESC;

-- 2. Delete ALL profiles (WARNING: This will delete all user profiles!)
-- Uncomment line below if you want to start fresh
-- TRUNCATE TABLE user_profiles CASCADE;

-- 3. Or delete specific user profile (replace with your user_id)
-- DELETE FROM user_profiles WHERE user_id = '99f07a34-2ad0-4433-b996-8455ed2a4dde';

-- 4. Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 5. Add missing columns if needed
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS kecamatan TEXT,
ADD COLUMN IF NOT EXISTS kabupaten TEXT,
ADD COLUMN IF NOT EXISTS provinsi TEXT,
ADD COLUMN IF NOT EXISTS business_start_year INT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS number_of_employees TEXT;

-- 6. Verify columns added
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
AND column_name IN ('kecamatan', 'kabupaten', 'provinsi', 'business_start_year', 'business_type', 'number_of_employees');

-- 7. Check for duplicate user_ids
SELECT user_id, COUNT(*) as count
FROM user_profiles
GROUP BY user_id
HAVING COUNT(*) > 1;
