-- ============================================================================
-- DOMAIN: STOREFRONT
-- Entity: cart_sessions (carts)
-- File: carts.index.sql
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
-- Index Name: cart_sessions_pkey
-- Columns: id (UUID)
-- Type: B-tree, UNIQUE
-- ============================================================================

-- ============================================================================
-- FOREIGN KEY INDEXES
-- ============================================================================

-- Index on storefront_id (FK to business_storefronts)
-- Purpose: Fast lookup of carts by storefront
-- Use Cases:
--   - Dashboard: "SELECT * FROM cart_sessions WHERE storefront_id = ?"
--   - Owner analytics: active_carts_summary view
--   - CASCADE DELETE: When storefront is deleted, find all carts
-- Query Pattern: Exact match on storefront_id
-- Cardinality: Medium (one storefront = some carts)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_cart_storefront 
ON public.cart_sessions(storefront_id);

COMMENT ON INDEX idx_cart_storefront IS 
'Index on storefront_id for fast cart lookup by storefront';

-- ============================================================================
-- SESSION INDEX
-- ============================================================================

-- Index on session_id (for cart retrieval by session)
-- Purpose: Fast lookup of cart by session_id
-- Use Cases:
--   - Cart retrieval: "SELECT * FROM cart_sessions WHERE session_id = ?"
--   - get_or_create_cart() function
--   - Most common query pattern for public cart access
-- Query Pattern: Exact match on session_id
-- Cardinality: High (unique per session)
-- Performance: CRITICAL path for cart operations
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_cart_session_id 
ON public.cart_sessions(session_id);

COMMENT ON INDEX idx_cart_session_id IS 
'Index on session_id for fast cart retrieval (critical for public cart access)';

-- ============================================================================
-- STATUS INDEX
-- ============================================================================

-- Index on status (for filtering by cart status)
-- Purpose: Fast filtering by cart status
-- Use Cases:
--   - Dashboard: "SELECT * FROM cart_sessions WHERE status = 'active'"
--   - Analytics: "COUNT active carts vs abandoned carts"
--   - Cleanup: "Find abandoned carts for recovery"
-- Query Pattern: Exact match on status
-- Cardinality: Low (3 values: active, checked_out, abandoned)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_cart_status 
ON public.cart_sessions(status);

COMMENT ON INDEX idx_cart_status IS 
'Index on status for filtering by cart status (active, checked_out, abandoned)';

-- ============================================================================
-- TIMESTAMP INDEXES
-- ============================================================================

-- Index on expires_at (for cleanup and expiry checks)
-- Purpose: Fast filtering of expired carts
-- Use Cases:
--   - Cleanup: "DELETE FROM cart_sessions WHERE expires_at < NOW()"
--   - cleanup_expired_carts() function
--   - Active cart filter: "WHERE expires_at > NOW()"
-- Query Pattern: Range queries on expires_at
-- Cardinality: High (unique timestamp per cart)
-- Performance: Critical for cleanup operations
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_cart_expires_at 
ON public.cart_sessions(expires_at);

COMMENT ON INDEX idx_cart_expires_at IS 
'Index on expires_at for fast cleanup of expired carts';

-- Index on updated_at (for sorting recent activity)
-- Purpose: Fast sorting by last update time
-- Use Cases:
--   - Dashboard: "ORDER BY updated_at DESC" (recent activity first)
--   - Abandoned cart detection: "WHERE updated_at < NOW() - INTERVAL '1 day'"
-- Query Pattern: ORDER BY updated_at DESC, range queries
-- Cardinality: High (unique timestamp per cart)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_cart_updated_at 
ON public.cart_sessions(updated_at DESC);

COMMENT ON INDEX idx_cart_updated_at IS 
'Index on updated_at (DESC) for sorting by recent activity';

-- ============================================================================
-- COMPOSITE INDEXES
-- ============================================================================

-- Composite index on storefront_id + status
-- Purpose: Fast filtering of carts by storefront and status
-- Use Cases:
--   - Dashboard: "Show active carts for my storefront"
--   - Analytics: "Count checked_out carts for my storefront"
-- Query Pattern: storefront_id = X AND status = Y
-- Cardinality: Medium (storefront) + Low (status)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_cart_storefront_status 
ON public.cart_sessions(storefront_id, status);

