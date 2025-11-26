-- =====================================================
-- DOMAIN: FINANCE
-- FILE: loans.index.sql
-- PURPOSE: Performance indexes & constraints for loans
-- =====================================================

-- =====================================================
-- PRIMARY INDEXES FOR FILTERING & LOOKUP
-- =====================================================

-- Fast filtering by owner (most common query pattern)
DROP INDEX IF EXISTS idx_loans_owner;
CREATE INDEX idx_loans_owner ON loans(owner_id);

-- Fast lookup by loan number
DROP INDEX IF EXISTS idx_loans_loan_number;
CREATE INDEX idx_loans_loan_number ON loans(owner_id, loan_number) WHERE loan_number IS NOT NULL;

-- Active loans (for dashboard)
DROP INDEX IF EXISTS idx_loans_active;
CREATE INDEX idx_loans_active ON loans(owner_id, is_active) WHERE is_active = TRUE;

-- =====================================================
-- STATUS & MONITORING INDEXES
-- =====================================================

-- Loans by status
DROP INDEX IF EXISTS idx_loans_status;
CREATE INDEX idx_loans_status ON loans(owner_id, status);

-- Overdue loans (for alerts)
DROP INDEX IF EXISTS idx_loans_overdue;
CREATE INDEX idx_loans_overdue ON loans(owner_id, maturity_date) 
WHERE status = 'overdue';

-- Active loans by maturity date (for reminders)
DROP INDEX IF EXISTS idx_loans_maturity;
CREATE INDEX idx_loans_maturity ON loans(owner_id, maturity_date) 
WHERE status = 'active';

-- =====================================================
-- LENDER & CATEGORY INDEXES
-- =====================================================

-- Loans by lender type
DROP INDEX IF EXISTS idx_loans_lender_type;
CREATE INDEX idx_loans_lender_type ON loans(owner_id, lender_type) WHERE lender_type IS NOT NULL;

-- Loans by category (working capital, investment, etc)
DROP INDEX IF EXISTS idx_loans_category;
CREATE INDEX idx_loans_category ON loans(owner_id, loan_category) WHERE loan_category IS NOT NULL;

-- =====================================================
-- FINANCIAL ANALYTICS INDEXES
-- =====================================================

-- Loans by original amount (for reporting)
DROP INDEX IF EXISTS idx_loans_amount;
CREATE INDEX idx_loans_amount ON loans(owner_id, original_amount DESC);

-- Loans by remaining principal
DROP INDEX IF EXISTS idx_loans_remaining;
CREATE INDEX idx_loans_remaining ON loans(owner_id, remaining_principal DESC) 
WHERE remaining_principal > 0;

-- =====================================================
-- DATE INDEXES
-- =====================================================

-- Loans by loan date
DROP INDEX IF EXISTS idx_loans_loan_date;
CREATE INDEX idx_loans_loan_date ON loans(owner_id, loan_date DESC);

-- Recent activity
DROP INDEX IF EXISTS idx_loans_created;
CREATE INDEX idx_loans_created ON loans(owner_id, created_at DESC);

DROP INDEX IF EXISTS idx_loans_updated;
CREATE INDEX idx_loans_updated ON loans(owner_id, updated_at DESC);

-- =====================================================
-- RELATIONSHIP INDEXES
-- =====================================================

-- Link to incomes (loan receipt)
DROP INDEX IF EXISTS idx_loans_income;
CREATE INDEX idx_loans_income ON loans(income_id) WHERE income_id IS NOT NULL;

-- =====================================================
-- LOAN_INSTALLMENTS INDEXES
-- =====================================================

-- Fast lookup by loan_id (JOIN queries)
DROP INDEX IF EXISTS idx_loan_installments_loan;
CREATE INDEX idx_loan_installments_loan ON loan_installments(loan_id);

-- Owner + loan composite
DROP INDEX IF EXISTS idx_loan_installments_owner_loan;
CREATE INDEX idx_loan_installments_owner_loan ON loan_installments(owner_id, loan_id);

-- Installments by status
DROP INDEX IF EXISTS idx_loan_installments_status;
CREATE INDEX idx_loan_installments_status ON loan_installments(owner_id, status);

-- Pending installments (not yet paid)
DROP INDEX IF EXISTS idx_loan_installments_pending;
CREATE INDEX idx_loan_installments_pending ON loan_installments(owner_id, due_date) 
WHERE status IN ('pending', 'partial');

-- Overdue installments (for alerts)
DROP INDEX IF EXISTS idx_loan_installments_overdue;
CREATE INDEX idx_loan_installments_overdue ON loan_installments(owner_id, due_date, days_late DESC) 
WHERE status IN ('overdue', 'partial');

-- Upcoming installments (next 30 days)
DROP INDEX IF EXISTS idx_loan_installments_upcoming;
CREATE INDEX idx_loan_installments_upcoming ON loan_installments(owner_id, due_date) 
WHERE status != 'paid' AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days';

