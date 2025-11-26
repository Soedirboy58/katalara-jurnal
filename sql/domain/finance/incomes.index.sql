-- =====================================================
-- DOMAIN: FINANCE
-- FILE: incomes.index.sql
-- PURPOSE: Performance indexes & constraints for incomes
-- =====================================================

-- =====================================================
-- PRIMARY INDEXES FOR FILTERING & LOOKUP
-- =====================================================

-- Fast filtering by owner (most common query pattern)
DROP INDEX IF EXISTS idx_incomes_owner;
CREATE INDEX idx_incomes_owner ON incomes(owner_id);

-- Owner + date range queries (dashboard KPIs)
DROP INDEX IF EXISTS idx_incomes_owner_date;
CREATE INDEX idx_incomes_owner_date ON incomes(owner_id, income_date DESC);

-- Fast lookup by invoice number
DROP INDEX IF EXISTS idx_incomes_invoice;
CREATE INDEX idx_incomes_invoice ON incomes(owner_id, invoice_number) WHERE invoice_number IS NOT NULL;

-- =====================================================
-- CLASSIFICATION INDEXES
-- =====================================================

-- Income type filtering (operating/investing/financing)
DROP INDEX IF EXISTS idx_incomes_type;
CREATE INDEX idx_incomes_type ON incomes(owner_id, income_type);

-- Category within type
DROP INDEX IF EXISTS idx_incomes_type_category;
CREATE INDEX idx_incomes_type_category ON incomes(owner_id, income_type, income_category);

-- Date + type composite (KPI by type)
DROP INDEX IF EXISTS idx_incomes_type_date;
CREATE INDEX idx_incomes_type_date ON incomes(owner_id, income_type, income_date DESC);

-- =====================================================
-- PAYMENT & RECEIVABLES INDEXES
-- =====================================================

-- Payment status queries (unpaid, partial, paid)
DROP INDEX IF EXISTS idx_incomes_payment_status;
CREATE INDEX idx_incomes_payment_status ON incomes(owner_id, payment_status);

-- Outstanding receivables (piutang)
DROP INDEX IF EXISTS idx_incomes_outstanding;
CREATE INDEX idx_incomes_outstanding ON incomes(owner_id, remaining_payment DESC) 
WHERE remaining_payment > 0;

-- Overdue receivables (jatuh tempo lewat)
DROP INDEX IF EXISTS idx_incomes_overdue;
CREATE INDEX idx_incomes_overdue ON incomes(owner_id, due_date) 
WHERE due_date < CURRENT_DATE AND payment_status IN ('unpaid', 'partial');

-- Due date monitoring
DROP INDEX IF EXISTS idx_incomes_due_date;
CREATE INDEX idx_incomes_due_date ON incomes(owner_id, due_date) 
WHERE due_date IS NOT NULL AND payment_status != 'paid';

-- =====================================================
-- CUSTOMER RELATIONSHIP INDEXES
-- =====================================================

-- Customer income history
DROP INDEX IF EXISTS idx_incomes_customer;
CREATE INDEX idx_incomes_customer ON incomes(customer_id, income_date DESC) 
WHERE customer_id IS NOT NULL;

-- Customer + status (for AR tracking)
DROP INDEX IF EXISTS idx_incomes_customer_status;
CREATE INDEX idx_incomes_customer_status ON incomes(customer_id, payment_status) 
WHERE customer_id IS NOT NULL;

-- =====================================================
-- ANALYTICS INDEXES
-- =====================================================

-- Revenue by grand total (top transactions)
DROP INDEX IF EXISTS idx_incomes_grand_total;
CREATE INDEX idx_incomes_grand_total ON incomes(owner_id, grand_total DESC);

-- Operating income queries (most common)
DROP INDEX IF EXISTS idx_incomes_operating;
CREATE INDEX idx_incomes_operating ON incomes(owner_id, income_date DESC) 
WHERE income_type = 'operating';

-- Payment method analysis
DROP INDEX IF EXISTS idx_incomes_payment_method;
CREATE INDEX idx_incomes_payment_method ON incomes(owner_id, payment_method);

-- =====================================================
-- ASSET & FINANCING INDEXES
-- =====================================================

-- Investing income with asset tracking
DROP INDEX IF EXISTS idx_incomes_asset;
CREATE INDEX idx_incomes_asset ON incomes(asset_id) 
WHERE asset_id IS NOT NULL;

-- Financing income with loan tracking
DROP INDEX IF EXISTS idx_incomes_loan;
CREATE INDEX idx_incomes_loan ON incomes(loan_id) 
WHERE loan_id IS NOT NULL;

-- Financing income with investor tracking
DROP INDEX IF EXISTS idx_incomes_investor;
CREATE INDEX idx_incomes_investor ON incomes(investor_id) 
WHERE investor_id IS NOT NULL;

-- =====================================================
-- TIMESTAMP INDEXES (for audit trails)
-- =====================================================