COMMENT ON INDEX idx_cart_storefront_status IS 
'Composite index on storefront_id + status for fast dashboard queries';

-- Composite index on session_id + storefront_id + status
-- Purpose: Fast cart retrieval for specific session + storefront + status
-- Use Cases:
--   - get_or_create_cart() function: Find active cart for session
--   - Covers query: session_id + storefront_id + status
-- Query Pattern: session_id = X AND storefront_id = Y AND status = 'active'
-- Cardinality: High (session) + Medium (storefront) + Low (status)
-- Performance: Optimized for get_or_create_cart() function
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_cart_session_storefront_status 
ON public.cart_sessions(session_id, storefront_id, status)
WHERE status = 'active';

COMMENT ON INDEX idx_cart_session_storefront_status IS 
'Composite partial index on session_id + storefront_id + status = active (optimized for get_or_create_cart)';

-- ============================================================================
-- JSONB INDEXES (Optional - for cart_items queries)
-- ============================================================================

-- GIN index on cart_items (for JSONB queries)
-- Purpose: Enable fast queries on cart_items content
-- Use Cases:
--   - Search for carts containing specific product: "WHERE cart_items @> '...'::JSONB"
--   - Filter by product_id in cart: "WHERE cart_items @> '[{"product_id": "uuid"}]'::JSONB"
-- Note: GIN index is expensive, only create if cart_items queries are common
-- ============================================================================

-- CREATE INDEX IF NOT EXISTS idx_cart_items_gin 
-- ON public.cart_sessions 
-- USING GIN (cart_items);

-- COMMENT ON INDEX idx_cart_items_gin IS 
-- 'GIN index on cart_items for fast JSONB queries (search by product_id)';

-- ============================================================================
-- CONSTRAINTS (Additional - Beyond Schema Defaults)
-- ============================================================================

-- Constraint: status must be valid
-- Rule: status IN ('active', 'checked_out', 'abandoned')
-- ============================================================================

ALTER TABLE public.cart_sessions
DROP CONSTRAINT IF EXISTS check_cart_status_valid;

ALTER TABLE public.cart_sessions
ADD CONSTRAINT check_cart_status_valid 
CHECK (status IN ('active', 'checked_out', 'abandoned'));

COMMENT ON CONSTRAINT check_cart_status_valid ON public.cart_sessions IS 
'Ensures status is one of: active, checked_out, abandoned';

-- ============================================================================
-- Constraint: session_id must not be empty
-- Rule: session_id length > 0
-- ============================================================================

ALTER TABLE public.cart_sessions
DROP CONSTRAINT IF EXISTS check_session_id_not_empty;

ALTER TABLE public.cart_sessions
ADD CONSTRAINT check_session_id_not_empty 
CHECK (length(trim(session_id)) > 0);

COMMENT ON CONSTRAINT check_session_id_not_empty ON public.cart_sessions IS 
'Ensures session_id is not empty or whitespace-only';

-- ============================================================================
-- Constraint: cart_items must be valid JSON array
-- Rule: cart_items must be JSONB array type
-- Note: PostgreSQL automatically validates JSONB, but explicit check for clarity
-- ============================================================================

ALTER TABLE public.cart_sessions
DROP CONSTRAINT IF EXISTS check_cart_items_is_array;

ALTER TABLE public.cart_sessions
ADD CONSTRAINT check_cart_items_is_array 
CHECK (jsonb_typeof(cart_items) = 'array');

COMMENT ON CONSTRAINT check_cart_items_is_array ON public.cart_sessions IS 
'Ensures cart_items is a valid JSONB array';

-- ============================================================================
-- Constraint: expires_at must be in the future (at creation)
-- Rule: expires_at > created_at
-- ============================================================================

ALTER TABLE public.cart_sessions
DROP CONSTRAINT IF EXISTS check_expires_after_created;

ALTER TABLE public.cart_sessions
ADD CONSTRAINT check_expires_after_created 
CHECK (expires_at > created_at);

COMMENT ON CONSTRAINT check_expires_after_created ON public.cart_sessions IS 
'Ensures expires_at is after created_at';

-- ============================================================================
-- Constraint: customer_phone format (if provided)
-- Rule: If customer_phone is set, must start with 62 (Indonesia)
-- ============================================================================

