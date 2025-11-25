-- =====================================================
-- FIX: EXPENSE_ITEMS RLS POLICY BUG
-- =====================================================
-- Issue: RLS policy checking expenses.user_id but might need owner_id
-- Date: 2025-11-25
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own expense items" ON expense_items;
DROP POLICY IF EXISTS "Users can insert own expense items" ON expense_items;
DROP POLICY IF EXISTS "Users can update own expense items" ON expense_items;
DROP POLICY IF EXISTS "Users can delete own expense items" ON expense_items;

-- Recreate policies with BOTH user_id and owner_id check for compatibility
CREATE POLICY "Users can view own expense items" ON expense_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM expenses 
      WHERE expenses.id = expense_items.expense_id 
      AND (expenses.user_id = auth.uid() OR expenses.owner_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert own expense items" ON expense_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM expenses 
      WHERE expenses.id = expense_items.expense_id 
      AND (expenses.user_id = auth.uid() OR expenses.owner_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own expense items" ON expense_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM expenses 
      WHERE expenses.id = expense_items.expense_id 
      AND (expenses.user_id = auth.uid() OR expenses.owner_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete own expense items" ON expense_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM expenses 
      WHERE expenses.id = expense_items.expense_id 
      AND (expenses.user_id = auth.uid() OR expenses.owner_id = auth.uid())
    )
  );

-- Add index for faster RLS checks
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_owner_id ON expenses(owner_id);

-- Verify tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'expense_items') THEN
    RAISE NOTICE '✅ expense_items table exists';
  ELSE
    RAISE NOTICE '❌ expense_items table NOT found - run expenses.sql first!';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'expenses') THEN
    RAISE NOTICE '✅ expenses table exists';
  ELSE
    RAISE NOTICE '❌ expenses table NOT found';
  END IF;
END $$;

-- Check if columns exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'user_id'
  ) THEN
    RAISE NOTICE '✅ expenses.user_id column exists';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'owner_id'
  ) THEN
    RAISE NOTICE '✅ expenses.owner_id column exists';
  END IF;
  
  RAISE NOTICE '✅ RLS Policies for expense_items have been fixed!';
END $$;
