-- =====================================================
-- DOMAIN: FINANCE
-- FILE: loans.policies.sql
-- PURPOSE: Row Level Security policies for loans
-- =====================================================

-- =====================================================
-- ENABLE RLS ON LOANS
-- =====================================================
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICY: SELECT
-- Users can view their own loans
-- =====================================================
DROP POLICY IF EXISTS loans_select_policy ON loans;
CREATE POLICY loans_select_policy
  ON loans
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- =====================================================
-- POLICY: INSERT
-- Users can create loans for themselves
-- =====================================================
DROP POLICY IF EXISTS loans_insert_policy ON loans;
CREATE POLICY loans_insert_policy
  ON loans
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- =====================================================
-- POLICY: UPDATE
-- Users can update their own loans
-- =====================================================
DROP POLICY IF EXISTS loans_update_policy ON loans;
CREATE POLICY loans_update_policy
  ON loans
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- =====================================================
-- POLICY: DELETE
-- Users can delete their own loans
-- Note: CASCADE will handle related loan_installments
-- =====================================================
DROP POLICY IF EXISTS loans_delete_policy ON loans;
CREATE POLICY loans_delete_policy
  ON loans
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- =====================================================
-- ENABLE RLS ON LOAN_INSTALLMENTS
-- =====================================================
ALTER TABLE loan_installments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICY: SELECT (loan_installments)
-- Users can view their own installments
-- =====================================================
DROP POLICY IF EXISTS loan_installments_select_policy ON loan_installments;
CREATE POLICY loan_installments_select_policy
  ON loan_installments
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- =====================================================
-- POLICY: INSERT (loan_installments)
-- Users can create installments for themselves
-- =====================================================
DROP POLICY IF EXISTS loan_installments_insert_policy ON loan_installments;
CREATE POLICY loan_installments_insert_policy
  ON loan_installments
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- =====================================================
-- POLICY: UPDATE (loan_installments)
-- Users can update their own installments
-- =====================================================
DROP POLICY IF EXISTS loan_installments_update_policy ON loan_installments;
CREATE POLICY loan_installments_update_policy
  ON loan_installments
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- =====================================================
-- POLICY: DELETE (loan_installments)
-- Users can delete their own installments
-- =====================================================
DROP POLICY IF EXISTS loan_installments_delete_policy ON loan_installments;
CREATE POLICY loan_installments_delete_policy
  ON loan_installments
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON loans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON loan_installments TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Finance Domain - Loans Policies Created';
  RAISE NOTICE '   - RLS enabled on loans and loan_installments tables';
  RAISE NOTICE '   - 4 policies on loans: SELECT, INSERT, UPDATE, DELETE';
  RAISE NOTICE '   - 4 policies on loan_installments: SELECT, INSERT, UPDATE, DELETE';
  RAISE NOTICE '   - Access control: Users can only see/modify their own data';
END $$;
