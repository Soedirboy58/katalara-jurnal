-- =====================================================
-- DOMAIN: FINANCE
-- FILE: customers.index.sql
-- PURPOSE: Performance indexes & constraints for customers
-- =====================================================

-- =====================================================
-- PRIMARY INDEXES FOR FILTERING & LOOKUP
-- =====================================================

-- Fast filtering by owner (most common query pattern)
DROP INDEX IF EXISTS idx_customers_owner;
CREATE INDEX idx_customers_owner ON customers(owner_id);

-- Fast lookup by customer code (if used)
DROP INDEX IF EXISTS idx_customers_code;
CREATE INDEX idx_customers_code ON customers(owner_id, code) WHERE code IS NOT NULL;

-- Fast active customer lookup (for dropdowns)
DROP INDEX IF EXISTS idx_customers_active;
CREATE INDEX idx_customers_active ON customers(owner_id, is_active) WHERE is_active = TRUE;

-- =====================================================
-- SEARCH INDEXES
-- =====================================================

-- Full-text search on customer name
DROP INDEX IF EXISTS idx_customers_name_search;
CREATE INDEX idx_customers_name_search ON customers USING gin(to_tsvector('simple', name));

-- Case-insensitive name search (for autocomplete)
DROP INDEX IF EXISTS idx_customers_name_lower;
CREATE INDEX idx_customers_name_lower ON customers(owner_id, LOWER(name));

-- =====================================================
-- ANALYTICS INDEXES
-- =====================================================

-- Customer performance queries (CLV, total purchases)
DROP INDEX IF EXISTS idx_customers_performance;
CREATE INDEX idx_customers_performance ON customers(owner_id, total_purchases DESC, lifetime_value DESC);

-- Receivables monitoring (customers with outstanding balance)
DROP INDEX IF EXISTS idx_customers_outstanding;
CREATE INDEX idx_customers_outstanding ON customers(owner_id, outstanding_balance DESC) 
WHERE outstanding_balance > 0;

-- Over-limit customers (for alerts)
DROP INDEX IF EXISTS idx_customers_overlimit;
CREATE INDEX idx_customers_overlimit ON customers(owner_id, credit_limit, outstanding_balance) 
WHERE credit_limit > 0 AND outstanding_balance > credit_limit;

-- =====================================================
-- SEGMENTATION INDEXES
-- =====================================================

-- Customer by type (individual, company, reseller)
DROP INDEX IF EXISTS idx_customers_type;
CREATE INDEX idx_customers_type ON customers(owner_id, customer_type) WHERE customer_type IS NOT NULL;

-- Customer by tier (loyalty segmentation)
DROP INDEX IF EXISTS idx_customers_tier;
CREATE INDEX idx_customers_tier ON customers(owner_id, tier) WHERE tier IS NOT NULL;

-- Customer by location (for regional analysis)
DROP INDEX IF EXISTS idx_customers_location;
CREATE INDEX idx_customers_location ON customers(owner_id, province, city) WHERE province IS NOT NULL;

-- =====================================================
-- CLV & LOYALTY INDEXES
-- =====================================================

-- Top customers by lifetime value
DROP INDEX IF EXISTS idx_customers_clv;
CREATE INDEX idx_customers_clv ON customers(owner_id, lifetime_value DESC NULLS LAST);

-- Frequent buyers
DROP INDEX IF EXISTS idx_customers_frequency;
CREATE INDEX idx_customers_frequency ON customers(owner_id, purchase_frequency DESC);

-- High value per transaction
DROP INDEX IF EXISTS idx_customers_avg_order;
CREATE INDEX idx_customers_avg_order ON customers(owner_id, average_order_value DESC NULLS LAST);

-- =====================================================
-- TIMESTAMP INDEXES (for audit trails)
-- =====================================================

-- Recent activity tracking
DROP INDEX IF EXISTS idx_customers_created;
CREATE INDEX idx_customers_created ON customers(owner_id, created_at DESC);

DROP INDEX IF EXISTS idx_customers_updated;
CREATE INDEX idx_customers_updated ON customers(owner_id, updated_at DESC);

DROP INDEX IF EXISTS idx_customers_last_purchase;
CREATE INDEX idx_customers_last_purchase ON customers(owner_id, last_purchase_date DESC NULLS LAST);

-- =====================================================
-- UNIQUE CONSTRAINTS
-- =====================================================

-- Prevent duplicate customer codes per owner
DROP INDEX IF EXISTS idx_customers_unique_code;
CREATE UNIQUE INDEX idx_customers_unique_code ON customers(owner_id, code) 
WHERE code IS NOT NULL AND code != '';

