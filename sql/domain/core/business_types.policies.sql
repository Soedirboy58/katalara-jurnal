-- =====================================================
-- DOMAIN: CORE
-- TABLE: business_type_mappings
-- ROW LEVEL SECURITY (RLS) Policies
-- =====================================================

-- =====================================================
-- ENABLE RLS
-- =====================================================
ALTER TABLE business_type_mappings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES: business_type_mappings
-- Public reference data - read-only for all, write for admins
-- =====================================================

-- Policy 1: Anyone (authenticated) can view business types
-- This is reference data needed for onboarding
CREATE POLICY business_types_select_public
  ON business_type_mappings FOR SELECT
  TO authenticated
  USING (TRUE);

-- Policy 2: Super admins can insert new business types
CREATE POLICY business_types_insert_admin
  ON business_type_mappings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- Policy 3: Super admins can update business types
CREATE POLICY business_types_update_admin
  ON business_type_mappings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- Policy 4: Super admins can delete business types (careful!)
CREATE POLICY business_types_delete_admin
  ON business_type_mappings FOR DELETE
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
GRANT EXECUTE ON FUNCTION classify_business_by_keywords TO authenticated;
GRANT EXECUTE ON FUNCTION get_business_type_by_category TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_business_types TO authenticated;
GRANT EXECUTE ON FUNCTION search_business_types_by_keyword TO authenticated;
GRANT EXECUTE ON FUNCTION get_recommended_features TO authenticated;
GRANT EXECUTE ON FUNCTION update_business_type_mapping TO authenticated;
GRANT EXECUTE ON FUNCTION get_category_usage_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION update_business_types_timestamp TO authenticated;

-- Grant select on view to authenticated
GRANT SELECT ON business_type_summary TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON POLICY business_types_select_public ON business_type_mappings IS 'All authenticated users can view business types (reference data)';
COMMENT ON POLICY business_types_insert_admin ON business_type_mappings IS 'Only super admins can add new business types';
COMMENT ON POLICY business_types_update_admin ON business_type_mappings IS 'Only super admins can update business types';
COMMENT ON POLICY business_types_delete_admin ON business_type_mappings IS 'Only super admins can delete business types';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ CORE Domain - Business Type Mappings RLS Policies Created';
  RAISE NOTICE '   - Policies: 4 (public read + admin write/update/delete)';
  RAISE NOTICE '   - Security: Reference data accessible to all, managed by admins';
  RAISE NOTICE '   - Functions: All granted to authenticated users';
END $$;
