-- =====================================================
-- DOMAIN: CORE
-- TABLE: business_configurations
-- ROW LEVEL SECURITY (RLS) Policies
-- =====================================================

-- =====================================================
-- ENABLE RLS
-- =====================================================
ALTER TABLE business_configurations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES: business_configurations
-- =====================================================

-- Policy 1: Users can view their own business config
CREATE POLICY business_config_select_own
  ON business_configurations FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own business config
CREATE POLICY business_config_insert_own
  ON business_configurations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own business config
CREATE POLICY business_config_update_own
  ON business_configurations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own business config (rare)
CREATE POLICY business_config_delete_own
  ON business_configurations FOR DELETE
  USING (auth.uid() = user_id);

-- Policy 5: Super admins can view all business configs
CREATE POLICY business_config_select_admin
  ON business_configurations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- Policy 6: Super admins can update any business config
CREATE POLICY business_config_update_admin
  ON business_configurations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- Policy 7: Super admins can insert business configs (admin-created accounts)
CREATE POLICY business_config_insert_admin
  ON business_configurations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- Policy 8: Super admins can delete business configs (cleanup)
CREATE POLICY business_config_delete_admin
  ON business_configurations FOR DELETE
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
GRANT EXECUTE ON FUNCTION get_business_config TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_business_config TO authenticated;
GRANT EXECUTE ON FUNCTION complete_onboarding TO authenticated;
GRANT EXECUTE ON FUNCTION update_onboarding_step TO authenticated;
GRANT EXECUTE ON FUNCTION get_onboarding_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_by_category TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_business_health_score TO authenticated;
GRANT EXECUTE ON FUNCTION update_business_config_timestamp TO authenticated;
GRANT EXECUTE ON FUNCTION set_onboarding_completed_timestamp TO authenticated;

-- Grant select on view to authenticated
GRANT SELECT ON business_config_overview TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON POLICY business_config_select_own ON business_configurations IS 'Users can view their own business configuration';
COMMENT ON POLICY business_config_insert_own ON business_configurations IS 'Users can create their own business configuration';
COMMENT ON POLICY business_config_update_own ON business_configurations IS 'Users can update their own business configuration';
COMMENT ON POLICY business_config_delete_own ON business_configurations IS 'Users can delete their own business configuration';
COMMENT ON POLICY business_config_select_admin ON business_configurations IS 'Super admins can view all business configurations';
COMMENT ON POLICY business_config_update_admin ON business_configurations IS 'Super admins can update any business configuration';
COMMENT ON POLICY business_config_insert_admin ON business_configurations IS 'Super admins can create business configurations';
COMMENT ON POLICY business_config_delete_admin ON business_configurations IS 'Super admins can delete business configurations';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ CORE Domain - Business Configurations RLS Policies Created';
  RAISE NOTICE '   - Policies: 8 (user own access + super_admin full access)';
  RAISE NOTICE '   - Security: Users can only access their own config';
  RAISE NOTICE '   - Admin: Super admins have full access for management';
  RAISE NOTICE '   - Functions: All granted to authenticated users';
END $$;
