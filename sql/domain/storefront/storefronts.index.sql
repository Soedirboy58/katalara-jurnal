-- ============================================================================
-- DOMAIN: STOREFRONT
-- Entity: business_storefronts (storefronts)
-- File: storefronts.index.sql
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
-- Index Name: business_storefronts_pkey
-- Columns: id (UUID)
-- Type: B-tree, UNIQUE
-- ============================================================================

-- ============================================================================
-- FOREIGN KEY INDEXES
-- ============================================================================

-- Index on user_id (FK to auth.users)
-- Purpose: Fast lookup of storefronts by owner
-- Use Cases:
--   - Dashboard: "SELECT * FROM business_storefronts WHERE user_id = ?"
--   - RLS policies: "WHERE user_id = auth.uid()"
--   - CASCADE DELETE: When user is deleted, find all storefronts
-- Query Pattern: Exact match on user_id
-- Cardinality: Low (one user = one storefront typically)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_storefronts_user_id 
ON public.business_storefronts(user_id);

COMMENT ON INDEX idx_storefronts_user_id IS 
'Index on user_id for fast owner lookup and RLS policy enforcement';

-- ============================================================================
-- UNIQUE INDEXES
-- ============================================================================

-- Unique index on slug (for public URL lookup)
-- Purpose: Enforce slug uniqueness + fast public lookup
-- Use Cases:
--   - Public page: "SELECT * FROM business_storefronts WHERE slug = ?"
--   - get_storefront_by_slug() function
--   - /lapak/[slug] route
-- Query Pattern: Exact match on slug
-- Cardinality: High (one slug = one storefront, globally unique)
-- Performance: Critical path for public pages
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_storefronts_slug 
ON public.business_storefronts(slug);

COMMENT ON INDEX idx_storefronts_slug IS 
'Unique index on slug for fast public URL lookup (/lapak/[slug])';

-- ============================================================================
-- BOOLEAN FILTER INDEXES
-- ============================================================================

-- Index on is_active (for public visibility filtering)
-- Purpose: Fast filtering of active storefronts
-- Use Cases:
--   - Public listing: "SELECT * FROM business_storefronts WHERE is_active = true"
--   - RLS policy: "Public can view active storefronts"
--   - active_storefronts_summary view
-- Query Pattern: Boolean filter (is_active = true)
-- Cardinality: Medium (most storefronts are active)
-- Note: Partial index on is_active = true would be more efficient
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_storefronts_active 
ON public.business_storefronts(is_active)
WHERE is_active = true;

COMMENT ON INDEX idx_storefronts_active IS 
'Partial index on is_active = true for fast public listing queries';

-- ============================================================================
-- COMPOSITE INDEXES
-- ============================================================================

-- Composite index on user_id + is_active
-- Purpose: Fast filtering of owner's storefronts by status
-- Use Cases:
--   - Dashboard filter: "My active storefront"
--   - Owner analytics: "Show stats for my active storefront"
-- Query Pattern: user_id = X AND is_active = Y
-- Cardinality: Low (one user = one storefront)
-- Note: May be redundant with single-column indexes, monitor usage
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_storefronts_user_active 
ON public.business_storefronts(user_id, is_active);

COMMENT ON INDEX idx_storefronts_user_active IS 
'Composite index on user_id + is_active for dashboard filtering';

-- ============================================================================
-- TIMESTAMP INDEXES
-- ============================================================================

-- Index on created_at (for sorting/filtering by creation date)
-- Purpose: Fast sorting for "newest storefronts" queries
-- Use Cases:
--   - Admin panel: "Recent storefronts"
--   - Public listing: "ORDER BY created_at DESC"
--   - active_storefronts_summary view
-- Query Pattern: ORDER BY created_at DESC, range queries
-- Cardinality: High (unique timestamp per storefront)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_storefronts_created_at 
ON public.business_storefronts(created_at DESC);

COMMENT ON INDEX idx_storefronts_created_at IS 
'Index on created_at (DESC) for sorting newest storefronts first';

-- ============================================================================
-- TEXT SEARCH INDEXES (Optional - for future use)
-- ============================================================================

-- Full-text search index on store_name + description
-- Purpose: Enable search functionality for storefronts
-- Use Cases:
--   - Public search: "Find storefronts by name or description"
--   - Admin panel: "Search storefronts"
-- Note: GIN index is expensive, only create if search is needed
-- ============================================================================

-- CREATE INDEX IF NOT EXISTS idx_storefronts_search 
-- ON public.business_storefronts 
-- USING GIN (to_tsvector('indonesian', store_name || ' ' || COALESCE(description, '')));

-- COMMENT ON INDEX idx_storefronts_search IS 
-- 'Full-text search index on store_name + description (Indonesian language)';

-- ============================================================================
-- CONSTRAINTS (Additional - Beyond Schema Defaults)
-- ============================================================================

-- Constraint: slug must follow valid format
-- Rule: lowercase alphanumeric + hyphens, 3-50 characters
-- Enforced by: validate_slug_format() function check
-- ============================================================================

ALTER TABLE public.business_storefronts
DROP CONSTRAINT IF EXISTS check_slug_format;

ALTER TABLE public.business_storefronts
ADD CONSTRAINT check_slug_format 
CHECK (validate_slug_format(slug));

COMMENT ON CONSTRAINT check_slug_format ON public.business_storefronts IS 
'Ensures slug follows valid format: lowercase alphanumeric + hyphens, 3-50 chars';

-- ============================================================================
-- Constraint: theme_color must be valid hex color
-- Rule: Starts with #, followed by 6 hex characters
-- Pattern: #RRGGBB (e.g., #3B82F6)
-- ============================================================================

ALTER TABLE public.business_storefronts
DROP CONSTRAINT IF EXISTS check_theme_color_format;

