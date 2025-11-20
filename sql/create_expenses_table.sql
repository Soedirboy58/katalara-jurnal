-- ============================================================================
-- UPDATE EXPENSES TABLE - Add new columns for tempo/hutang tracking
-- ============================================================================
-- Table sudah ada dengan owner_id, kita ADD kolom baru tanpa DROP data lama
-- ============================================================================

-- 1. ADD NEW COLUMNS (if not exists)
-- ============================================================================

-- Add user_id column (untuk consistency dengan API)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'expenses' AND column_name = 'user_id') THEN
    ALTER TABLE expenses ADD COLUMN user_id UUID;
  END IF;
END $$;

-- Migrate data: Copy owner_id → user_id
UPDATE expenses SET user_id = owner_id WHERE user_id IS NULL;

-- Add payment_type column (for tempo tracking: cash, tempo_7, tempo_14, tempo_30)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'expenses' AND column_name = 'payment_type') THEN
    ALTER TABLE expenses ADD COLUMN payment_type TEXT DEFAULT 'cash';
  END IF;
END $$;

-- Add due_date column (for tempo/hutang deadline)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'expenses' AND column_name = 'due_date') THEN
    ALTER TABLE expenses ADD COLUMN due_date DATE;
  END IF;
END $$;

-- 2. UPDATE EXISTING DATA (set defaults)
-- ============================================================================
UPDATE expenses 
SET payment_type = 'cash' 
WHERE payment_type IS NULL;

-- 3. ADD NEW INDEXES (if not exists)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_status ON expenses(payment_status);
CREATE INDEX IF NOT EXISTS idx_expenses_due_date ON expenses(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_payment_type ON expenses(payment_type);

-- 4. UPDATE RLS POLICIES (support both owner_id and user_id)
-- ============================================================================
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;

-- Create new policies (backward compatible)
CREATE POLICY "Users can view own expenses" 
  ON expenses FOR SELECT 
  USING (auth.uid() = owner_id OR auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses" 
  ON expenses FOR INSERT 
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" 
  ON expenses FOR UPDATE 
  USING (auth.uid() = owner_id OR auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" 
  ON expenses FOR DELETE 
  USING (auth.uid() = owner_id OR auth.uid() = user_id);

-- 5. COMMENTS
-- ============================================================================
COMMENT ON COLUMN expenses.payment_type IS 'Payment type: cash, tempo_7, tempo_14, tempo_30';
COMMENT ON COLUMN expenses.due_date IS 'Due date for tempo/hutang, NULL for cash';
COMMENT ON COLUMN expenses.user_id IS 'User ID (alias of owner_id for API compatibility)';

-- ============================================================================
-- VERIFY (Uncomment untuk test)
-- ============================================================================
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'expenses' 
-- ORDER BY ordinal_position;

-- SELECT COUNT(*), SUM(amount) as total FROM expenses;
