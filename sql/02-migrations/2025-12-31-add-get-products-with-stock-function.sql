-- =====================================================
-- MIGRATION: Add get_products_with_stock RPC function
-- DATE: 2025-12-31
-- PURPOSE: Efficient query untuk ambil products + current stock dalam satu call
-- FEATURE: Product Synchronization (Input-Expense ↔ Products ↔ Input-Income)
-- =====================================================

-- =====================================================
-- FUNCTION: get_products_with_stock()
-- Returns products with current stock and stock status
-- Used by input-expense and input-income dropdowns
-- =====================================================
CREATE OR REPLACE FUNCTION get_products_with_stock(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  sku TEXT,
  category TEXT,
  unit TEXT,
  cost_price NUMERIC(15,2),
  selling_price NUMERIC(15,2),
  current_stock INTEGER,
  min_stock_alert INTEGER,
  stock_status TEXT,
  is_active BOOLEAN,
  track_inventory BOOLEAN
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.sku,
    p.category,
    p.unit,
    p.cost_price,
    p.selling_price,
    COALESCE(get_current_stock(p.id), 0) AS current_stock,
    p.min_stock_alert,
    CASE 
      WHEN NOT p.track_inventory THEN 'not_tracked'
      WHEN get_current_stock(p.id) <= 0 THEN 'out_of_stock'
      WHEN get_current_stock(p.id) < p.min_stock_alert THEN 'low_stock'
      ELSE 'sufficient'
    END AS stock_status,
    p.is_active,
    p.track_inventory
  FROM products p
  WHERE p.user_id = p_user_id
    AND p.is_active = TRUE
  ORDER BY p.name ASC;
END;
$$;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION get_products_with_stock(UUID) IS 
'Get all active products with current stock and stock status for a user. Used in input-expense and input-income forms.';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Migration: get_products_with_stock() function created';
  RAISE NOTICE '   - Returns: products with current stock, stock status';
  RAISE NOTICE '   - Used by: input-expense, input-income forms';
  RAISE NOTICE '   - Performance: Single query with stock calculation';
END $$;
