-- ============================================================================
-- DOMAIN: STOREFRONT
-- Entity: storefront_products (products)
-- File: products.index.sql
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
-- Index Name: storefront_products_pkey
-- Columns: id (UUID)
-- Type: B-tree, UNIQUE
-- ============================================================================

-- ============================================================================
-- FOREIGN KEY INDEXES
-- ============================================================================

-- Index on storefront_id (FK to business_storefronts)
-- Purpose: Fast lookup of products by storefront
-- Use Cases:
--   - Listing: "SELECT * FROM storefront_products WHERE storefront_id = ?"
--   - Public storefront page: /lapak/[slug] → get storefront_id → list products
--   - CASCADE DELETE: When storefront is deleted, find all products
-- Query Pattern: Exact match on storefront_id
-- Cardinality: Medium (one storefront = many products)
-- Performance: Critical path for storefront pages
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_products_storefront 
ON public.storefront_products(storefront_id);

COMMENT ON INDEX idx_products_storefront IS 
'Index on storefront_id for fast product listing by storefront';

-- Index on user_id (FK to auth.users)
-- Purpose: Fast lookup of products by owner
-- Use Cases:
--   - Dashboard: "SELECT * FROM storefront_products WHERE user_id = ?"
--   - RLS policies: "WHERE user_id = auth.uid()"
--   - Owner analytics: my_products_analytics view
-- Query Pattern: Exact match on user_id
-- Cardinality: Medium (one user = many products)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_products_user 
ON public.storefront_products(user_id);

COMMENT ON INDEX idx_products_user IS 
'Index on user_id for fast owner lookup and RLS policy enforcement';

-- ============================================================================
-- CRITICAL: Index on product_id (FK to products table - master data)
-- ============================================================================
-- Purpose: Fast lookup of storefront products by master product_id
-- Use Cases:
--   - Syncing: "SELECT * FROM storefront_products WHERE product_id = ?"
--   - Linking: "Find all storefronts selling this product"
--   - Analytics: "Which products are most popular across storefronts?"
-- Query Pattern: Exact match on product_id
-- Cardinality: Medium (one master product = few storefront products)
-- Note: product_id can be NULL (legacy products not linked to master)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_products_master_link 
ON public.storefront_products(product_id)
WHERE product_id IS NOT NULL;

COMMENT ON INDEX idx_products_master_link IS 
'Partial index on product_id (NOT NULL) for fast lookup of linked products to master products table';

-- ============================================================================
-- BOOLEAN FILTER INDEXES
-- ============================================================================

-- Index on is_visible (for public visibility filtering)
-- Purpose: Fast filtering of visible products
-- Use Cases:
--   - Public listing: "SELECT * FROM storefront_products WHERE is_visible = true"
--   - RLS policy: "Public can view visible products"
--   - visible_products_with_storefront view
-- Query Pattern: Boolean filter (is_visible = true)
-- Cardinality: Medium (most products are visible)
-- Note: Partial index on is_visible = true is more efficient
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_products_visible 
ON public.storefront_products(is_visible)
WHERE is_visible = true;

COMMENT ON INDEX idx_products_visible IS 
'Partial index on is_visible = true for fast public listing queries';

-- Index on is_featured (for featured products filtering)
-- Purpose: Fast filtering of featured products
-- Use Cases:
--   - Homepage: "SELECT * FROM storefront_products WHERE is_featured = true"
--   - Featured products section on storefront page
-- Query Pattern: Boolean filter (is_featured = true)
-- Cardinality: Low (few products are featured)
-- Note: Partial index on is_featured = true is more efficient
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_products_featured 
ON public.storefront_products(is_featured)
WHERE is_featured = true;

COMMENT ON INDEX idx_products_featured IS 
'Partial index on is_featured = true for fast featured products queries';

-- ============================================================================
-- CATEGORY INDEX
-- ============================================================================