ALTER TABLE public.cart_sessions
DROP CONSTRAINT IF EXISTS check_customer_phone_format;

ALTER TABLE public.cart_sessions
ADD CONSTRAINT check_customer_phone_format 
CHECK (customer_phone IS NULL OR customer_phone ~ '^62[0-9]{8,13}$');

COMMENT ON CONSTRAINT check_customer_phone_format ON public.cart_sessions IS 
'Ensures customer_phone (if provided) starts with 62 (Indonesia) + 8-13 digits';

-- ============================================================================
-- INDEX SUMMARY
-- ============================================================================
-- Total Indexes: 8
--   1. idx_cart_storefront (FK to business_storefronts)
--   2. idx_cart_session_id (for cart retrieval by session - CRITICAL)
--   3. idx_cart_status (for status filtering)
--   4. idx_cart_expires_at (for cleanup operations)
--   5. idx_cart_updated_at (for sorting by recent activity)
--   6. idx_cart_storefront_status (COMPOSITE, storefront + status)
--   7. idx_cart_session_storefront_status (COMPOSITE PARTIAL, get_or_create_cart optimization)
--   8. (Optional) idx_cart_items_gin (GIN, for JSONB queries)
--
-- Total Constraints: 5
--   1. check_cart_status_valid (status IN ...)
--   2. check_session_id_not_empty (session_id length > 0)
--   3. check_cart_items_is_array (cart_items is JSONB array)
--   4. check_expires_after_created (expires_at > created_at)
--   5. check_customer_phone_format (62XXXXXXXXX)
--
-- Performance Notes:
--   - idx_cart_session_id is CRITICAL for cart retrieval (most common query)
--   - idx_cart_session_storefront_status optimizes get_or_create_cart() function
--   - idx_cart_expires_at is critical for cleanup_expired_carts() function
--   - Partial index on status = 'active' for common dashboard queries
--   - Consider GIN index on cart_items if searching by product_id is needed
--
-- Maintenance:
--   - Monitor slow queries: pg_stat_statements
--   - Check index usage: pg_stat_user_indexes
--   - Run cleanup daily: SELECT cleanup_expired_carts()
--   - Vacuum regularly: VACUUM ANALYZE cart_sessions
--   - Consider partitioning by created_at if table grows beyond 1M rows
-- ============================================================================

-- ============================================================================
-- END OF INDEXES
-- ============================================================================
-- Next Steps:
--   1. Test indexes: EXPLAIN ANALYZE on common queries
--   2. Verify constraints: Insert invalid data, expect errors
--   3. Check index usage: pg_stat_user_indexes view
--   4. Run: storefront.debug.sql (section: carts index health)
--   5. Setup cron job: SELECT cleanup_expired_carts() daily
--
-- Testing Commands:
--   -- Test status constraint:
--   INSERT INTO cart_sessions (storefront_id, session_id, cart_items, status)
--   VALUES ('storefront-uuid', 'test-session-id', '[]'::JSONB, 'invalid_status');
--   -- Expected: ERROR - check_cart_status_valid violation
--
--   -- Test cart_items constraint:
--   INSERT INTO cart_sessions (storefront_id, session_id, cart_items)
--   VALUES ('storefront-uuid', 'test-session-id', '{}'::JSONB);
--   -- Expected: ERROR - check_cart_items_is_array violation
--
--   -- Test index usage (cart retrieval):
--   EXPLAIN ANALYZE 
--   SELECT * FROM cart_sessions 
--   WHERE session_id = 'test-session-id';
--   -- Expected: Index Scan using idx_cart_session_id
--
--   -- Test index usage (get_or_create_cart):
--   EXPLAIN ANALYZE 
--   SELECT * FROM cart_sessions 
--   WHERE session_id = 'test-session-id'
--     AND storefront_id = 'storefront-uuid'
--     AND status = 'active'
--     AND expires_at > NOW();
--   -- Expected: Index Scan using idx_cart_session_storefront_status
--
--   -- Test cleanup:
--   EXPLAIN ANALYZE 
--   DELETE FROM cart_sessions WHERE expires_at < NOW();
--   -- Expected: Index Scan using idx_cart_expires_at
-- ============================================================================
