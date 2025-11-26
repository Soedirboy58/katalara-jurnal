-- =====================================================
-- DOMAIN: INVENTORY
-- FILE: product_stock_movements.policies.sql
-- PURPOSE: Row Level Security untuk stock movements
-- =====================================================

-- =====================================================
-- ENABLE RLS
-- =====================================================
ALTER TABLE product_stock_movements ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICY: Users can view stock movements of their own products
-- =====================================================
DROP POLICY IF EXISTS stock_movements_select_own ON product_stock_movements;
CREATE POLICY stock_movements_select_own ON product_stock_movements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_stock_movements.product_id
        AND products.user_id = auth.uid()
    )
  );

-- =====================================================
-- POLICY: Users can insert stock movements for their own products
-- =====================================================
DROP POLICY IF EXISTS stock_movements_insert_own ON product_stock_movements;
CREATE POLICY stock_movements_insert_own ON product_stock_movements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_stock_movements.product_id
        AND products.user_id = auth.uid()
    )
  );

-- =====================================================
-- POLICY: No UPDATE allowed (append-only log)
-- Stock movements are immutable once created
-- =====================================================
COMMENT ON TABLE product_stock_movements IS 'IMMUTABLE: Stock movements cannot be updated or deleted - append-only audit trail';

-- =====================================================
-- POLICY: No DELETE allowed (append-only log)
-- Use adjustment movements to correct errors
-- =====================================================
COMMENT ON COLUMN product_stock_movements.movement_type IS 'Use "adjust" movement type to correct errors, never delete movements';

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON POLICY stock_movements_select_own ON product_stock_movements IS 'Users can only view stock movements of their own products';
COMMENT ON POLICY stock_movements_insert_own ON product_stock_movements IS 'Users can only insert stock movements for their own products';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Inventory Domain - Product Stock Movements Policies Created';
  RAISE NOTICE '   - RLS enabled on product_stock_movements table';
  RAISE NOTICE '   - 2 Policies: SELECT, INSERT (via product ownership)';
  RAISE NOTICE '   - IMMUTABLE: No UPDATE/DELETE allowed (append-only log)';
END $$;
