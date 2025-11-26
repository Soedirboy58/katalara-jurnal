-- =====================================================
-- INVENTORY DOMAIN - HEALTH CHECK & DEBUG SCRIPT
-- Purpose: Validate deployment & test functionality
-- Version: 1.0
-- =====================================================

\echo '================================================='
\echo 'INVENTORY DOMAIN - HEALTH CHECK'
\echo '================================================='
\echo ''

-- =====================================================
-- SECTION 1: TABLE EXISTENCE
-- =====================================================
\echo '1️⃣  CHECKING TABLES...'
\echo ''

SELECT 
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ All tables exist'
    ELSE '❌ Missing tables: ' || (2 - COUNT(*))::TEXT
  END AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('products', 'product_stock_movements');

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('products', 'product_stock_movements')
ORDER BY table_name;

\echo ''

-- =====================================================
-- SECTION 2: RLS STATUS
-- =====================================================
\echo '2️⃣  CHECKING RLS (Row Level Security)...'
\echo ''

SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('products', 'product_stock_movements')
ORDER BY tablename;

\echo ''

-- =====================================================
-- SECTION 3: POLICIES
-- =====================================================
\echo '3️⃣  CHECKING RLS POLICIES...'
\echo ''

SELECT 
  tablename,
  policyname,
  cmd AS operation
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('products', 'product_stock_movements')
ORDER BY tablename, policyname;

SELECT 
  tablename,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('products', 'product_stock_movements')
GROUP BY tablename
ORDER BY tablename;

\echo ''

-- =====================================================
-- SECTION 4: FUNCTIONS
-- =====================================================
\echo '4️⃣  CHECKING FUNCTIONS...'
\echo ''

SELECT 
  routine_name AS function_name,
  routine_type AS type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_product_updated_at',
    'generate_product_sku',
    'get_current_stock',
    'get_low_stock_products',
    'get_product_profit_margin',
    'get_product_summary',
    'record_stock_movement',
    'get_product_stock_history',
    'get_stock_summary_by_product',
    'validate_stock_before_out'
  )
ORDER BY routine_name;

SELECT 
  CASE 
    WHEN COUNT(*) >= 9 THEN '✅ All functions exist (' || COUNT(*) || '/9)'
    ELSE '❌ Missing functions: ' || (9 - COUNT(*))::TEXT
  END AS status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_product_updated_at',
    'generate_product_sku',
    'get_current_stock',
    'get_low_stock_products',
    'get_product_profit_margin',
    'get_product_summary',
    'record_stock_movement',
    'get_product_stock_history',
    'get_stock_summary_by_product',
    'validate_stock_before_out'
  );

\echo ''

-- =====================================================
-- SECTION 5: INDEXES
-- =====================================================
\echo '5️⃣  CHECKING INDEXES...'
\echo ''

SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('products', 'product_stock_movements')
ORDER BY tablename, indexname;

SELECT 
  tablename,
  COUNT(*) AS index_count
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('products', 'product_stock_movements')
GROUP BY tablename
ORDER BY tablename;

\echo ''

-- =====================================================
-- SECTION 6: CONSTRAINTS
-- =====================================================
\echo '6️⃣  CHECKING CONSTRAINTS...'
\echo ''

SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('products', 'product_stock_movements')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

SELECT 
  table_name,
  COUNT(*) AS constraint_count
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name IN ('products', 'product_stock_movements')
GROUP BY table_name
ORDER BY table_name;

\echo ''

-- =====================================================
-- SECTION 7: VIEWS
-- =====================================================
\echo '7️⃣  CHECKING VIEWS...'
\echo ''

SELECT 
  table_name AS view_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN (
    'active_products_list',
    'products_with_metrics',
    'recent_stock_movements'
  )
ORDER BY table_name;

SELECT 
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ All views exist (' || COUNT(*) || '/3)'
    ELSE '❌ Missing views: ' || (3 - COUNT(*)::TEXT)
  END AS status
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN (
    'active_products_list',
    'products_with_metrics',
    'recent_stock_movements'
  );

\echo ''

-- =====================================================
-- SECTION 8: SAMPLE DATA TEST (if you have test data)
-- =====================================================
\echo '8️⃣  DATA OVERVIEW...'
\echo ''

SELECT 
  'products' AS table_name,
  COUNT(*) AS row_count,
  COUNT(DISTINCT user_id) AS unique_users,
  COUNT(*) FILTER (WHERE is_active = TRUE) AS active_count,
  COUNT(*) FILTER (WHERE track_inventory = TRUE) AS tracked_count
FROM products;

