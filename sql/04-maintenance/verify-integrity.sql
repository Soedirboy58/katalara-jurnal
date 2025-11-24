-- =====================================================
-- VERIFY & TEST RLS POLICIES
-- =====================================================

-- 1. Check semua policies yang ada
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 2. Check apakah RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- 3. Test query as authenticated user (ganti dengan user_id Anda)
-- SET LOCAL role TO authenticated;
-- SET LOCAL request.jwt.claims TO '{"sub": "99f07a34-2ad0-4433-b996-8455ed2a4dde"}';
-- SELECT * FROM user_profiles WHERE user_id = '99f07a34-2ad0-4433-b996-8455ed2a4dde';

-- 4. Check data yang ada
SELECT user_id, full_name, business_name, phone, address, role, is_active
FROM user_profiles
ORDER BY created_at DESC;

-- 5. Count total profiles
SELECT COUNT(*) as total_profiles FROM user_profiles;