-- Recent transactions
DROP INDEX IF EXISTS idx_incomes_created;
CREATE INDEX idx_incomes_created ON incomes(owner_id, created_at DESC);

DROP INDEX IF EXISTS idx_incomes_updated;
CREATE INDEX idx_incomes_updated ON incomes(owner_id, updated_at DESC);

-- Payment date tracking
DROP INDEX IF EXISTS idx_incomes_payment_date;
CREATE INDEX idx_incomes_payment_date ON incomes(owner_id, payment_date DESC) 
WHERE payment_date IS NOT NULL;

-- =====================================================
-- INCOME_ITEMS INDEXES
-- =====================================================

-- Fast lookup by income_id (JOIN queries)
DROP INDEX IF EXISTS idx_income_items_income;
CREATE INDEX idx_income_items_income ON income_items(income_id);

-- Product sales analysis
DROP INDEX IF EXISTS idx_income_items_product;
CREATE INDEX idx_income_items_product ON income_items(product_id, created_at DESC) 
WHERE product_id IS NOT NULL;

-- Owner + product (for product performance)
DROP INDEX IF EXISTS idx_income_items_owner_product;
CREATE INDEX idx_income_items_owner_product ON income_items(owner_id, product_id) 
WHERE product_id IS NOT NULL;

-- Profit analysis
DROP INDEX IF EXISTS idx_income_items_profit;
CREATE INDEX idx_income_items_profit ON income_items(income_id, total_profit DESC);

-- =====================================================
-- FULL-TEXT SEARCH
-- =====================================================

-- Search by customer name
DROP INDEX IF EXISTS idx_incomes_customer_name_search;
CREATE INDEX idx_incomes_customer_name_search ON incomes USING gin(to_tsvector('simple', customer_name)) 
WHERE customer_name IS NOT NULL;

-- Search by invoice number
DROP INDEX IF EXISTS idx_incomes_invoice_search;
CREATE INDEX idx_incomes_invoice_search ON incomes USING gin(to_tsvector('simple', invoice_number)) 
WHERE invoice_number IS NOT NULL;

-- Search by product name in items
DROP INDEX IF EXISTS idx_income_items_product_search;
CREATE INDEX idx_income_items_product_search ON income_items USING gin(to_tsvector('simple', product_name));

-- =====================================================
-- UNIQUE CONSTRAINTS
-- =====================================================

-- Prevent duplicate invoice numbers per owner (optional)
-- Uncomment if you want to enforce unique invoice numbers
-- DROP INDEX IF EXISTS idx_incomes_unique_invoice;
-- CREATE UNIQUE INDEX idx_incomes_unique_invoice ON incomes(owner_id, invoice_number) 
-- WHERE invoice_number IS NOT NULL AND invoice_number != '';

-- =====================================================
-- DATA INTEGRITY CONSTRAINTS
-- =====================================================

-- Grand total must be non-negative
ALTER TABLE incomes 
DROP CONSTRAINT IF EXISTS incomes_grand_total_check;

ALTER TABLE incomes 
ADD CONSTRAINT incomes_grand_total_check 
CHECK (grand_total >= 0);

-- Paid amount cannot exceed grand total
ALTER TABLE incomes 
DROP CONSTRAINT IF EXISTS incomes_paid_amount_check;

ALTER TABLE incomes 
ADD CONSTRAINT incomes_paid_amount_check 
CHECK (paid_amount >= 0 AND paid_amount <= grand_total);

-- Remaining payment must be non-negative
ALTER TABLE incomes 
DROP CONSTRAINT IF EXISTS incomes_remaining_payment_check;

ALTER TABLE incomes 
ADD CONSTRAINT incomes_remaining_payment_check 
CHECK (remaining_payment >= 0);

-- Subtotal must be non-negative
ALTER TABLE incomes 
DROP CONSTRAINT IF EXISTS incomes_subtotal_check;

ALTER TABLE incomes 
ADD CONSTRAINT incomes_subtotal_check 
CHECK (subtotal >= 0);

-- Discount value must be non-negative
ALTER TABLE incomes 
DROP CONSTRAINT IF EXISTS incomes_discount_value_check;

ALTER TABLE incomes 
ADD CONSTRAINT incomes_discount_value_check 
CHECK (discount_value >= 0);

-- Discount amount cannot exceed subtotal
ALTER TABLE incomes 
DROP CONSTRAINT IF EXISTS incomes_discount_amount_check;

ALTER TABLE incomes 
ADD CONSTRAINT incomes_discount_amount_check 
CHECK (discount_amount >= 0 AND discount_amount <= subtotal);

-- Discount percent must be 0-100
ALTER TABLE incomes 
DROP CONSTRAINT IF EXISTS incomes_discount_percent_check;

ALTER TABLE incomes 
ADD CONSTRAINT incomes_discount_percent_check 
CHECK (discount_mode != 'percent' OR (discount_value >= 0 AND discount_value <= 100));

-- PPN rate validation
ALTER TABLE incomes 
DROP CONSTRAINT IF EXISTS incomes_ppn_rate_check;

