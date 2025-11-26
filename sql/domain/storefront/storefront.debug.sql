-- ============================================================================
-- STOREFRONT DOMAIN - DEBUG & HEALTH CHECK
-- File: storefront.debug.sql
-- Purpose: Comprehensive health check and diagnostic queries
-- ============================================================================
-- Usage:
--   psql -f sql/domain/storefront/storefront.debug.sql
--
-- Sections:
--   01. Domain Overview
--   02-05. Entity Health (storefronts, products, analytics, carts)
--   06-09. Index Usage
--   10-13. Constraint Validation
--   14-17. RLS Policy Tests
--   18. Function Smoke Tests
--   19. View Validation
--   20. Performance Analysis
-- ============================================================================

\set QUIET on
\pset border 2
\pset format wrapped
\timing on

\echo '========================================================================'
\echo 'STOREFRONT DOMAIN - HEALTH CHECK'
\echo 'Version: 1.0'
\echo 'Date:' `date`
\echo '========================================================================'
\echo ''

-- ============================================================================
-- SECTION 01: DOMAIN OVERVIEW
-- ============================================================================
\echo '========================================================================'
\echo 'SECTION 01: DOMAIN OVERVIEW'
\echo '========================================================================'

\echo '-- Tables Status:'
SELECT 
    schemaname,
    tablename,
    CASE WHEN rowsecurity THEN '✓ ENABLED' ELSE '✗ DISABLED' END AS rls_status,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size
FROM pg_tables
WHERE schemaname = 'public'
  AND (tablename LIKE '%storefront%' OR tablename LIKE 'business_storefronts' OR tablename = 'cart_sessions')
ORDER BY tablename;

\echo ''
\echo '-- Row Counts:'
SELECT 
    'business_storefronts' AS table_name,
    COUNT(*) AS row_count,
    COUNT(*) FILTER (WHERE is_active = true) AS active_count,
    COUNT(*) FILTER (WHERE is_active = false) AS inactive_count
FROM business_storefronts
UNION ALL
SELECT 
    'storefront_products',
    COUNT(*),
    COUNT(*) FILTER (WHERE is_visible = true),
    COUNT(*) FILTER (WHERE is_visible = false)
FROM storefront_products
UNION ALL
SELECT 
    'storefront_analytics',
    COUNT(*),
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'),
    COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '30 days')
FROM storefront_analytics
UNION ALL
SELECT 
    'cart_sessions',
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'active'),
    COUNT(*) FILTER (WHERE status IN ('checked_out', 'abandoned'))
FROM cart_sessions;

-- ============================================================================
-- SECTION 02: business_storefronts HEALTH
-- ============================================================================
\echo ''
\echo '========================================================================'
\echo 'SECTION 02: business_storefronts HEALTH'
\echo '========================================================================'

