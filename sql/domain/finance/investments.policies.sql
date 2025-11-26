-- =====================================================
-- DOMAIN: FINANCE
-- TABLE: investments
-- ROW LEVEL SECURITY (RLS) Policies
-- =====================================================

-- =====================================================
-- ENABLE RLS
-- =====================================================
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_sharing_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES: investments
-- =====================================================

-- Policy 1: SELECT - Users can only see their own investments
CREATE POLICY investments_select_own 
  ON investments
  FOR SELECT
  USING (auth.uid() = owner_id);

-- Policy 2: INSERT - Users can only create investments for themselves
CREATE POLICY investments_insert_own 
  ON investments
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Policy 3: UPDATE - Users can only update their own investments
CREATE POLICY investments_update_own 
  ON investments
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Policy 4: DELETE - Users can only delete their own investments
-- (with protection from trigger if has history)
CREATE POLICY investments_delete_own 
  ON investments
  FOR DELETE
  USING (auth.uid() = owner_id);

-- =====================================================
-- POLICIES: profit_sharing_history
-- =====================================================

-- Policy 1: SELECT - Users can only see their own profit sharing history
CREATE POLICY profit_sharing_select_own 
  ON profit_sharing_history
  FOR SELECT
  USING (auth.uid() = owner_id);

-- Policy 2: INSERT - Users can only create profit sharing records for themselves
CREATE POLICY profit_sharing_insert_own 
  ON profit_sharing_history
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Policy 3: UPDATE - Users can only update their own profit sharing records
CREATE POLICY profit_sharing_update_own 
  ON profit_sharing_history
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Policy 4: DELETE - Users can only delete their own profit sharing records
CREATE POLICY profit_sharing_delete_own 
  ON profit_sharing_history
  FOR DELETE
  USING (auth.uid() = owner_id);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION calculate_investment_roi TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_profit_share_date TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_buyback_amount TO authenticated;
GRANT EXECUTE ON FUNCTION get_investment_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_investments_summary TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_profit_share_amount TO authenticated;
GRANT EXECUTE ON FUNCTION get_investments_due_for_profit_share TO authenticated;
GRANT EXECUTE ON FUNCTION update_investment_total_profit_shared TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON POLICY investments_select_own ON investments IS 'Users can only view their own investments';
COMMENT ON POLICY investments_insert_own ON investments IS 'Users can only create investments for themselves';
COMMENT ON POLICY investments_update_own ON investments IS 'Users can only update their own investments';
COMMENT ON POLICY investments_delete_own ON investments IS 'Users can only delete their own investments (protected by trigger if has history)';

COMMENT ON POLICY profit_sharing_select_own ON profit_sharing_history IS 'Users can only view their own profit sharing records';
COMMENT ON POLICY profit_sharing_insert_own ON profit_sharing_history IS 'Users can only create profit sharing records for themselves';
COMMENT ON POLICY profit_sharing_update_own ON profit_sharing_history IS 'Users can only update their own profit sharing records';
COMMENT ON POLICY profit_sharing_delete_own ON profit_sharing_history IS 'Users can only delete their own profit sharing records';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Finance Domain - Investments RLS Policies Created';
  RAISE NOTICE '   - Table: investments (4 policies - SELECT, INSERT, UPDATE, DELETE)';
  RAISE NOTICE '   - Table: profit_sharing_history (4 policies - SELECT, INSERT, UPDATE, DELETE)';
  RAISE NOTICE '   - Security: Owner-based isolation, function execution granted';
END $$;