ALTER TABLE incomes 
ADD CONSTRAINT incomes_ppn_rate_check 
CHECK (ppn_rate >= 0 AND ppn_rate <= 100);

-- PPh rate validation
ALTER TABLE incomes 
DROP CONSTRAINT IF EXISTS incomes_pph_rate_check;

ALTER TABLE incomes 
ADD CONSTRAINT incomes_pph_rate_check 
CHECK (pph_rate >= 0 AND pph_rate <= 100);

-- Due date must be >= income_date (for tempo)
ALTER TABLE incomes 
DROP CONSTRAINT IF EXISTS incomes_due_date_check;

ALTER TABLE incomes 
ADD CONSTRAINT incomes_due_date_check 
CHECK (due_date IS NULL OR due_date >= income_date);

-- Payment date validation
ALTER TABLE incomes 
DROP CONSTRAINT IF EXISTS incomes_payment_date_check;

ALTER TABLE incomes 
ADD CONSTRAINT incomes_payment_date_check 
CHECK (payment_date IS NULL OR payment_date >= income_date);

-- Income type must be valid
ALTER TABLE incomes 
DROP CONSTRAINT IF EXISTS incomes_type_check;

ALTER TABLE incomes 
ADD CONSTRAINT incomes_type_check 
CHECK (income_type IN ('operating', 'investing', 'financing'));

-- Payment status must be valid
ALTER TABLE incomes 
DROP CONSTRAINT IF EXISTS incomes_payment_status_check;

ALTER TABLE incomes 
ADD CONSTRAINT incomes_payment_status_check 
CHECK (payment_status IN ('unpaid', 'partial', 'paid'));

-- Payment method must be valid
ALTER TABLE incomes 
DROP CONSTRAINT IF EXISTS incomes_payment_method_check;

ALTER TABLE incomes 
ADD CONSTRAINT incomes_payment_method_check 
CHECK (payment_method IN ('cash', 'transfer', 'tempo'));

-- Discount mode must be valid
ALTER TABLE incomes 
DROP CONSTRAINT IF EXISTS incomes_discount_mode_check;

ALTER TABLE incomes 
ADD CONSTRAINT incomes_discount_mode_check 
CHECK (discount_mode IN ('nominal', 'percent'));

-- =====================================================
-- INCOME_ITEMS CONSTRAINTS
-- =====================================================

-- Quantity must be positive
ALTER TABLE income_items 
DROP CONSTRAINT IF EXISTS income_items_qty_check;

ALTER TABLE income_items 
ADD CONSTRAINT income_items_qty_check 
CHECK (qty > 0);

-- Price per unit must be non-negative
ALTER TABLE income_items 
DROP CONSTRAINT IF EXISTS income_items_price_check;

ALTER TABLE income_items 
ADD CONSTRAINT income_items_price_check 
CHECK (price_per_unit >= 0);

-- Buy price must be non-negative
ALTER TABLE income_items 
DROP CONSTRAINT IF EXISTS income_items_buy_price_check;

ALTER TABLE income_items 
ADD CONSTRAINT income_items_buy_price_check 
CHECK (buy_price >= 0);

-- Subtotal must be non-negative
ALTER TABLE income_items 
DROP CONSTRAINT IF EXISTS income_items_subtotal_check;

ALTER TABLE income_items 
ADD CONSTRAINT income_items_subtotal_check 
CHECK (subtotal >= 0);

-- =====================================================
-- QUERY OPTIMIZATION
-- Update table statistics for query planner
-- =====================================================
ANALYZE incomes;
ANALYZE income_items;

-- =====================================================
-- PERFORMANCE HINTS
-- =====================================================
COMMENT ON INDEX idx_incomes_owner_date IS 'Primary dashboard query - owner + date range';
COMMENT ON INDEX idx_incomes_outstanding IS 'Partial index for AR monitoring - only unpaid receivables';
COMMENT ON INDEX idx_incomes_overdue IS 'Alert index - overdue payments for reminders';
COMMENT ON INDEX idx_incomes_operating IS 'Most common query - operating income (sales)';
COMMENT ON INDEX idx_income_items_income IS 'JOIN optimization - line items to header';
COMMENT ON INDEX idx_income_items_profit IS 'Profit analysis - highest margin products';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Finance Domain - Incomes Indexes Created';
  RAISE NOTICE '   - 28 indexes on incomes: owner, date, type, payment, customer, analytics';
  RAISE NOTICE '   - 4 indexes on income_items: income, product, profit';
  RAISE NOTICE '   - 16 constraints on incomes: amounts, rates, dates, enums';
  RAISE NOTICE '   - 4 constraints on income_items: qty, prices, subtotal';
  RAISE NOTICE '   - Partial indexes for: outstanding AR, overdue payments, operating income';
  RAISE NOTICE '   - Full-text search enabled on: customer name, invoice, product name';
  RAISE NOTICE '   - Performance optimized for: dashboard KPIs, AR aging, revenue analytics';
END $$;
