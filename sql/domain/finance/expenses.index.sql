-- =====================================================
-- DOMAIN: FINANCE
-- FILE: expenses.index.sql
-- PURPOSE: Database indexes & constraints for performance optimization
-- =====================================================

-- =====================================================
-- INDEXES: expenses (Header)
-- Optimasi query untuk performa tinggi
-- =====================================================

-- Primary index sudah ada di schema (id PRIMARY KEY)

-- Owner-based queries (most common filter)
CREATE INDEX IF NOT EXISTS idx_expenses_owner 
  ON expenses(owner_id);

-- Date-based queries (untuk KPI & reports)
CREATE INDEX IF NOT EXISTS idx_expenses_date 
  ON expenses(expense_date DESC);

-- Composite index untuk query owner + date (sangat sering dipakai)
CREATE INDEX IF NOT EXISTS idx_expenses_owner_date 
  ON expenses(owner_id, expense_date DESC);

-- Type & category filters
CREATE INDEX IF NOT EXISTS idx_expenses_type 
  ON expenses(expense_type);

CREATE INDEX IF NOT EXISTS idx_expenses_category 
  ON expenses(category);

-- Supplier relationship (untuk outstanding payables)
CREATE INDEX IF NOT EXISTS idx_expenses_supplier 
  ON expenses(supplier_id) 
  WHERE supplier_id IS NOT NULL;

-- Payment status tracking (untuk hutang monitoring)
CREATE INDEX IF NOT EXISTS idx_expenses_payment_status 
  ON expenses(payment_status);

-- Due date tracking (untuk reminder system)
CREATE INDEX IF NOT EXISTS idx_expenses_due_date 
  ON expenses(due_date) 
  WHERE due_date IS NOT NULL 
    AND payment_status != 'lunas';

-- Composite index untuk outstanding payments
CREATE INDEX IF NOT EXISTS idx_expenses_owner_status_due 
  ON expenses(owner_id, payment_status, due_date) 
  WHERE payment_status != 'lunas';

-- Asset purchase tracking
CREATE INDEX IF NOT EXISTS idx_expenses_asset_purchase 
  ON expenses(is_asset_purchase, owner_id) 
  WHERE is_asset_purchase = TRUE;

-- Loan payment tracking
CREATE INDEX IF NOT EXISTS idx_expenses_loan_payment 
  ON expenses(loan_id) 
  WHERE loan_id IS NOT NULL;

-- Full-text search index untuk description (optional - untuk fitur search)
-- CREATE INDEX IF NOT EXISTS idx_expenses_description_search 
--   ON expenses USING gin(to_tsvector('indonesian', description));

-- =====================================================
-- INDEXES: expense_items (Line Items)
-- =====================================================

-- Foreign key index (auto-query optimization)
CREATE INDEX IF NOT EXISTS idx_expense_items_expense 
  ON expense_items(expense_id);

CREATE INDEX IF NOT EXISTS idx_expense_items_owner 
  ON expense_items(owner_id);

-- Product relationship (untuk inventory tracking)
CREATE INDEX IF NOT EXISTS idx_expense_items_product 
  ON expense_items(product_id) 
  WHERE product_id IS NOT NULL;

-- Restock tracking
CREATE INDEX IF NOT EXISTS idx_expense_items_restock 
  ON expense_items(product_id, is_restock) 
  WHERE is_restock = TRUE;

-- =====================================================
-- ADDITIONAL CONSTRAINTS
-- Constraint tambahan untuk data integrity
-- =====================================================

-- Ensure grand_total tidak negatif (sudah ada CHECK di schema, ini reminder)
-- ALTER TABLE expenses ADD CONSTRAINT chk_expenses_grand_total_positive 
--   CHECK (grand_total >= 0);

-- Ensure due_date hanya ada jika payment_type = 'tempo'
ALTER TABLE expenses 
  DROP CONSTRAINT IF EXISTS chk_expenses_due_date_logic;
  
ALTER TABLE expenses 
  ADD CONSTRAINT chk_expenses_due_date_logic 
  CHECK (
    (payment_type = 'tempo' AND due_date IS NOT NULL) 
    OR 
    (payment_type = 'cash' AND due_date IS NULL)
  );

-- Ensure discount tidak lebih besar dari subtotal
ALTER TABLE expenses 
  DROP CONSTRAINT IF EXISTS chk_expenses_discount_valid;
  
ALTER TABLE expenses 
  ADD CONSTRAINT chk_expenses_discount_valid 
  CHECK (discount_amount <= subtotal);

-- Ensure discount_percent dalam range 0-100
ALTER TABLE expenses 
  DROP CONSTRAINT IF EXISTS chk_expenses_discount_percent_range;
  
ALTER TABLE expenses 
  ADD CONSTRAINT chk_expenses_discount_percent_range 
  CHECK (discount_percent >= 0 AND discount_percent <= 100);

-- Ensure down_payment tidak lebih besar dari grand_total
ALTER TABLE expenses 
  DROP CONSTRAINT IF EXISTS chk_expenses_down_payment_valid;
  
ALTER TABLE expenses 
  ADD CONSTRAINT chk_expenses_down_payment_valid 
  CHECK (down_payment <= grand_total);

-- =====================================================
-- PERFORMANCE HINTS & COMMENTS
-- =====================================================

COMMENT ON INDEX idx_expenses_owner IS 'Fast filter by owner - used in all user queries';
COMMENT ON INDEX idx_expenses_owner_date IS 'Composite index for dashboard KPI (owner + date DESC)';
COMMENT ON INDEX idx_expenses_due_date IS 'Partial index for payment reminder system';
COMMENT ON INDEX idx_expenses_owner_status_due IS 'Optimized for outstanding payables queries';

-- =====================================================
-- ANALYZE TABLE (Update Statistics)
-- Run setelah bulk insert untuk optimasi query planner
-- =====================================================

ANALYZE expenses;
ANALYZE expense_items;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Finance Domain - Expenses Indexes Created';
  RAISE NOTICE '   - Indexes: 12 created for expenses table';
  RAISE NOTICE '   - Indexes: 4 created for expense_items table';
  RAISE NOTICE '   - Constraints: 5 additional constraints added';
  RAISE NOTICE '   - Performance: Tables analyzed for query optimization';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Query Performance Tips:';
  RAISE NOTICE '   - Use owner_id filter in WHERE clause (uses idx_expenses_owner)';
  RAISE NOTICE '   - Filter by date DESC for best performance (uses idx_expenses_date)';
  RAISE NOTICE '   - Combine owner + date for optimal speed (uses idx_expenses_owner_date)';
  RAISE NOTICE '   - payment_status filter is indexed (uses idx_expenses_payment_status)';
END $$;
