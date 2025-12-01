-- =====================================================
-- VERIFY PRODUCTS TABLE SCHEMA
-- Run this in Supabase SQL Editor to confirm structure
-- =====================================================

-- 1. Check if products is a VIEW or TABLE
SELECT 
  schemaname,
  tablename as name,
  'TABLE' as type
FROM pg_tables 
WHERE tablename = 'products'
UNION ALL
SELECT 
  schemaname,
  viewname as name,
  'VIEW' as type
FROM pg_views 
WHERE viewname = 'products'
ORDER BY type;

-- 2. List ALL columns in products table
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable,
  CASE 
    WHEN column_name IN ('cost_price', 'selling_price', 'min_stock_alert', 'user_id', 'unit') 
    THEN '✅ EXPECTED'
    WHEN column_name IN ('sell_price', 'buy_price', 'stock_quantity', 'min_stock', 'owner_id', 'stock_unit')
    THEN '❌ OLD/WRONG'
    ELSE '🔵 OTHER'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'products'
ORDER BY ordinal_position;

-- 3. Check for duplicate columns or aliases
SELECT 
  COUNT(*) as total_columns,
  COUNT(DISTINCT column_name) as unique_columns
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'products';

-- 4. Verify expected columns exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'products' AND column_name = 'cost_price') 
    THEN '✅ cost_price exists'
    ELSE '❌ cost_price MISSING'
  END as cost_price_check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'products' AND column_name = 'selling_price') 
    THEN '✅ selling_price exists'
    ELSE '❌ selling_price MISSING'
  END as selling_price_check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'products' AND column_name = 'stock_quantity') 
    THEN '⚠️ stock_quantity exists (should NOT)'
    ELSE '✅ stock_quantity absent (CORRECT)'
  END as stock_quantity_check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'products' AND column_name = 'min_stock_alert') 
    THEN '✅ min_stock_alert exists'
    ELSE '❌ min_stock_alert MISSING'
  END as min_stock_alert_check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'products' AND column_name = 'user_id') 
    THEN '✅ user_id exists'
    ELSE '❌ user_id MISSING'
  END as user_id_check;

-- 5. Check table constraints
SELECT
  con.conname as constraint_name,
  con.contype as constraint_type,
  CASE con.contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'c' THEN 'CHECK'
    WHEN 'u' THEN 'UNIQUE'
    ELSE con.contype::text
  END as type_description
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
  AND rel.relname = 'products';

-- 6. Sample data (if any exists)
-- Note: This query will fail if migration not run yet (columns don't exist)
DO $$ 
BEGIN
  -- Try to query with new column names
  PERFORM id, name, cost_price, selling_price, created_at
  FROM products
  LIMIT 1;
  
  RAISE NOTICE '✅ Query successful - all expected columns exist';
EXCEPTION
  WHEN undefined_column THEN
    RAISE NOTICE '⚠️ Migration needed - some columns missing';
END $$;

-- =====================================================
-- EXPECTED RESULTS:
-- =====================================================
-- Query 1: Should show 'TABLE' (not VIEW)
-- Query 2: Should list columns with ✅ EXPECTED status for:
--   - cost_price
--   - selling_price  
--   - min_stock_alert
--   - user_id
--   - unit
-- Query 3: Should show NO duplicate columns
-- Query 4: All checks should be ✅ (green)
-- Query 5: Should show PRIMARY KEY, FOREIGN KEY, CHECK constraints
-- Query 6: Sample products with cost_price and selling_price
