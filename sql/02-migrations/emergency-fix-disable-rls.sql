-- =====================================================
-- EMERGENCY FIX - DISABLE RLS TEMPORARILY
-- =====================================================

-- STEP 1: Disable RLS completely on user_profiles
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop ALL policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can view admin analytics" ON user_profiles;

-- STEP 3: Drop trigger yang mungkin error
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- STEP 4: Grant full access to authenticated users
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO anon;

-- STEP 5: Update admin account
UPDATE auth.users
SET 
  encrypted_password = crypt('Admin123!', gen_salt('bf')),
  email_confirmed_at = NOW(),
  phone_confirmed_at = NOW()
WHERE email = 'admin@katalara.com';

-- STEP 6: Create/update profile
INSERT INTO user_profiles (
  user_id,
  full_name,
  phone,
  business_name,
  role,
  is_approved,
  is_verified,
  is_active
)
SELECT 
  id,
  'Admin Katalara',
  '081234567890',
  'Katalara Admin',
  'super_admin',
  true,
  true,
  true
FROM auth.users
WHERE email = 'admin@katalara.com'
ON CONFLICT (user_id) 
DO UPDATE SET
  role = 'super_admin',
  is_approved = true,
  is_verified = true,
  is_active = true;

-- STEP 7: Verify
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.encrypted_password IS NOT NULL as has_password,
  p.role,
  p.is_active
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.user_id
WHERE u.email = 'admin@katalara.com';

-- =====================================================
-- SEKARANG COBA LOGIN:
-- Email: admin@katalara.com
-- Password: Admin123!
--
-- SETELAH BERHASIL LOGIN, KITA BISA ENABLE RLS LAGI
-- =====================================================
