-- =====================================================
-- DOMAIN: FINANCE
-- FILE: customers.policies.sql
-- PURPOSE: Row Level Security policies for customers
-- =====================================================

-- =====================================================
-- ENABLE RLS
-- =====================================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICY: SELECT
-- Users can view their own customers
-- =====================================================
DROP POLICY IF EXISTS customers_select_policy ON customers;
CREATE POLICY customers_select_policy
  ON customers
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- =====================================================
-- POLICY: INSERT
-- Users can create customers for themselves
-- =====================================================
DROP POLICY IF EXISTS customers_insert_policy ON customers;
CREATE POLICY customers_insert_policy
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- =====================================================
-- POLICY: UPDATE
-- Users can update their own customers
-- =====================================================
DROP POLICY IF EXISTS customers_update_policy ON customers;
CREATE POLICY customers_update_policy
  ON customers
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- =====================================================
-- POLICY: DELETE
-- Users can delete their own customers
-- Note: CASCADE will handle related incomes
-- =====================================================
DROP POLICY IF EXISTS customers_delete_policy ON customers;
CREATE POLICY customers_delete_policy
  ON customers
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON customers TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Finance Domain - Customers Policies Created';
  RAISE NOTICE '   - RLS enabled on customers table';
  RAISE NOTICE '   - 4 policies: SELECT, INSERT, UPDATE, DELETE';
  RAISE NOTICE '   - Access control: Users can only see/modify their own customers';
END $$;