SELECT 
  'product_stock_movements' AS table_name,
  COUNT(*) AS total_movements,
  COUNT(DISTINCT product_id) AS unique_products,
  COUNT(*) FILTER (WHERE movement_type = 'in') AS in_movements,
  COUNT(*) FILTER (WHERE movement_type = 'out') AS out_movements,
  COUNT(*) FILTER (WHERE movement_type = 'adjust') AS adjust_movements
FROM product_stock_movements;

\echo ''

-- =====================================================
-- SECTION 9: FUNCTIONAL TEST (create → record → check)
-- =====================================================
\echo '9️⃣  FUNCTIONAL TEST (if authenticated)...'
\echo ''
\echo '   To test: Run following SQL after login:'
\echo ''
\echo '   -- Create test product'
\echo '   INSERT INTO products (user_id, name, category, unit, cost_price, selling_price, track_inventory, min_stock_alert)'
\echo '   VALUES (auth.uid(), ''Test Product'', ''test'', ''pcs'', 10000, 15000, TRUE, 5);'
\echo ''
\echo '   -- Record stock in'
\echo '   SELECT record_stock_movement('
\echo '     (SELECT id FROM products WHERE name = ''Test Product'' AND user_id = auth.uid() LIMIT 1),'
\echo '     50, ''in'', ''manual'', NULL, ''Initial stock'');'
\echo ''
\echo '   -- Check current stock'
\echo '   SELECT get_current_stock('
\echo '     (SELECT id FROM products WHERE name = ''Test Product'' AND user_id = auth.uid() LIMIT 1));'
\echo '   -- Expected: 50'
\echo ''
\echo '   -- Record stock out'
\echo '   SELECT record_stock_movement('
\echo '     (SELECT id FROM products WHERE name = ''Test Product'' AND user_id = auth.uid() LIMIT 1),'
\echo '     10, ''out'', ''manual'', NULL, ''Test sale'');'
\echo ''
\echo '   -- Check current stock again'
\echo '   SELECT get_current_stock('
\echo '     (SELECT id FROM products WHERE name = ''Test Product'' AND user_id = auth.uid() LIMIT 1));'
\echo '   -- Expected: 40'
\echo ''
\echo '   -- Clean up'
\echo '   DELETE FROM products WHERE name = ''Test Product'' AND user_id = auth.uid();'
\echo ''

-- =====================================================
-- SECTION 10: PERFORMANCE CHECK
-- =====================================================
\echo '🔟 PERFORMANCE CHECK...'
\echo ''
\echo '   Sample queries with EXPLAIN ANALYZE:'
\echo ''

-- Only run if products table has data
DO $$
DECLARE
  product_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO product_count FROM products LIMIT 1;
  
  IF product_count > 0 THEN
    RAISE NOTICE 'Products exist - run EXPLAIN ANALYZE manually:';
    RAISE NOTICE '';
    RAISE NOTICE 'EXPLAIN ANALYZE SELECT * FROM active_products_list LIMIT 100;';
    RAISE NOTICE 'EXPLAIN ANALYZE SELECT * FROM products_with_metrics LIMIT 100;';
    RAISE NOTICE 'EXPLAIN ANALYZE SELECT * FROM recent_stock_movements LIMIT 100;';
  ELSE
    RAISE NOTICE 'No products found - skipping performance tests';
  END IF;
END $$;

\echo ''

-- =====================================================
-- SECTION 11: SUMMARY
-- =====================================================
\echo '================================================='
\echo 'HEALTH CHECK SUMMARY'
\echo '================================================='
\echo ''

SELECT 
  '✅ INVENTORY Domain Health Check Complete' AS status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('products', 'product_stock_movements')) AS tables_count,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('products', 'product_stock_movements')) AS policies_count,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN (
    'update_product_updated_at', 'generate_product_sku', 'get_current_stock',
    'get_low_stock_products', 'get_product_profit_margin', 'get_product_summary',
    'record_stock_movement', 'get_product_stock_history', 'get_stock_summary_by_product',
    'validate_stock_before_out'
  )) AS functions_count,
  (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public' AND table_name IN (
    'active_products_list', 'products_with_metrics', 'recent_stock_movements'
  )) AS views_count,
  (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('products', 'product_stock_movements')) AS indexes_count;

\echo ''
\echo 'Next Steps:'
\echo '1. Run functional test (Section 9) after authentication'
\echo '2. Run performance check (Section 10) with sample data'
\echo '3. Deploy FINANCE & STOREFRONT domains (they depend on INVENTORY)'
\echo '4. Test integration (income_items.product_id, storefront_products.product_id)'
\echo ''
\echo '================================================='
\echo 'END OF HEALTH CHECK'
\echo '================================================='