-- Index on category (for category filtering)
-- Purpose: Fast filtering by product category
-- Use Cases:
--   - Category page: "SELECT * FROM storefront_products WHERE category = 'Makanan'"
--   - Filtering: "Show only Minuman products"
-- Query Pattern: Exact match on category
-- Cardinality: Low (limited categories: Makanan, Minuman, etc.)
-- Note: Consider GIN index if category becomes array/JSONB
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_products_category 
ON public.storefront_products(category);

COMMENT ON INDEX idx_products_category IS 
'Index on category for fast filtering by product category';

-- ============================================================================
-- PRODUCT TYPE INDEX
-- ============================================================================

-- Index on product_type (for barang/jasa filtering)
-- Purpose: Fast filtering by product type
-- Use Cases:
--   - Filter: "SELECT * FROM storefront_products WHERE product_type = 'barang'"
--   - Filter: "Show only services (jasa)"
-- Query Pattern: Exact match on product_type
-- Cardinality: Very low (only 2 values: barang, jasa)
-- Note: Partial indexes on each value would be more efficient
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_products_type 
ON public.storefront_products(product_type);

COMMENT ON INDEX idx_products_type IS 
'Index on product_type for filtering by barang (goods) or jasa (services)';

-- ============================================================================
-- COMPOSITE INDEXES
-- ============================================================================

-- Composite index on storefront_id + is_visible
-- Purpose: Fast filtering of visible products in a storefront
-- Use Cases:
--   - Public storefront page: "Show visible products in this storefront"
--   - Most common query pattern for storefront pages
-- Query Pattern: storefront_id = X AND is_visible = true
-- Cardinality: Medium (storefront) + High (visibility)
-- Performance: Critical path for public pages
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_products_storefront_visible 
ON public.storefront_products(storefront_id, is_visible)
WHERE is_visible = true;

COMMENT ON INDEX idx_products_storefront_visible IS 
'Composite partial index on storefront_id + is_visible = true for fast public storefront pages';

-- Composite index on storefront_id + sort_order + created_at
-- Purpose: Fast sorting for product listing
-- Use Cases:
--   - Product listing: "ORDER BY sort_order ASC, created_at DESC"
--   - Featured first, then manual sort, then newest
-- Query Pattern: storefront_id = X ORDER BY sort_order, created_at DESC
-- Cardinality: Medium (storefront) + Low (sort_order) + High (created_at)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_products_storefront_sort 
ON public.storefront_products(storefront_id, sort_order ASC, created_at DESC);

COMMENT ON INDEX idx_products_storefront_sort IS 
'Composite index on storefront_id + sort_order + created_at for fast sorted product listing';

-- ============================================================================
-- TIMESTAMP INDEXES
-- ============================================================================

-- Index on created_at (for sorting by creation date)
-- Purpose: Fast sorting for "newest products" queries
-- Use Cases:
--   - Admin panel: "Recent products"
--   - Product listing: "ORDER BY created_at DESC"
-- Query Pattern: ORDER BY created_at DESC, range queries
-- Cardinality: High (unique timestamp per product)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_products_created_at 
ON public.storefront_products(created_at DESC);

COMMENT ON INDEX idx_products_created_at IS 
'Index on created_at (DESC) for sorting newest products first';

-- ============================================================================
-- ANALYTICS INDEXES (Optional - for future use)
-- ============================================================================

-- Index on view_count (for sorting by popularity)
-- Purpose: Fast sorting for "most viewed products" queries
-- Use Cases:
--   - Analytics: "Top 10 most viewed products"
--   - Recommendations: "Popular products"
-- Note: Only create if analytics queries are common
-- ============================================================================

-- CREATE INDEX IF NOT EXISTS idx_products_view_count 
-- ON public.storefront_products(view_count DESC)
-- WHERE view_count > 0;

-- COMMENT ON INDEX idx_products_view_count IS 
-- 'Partial index on view_count (DESC) for sorting most viewed products';

-- ============================================================================
-- TEXT SEARCH INDEXES (Optional - for future use)
-- ============================================================================

-- Full-text search index on name + description
-- Purpose: Enable search functionality for products
-- Use Cases:
--   - Public search: "Find products by name or description"
--   - Storefront search: "Search within this storefront"
-- Note: GIN index is expensive, only create if search is needed
-- ============================================================================

