-- ============================================================================
-- DOMAIN: STOREFRONT
-- Entity: storefront_analytics (analytics)
-- File: analytics.index.sql
-- Purpose: Indexes, constraints, and performance optimizations
-- ============================================================================
-- Pattern: 4-File Entity Structure
-- 1. schema.sql  (Table Definition)
-- 2. logic.sql   (Functions, Views, Triggers)
-- 3. policies.sql (Row Level Security)
-- 4. index.sql   ← YOU ARE HERE
-- ============================================================================

-- ============================================================================
-- PRIMARY KEY INDEX
-- ============================================================================
-- Note: Primary key index is automatically created by PostgreSQL
-- Index Name: storefront_analytics_pkey
-- Columns: id (UUID)
-- Type: B-tree, UNIQUE
-- ============================================================================

-- ============================================================================
-- FOREIGN KEY INDEXES
-- ============================================================================

-- Index on storefront_id (FK to business_storefronts)
-- Purpose: Fast lookup of analytics by storefront
-- Use Cases:
--   - Dashboard: "SELECT * FROM storefront_analytics WHERE storefront_id = ?"
--   - RLS policy: "WHERE storefront.user_id = auth.uid()"
--   - CASCADE DELETE: When storefront is deleted, find all analytics
--   - get_storefront_event_counts() function
-- Query Pattern: Exact match on storefront_id
-- Cardinality: High (one storefront = many events)
-- Performance: Critical path for analytics dashboards
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_analytics_storefront 
ON public.storefront_analytics(storefront_id);

COMMENT ON INDEX idx_analytics_storefront IS 
'Index on storefront_id for fast analytics lookup by storefront';

-- Index on product_id (FK to storefront_products)
-- Purpose: Fast lookup of analytics by product
-- Use Cases:
--   - Product analytics: "SELECT * FROM storefront_analytics WHERE product_id = ?"
--   - get_product_event_counts() function
--   - ON DELETE SET NULL: When product is deleted, find all analytics
-- Query Pattern: Exact match on product_id
-- Cardinality: Medium (one product = some events)
-- Note: product_id can be NULL (non-product events)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_analytics_product 
ON public.storefront_analytics(product_id)
WHERE product_id IS NOT NULL;

COMMENT ON INDEX idx_analytics_product IS 
'Partial index on product_id (NOT NULL) for fast product analytics lookup';

-- ============================================================================
-- EVENT TYPE INDEX
-- ============================================================================

-- Index on event_type (for filtering by event type)
-- Purpose: Fast filtering and grouping by event type
-- Use Cases:
--   - Dashboard: "SELECT COUNT(*) FROM storefront_analytics WHERE event_type = 'page_view'"
--   - Aggregation: "GROUP BY event_type"
--   - get_storefront_event_counts() function
-- Query Pattern: Exact match + GROUP BY event_type
-- Cardinality: Low (6 event types: page_view, product_view, etc.)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_analytics_event_type 
ON public.storefront_analytics(event_type);

COMMENT ON INDEX idx_analytics_event_type IS 
'Index on event_type for fast filtering and grouping by event type';

-- ============================================================================
-- TIMESTAMP INDEX
-- ============================================================================

-- Index on created_at (for date range queries and sorting)
-- Purpose: Fast filtering by date range and time-series analysis
-- Use Cases:
--   - Dashboard: "WHERE created_at >= NOW() - INTERVAL '30 days'"
--   - Daily aggregation: "GROUP BY DATE(created_at)"
--   - Time-series charts: "ORDER BY created_at"
--   - get_storefront_event_counts() with date range
-- Query Pattern: Range queries, ORDER BY created_at DESC
-- Cardinality: Very high (unique timestamp per event)
-- Performance: Critical for date range filters
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_analytics_created_at 
ON public.storefront_analytics(created_at DESC);

COMMENT ON INDEX idx_analytics_created_at IS 
'Index on created_at (DESC) for fast date range queries and time-series analysis';

-- ============================================================================
-- SESSION INDEX (Optional - for unique visitor tracking)
-- ============================================================================

-- Index on session_id (for unique visitor counting)
-- Purpose: Fast DISTINCT count for unique visitor metrics
-- Use Cases:
--   - Unique visitors: "SELECT COUNT(DISTINCT session_id)"
--   - get_unique_visitors() function
--   - Session-based analytics
-- Query Pattern: COUNT(DISTINCT session_id)
-- Cardinality: High (unique per visitor)
-- Note: session_id can be NULL (anonymous events)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_analytics_session 
ON public.storefront_analytics(session_id)
WHERE session_id IS NOT NULL;

