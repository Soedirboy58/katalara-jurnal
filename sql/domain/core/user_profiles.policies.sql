-- =====================================================
-- DOMAIN: CORE
-- TABLE: user_profiles
-- ROW LEVEL SECURITY (RLS) Policies
-- =====================================================

-- =====================================================
-- ENABLE RLS
-- =====================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES: user_profiles
-- =====================================================

-- Policy 1: Users can view their own profile
CREATE POLICY user_profiles_select_own
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own profile (during registration)
-- Note: Usually handled by trigger, but allow manual insert
CREATE POLICY user_profiles_insert_own
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own profile
-- Restricted: cannot change role, approval status, or admin fields
CREATE POLICY user_profiles_update_own
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND role = (SELECT role FROM user_profiles WHERE user_id = auth.uid()) -- Cannot change own role
    AND is_approved = (SELECT is_approved FROM user_profiles WHERE user_id = auth.uid()) -- Cannot self-approve
  );

-- Policy 4: Super admins can view all profiles
CREATE POLICY user_profiles_select_admin
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- Policy 5: Super admins can update any profile
-- For approval workflow and user management
CREATE POLICY user_profiles_update_admin
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- Policy 6: Super admins can insert profiles (rare case)
CREATE POLICY user_profiles_insert_admin
  ON user_profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- Policy 7: Super admins can delete profiles (cleanup)
CREATE POLICY user_profiles_delete_admin
  ON user_profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION handle_new_user TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_profiles_timestamp TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_with_profile TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_approval_users TO authenticated;
GRANT EXECUTE ON FUNCTION approve_user_account TO authenticated;
GRANT EXECUTE ON FUNCTION deactivate_user_account TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_statistics TO authenticated;

-- Grant select on admin view to authenticated
-- RLS within view handles permission checking
GRANT SELECT ON admin_users_overview TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON POLICY user_profiles_select_own ON user_profiles IS 'Users can view their own profile';
COMMENT ON POLICY user_profiles_insert_own ON user_profiles IS 'Users can create their own profile during registration';
COMMENT ON POLICY user_profiles_update_own ON user_profiles IS 'Users can update their own profile (except role/approval)';
COMMENT ON POLICY user_profiles_select_admin ON user_profiles IS 'Super admins can view all profiles';
COMMENT ON POLICY user_profiles_update_admin ON user_profiles IS 'Super admins can update any profile (approval workflow)';
COMMENT ON POLICY user_profiles_insert_admin ON user_profiles IS 'Super admins can manually create profiles';
COMMENT ON POLICY user_profiles_delete_admin ON user_profiles IS 'Super admins can delete profiles (cleanup)';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ CORE Domain - User Profiles RLS Policies Created';
  RAISE NOTICE '   - Policies: 7 (user own access + super_admin full access)';
  RAISE NOTICE '   - Security: Users can only modify own profile (except role/approval)';
  RAISE NOTICE '   - Admin: Super admins have full access for approval workflow';
  RAISE NOTICE '   - Functions: All granted to authenticated users';
END $$;
