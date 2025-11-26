-- =====================================================
-- DOMAIN: SUPPORTING
-- TABLE: user_unit_settings
-- ROW LEVEL SECURITY (RLS) Policies
-- =====================================================

-- =====================================================
-- ENABLE RLS
-- =====================================================
ALTER TABLE user_unit_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES: user_unit_settings
-- Users can only access their own settings
-- =====================================================

-- Policy 1: Users can view their own unit settings
CREATE POLICY user_units_select_own
  ON user_unit_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own unit settings
CREATE POLICY user_units_insert_own
  ON user_unit_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own unit settings
CREATE POLICY user_units_update_own
  ON user_unit_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own unit settings
CREATE POLICY user_units_delete_own
  ON user_unit_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 5: Super admins can view all unit settings
CREATE POLICY user_units_select_admin
  ON user_unit_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- Policy 6: Super admins can update any unit settings
CREATE POLICY user_units_update_admin
  ON user_unit_settings FOR UPDATE
  TO authenticated
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
GRANT EXECUTE ON FUNCTION get_user_unit_settings TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_user_unit_settings TO authenticated;
GRANT EXECUTE ON FUNCTION add_custom_physical_unit TO authenticated;
GRANT EXECUTE ON FUNCTION add_custom_service_unit TO authenticated;
GRANT EXECUTE ON FUNCTION remove_custom_physical_unit TO authenticated;
GRANT EXECUTE ON FUNCTION remove_custom_service_unit TO authenticated;
GRANT EXECUTE ON FUNCTION update_default_units TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_available_units TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_unit_settings_timestamp TO authenticated;

-- Grant select on view to authenticated
GRANT SELECT ON user_unit_settings_summary TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON POLICY user_units_select_own ON user_unit_settings IS 'Users can view their own unit settings';
COMMENT ON POLICY user_units_insert_own ON user_unit_settings IS 'Users can create their own unit settings';
COMMENT ON POLICY user_units_update_own ON user_unit_settings IS 'Users can update their own unit settings';
COMMENT ON POLICY user_units_delete_own ON user_unit_settings IS 'Users can delete their own unit settings';
COMMENT ON POLICY user_units_select_admin ON user_unit_settings IS 'Super admins can view all unit settings';
COMMENT ON POLICY user_units_update_admin ON user_unit_settings IS 'Super admins can update any unit settings';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ SUPPORTING Domain - User Unit Settings RLS Policies Created';
  RAISE NOTICE '   - Policies: 6 (user own: 4, admin: 2)';
  RAISE NOTICE '   - Security: Users isolated to own settings, admins see all';
  RAISE NOTICE '   - Functions: All granted to authenticated users';
END $$;