-- CREATE INDEX IF NOT EXISTS idx_products_search 
-- ON public.storefront_products 
-- USING GIN (to_tsvector('indonesian', name || ' ' || COALESCE(description, '')));

-- COMMENT ON INDEX idx_products_search IS 
-- 'Full-text search index on name + description (Indonesian language)';

-- ============================================================================
-- CONSTRAINTS (Additional - Beyond Schema Defaults)
-- ============================================================================

-- Constraint: price must be positive
-- Rule: price > 0
-- ============================================================================

ALTER TABLE public.storefront_products
DROP CONSTRAINT IF EXISTS check_price_positive;

ALTER TABLE public.storefront_products
ADD CONSTRAINT check_price_positive 
CHECK (price > 0);

COMMENT ON CONSTRAINT check_price_positive ON public.storefront_products IS 
'Ensures price is positive (> 0)';

-- ============================================================================
-- Constraint: compare_at_price must be >= price (if set)
-- Rule: If compare_at_price is set, it must be >= price
-- Rationale: compare_at_price is "original price", should be higher than sale price
-- ============================================================================

ALTER TABLE public.storefront_products
DROP CONSTRAINT IF EXISTS check_compare_price_valid;

ALTER TABLE public.storefront_products
ADD CONSTRAINT check_compare_price_valid 
CHECK (compare_at_price IS NULL OR compare_at_price >= price);

COMMENT ON CONSTRAINT check_compare_price_valid ON public.storefront_products IS 
'Ensures compare_at_price >= price (if set). Original price must be >= sale price.';

-- ============================================================================
-- Constraint: stock_quantity must be non-negative
-- Rule: stock_quantity >= 0 (cannot go negative)
-- ============================================================================

ALTER TABLE public.storefront_products
DROP CONSTRAINT IF EXISTS check_stock_non_negative;

ALTER TABLE public.storefront_products
ADD CONSTRAINT check_stock_non_negative 
CHECK (stock_quantity >= 0);

COMMENT ON CONSTRAINT check_stock_non_negative ON public.storefront_products IS 
'Ensures stock_quantity is non-negative (>= 0)';

-- ============================================================================
-- Constraint: low_stock_threshold must be positive
-- Rule: low_stock_threshold > 0
-- ============================================================================

ALTER TABLE public.storefront_products
DROP CONSTRAINT IF EXISTS check_threshold_positive;

ALTER TABLE public.storefront_products
ADD CONSTRAINT check_threshold_positive 
CHECK (low_stock_threshold > 0);

COMMENT ON CONSTRAINT check_threshold_positive ON public.storefront_products IS 
'Ensures low_stock_threshold is positive (> 0)';

-- ============================================================================
-- Constraint: analytics counters must be non-negative
-- Rule: view_count, click_count, cart_add_count >= 0
-- ============================================================================

ALTER TABLE public.storefront_products
DROP CONSTRAINT IF EXISTS check_analytics_non_negative;

ALTER TABLE public.storefront_products
ADD CONSTRAINT check_analytics_non_negative 
CHECK (view_count >= 0 AND click_count >= 0 AND cart_add_count >= 0);

COMMENT ON CONSTRAINT check_analytics_non_negative ON public.storefront_products IS 
'Ensures all analytics counters are non-negative (>= 0)';

-- ============================================================================
-- Constraint: name must not be empty
-- Rule: name length > 0
-- ============================================================================

ALTER TABLE public.storefront_products
DROP CONSTRAINT IF EXISTS check_name_not_empty;

ALTER TABLE public.storefront_products
ADD CONSTRAINT check_name_not_empty 
CHECK (length(trim(name)) > 0);

COMMENT ON CONSTRAINT check_name_not_empty ON public.storefront_products IS 
'Ensures name is not empty or whitespace-only';

-- ============================================================================
-- Constraint: product_type must be 'barang' or 'jasa'
-- Rule: product_type IN ('barang', 'jasa')
-- Note: This constraint may already exist from migration
-- ============================================================================