\echo '-- Constraint Validation:'
SELECT 
    COUNT(*) AS total_storefronts,
    COUNT(*) FILTER (WHERE slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$') AS valid_slugs,
    COUNT(*) FILTER (WHERE whatsapp_number ~ '^62[0-9]{8,13}$') AS valid_whatsapp,
    COUNT(*) FILTER (WHERE theme_color ~ '^#[0-9A-Fa-f]{6}$') AS valid_theme_colors,
    COUNT(*) FILTER (WHERE total_views >= 0 AND total_clicks >= 0) AS valid_analytics
FROM business_storefronts;

\echo ''
\echo '-- Duplicate Checks:'
SELECT 
    slug,
    COUNT(*) AS duplicate_count
FROM business_storefronts
GROUP BY slug
HAVING COUNT(*) > 1;

SELECT 
    user_id,
    COUNT(*) AS storefront_count
FROM business_storefronts
GROUP BY user_id
HAVING COUNT(*) > 1;

\echo ''
\echo '-- Top 5 Storefronts by Views:'
SELECT 
    slug,
    store_name,
    total_views,
    total_clicks,
    CASE 
        WHEN total_views > 0 THEN ROUND((total_clicks::NUMERIC / total_views * 100), 2)
        ELSE 0
    END AS conversion_rate
FROM business_storefronts
WHERE is_active = true
ORDER BY total_views DESC
LIMIT 5;

-- ============================================================================
-- SECTION 03: storefront_products HEALTH
-- ============================================================================
\echo ''
\echo '========================================================================'
\echo 'SECTION 03: storefront_products HEALTH'
\echo '========================================================================'

\echo '-- Product Linking Status (product_id FK):'
SELECT 
    COUNT(*) AS total_products,
    COUNT(*) FILTER (WHERE product_id IS NOT NULL) AS linked_to_master,
    COUNT(*) FILTER (WHERE product_id IS NULL) AS legacy_products,
    ROUND((COUNT(*) FILTER (WHERE product_id IS NOT NULL)::NUMERIC / COUNT(*) * 100), 2) AS link_percentage
FROM storefront_products;

\echo ''
\echo '-- Constraint Validation:'
SELECT 
    COUNT(*) AS total_products,
    COUNT(*) FILTER (WHERE price > 0) AS valid_price,
    COUNT(*) FILTER (WHERE compare_at_price IS NULL OR compare_at_price >= price) AS valid_compare_price,
    COUNT(*) FILTER (WHERE stock_quantity >= 0) AS valid_stock,
    COUNT(*) FILTER (WHERE product_type IN ('barang', 'jasa')) AS valid_type,
    COUNT(*) FILTER (WHERE view_count >= 0 AND click_count >= 0 AND cart_add_count >= 0) AS valid_analytics
FROM storefront_products;

\echo ''
\echo '-- Product Type Distribution:'
SELECT 
    product_type,
    COUNT(*) AS product_count,
    COUNT(*) FILTER (WHERE is_visible = true) AS visible_count
FROM storefront_products
GROUP BY product_type
ORDER BY product_count DESC;

\echo ''
\echo '-- Top 5 Products by Views:'
SELECT 
    p.name,
    s.store_name,
    p.view_count,
    p.click_count,
    p.cart_add_count
FROM storefront_products p
JOIN business_storefronts s ON p.storefront_id = s.id
WHERE p.is_visible = true
ORDER BY p.view_count DESC
LIMIT 5;

-- ============================================================================
-- SECTION 04: storefront_analytics HEALTH
-- ============================================================================
\echo ''
\echo '========================================================================'
\echo 'SECTION 04: storefront_analytics HEALTH'
\echo '========================================================================'

\echo '-- Event Type Distribution:'
SELECT 
    event_type,
    COUNT(*) AS event_count,
    ROUND((COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM storefront_analytics) * 100), 2) AS percentage
FROM storefront_analytics
GROUP BY event_type
ORDER BY event_count DESC;

\echo ''
\echo '-- Constraint Validation:'
SELECT 
    COUNT(*) AS total_events,
    COUNT(*) FILTER (WHERE event_type IN ('page_view', 'product_view', 'product_click', 'cart_add', 'checkout_start', 'whatsapp_click')) AS valid_event_types,
    COUNT(*) FILTER (WHERE event_type IN ('product_view', 'product_click', 'cart_add') AND product_id IS NOT NULL) AS valid_product_events,
    COUNT(*) FILTER (WHERE event_type IN ('product_view', 'product_click', 'cart_add') AND product_id IS NULL) AS invalid_product_events
FROM storefront_analytics;

\echo ''
\echo '-- Events Last 7 Days:'
SELECT 
    DATE(created_at) AS date,
    COUNT(*) AS event_count,
    COUNT(DISTINCT session_id) FILTER (WHERE session_id IS NOT NULL) AS unique_visitors
FROM storefront_analytics
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================================================
-- SECTION 05: cart_sessions HEALTH
-- ============================================================================
\echo ''
\echo '========================================================================'
\echo 'SECTION 05: cart_sessions HEALTH'
\echo '========================================================================'

\echo '-- Cart Status Distribution:'
SELECT 
    status,
    COUNT(*) AS cart_count,
    ROUND((COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM cart_sessions) * 100), 2) AS percentage