COMMENT ON INDEX idx_analytics_session IS 
'Partial index on session_id (NOT NULL) for fast unique visitor counting';

-- ============================================================================
-- COMPOSITE INDEXES
-- ============================================================================

-- Composite index on storefront_id + event_type
-- Purpose: Fast filtering by storefront and event type
-- Use Cases:
--   - Dashboard: "WHERE storefront_id = X AND event_type = 'page_view'"
--   - Event counts: "GROUP BY storefront_id, event_type"
--   - get_storefront_event_counts() function
-- Query Pattern: storefront_id = X AND event_type = Y
-- Cardinality: High (storefront) + Low (event_type)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_analytics_storefront_type 
ON public.storefront_analytics(storefront_id, event_type);

COMMENT ON INDEX idx_analytics_storefront_type IS 
'Composite index on storefront_id + event_type for fast event counts';

-- Composite index on storefront_id + created_at
-- Purpose: Fast date range queries for specific storefront
-- Use Cases:
--   - Dashboard: "WHERE storefront_id = X AND created_at >= Y"
--   - Time-series analytics for storefront
--   - get_storefront_event_counts() with date range
-- Query Pattern: storefront_id = X AND created_at >= Y AND created_at <= Z
-- Cardinality: High (storefront) + Very high (created_at)
-- Performance: Critical for time-series dashboards
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_analytics_storefront_date 
ON public.storefront_analytics(storefront_id, created_at DESC);

COMMENT ON INDEX idx_analytics_storefront_date IS 
'Composite index on storefront_id + created_at for fast time-series queries';

-- Composite index on product_id + event_type
-- Purpose: Fast product analytics filtering
-- Use Cases:
--   - Product dashboard: "WHERE product_id = X AND event_type = 'product_view'"
--   - get_product_event_counts() function
-- Query Pattern: product_id = X AND event_type = Y
-- Cardinality: Medium (product) + Low (event_type)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_analytics_product_type 
ON public.storefront_analytics(product_id, event_type)
WHERE product_id IS NOT NULL;

COMMENT ON INDEX idx_analytics_product_type IS 
'Composite partial index on product_id + event_type for fast product analytics';

-- ============================================================================
-- JSONB METADATA INDEXES (Optional - for future use)
-- ============================================================================

-- GIN index on metadata (for JSONB queries)
-- Purpose: Enable fast queries on metadata fields
-- Use Cases:
--   - Filter by device: "WHERE metadata->>'device' = 'mobile'"
--   - Filter by referrer: "WHERE metadata->>'referrer' = 'google.com'"
-- Note: GIN index is expensive, only create if metadata queries are common
-- ============================================================================

-- CREATE INDEX IF NOT EXISTS idx_analytics_metadata 
-- ON public.storefront_analytics 
-- USING GIN (metadata);

-- COMMENT ON INDEX idx_analytics_metadata IS 
-- 'GIN index on metadata for fast JSONB queries (device, referrer, etc.)';

-- ============================================================================
-- CONSTRAINTS (Additional - Beyond Schema Defaults)
-- ============================================================================

-- Constraint: event_type must be valid
-- Rule: event_type IN ('page_view', 'product_view', 'product_click', 'cart_add', 'checkout_start', 'whatsapp_click')
-- ============================================================================

ALTER TABLE public.storefront_analytics
DROP CONSTRAINT IF EXISTS check_event_type_valid;

ALTER TABLE public.storefront_analytics
ADD CONSTRAINT check_event_type_valid 
CHECK (event_type IN ('page_view', 'product_view', 'product_click', 'cart_add', 'checkout_start', 'whatsapp_click'));

COMMENT ON CONSTRAINT check_event_type_valid ON public.storefront_analytics IS 
'Ensures event_type is one of: page_view, product_view, product_click, cart_add, checkout_start, whatsapp_click';

-- Constraint: product_id required for product-specific events
-- Rule: If event_type is product-specific, product_id must not be NULL
-- ============================================================================

ALTER TABLE public.storefront_analytics
DROP CONSTRAINT IF EXISTS check_product_event_has_product;

ALTER TABLE public.storefront_analytics
ADD CONSTRAINT check_product_event_has_product 
CHECK (
    (event_type IN ('product_view', 'product_click', 'cart_add') AND product_id IS NOT NULL)
    OR
    (event_type NOT IN ('product_view', 'product_click', 'cart_add'))
);

