-- =====================================================
-- DOMAIN: INVENTORY
-- FILE: products.policies.sql
-- PURPOSE: Row Level Security untuk products
-- =====================================================

-- =====================================================
-- ENABLE RLS
-- =====================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICY: Users can view their own products
-- =====================================================
DROP POLICY IF EXISTS products_select_own ON products;
CREATE POLICY products_select_own ON products
  FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- POLICY: Users can insert their own products
-- =====================================================
DROP POLICY IF EXISTS products_insert_own ON products;
CREATE POLICY products_insert_own ON products
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- POLICY: Users can update their own products
-- =====================================================
DROP POLICY IF EXISTS products_update_own ON products;
CREATE POLICY products_update_own ON products
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- POLICY: Users can delete their own products
-- =====================================================
DROP POLICY IF EXISTS products_delete_own ON products;
CREATE POLICY products_delete_own ON products
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON POLICY products_select_own ON products IS 'Users can only view their own products';
COMMENT ON POLICY products_insert_own ON products IS 'Users can only insert products with their user_id';
COMMENT ON POLICY products_update_own ON products IS 'Users can only update their own products';
COMMENT ON POLICY products_delete_own ON products IS 'Users can only delete their own products';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Inventory Domain - Products Policies Created';
  RAISE NOTICE '   - RLS enabled on products table';
  RAISE NOTICE '   - 4 Policies: SELECT, INSERT, UPDATE, DELETE (user isolation)';
END $$;