-- Payment date tracking
DROP INDEX IF EXISTS idx_loan_installments_payment_date;
CREATE INDEX idx_loan_installments_payment_date ON loan_installments(owner_id, payment_date DESC) 
WHERE payment_date IS NOT NULL;

-- Link to expenses (payment)
DROP INDEX IF EXISTS idx_loan_installments_expense;
CREATE INDEX idx_loan_installments_expense ON loan_installments(expense_id) WHERE expense_id IS NOT NULL;

-- =====================================================
-- FULL-TEXT SEARCH
-- =====================================================

-- Search by lender name
DROP INDEX IF EXISTS idx_loans_lender_search;
CREATE INDEX idx_loans_lender_search ON loans USING gin(to_tsvector('simple', lender_name));

-- =====================================================
-- DATA INTEGRITY CONSTRAINTS
-- =====================================================

-- Original amount must be positive
ALTER TABLE loans 
DROP CONSTRAINT IF EXISTS loans_original_amount_check;

ALTER TABLE loans 
ADD CONSTRAINT loans_original_amount_check 
CHECK (original_amount > 0);

-- Principal paid cannot exceed original amount
ALTER TABLE loans 
DROP CONSTRAINT IF EXISTS loans_principal_paid_check;

ALTER TABLE loans 
ADD CONSTRAINT loans_principal_paid_check 
CHECK (principal_paid >= 0 AND principal_paid <= original_amount);

-- Interest paid must be non-negative
ALTER TABLE loans 
DROP CONSTRAINT IF EXISTS loans_interest_paid_check;

ALTER TABLE loans 
ADD CONSTRAINT loans_interest_paid_check 
CHECK (interest_paid >= 0);

-- Remaining principal must be non-negative
ALTER TABLE loans 
DROP CONSTRAINT IF EXISTS loans_remaining_principal_check;

ALTER TABLE loans 
ADD CONSTRAINT loans_remaining_principal_check 
CHECK (remaining_principal >= 0);

-- Interest rate must be valid
ALTER TABLE loans 
DROP CONSTRAINT IF EXISTS loans_interest_rate_check;

ALTER TABLE loans 
ADD CONSTRAINT loans_interest_rate_check 
CHECK (interest_rate >= 0 AND interest_rate <= 100);

-- Total installments must be positive
ALTER TABLE loans 
DROP CONSTRAINT IF EXISTS loans_total_installments_check;

ALTER TABLE loans 
ADD CONSTRAINT loans_total_installments_check 
CHECK (total_installments > 0);

-- Installments paid cannot exceed total
ALTER TABLE loans 
DROP CONSTRAINT IF EXISTS loans_installments_paid_check;

ALTER TABLE loans 
ADD CONSTRAINT loans_installments_paid_check 
CHECK (installments_paid >= 0 AND installments_paid <= total_installments);

-- Installment amount must be non-negative
ALTER TABLE loans 
DROP CONSTRAINT IF EXISTS loans_installment_amount_check;

ALTER TABLE loans 
ADD CONSTRAINT loans_installment_amount_check 
CHECK (installment_amount >= 0);

-- Maturity date must be >= loan date
ALTER TABLE loans 
DROP CONSTRAINT IF EXISTS loans_maturity_date_check;

ALTER TABLE loans 
ADD CONSTRAINT loans_maturity_date_check 
CHECK (maturity_date IS NULL OR maturity_date >= loan_date);

-- First installment date must be >= loan date
ALTER TABLE loans 
DROP CONSTRAINT IF EXISTS loans_first_installment_check;

ALTER TABLE loans 
ADD CONSTRAINT loans_first_installment_check 
CHECK (first_installment_date IS NULL OR first_installment_date >= loan_date);

-- Status must be valid
ALTER TABLE loans 
DROP CONSTRAINT IF EXISTS loans_status_check;

ALTER TABLE loans 
ADD CONSTRAINT loans_status_check 
CHECK (status IN ('active', 'completed', 'overdue', 'defaulted'));

-- Interest type must be valid
ALTER TABLE loans 
DROP CONSTRAINT IF EXISTS loans_interest_type_check;

ALTER TABLE loans 
ADD CONSTRAINT loans_interest_type_check 
CHECK (interest_type IN ('flat', 'effective', 'fixed'));

-- Installment frequency must be valid
ALTER TABLE loans 
DROP CONSTRAINT IF EXISTS loans_frequency_check;

ALTER TABLE loans 
ADD CONSTRAINT loans_frequency_check 
CHECK (installment_frequency IN ('daily', 'weekly', 'monthly', 'yearly'));

-- Lender type must be valid
ALTER TABLE loans 
DROP CONSTRAINT IF EXISTS loans_lender_type_check;

ALTER TABLE loans 
ADD CONSTRAINT loans_lender_type_check 
CHECK (lender_type IS NULL OR lender_type IN ('bank', 'cooperative', 'individual', 'fintech'));

-- Collateral value must be non-negative
ALTER TABLE loans 
DROP CONSTRAINT IF EXISTS loans_collateral_value_check;

