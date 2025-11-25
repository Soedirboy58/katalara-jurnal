-- =====================================================
-- FIX SUPER ADMIN LOGIN - FORCE CONFIRM EMAIL
-- =====================================================
-- Use this if super admin can't login due to unconfirmed email
-- =====================================================

-- Update auth.users to mark email as confirmed
UPDATE auth.users
SET 
  email_confirmed_at = NOW(),
  confirmed_at = NOW()
WHERE email = 'admin@katalara.com';

-- Ensure user_profiles has correct role
UPDATE user_profiles
SET 
  role = 'super_admin',
  is_active = true
WHERE email = 'admin@katalara.com';

-- Verify the fix
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  au.confirmed_at,
  up.role,
  up.is_active,
  'Login should work now!' as status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email = 'admin@katalara.com';

RAISE NOTICE '✅ Super admin email confirmed and role updated!';
RAISE NOTICE '🔐 Try logging in now at /login';
