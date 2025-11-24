-- =====================================================
-- FIX ADMIN@KATALARA.COM - CREATE PROFILE + SET PASSWORD
-- =====================================================

-- STEP 1: Update password untuk admin@katalara.com
UPDATE auth.users
SET 
  encrypted_password = crypt('Admin123!', gen_salt('bf')),
  email_confirmed_at = NOW(),
  phone_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'admin@katalara.com';

-- STEP 2: Create atau update user_profiles
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
  is_active = true,
  full_name = 'Admin Katalara',
  phone = '081234567890',
  business_name = 'Katalara Admin';

-- STEP 3: Verify
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.encrypted_password IS NOT NULL as has_password,
  p.role,
  p.is_active,
  p.is_approved,
  p.full_name
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.user_id
WHERE u.email = 'admin@katalara.com';

-- =====================================================
-- LOGIN SEKARANG:
-- Email: admin@katalara.com
-- Password: Admin123!
-- =====================================================
