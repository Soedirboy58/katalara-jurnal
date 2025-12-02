-- =====================================================
-- DIAGNOSTIC: Check Products Table Schema Status
-- Purpose: Identify which migration is needed
-- =====================================================

-- 1. List all columns in products table
SELECT 
  '1. CURRENT COLUMNS' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- 2. Check for duplicate/conflicting columns
SELECT 
  '2. CONFLICTING COLUMNS CHECK' as section,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sell_price')
    THEN '⚠️ sell_price EXISTS (should be selling_price)'
    ELSE '✅ sell_price removed'
  END as sell_price_status,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'selling_price')
    THEN '✅ selling_price EXISTS'
    ELSE '❌ selling_price MISSING'
  END as selling_price_status,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'buy_price')
    THEN '⚠️ buy_price EXISTS (should be cost_price)'
    ELSE '✅ buy_price removed'
  END as buy_price_status,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'cost_price')
    THEN '✅ cost_price EXISTS'
    ELSE '❌ cost_price MISSING'
  END as cost_price_status,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'price')
    THEN '⚠️ price EXISTS (ambiguous - should be removed)'
    ELSE '✅ price removed'
  END as price_status,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock_quantity')
    THEN '⚠️ stock_quantity EXISTS (should be removed)'
    ELSE '✅ stock_quantity removed'
  END as stock_quantity_status;

-- 3. Sample data to see current values
SELECT 
  '3. SAMPLE DATA' as section,
  id,
  name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'price')
    THEN 'Has price column'
    ELSE 'No price column'
  END as price_check,
  unit,
  stock,
  created_at
FROM products
LIMIT 5;

-- 4. Check if backup exists
SELECT 
  '4. BACKUP CHECK' as section,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products_backup_pre_standardization')
    THEN '✅ Backup exists'
    ELSE '❌ No backup found'
  END as backup_status;

-- 5. Recommendation
DO $$
DECLARE
  has_conflicts BOOLEAN;
  needs_migration BOOLEAN;
BEGIN
  -- Check for conflicting columns
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name IN ('sell_price', 'buy_price', 'stock_quantity', 'price')
  ) INTO has_conflicts;
  
  -- Check for missing columns
  SELECT NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name IN ('selling_price', 'cost_price')
  ) INTO needs_migration;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DIAGNOSIS RESULT';
  RAISE NOTICE '========================================';
  
  IF has_conflicts THEN
    RAISE NOTICE '⚠️ CONFLICTING COLUMNS DETECTED';
    RAISE NOTICE '📝 Action: Run fix-products-schema-conflicts.sql';
  ELSIF needs_migration THEN
    RAISE NOTICE '⚠️ MISSING REQUIRED COLUMNS';
    RAISE NOTICE '📝 Action: Run standardize-products-schema.sql';
  ELSE
    RAISE NOTICE '✅ SCHEMA IS CLEAN';
    RAISE NOTICE '📝 Action: Force reload schema cache';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- 6. SOLUTION: Force reload schema cache
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

SELECT '✅ Schema cache reload triggered' as result;