ALTER TABLE public.business_storefronts
ADD CONSTRAINT check_theme_color_format 
CHECK (theme_color ~ '^#[0-9A-Fa-f]{6}$');

COMMENT ON CONSTRAINT check_theme_color_format ON public.business_storefronts IS 
'Ensures theme_color is valid hex color (#RRGGBB format)';

-- ============================================================================
-- Constraint: whatsapp_number must be valid format
-- Rule: Starts with 62 (Indonesia country code), followed by digits
-- Length: 10-15 characters (62 + 8-13 digits)
-- Example: 628123456789
-- ============================================================================

ALTER TABLE public.business_storefronts
DROP CONSTRAINT IF EXISTS check_whatsapp_format;

ALTER TABLE public.business_storefronts
ADD CONSTRAINT check_whatsapp_format 
CHECK (whatsapp_number ~ '^62[0-9]{8,13}$');

COMMENT ON CONSTRAINT check_whatsapp_format ON public.business_storefronts IS 
'Ensures whatsapp_number starts with 62 (Indonesia) + 8-13 digits';

-- ============================================================================
-- Constraint: total_views and total_clicks must be non-negative
-- Rule: Both counters >= 0 (cannot go negative)
-- ============================================================================

ALTER TABLE public.business_storefronts
DROP CONSTRAINT IF EXISTS check_analytics_non_negative;

ALTER TABLE public.business_storefronts
ADD CONSTRAINT check_analytics_non_negative 
CHECK (total_views >= 0 AND total_clicks >= 0);

COMMENT ON CONSTRAINT check_analytics_non_negative ON public.business_storefronts IS 
'Ensures total_views and total_clicks are non-negative integers';

-- ============================================================================
-- Constraint: slug must not be empty
-- Rule: slug length > 0 (additional check beyond validate_slug_format)
-- ============================================================================

ALTER TABLE public.business_storefronts
DROP CONSTRAINT IF EXISTS check_slug_not_empty;

ALTER TABLE public.business_storefronts
ADD CONSTRAINT check_slug_not_empty 
CHECK (length(trim(slug)) > 0);

COMMENT ON CONSTRAINT check_slug_not_empty ON public.business_storefronts IS 
'Ensures slug is not empty or whitespace-only';

-- ============================================================================
-- Constraint: store_name must not be empty
-- Rule: store_name length > 0
-- ============================================================================

ALTER TABLE public.business_storefronts
DROP CONSTRAINT IF EXISTS check_store_name_not_empty;

ALTER TABLE public.business_storefronts
ADD CONSTRAINT check_store_name_not_empty 
CHECK (length(trim(store_name)) > 0);

COMMENT ON CONSTRAINT check_store_name_not_empty ON public.business_storefronts IS 
'Ensures store_name is not empty or whitespace-only';

-- ============================================================================
-- UNIQUE CONSTRAINT: One storefront per user
-- ============================================================================
-- Rule: Each user can have only ONE storefront
-- Rationale: Simplifies business logic, prevents storefront sprawl
-- Note: If multi-storefront support is needed in future, remove this constraint
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_storefronts_one_per_user 
ON public.business_storefronts(user_id);

COMMENT ON INDEX idx_storefronts_one_per_user IS 
'Enforces one storefront per user (unique constraint on user_id)';

-- ============================================================================
-- INDEX SUMMARY
-- ============================================================================
-- Total Indexes: 7
--   1. idx_storefronts_user_id (FK to auth.users)
--   2. idx_storefronts_slug (UNIQUE, for public URL lookup)
--   3. idx_storefronts_active (PARTIAL, for public listing)
--   4. idx_storefronts_user_active (COMPOSITE, for dashboard)
--   5. idx_storefronts_created_at (for sorting)
--   6. idx_storefronts_one_per_user (UNIQUE, one storefront per user)
--   7. (Optional) idx_storefronts_search (GIN, full-text search)
--
-- Total Constraints: 6
--   1. check_slug_format (validate_slug_format function)
--   2. check_theme_color_format (#RRGGBB hex color)
--   3. check_whatsapp_format (62XXXXXXXXX)
--   4. check_analytics_non_negative (counters >= 0)
--   5. check_slug_not_empty (slug length > 0)
--   6. check_store_name_not_empty (store_name length > 0)
--
-- Performance Notes:
--   - idx_storefronts_slug is CRITICAL for public pages (cover query)
--   - idx_storefronts_active uses partial index for efficiency
--   - idx_storefronts_user_id is necessary for RLS policy performance
--   - created_at index sorted DESC for common "newest first" queries
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
--   -- Test slug format constraint:
--   INSERT INTO business_storefronts (user_id, slug, store_name, whatsapp_number)
--   VALUES (auth.uid(), 'Invalid Slug!', 'Test Store', '628123456789');
--   -- Expected: ERROR - check_slug_format violation
--
--   -- Test whatsapp format constraint:
--   INSERT INTO business_storefronts (user_id, slug, store_name, whatsapp_number)
--   VALUES (auth.uid(), 'test-store', 'Test Store', '08123456789');
--   -- Expected: ERROR - check_whatsapp_format violation
--
--   -- Test duplicate user_id:
--   INSERT INTO business_storefronts (user_id, slug, store_name, whatsapp_number)
--   VALUES (auth.uid(), 'test-store-2', 'Test Store 2', '628123456789');
--   -- Expected: ERROR - duplicate key violation on idx_storefronts_one_per_user
--
--   -- Test index usage:
--   EXPLAIN ANALYZE 
--   SELECT * FROM business_storefronts WHERE slug = 'toko-kue-ani';
--   -- Expected: Index Scan using idx_storefronts_slug
-- ============================================================================