COMMENT ON CONSTRAINT check_product_event_has_product ON public.storefront_analytics IS 
'Ensures product-specific events (product_view, product_click, cart_add) have product_id';

-- ============================================================================
-- PARTITIONING RECOMMENDATION (For future growth)
-- ============================================================================
-- Note: If table grows beyond 1M rows, consider partitioning by created_at
--
-- Example: Monthly partitioning
--   CREATE TABLE storefront_analytics_2024_01 PARTITION OF storefront_analytics
--   FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
--
--   CREATE TABLE storefront_analytics_2024_02 PARTITION OF storefront_analytics
--   FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
--
-- Benefits:
--   - Faster queries on recent data (partition pruning)
--   - Easier archiving of old data (detach partition)
--   - Better vacuum performance (smaller tables)
--
-- Migration Strategy:
--   1. Create partitioned table: storefront_analytics_partitioned
--   2. Create partitions for current + future months
--   3. Copy data: INSERT INTO storefront_analytics_partitioned SELECT * FROM storefront_analytics
--   4. Rename: ALTER TABLE storefront_analytics RENAME TO storefront_analytics_old
--   5. Rename: ALTER TABLE storefront_analytics_partitioned RENAME TO storefront_analytics
--   6. Drop old: DROP TABLE storefront_analytics_old
-- ============================================================================

-- ============================================================================
-- INDEX SUMMARY
-- ============================================================================
-- Total Indexes: 8
--   1. idx_analytics_storefront (FK to business_storefronts)
--   2. idx_analytics_product (PARTIAL, FK to storefront_products)
--   3. idx_analytics_event_type (for event filtering)
--   4. idx_analytics_created_at (for date range queries)
--   5. idx_analytics_session (PARTIAL, for unique visitor counts)
--   6. idx_analytics_storefront_type (COMPOSITE, storefront + event)
--   7. idx_analytics_storefront_date (COMPOSITE, storefront + date)
--   8. idx_analytics_product_type (COMPOSITE PARTIAL, product + event)
--   9. (Optional) idx_analytics_metadata (GIN, for JSONB queries)
--
-- Total Constraints: 2
--   1. check_event_type_valid (event_type IN ...)
--   2. check_product_event_has_product (product events require product_id)
--
-- Performance Notes:
--   - idx_analytics_storefront_date is CRITICAL for time-series dashboards
--   - idx_analytics_storefront_type enables fast event counts
--   - Partial indexes on product_id and session_id for efficiency
--   - created_at DESC for common "newest first" queries
--   - Consider partitioning by created_at if table grows beyond 1M rows
--
-- Maintenance:
--   - Monitor slow queries: pg_stat_statements
--   - Check index usage: pg_stat_user_indexes
--   - Vacuum regularly: VACUUM ANALYZE storefront_analytics
--   - Archive old data: DELETE WHERE created_at < NOW() - INTERVAL '1 year'
--     (Or use partitioning + DETACH PARTITION)
-- ============================================================================

-- ============================================================================
-- END OF INDEXES
-- ============================================================================
-- Next Steps:
--   1. Test indexes: EXPLAIN ANALYZE on common queries
--   2. Verify constraints: Insert invalid data, expect errors
--   3. Check index usage: pg_stat_user_indexes view
--   4. Run: storefront.debug.sql (section: analytics index health)
--   5. Monitor table growth: Plan partitioning if needed
--
-- Testing Commands:
--   -- Test event_type constraint:
--   INSERT INTO storefront_analytics (storefront_id, event_type)
--   VALUES ('storefront-uuid', 'invalid_event');
--   -- Expected: ERROR - check_event_type_valid violation
--
--   -- Test product event constraint:
--   INSERT INTO storefront_analytics (storefront_id, event_type)
--   VALUES ('storefront-uuid', 'product_view');
--   -- Expected: ERROR - check_product_event_has_product violation
--
--   -- Test index usage (date range query):
--   EXPLAIN ANALYZE 
--   SELECT * FROM storefront_analytics 
--   WHERE storefront_id = 'storefront-uuid'
--     AND created_at >= NOW() - INTERVAL '30 days';
--   -- Expected: Index Scan using idx_analytics_storefront_date
--
--   -- Test index usage (event counts):
--   EXPLAIN ANALYZE 
--   SELECT event_type, COUNT(*) 
--   FROM storefront_analytics 
--   WHERE storefront_id = 'storefront-uuid'
--   GROUP BY event_type;
--   -- Expected: Index Scan using idx_analytics_storefront_type
-- ============================================================================
