-- =====================================================
-- DOMAIN: FINANCE
-- FILE: suppliers.index.sql
-- PURPOSE: Performance indexes & constraints for suppliers
-- =====================================================

-- =====================================================
-- PRIMARY INDEXES FOR FILTERING & LOOKUP
-- =====================================================

-- Fast filtering by owner (most common query pattern)
DROP INDEX IF EXISTS idx_suppliers_owner;
CREATE INDEX idx_suppliers_owner ON suppliers(owner_id);

-- Fast lookup by supplier code (if used)
DROP INDEX IF EXISTS idx_suppliers_code;
CREATE INDEX idx_suppliers_code ON suppliers(owner_id, code) WHERE code IS NOT NULL;

-- Fast active supplier lookup (for dropdowns)
DROP INDEX IF EXISTS idx_suppliers_active;
CREATE INDEX idx_suppliers_active ON suppliers(owner_id, is_active) WHERE is_active = TRUE;

-- =====================================================
-- SEARCH INDEXES
-- =====================================================

-- Full-text search on supplier name
DROP INDEX IF EXISTS idx_suppliers_name_search;
CREATE INDEX idx_suppliers_name_search ON suppliers USING gin(to_tsvector('simple', name));

-- Case-insensitive name search (for autocomplete)
DROP INDEX IF EXISTS idx_suppliers_name_lower;
CREATE INDEX idx_suppliers_name_lower ON suppliers(owner_id, LOWER(name));

-- =====================================================
-- ANALYTICS INDEXES
-- =====================================================

-- Supplier performance queries (total purchases, last purchase)
DROP INDEX IF EXISTS idx_suppliers_performance;
CREATE INDEX idx_suppliers_performance ON suppliers(owner_id, total_purchases DESC, last_purchase_date DESC);

-- Credit monitoring (suppliers with outstanding balance)
DROP INDEX IF EXISTS idx_suppliers_outstanding;
CREATE INDEX idx_suppliers_outstanding ON suppliers(owner_id, outstanding_balance DESC) 
WHERE outstanding_balance > 0;

-- Over-limit suppliers (for alerts)
DROP INDEX IF EXISTS idx_suppliers_overlimit;
CREATE INDEX idx_suppliers_overlimit ON suppliers(owner_id, credit_limit, outstanding_balance) 
WHERE credit_limit > 0 AND outstanding_balance > credit_limit;

-- =====================================================
-- REPORTING INDEXES
-- =====================================================

-- Supplier by category (for expense categorization)
DROP INDEX IF EXISTS idx_suppliers_category;
CREATE INDEX idx_suppliers_category ON suppliers(owner_id, category) WHERE category IS NOT NULL;

-- Supplier by location (for regional analysis)
DROP INDEX IF EXISTS idx_suppliers_location;
CREATE INDEX idx_suppliers_location ON suppliers(owner_id, province, city) WHERE province IS NOT NULL;

-- =====================================================
-- TIMESTAMP INDEXES (for audit trails)
-- =====================================================

-- Recent activity tracking
DROP INDEX IF EXISTS idx_suppliers_created;
CREATE INDEX idx_suppliers_created ON suppliers(owner_id, created_at DESC);

DROP INDEX IF EXISTS idx_suppliers_updated;
CREATE INDEX idx_suppliers_updated ON suppliers(owner_id, updated_at DESC);

-- =====================================================
-- UNIQUE CONSTRAINTS
-- =====================================================

-- Prevent duplicate supplier codes per owner
DROP INDEX IF EXISTS idx_suppliers_unique_code;
CREATE UNIQUE INDEX idx_suppliers_unique_code ON suppliers(owner_id, code) 
WHERE code IS NOT NULL AND code != '';

-- Prevent duplicate supplier names per owner (case-insensitive)
-- Optional: uncomment jika ingin enforce unique names
-- DROP INDEX IF EXISTS idx_suppliers_unique_name;
-- CREATE UNIQUE INDEX idx_suppliers_unique_name ON suppliers(owner_id, LOWER(name));

-- =====================================================
-- DATA INTEGRITY CONSTRAINTS
-- =====================================================

-- Credit limit must be non-negative
ALTER TABLE suppliers 
DROP CONSTRAINT IF EXISTS suppliers_credit_limit_check;

ALTER TABLE suppliers 
ADD CONSTRAINT suppliers_credit_limit_check 
CHECK (credit_limit >= 0);

-- Outstanding balance must be non-negative
ALTER TABLE suppliers 
DROP CONSTRAINT IF EXISTS suppliers_outstanding_balance_check;

ALTER TABLE suppliers 
ADD CONSTRAINT suppliers_outstanding_balance_check 
CHECK (outstanding_balance >= 0);

-- Total purchases must be non-negative
ALTER TABLE suppliers 
DROP CONSTRAINT IF EXISTS suppliers_total_purchases_check;

ALTER TABLE suppliers 
ADD CONSTRAINT suppliers_total_purchases_check 
CHECK (total_purchases >= 0);

-- Payment term days must be non-negative
ALTER TABLE suppliers 
DROP CONSTRAINT IF EXISTS suppliers_payment_term_check;

ALTER TABLE suppliers 
ADD CONSTRAINT suppliers_payment_term_check 
CHECK (default_payment_term_days >= 0);

-- Rating must be between 1-5 or NULL
ALTER TABLE suppliers 
DROP CONSTRAINT IF EXISTS suppliers_rating_check;

ALTER TABLE suppliers 
ADD CONSTRAINT suppliers_rating_check 
CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));

-- Email format validation (basic check)
ALTER TABLE suppliers 
DROP CONSTRAINT IF EXISTS suppliers_email_format_check;

ALTER TABLE suppliers 
ADD CONSTRAINT suppliers_email_format_check 
CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- =====================================================
-- QUERY OPTIMIZATION
-- Update table statistics for query planner
-- =====================================================
ANALYZE suppliers;

-- =====================================================
-- PERFORMANCE HINTS
-- =====================================================
COMMENT ON INDEX idx_suppliers_owner IS 'Primary filter - used in 99% of queries';
COMMENT ON INDEX idx_suppliers_active IS 'Partial index for dropdown lists - only active suppliers';
COMMENT ON INDEX idx_suppliers_outstanding IS 'Partial index for payables monitoring - only suppliers with debt';
COMMENT ON INDEX idx_suppliers_overlimit IS 'Alert index - suppliers exceeding credit limit';
COMMENT ON INDEX idx_suppliers_name_search IS 'Full-text search for supplier discovery';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Finance Domain - Suppliers Indexes Created';
  RAISE NOTICE '   - 13 indexes: owner, code, active, name search, performance, reporting';
  RAISE NOTICE '   - 7 constraints: credit limit, balance, purchases, payment terms, rating, email';
  RAISE NOTICE '   - Partial indexes for: active suppliers, outstanding balance, over-limit alerts';
  RAISE NOTICE '   - Full-text search enabled on supplier name';
END $$;
