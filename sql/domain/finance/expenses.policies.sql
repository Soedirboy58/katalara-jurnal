-- =====================================================
-- DOMAIN: FINANCE
-- FILE: expenses.policies.sql
-- PURPOSE: Row Level Security policies for expenses
-- =====================================================

-- =====================================================
-- ENABLE RLS
-- =====================================================
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES: expenses (Header)
-- =====================================================

-- SELECT: Users can view own expenses
DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
CREATE POLICY "Users can view own expenses"
  ON expenses
  FOR SELECT
  USING (owner_id = auth.uid());

-- INSERT: Users can create own expenses
DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
CREATE POLICY "Users can insert own expenses"
  ON expenses
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- UPDATE: Users can update own expenses
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
CREATE POLICY "Users can update own expenses"
  ON expenses
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- DELETE: Users can delete own expenses
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;
CREATE POLICY "Users can delete own expenses"
  ON expenses
  FOR DELETE
  USING (owner_id = auth.uid());

-- =====================================================
-- POLICIES: expense_items (Line Items)
-- =====================================================

-- SELECT: Users can view own expense items
DROP POLICY IF EXISTS "Users can view own expense items" ON expense_items;
CREATE POLICY "Users can view own expense items"
  ON expense_items
  FOR SELECT
  USING (owner_id = auth.uid());

-- INSERT: Users can create own expense items
DROP POLICY IF EXISTS "Users can insert own expense items" ON expense_items;
CREATE POLICY "Users can insert own expense items"
  ON expense_items
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- UPDATE: Users can update own expense items
DROP POLICY IF EXISTS "Users can update own expense items" ON expense_items;
CREATE POLICY "Users can update own expense items"
  ON expense_items
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- DELETE: Users can delete own expense items
DROP POLICY IF EXISTS "Users can delete own expense items" ON expense_items;
CREATE POLICY "Users can delete own expense items"
  ON expense_items
  FOR DELETE
  USING (owner_id = auth.uid());

-- =====================================================
-- ADMIN POLICIES (Optional)
-- Uncomment if you need admin access to all expenses
-- =====================================================

-- -- Admin can view all expenses
-- DROP POLICY IF EXISTS "Admin can view all expenses" ON expenses;
-- CREATE POLICY "Admin can view all expenses"
--   ON expenses
--   FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM auth.users
--       WHERE id = auth.uid()
--       AND raw_user_meta_data->>'role' = 'admin'
--     )
--   );

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Finance Domain - Expenses RLS Policies Created';
  RAISE NOTICE '   - Table: expenses (4 policies)';
  RAISE NOTICE '   - Table: expense_items (4 policies)';
  RAISE NOTICE '   - Security: Row Level Security enabled';
END $$;