FROM cart_sessions
GROUP BY status
ORDER BY cart_count DESC;

\echo ''
\echo '-- Expiry Status:'
SELECT 
    COUNT(*) AS total_carts,
    COUNT(*) FILTER (WHERE expires_at > NOW()) AS active_carts,
    COUNT(*) FILTER (WHERE expires_at <= NOW()) AS expired_carts,
    COUNT(*) FILTER (WHERE status = 'active' AND expires_at <= NOW()) AS needs_cleanup
FROM cart_sessions;

\echo ''
\echo '-- Constraint Validation:'
SELECT 
    COUNT(*) AS total_carts,
    COUNT(*) FILTER (WHERE status IN ('active', 'checked_out', 'abandoned')) AS valid_status,
    COUNT(*) FILTER (WHERE jsonb_typeof(cart_items) = 'array') AS valid_cart_items,
    COUNT(*) FILTER (WHERE expires_at > created_at) AS valid_expiry,
    COUNT(*) FILTER (WHERE customer_phone IS NULL OR customer_phone ~ '^62[0-9]{8,13}$') AS valid_phone
FROM cart_sessions;

\echo ''
\echo '-- Cart Item Count Distribution:'
SELECT 
    CASE 
        WHEN jsonb_array_length(cart_items) = 0 THEN '0 items (empty)'
        WHEN jsonb_array_length(cart_items) BETWEEN 1 AND 3 THEN '1-3 items'
        WHEN jsonb_array_length(cart_items) BETWEEN 4 AND 10 THEN '4-10 items'
        ELSE '>10 items'
    END AS item_range,
    COUNT(*) AS cart_count
FROM cart_sessions
WHERE status = 'active' AND expires_at > NOW()
GROUP BY item_range
ORDER BY MIN(jsonb_array_length(cart_items));

-- ============================================================================
-- SECTION 06-09: INDEX USAGE
-- ============================================================================
\echo ''
\echo '========================================================================'
\echo 'SECTION 06-09: INDEX USAGE'
\echo '========================================================================'

\echo '-- Index Usage Statistics:'
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan AS scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND (tablename LIKE '%storefront%' OR tablename = 'business_storefronts' OR tablename = 'cart_sessions')
ORDER BY idx_scan DESC
LIMIT 20;

\echo ''
\echo '-- Unused Indexes (0 scans):'
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND (tablename LIKE '%storefront%' OR tablename = 'business_storefronts' OR tablename = 'cart_sessions')
  AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- SECTION 10-13: CONSTRAINT VALIDATION
-- ============================================================================
\echo ''
\echo '========================================================================'
\echo 'SECTION 10-13: CONSTRAINT VALIDATION'
\echo '========================================================================'

\echo '-- All Constraints:'
SELECT 
    conrelid::regclass AS table_name,
    conname AS constraint_name,
    CASE contype
        WHEN 'c' THEN 'CHECK'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'u' THEN 'UNIQUE'
        ELSE contype::TEXT
    END AS constraint_type
FROM pg_constraint
WHERE conrelid::regclass::TEXT IN ('business_storefronts', 'storefront_products', 'storefront_analytics', 'cart_sessions')
ORDER BY table_name, constraint_type, constraint_name;

-- ============================================================================
-- SECTION 14-17: RLS POLICY TESTS
-- ============================================================================
\echo ''
\echo '========================================================================'
\echo 'SECTION 14-17: RLS POLICY TESTS'
\echo '========================================================================'

\echo '-- RLS Policy Count:'
SELECT 
    schemaname,
    tablename,
    COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND (tablename LIKE '%storefront%' OR tablename = 'business_storefronts' OR tablename = 'cart_sessions')
GROUP BY schemaname, tablename
ORDER BY tablename;

\echo ''
\echo '-- Policy Details:'
SELECT 
    tablename,
    policyname,
    cmd AS operation,
    CASE WHEN permissive = 't' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END AS policy_type
FROM pg_policies
WHERE schemaname = 'public'
  AND (tablename LIKE '%storefront%' OR tablename = 'business_storefronts' OR tablename = 'cart_sessions')