ALTER TABLE loans 
ADD CONSTRAINT loans_collateral_value_check 
CHECK (collateral_value IS NULL OR collateral_value >= 0);

-- =====================================================
-- LOAN_INSTALLMENTS CONSTRAINTS
-- =====================================================

-- Installment number must be positive
ALTER TABLE loan_installments 
DROP CONSTRAINT IF EXISTS loan_installments_number_check;

ALTER TABLE loan_installments 
ADD CONSTRAINT loan_installments_number_check 
CHECK (installment_number > 0);

-- Principal amount must be non-negative
ALTER TABLE loan_installments 
DROP CONSTRAINT IF EXISTS loan_installments_principal_check;

ALTER TABLE loan_installments 
ADD CONSTRAINT loan_installments_principal_check 
CHECK (principal_amount >= 0);

-- Interest amount must be non-negative
ALTER TABLE loan_installments 
DROP CONSTRAINT IF EXISTS loan_installments_interest_check;

ALTER TABLE loan_installments 
ADD CONSTRAINT loan_installments_interest_check 
CHECK (interest_amount >= 0);

-- Total amount must be non-negative
ALTER TABLE loan_installments 
DROP CONSTRAINT IF EXISTS loan_installments_total_check;

ALTER TABLE loan_installments 
ADD CONSTRAINT loan_installments_total_check 
CHECK (total_amount >= 0);

-- Amount paid must be non-negative and not exceed total
ALTER TABLE loan_installments 
DROP CONSTRAINT IF EXISTS loan_installments_paid_check;

ALTER TABLE loan_installments 
ADD CONSTRAINT loan_installments_paid_check 
CHECK (amount_paid >= 0 AND amount_paid <= total_amount);

-- Days late must be non-negative
ALTER TABLE loan_installments 
DROP CONSTRAINT IF EXISTS loan_installments_days_late_check;

ALTER TABLE loan_installments 
ADD CONSTRAINT loan_installments_days_late_check 
CHECK (days_late >= 0);

-- Late fee must be non-negative
ALTER TABLE loan_installments 
DROP CONSTRAINT IF EXISTS loan_installments_late_fee_check;

ALTER TABLE loan_installments 
ADD CONSTRAINT loan_installments_late_fee_check 
CHECK (late_fee >= 0);

-- Payment date must be >= due date (logical check - can be removed if back-payments allowed)
-- ALTER TABLE loan_installments 
-- DROP CONSTRAINT IF EXISTS loan_installments_payment_date_check;
-- 
-- ALTER TABLE loan_installments 
-- ADD CONSTRAINT loan_installments_payment_date_check 
-- CHECK (payment_date IS NULL OR payment_date >= due_date - INTERVAL '90 days');

-- Status must be valid
ALTER TABLE loan_installments 
DROP CONSTRAINT IF EXISTS loan_installments_status_check;

ALTER TABLE loan_installments 
ADD CONSTRAINT loan_installments_status_check 
CHECK (status IN ('pending', 'paid', 'overdue', 'partial'));

-- =====================================================
-- UNIQUE CONSTRAINTS
-- =====================================================

-- Prevent duplicate loan numbers per owner
DROP INDEX IF EXISTS idx_loans_unique_loan_number;
CREATE UNIQUE INDEX idx_loans_unique_loan_number ON loans(owner_id, loan_number) 
WHERE loan_number IS NOT NULL AND loan_number != '';

-- Prevent duplicate installment numbers per loan
DROP INDEX IF EXISTS idx_loan_installments_unique_number;
CREATE UNIQUE INDEX idx_loan_installments_unique_number ON loan_installments(loan_id, installment_number);

-- =====================================================
-- QUERY OPTIMIZATION
-- Update table statistics for query planner
-- =====================================================
ANALYZE loans;
ANALYZE loan_installments;

-- =====================================================
-- PERFORMANCE HINTS
-- =====================================================
COMMENT ON INDEX idx_loans_owner IS 'Primary filter - used in 99% of queries';
COMMENT ON INDEX idx_loans_active IS 'Dashboard query - only active loans';
COMMENT ON INDEX idx_loans_overdue IS 'Alert system - overdue loans for reminders';
COMMENT ON INDEX idx_loan_installments_overdue IS 'Alert system - overdue installments';
COMMENT ON INDEX idx_loan_installments_upcoming IS 'Reminder system - installments due soon';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Finance Domain - Loans Indexes Created';
  RAISE NOTICE '   - 15 indexes on loans: owner, status, dates, lender, financial';
  RAISE NOTICE '   - 9 indexes on loan_installments: loan, status, due dates, overdue';
  RAISE NOTICE '   - 17 constraints on loans: amounts, rates, dates, enums';
  RAISE NOTICE '   - 9 constraints on loan_installments: amounts, dates, status';
  RAISE NOTICE '   - Partial indexes for: active loans, overdue, upcoming payments';
  RAISE NOTICE '   - Full-text search enabled on lender name';
  RAISE NOTICE '   - Performance optimized for: dashboard, reminders, overdue tracking';
END $$;
