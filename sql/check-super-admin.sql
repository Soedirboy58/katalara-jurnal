-- =====================================================
-- CHECK SUPER ADMIN STATUS
-- =====================================================
-- Run this to verify super admin exists and check status
-- =====================================================

-- 1. Check if super admin exists in auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'admin@katalara.com';

-- 2. Check user_profiles for super admin
SELECT 
  id,
  email,
  role,
  business_name,
  is_active,
  created_at
FROM user_profiles
WHERE email = 'admin@katalara.com';

-- 3. Check all users with super_admin role
SELECT 
  up.id,
  up.email,
  up.role,
  up.is_active,
  au.email_confirmed_at,
  au.last_sign_in_at
FROM user_profiles up
LEFT JOIN auth.users au ON au.id = up.id
WHERE up.role = 'super_admin';

-- 4. If no super admin found, create one:
-- UNCOMMENT LINES BELOW TO CREATE SUPER ADMIN

/*
INSERT INTO user_profiles (
  id,
  email,
  role,
  business_name,
  business_category,
  is_active
)
SELECT 
  id,
  'admin@katalara.com',
  'super_admin',
  'Katalara Admin',
  'technology',
  true
FROM auth.users
WHERE email = 'admin@katalara.com'
ON CONFLICT (id) DO UPDATE
SET 
  role = 'super_admin',
  is_active = true;
*/

RAISE NOTICE '✅ Check complete. Review results above.';
