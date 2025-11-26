-- =====================================================
-- DOMAIN: FINANCE
-- FILE: incomes.policies.sql
-- PURPOSE: Row Level Security policies for incomes
-- =====================================================

-- =====================================================
-- ENABLE RLS ON INCOMES
-- =====================================================
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICY: SELECT
-- Users can view their own incomes
-- =====================================================
DROP POLICY IF EXISTS incomes_select_policy ON incomes;
CREATE POLICY incomes_select_policy
  ON incomes
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- =====================================================
-- POLICY: INSERT
-- Users can create incomes for themselves
-- =====================================================
DROP POLICY IF EXISTS incomes_insert_policy ON incomes;
CREATE POLICY incomes_insert_policy
  ON incomes
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- =====================================================
-- POLICY: UPDATE
-- Users can update their own incomes
-- =====================================================
DROP POLICY IF EXISTS incomes_update_policy ON incomes;
CREATE POLICY incomes_update_policy
  ON incomes
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- =====================================================
-- POLICY: DELETE
-- Users can delete their own incomes
-- Note: CASCADE will handle related income_items
-- =====================================================
DROP POLICY IF EXISTS incomes_delete_policy ON incomes;
CREATE POLICY incomes_delete_policy
  ON incomes
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- =====================================================
-- ENABLE RLS ON INCOME_ITEMS
-- =====================================================
ALTER TABLE income_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICY: SELECT (income_items)
-- Users can view their own income items
-- =====================================================
DROP POLICY IF EXISTS income_items_select_policy ON income_items;
CREATE POLICY income_items_select_policy
  ON income_items
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- =====================================================
-- POLICY: INSERT (income_items)
-- Users can create income items for themselves
-- =====================================================
DROP POLICY IF EXISTS income_items_insert_policy ON income_items;
CREATE POLICY income_items_insert_policy
  ON income_items
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- =====================================================
-- POLICY: UPDATE (income_items)
-- Users can update their own income items
-- =====================================================
DROP POLICY IF EXISTS income_items_update_policy ON income_items;
CREATE POLICY income_items_update_policy
  ON income_items
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- =====================================================
-- POLICY: DELETE (income_items)
-- Users can delete their own income items
-- =====================================================
DROP POLICY IF EXISTS income_items_delete_policy ON income_items;
CREATE POLICY income_items_delete_policy
  ON income_items
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON incomes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON income_items TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Finance Domain - Incomes Policies Created';
  RAISE NOTICE '   - RLS enabled on incomes and income_items tables';
  RAISE NOTICE '   - 4 policies on incomes: SELECT, INSERT, UPDATE, DELETE';
  RAISE NOTICE '   - 4 policies on income_items: SELECT, INSERT, UPDATE, DELETE';
  RAISE NOTICE '   - Access control: Users can only see/modify their own data';
END $$;