ORDER BY tablename, policyname;

-- ============================================================================
-- SECTION 18: FUNCTION SMOKE TESTS
-- ============================================================================
\echo ''
\echo '========================================================================'
\echo 'SECTION 18: FUNCTION SMOKE TESTS'
\echo '========================================================================'

\echo '-- Test slug generation:'
SELECT generate_storefront_slug('Test Store Kue Ibu Ani!!!') AS generated_slug;

\echo ''
\echo '-- Test slug validation:'
SELECT 
    validate_slug_format('test-store') AS valid_slug,
    validate_slug_format('Invalid Slug!') AS invalid_slug,
    validate_slug_format('ab') AS too_short;

\echo ''
\echo '-- Available Functions:'
SELECT 
    routine_name,
    routine_type,
    data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%storefront%' OR routine_name LIKE '%cart%' OR routine_name LIKE '%product%' OR routine_name LIKE '%analytics%')
ORDER BY routine_name;

-- ============================================================================
-- SECTION 19: VIEW VALIDATION
-- ============================================================================
\echo ''
\echo '========================================================================'
\echo 'SECTION 19: VIEW VALIDATION'
\echo '========================================================================'

\echo '-- Available Views:'
SELECT 
    table_name AS view_name,
    CASE WHEN is_updatable = 'YES' THEN 'YES' ELSE 'NO' END AS is_updatable
FROM information_schema.views
WHERE table_schema = 'public'
  AND (table_name LIKE '%storefront%' OR table_name LIKE '%cart%' OR table_name LIKE '%product%' OR table_name LIKE '%analytics%')
ORDER BY table_name;

\echo ''
\echo '-- Test Views (sample data):'
\echo '   - active_storefronts_summary'
SELECT COUNT(*) AS storefront_count FROM active_storefronts_summary;

\echo '   - visible_products_with_storefront'
SELECT COUNT(*) AS product_count FROM visible_products_with_storefront;

-- ============================================================================
-- SECTION 20: PERFORMANCE ANALYSIS
-- ============================================================================
\echo ''
\echo '========================================================================'
\echo 'SECTION 20: PERFORMANCE ANALYSIS'
\echo '========================================================================'

\echo '-- Table Sizes:'
SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size('public.'||table_name)) AS total_size,
    pg_size_pretty(pg_relation_size('public.'||table_name)) AS table_size,
    pg_size_pretty(pg_total_relation_size('public.'||table_name) - pg_relation_size('public.'||table_name)) AS index_size
FROM (
    VALUES 
        ('business_storefronts'),
        ('storefront_products'),
        ('storefront_analytics'),
        ('cart_sessions')
) AS t(table_name)
ORDER BY pg_total_relation_size('public.'||table_name) DESC;

\echo ''
\echo '-- Sample Query Performance Test (storefront products listing):'
EXPLAIN (ANALYZE, BUFFERS) 
SELECT p.*
FROM storefront_products p
JOIN business_storefronts s ON p.storefront_id = s.id
WHERE p.is_visible = true 
  AND s.is_active = true
ORDER BY p.sort_order ASC, p.created_at DESC
LIMIT 10;

\echo ''
\echo '-- Sample Query Performance Test (cart retrieval):'
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM cart_sessions
WHERE session_id = 'test-session-id'
  AND status = 'active'
  AND expires_at > NOW()
ORDER BY created_at DESC
LIMIT 1;

-- ============================================================================
-- SUMMARY
-- ============================================================================
\echo ''
\echo '========================================================================'
\echo 'HEALTH CHECK SUMMARY'
\echo '========================================================================'
\echo 'All sections completed.'
\echo 'Review warnings above for any issues.'
\echo ''
\echo 'Next Steps:'
\echo '  1. Verify RLS policies are enabled on all tables'
\echo '  2. Check for unused indexes (consider dropping if 0 scans)'
\echo '  3. Run cleanup: SELECT cleanup_expired_carts();'
\echo '  4. Monitor table sizes (consider partitioning if analytics > 1M rows)'
\echo '========================================================================'

\timing off
\set QUIET off
