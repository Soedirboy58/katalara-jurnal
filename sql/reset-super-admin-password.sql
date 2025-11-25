-- =====================================================
-- RESET SUPER ADMIN PASSWORD
-- =====================================================
-- Use this if you forgot super admin password
-- =====================================================

-- IMPORTANT: Replace 'NewSecurePassword123!' with your desired password
-- Password will be automatically hashed by Supabase

-- Method 1: Update password directly (requires pgcrypto extension)
UPDATE auth.users
SET 
  encrypted_password = crypt('NewSecurePassword123!', gen_salt('bf')),
  email_confirmed_at = NOW(),
  confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'admin@katalara.com';

-- Method 2: Alternative using Supabase Dashboard
-- If above doesn't work, go to:
-- Supabase Dashboard → Authentication → Users → 
-- Find admin@katalara.com → Click "..." → Reset Password

-- Verify the update
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  'Password has been reset to: NewSecurePassword123!' as message
FROM auth.users
WHERE email = 'admin@katalara.com';

RAISE NOTICE '✅ Password reset complete!';
RAISE NOTICE '🔐 New password: NewSecurePassword123!';
RAISE NOTICE '⚠️  Please change this password after first login!';
