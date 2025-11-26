-- =====================================================
-- DOMAIN: FINANCE
-- FILE: suppliers.policies.sql
-- PURPOSE: Row Level Security policies for suppliers
-- =====================================================

-- =====================================================
-- ENABLE RLS
-- =====================================================
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICY: SELECT
-- Users can view their own suppliers
-- =====================================================
DROP POLICY IF EXISTS suppliers_select_policy ON suppliers;
CREATE POLICY suppliers_select_policy
  ON suppliers
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- =====================================================
-- POLICY: INSERT
-- Users can create suppliers for themselves
-- =====================================================
DROP POLICY IF EXISTS suppliers_insert_policy ON suppliers;
CREATE POLICY suppliers_insert_policy
  ON suppliers
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- =====================================================
-- POLICY: UPDATE
-- Users can update their own suppliers
-- =====================================================
DROP POLICY IF EXISTS suppliers_update_policy ON suppliers;
CREATE POLICY suppliers_update_policy
  ON suppliers
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- =====================================================
-- POLICY: DELETE
-- Users can delete their own suppliers
-- Note: CASCADE will handle related expenses
-- =====================================================
DROP POLICY IF EXISTS suppliers_delete_policy ON suppliers;
CREATE POLICY suppliers_delete_policy
  ON suppliers
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON suppliers TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Finance Domain - Suppliers Policies Created';
  RAISE NOTICE '   - RLS enabled on suppliers table';
  RAISE NOTICE '   - 4 policies: SELECT, INSERT, UPDATE, DELETE';
  RAISE NOTICE '   - Access control: Users can only see/modify their own suppliers';
END $$;
