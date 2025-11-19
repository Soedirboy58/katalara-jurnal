-- =====================================================
-- FIX EXISTING USERS
-- Confirm email and create profiles for all existing users
-- =====================================================

-- 1. Confirm all existing users' emails
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 2. Create profiles for users who don't have one
INSERT INTO user_profiles (user_id, full_name, phone, role, is_approved)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', SPLIT_PART(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'phone', ''),
  'user',
  true  -- Auto-approve
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles p WHERE p.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 3. Check hasil
SELECT 
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  p.full_name,
  p.role,
  p.is_approved
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.user_id
ORDER BY u.created_at DESC;