-- Prevent duplicate customer names per owner (case-insensitive)
-- Optional: uncomment jika ingin enforce unique names
-- DROP INDEX IF EXISTS idx_customers_unique_name;
-- CREATE UNIQUE INDEX idx_customers_unique_name ON customers(owner_id, LOWER(name));

-- =====================================================
-- DATA INTEGRITY CONSTRAINTS
-- =====================================================

-- Credit limit must be non-negative
ALTER TABLE customers 
DROP CONSTRAINT IF EXISTS customers_credit_limit_check;

ALTER TABLE customers 
ADD CONSTRAINT customers_credit_limit_check 
CHECK (credit_limit >= 0);

-- Outstanding balance must be non-negative
ALTER TABLE customers 
DROP CONSTRAINT IF EXISTS customers_outstanding_balance_check;

ALTER TABLE customers 
ADD CONSTRAINT customers_outstanding_balance_check 
CHECK (outstanding_balance >= 0);

-- Total purchases must be non-negative
ALTER TABLE customers 
DROP CONSTRAINT IF EXISTS customers_total_purchases_check;

ALTER TABLE customers 
ADD CONSTRAINT customers_total_purchases_check 
CHECK (total_purchases >= 0);

-- Lifetime value must be non-negative
ALTER TABLE customers 
DROP CONSTRAINT IF EXISTS customers_lifetime_value_check;

ALTER TABLE customers 
ADD CONSTRAINT customers_lifetime_value_check 
CHECK (lifetime_value >= 0);

-- Average order value must be non-negative
ALTER TABLE customers 
DROP CONSTRAINT IF EXISTS customers_avg_order_check;

ALTER TABLE customers 
ADD CONSTRAINT customers_avg_order_check 
CHECK (average_order_value >= 0);

-- Purchase frequency must be non-negative
ALTER TABLE customers 
DROP CONSTRAINT IF EXISTS customers_frequency_check;

ALTER TABLE customers 
ADD CONSTRAINT customers_frequency_check 
CHECK (purchase_frequency >= 0);

-- Payment term days must be non-negative
ALTER TABLE customers 
DROP CONSTRAINT IF EXISTS customers_payment_term_check;

ALTER TABLE customers 
ADD CONSTRAINT customers_payment_term_check 
CHECK (default_payment_term_days >= 0);

-- Loyalty points must be non-negative
ALTER TABLE customers 
DROP CONSTRAINT IF EXISTS customers_loyalty_points_check;

ALTER TABLE customers 
ADD CONSTRAINT customers_loyalty_points_check 
CHECK (loyalty_points >= 0);

-- Tier must be valid value
ALTER TABLE customers 
DROP CONSTRAINT IF EXISTS customers_tier_check;

ALTER TABLE customers 
ADD CONSTRAINT customers_tier_check 
CHECK (tier IS NULL OR tier IN ('bronze', 'silver', 'gold', 'platinum'));

-- Email format validation (basic check)
ALTER TABLE customers 
DROP CONSTRAINT IF EXISTS customers_email_format_check;

ALTER TABLE customers 
ADD CONSTRAINT customers_email_format_check 
CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- =====================================================
-- QUERY OPTIMIZATION
-- Update table statistics for query planner
-- =====================================================
ANALYZE customers;

-- =====================================================
-- PERFORMANCE HINTS
-- =====================================================
COMMENT ON INDEX idx_customers_owner IS 'Primary filter - used in 99% of queries';
COMMENT ON INDEX idx_customers_active IS 'Partial index for dropdown lists - only active customers';
COMMENT ON INDEX idx_customers_outstanding IS 'Partial index for receivables monitoring - only customers with AR';
COMMENT ON INDEX idx_customers_overlimit IS 'Alert index - customers exceeding credit limit';
COMMENT ON INDEX idx_customers_name_search IS 'Full-text search for customer discovery';
COMMENT ON INDEX idx_customers_clv IS 'VIP customer identification by lifetime value';
COMMENT ON INDEX idx_customers_tier IS 'Loyalty program queries - segmentation by tier';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Finance Domain - Customers Indexes Created';
  RAISE NOTICE '   - 18 indexes: owner, code, active, name search, CLV, loyalty, segmentation';
  RAISE NOTICE '   - 10 constraints: credit limit, balance, purchases, CLV metrics, tier, email';
  RAISE NOTICE '   - Partial indexes for: active customers, outstanding AR, over-limit alerts';
  RAISE NOTICE '   - Full-text search enabled on customer name';
  RAISE NOTICE '   - CLV & loyalty tracking optimized';
END $$;
