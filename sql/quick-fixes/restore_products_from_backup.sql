-- =====================================================
-- RESTORE PRODUCTS FROM BACKUP
-- Quick fix - restore data back to products table
-- =====================================================

BEGIN;

-- Check if products table exists and is empty
DO $$
DECLARE
  product_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO product_count FROM products;
  RAISE NOTICE '📊 Current products table: % rows', product_count;
END $$;

-- Restore data from backup
INSERT INTO products (
  id,
  user_id,
  name,
  category,
  unit,
  cost_price,
  selling_price,
  stock,
  min_stock_alert,
  track_inventory,
  is_active,
  created_at,
  updated_at
)
SELECT 
  id,
  user_id,
  name,
  category,
  unit,
  cost_price,
  selling_price,
  stock,
  min_stock_alert,
  track_inventory,
  is_active,
  created_at,
  updated_at
FROM products_backup_current_schema
WHERE is_active = true;

-- Verify
DO $$
DECLARE
  restored_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO restored_count FROM products;
  RAISE NOTICE '✅ Products restored: % rows', restored_count;
END $$;

-- Show restored data
SELECT 
  name,
  cost_price,
  selling_price,
  unit,
  stock,
  is_active
FROM products
ORDER BY name;

COMMIT;

-- Success message
SELECT '✅ DATA RESTORED!' as status,
       'Run check-all-product-tables.mjs to verify' as next_step;
