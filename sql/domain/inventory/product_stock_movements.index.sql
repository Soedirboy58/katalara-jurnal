-- =====================================================
-- DOMAIN: INVENTORY
-- FILE: product_stock_movements.index.sql
-- PURPOSE: Performance indexes & constraints untuk stock movements
-- =====================================================

-- =====================================================
-- INDEXES: Performance Optimization
-- =====================================================

-- Product-based queries (primary filter)
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON product_stock_movements(product_id);

-- Movement type filtering
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON product_stock_movements(movement_type);

-- Reference tracking (untuk link ke income/expense)
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference ON product_stock_movements(reference_type, reference_id) 
  WHERE reference_type IS NOT NULL;

-- Timestamp queries (chronological sorting)
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON product_stock_movements(created_at DESC);

-- Composite: product + timestamp (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_time ON product_stock_movements(product_id, created_at DESC);

-- User audit trail (who created the movement)
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_by ON product_stock_movements(created_by) 
  WHERE created_by IS NOT NULL;

-- =====================================================
-- CONSTRAINTS: Data Validation
-- =====================================================

-- Movement type validation (already in schema, reinforced here)
ALTER TABLE product_stock_movements DROP CONSTRAINT IF EXISTS stock_movements_type_valid;
ALTER TABLE product_stock_movements ADD CONSTRAINT stock_movements_type_valid 
  CHECK (movement_type IN ('in', 'out', 'adjust'));

-- Quantity must be positive
ALTER TABLE product_stock_movements DROP CONSTRAINT IF EXISTS stock_movements_quantity_positive;
ALTER TABLE product_stock_movements ADD CONSTRAINT stock_movements_quantity_positive 
  CHECK (quantity > 0);

-- Reference type validation
ALTER TABLE product_stock_movements DROP CONSTRAINT IF EXISTS stock_movements_reference_type_valid;
ALTER TABLE product_stock_movements ADD CONSTRAINT stock_movements_reference_type_valid 
  CHECK (reference_type IS NULL OR reference_type IN ('income', 'expense', 'manual', 'adjustment', 'return', 'transfer'));

-- If reference_type provided, reference_id must be provided too
ALTER TABLE product_stock_movements DROP CONSTRAINT IF EXISTS stock_movements_reference_consistency;
ALTER TABLE product_stock_movements ADD CONSTRAINT stock_movements_reference_consistency 
  CHECK (
    (reference_type IS NULL AND reference_id IS NULL) OR
    (reference_type IS NOT NULL AND reference_id IS NOT NULL)
  );

-- Note length limit (prevent abuse)
ALTER TABLE product_stock_movements DROP CONSTRAINT IF EXISTS stock_movements_note_length;
ALTER TABLE product_stock_movements ADD CONSTRAINT stock_movements_note_length 
  CHECK (note IS NULL OR LENGTH(note) <= 1000);

-- =====================================================
-- COMMENTS ON INDEXES
-- =====================================================
COMMENT ON INDEX idx_stock_movements_product_id IS 'Primary filter: movements by product';
COMMENT ON INDEX idx_stock_movements_type IS 'Filter by movement type (in/out/adjust)';
COMMENT ON INDEX idx_stock_movements_reference IS 'Link to source transactions (income/expense)';
COMMENT ON INDEX idx_stock_movements_created_at IS 'Chronological sorting (newest first)';
COMMENT ON INDEX idx_stock_movements_product_time IS 'Composite for product history queries';
COMMENT ON INDEX idx_stock_movements_created_by IS 'Audit trail: who made the movement';

-- =====================================================
-- STATISTICS
-- =====================================================
DO $$
DECLARE
  index_count INTEGER;
  constraint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE tablename = 'product_stock_movements';
  
  SELECT COUNT(*) INTO constraint_count
  FROM pg_constraint
  WHERE conrelid = 'product_stock_movements'::regclass;
  
  RAISE NOTICE '✅ Inventory Domain - Product Stock Movements Indexes & Constraints Created';
  RAISE NOTICE '   - % Indexes created for performance', index_count;
  RAISE NOTICE '   - % Constraints created for data validation', constraint_count;
  RAISE NOTICE '   - Optimized for: product history, reference tracking, audit trail';
END $$;
