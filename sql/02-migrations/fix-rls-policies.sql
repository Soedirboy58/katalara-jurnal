-- =====================================================
-- FIX RLS POLICIES - ALLOW LOGIN ACCESS
-- =====================================================

-- Drop existing policies yang mungkin conflict
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can view admin analytics" ON user_profiles;

-- POLICY 1: Users can view their own profile (CRITICAL untuk login)
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- POLICY 2: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- POLICY 3: Users can insert their own profile (untuk signup)
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- POLICY 4: Super admins can view ALL profiles
CREATE POLICY "Super admins can view all profiles"
  ON user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'super_admin'
    )
  );

-- POLICY 5: Super admins can update ALL profiles
CREATE POLICY "Super admins can update all profiles"
  ON user_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'super_admin'
    )
  );

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- =====================================================
-- SETELAH RUN SQL INI, COBA LOGIN LAGI:
-- Email: admin@katalara.com
-- Password: Admin123!
-- =====================================================