ALTER TABLE public.storefront_products
DROP CONSTRAINT IF EXISTS check_product_type;

ALTER TABLE public.storefront_products
ADD CONSTRAINT check_product_type 
CHECK (product_type IN ('barang', 'jasa'));

COMMENT ON CONSTRAINT check_product_type ON public.storefront_products IS 
'Ensures product_type is either "barang" (goods) or "jasa" (services)';

-- ============================================================================
-- INDEX SUMMARY
-- ============================================================================
-- Total Indexes: 11
--   1. idx_products_storefront (FK to business_storefronts)
--   2. idx_products_user (FK to auth.users)
--   3. idx_products_master_link (FK to products - CRITICAL NEW INDEX)
--   4. idx_products_visible (PARTIAL, is_visible = true)
--   5. idx_products_featured (PARTIAL, is_featured = true)
--   6. idx_products_category (for category filtering)
--   7. idx_products_type (for product_type filtering)
--   8. idx_products_storefront_visible (COMPOSITE, storefront + visibility)
--   9. idx_products_storefront_sort (COMPOSITE, storefront + sort + created)
--   10. idx_products_created_at (for sorting)
--   11. (Optional) idx_products_view_count (for popularity sorting)
--   12. (Optional) idx_products_search (GIN, full-text search)
--
-- Total Constraints: 8
--   1. check_price_positive (price > 0)
--   2. check_compare_price_valid (compare_at_price >= price)
--   3. check_stock_non_negative (stock_quantity >= 0)
--   4. check_threshold_positive (low_stock_threshold > 0)
--   5. check_analytics_non_negative (counters >= 0)
--   6. check_name_not_empty (name length > 0)
--   7. check_product_type (IN 'barang', 'jasa')
--
-- Performance Notes:
--   - idx_products_storefront_visible is CRITICAL for public pages (cover query)
--   - idx_products_master_link enables fast syncing from master products table
--   - Partial indexes on is_visible and is_featured for efficiency
--   - Composite index on storefront_id + sort_order + created_at for sorted listing
--   - idx_products_user is necessary for RLS policy performance
--
-- Maintenance:
--   - Monitor slow queries: pg_stat_statements
--   - Check index usage: pg_stat_user_indexes
--   - Consider REINDEX if fragmentation occurs
--   - Vacuum regularly to maintain index efficiency
-- ============================================================================

-- ============================================================================
-- END OF INDEXES
-- ============================================================================
-- Next Steps:
--   1. Test indexes: EXPLAIN ANALYZE on common queries
--   2. Verify constraints: Insert invalid data, expect errors
--   3. Check index usage: pg_stat_user_indexes view
--   4. Run: storefront.debug.sql (section: index health check)
--
-- Testing Commands:
--   -- Test price constraint:
--   INSERT INTO storefront_products (storefront_id, user_id, name, price, whatsapp_number)
--   VALUES ('storefront-id', auth.uid(), 'Test Product', -1000, '628123456789');
--   -- Expected: ERROR - check_price_positive violation
--
--   -- Test compare_at_price constraint:
--   INSERT INTO storefront_products (storefront_id, user_id, name, price, compare_at_price, whatsapp_number)
--   VALUES ('storefront-id', auth.uid(), 'Test Product', 100000, 50000, '628123456789');
--   -- Expected: ERROR - check_compare_price_valid violation
--
--   -- Test index usage (storefront listing):
--   EXPLAIN ANALYZE 
--   SELECT * FROM storefront_products 
--   WHERE storefront_id = 'storefront-uuid' AND is_visible = true
--   ORDER BY sort_order ASC, created_at DESC;
--   -- Expected: Index Scan using idx_products_storefront_sort or idx_products_storefront_visible
--
--   -- Test master link index:
--   EXPLAIN ANALYZE 
--   SELECT * FROM storefront_products WHERE product_id = 'product-uuid';
--   -- Expected: Index Scan using idx_products_master_link
-- ============================================================================
