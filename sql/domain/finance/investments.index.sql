-- =====================================================
-- DOMAIN: FINANCE
-- TABLE: investments
-- INDEXES & CONSTRAINTS (Performance Optimization)
-- =====================================================

-- =====================================================
-- PART 1: PERFORMANCE INDEXES
-- =====================================================

-- ====== investments Table ======

-- Index 1: Active investments lookup (most common query)
CREATE INDEX IF NOT EXISTS idx_investments_active_lookup
  ON investments(owner_id, is_active, status)
  WHERE is_active = TRUE AND status = 'active';

-- Index 2: Investment date range queries
CREATE INDEX IF NOT EXISTS idx_investments_date_range
  ON investments(owner_id, investment_date DESC);

-- Index 3: Maturity date tracking (for alerts)
CREATE INDEX IF NOT EXISTS idx_investments_maturity
  ON investments(owner_id, maturity_date)
  WHERE maturity_date IS NOT NULL AND status = 'active';

-- Index 4: Profit share frequency lookup
CREATE INDEX IF NOT EXISTS idx_investments_profit_frequency
  ON investments(owner_id, profit_share_frequency, last_profit_share_date)
  WHERE is_active = TRUE;

-- Index 5: Investor search
CREATE INDEX IF NOT EXISTS idx_investments_investor_search
  ON investments(owner_id, investor_name);

-- Index 6: Investment category analytics
CREATE INDEX IF NOT EXISTS idx_investments_category
  ON investments(owner_id, investment_category)
  WHERE investment_category IS NOT NULL;

-- Index 7: Equity percentage tracking
CREATE INDEX IF NOT EXISTS idx_investments_equity
  ON investments(owner_id, equity_percentage DESC)
  WHERE equity_percentage > 0;

-- Index 8: Buyback tracking
CREATE INDEX IF NOT EXISTS idx_investments_buyback
  ON investments(owner_id, buyback_date)
  WHERE buyback_clause = TRUE AND status = 'active';

-- Index 9: Lock period tracking
CREATE INDEX IF NOT EXISTS idx_investments_lock_period
  ON investments(owner_id, start_date, lock_period_months)
  WHERE lock_period_months > 0 AND status = 'active';

-- Index 10: Total profit shared ranking
CREATE INDEX IF NOT EXISTS idx_investments_profit_ranking
  ON investments(owner_id, total_profit_shared DESC)
  WHERE is_active = TRUE;

-- Index 11: Investment number lookup (for documents)
CREATE INDEX IF NOT EXISTS idx_investments_number
  ON investments(owner_id, investment_number)
  WHERE investment_number IS NOT NULL;

-- Index 12: Status-based filtering
CREATE INDEX IF NOT EXISTS idx_investments_status_filter
  ON investments(owner_id, status, investment_date DESC);

-- Index 13: Foreign key: income_id
CREATE INDEX IF NOT EXISTS idx_investments_income_link
  ON investments(income_id)
  WHERE income_id IS NOT NULL;

-- Index 14: Foreign key: loan_id (conversion tracking)
CREATE INDEX IF NOT EXISTS idx_investments_loan_link
  ON investments(loan_id)
  WHERE loan_id IS NOT NULL;

-- Index 15: Tags search (GIN index for array)
CREATE INDEX IF NOT EXISTS idx_investments_tags
  ON investments USING GIN(tags)
  WHERE tags IS NOT NULL;

-- ====== profit_sharing_history Table ======

-- Index 16: Investment history lookup
CREATE INDEX IF NOT EXISTS idx_profit_sharing_by_investment
  ON profit_sharing_history(investment_id, period_start_date DESC);

-- Index 17: Owner + period range queries
CREATE INDEX IF NOT EXISTS idx_profit_sharing_period_range
  ON profit_sharing_history(owner_id, period_start_date, period_end_date);

-- Index 18: Payment status tracking
CREATE INDEX IF NOT EXISTS idx_profit_sharing_payment_status
  ON profit_sharing_history(owner_id, payment_status, payment_date)
  WHERE payment_status IN ('pending', 'paid');

-- Index 19: Pending payments alert
CREATE INDEX IF NOT EXISTS idx_profit_sharing_pending
  ON profit_sharing_history(owner_id, period_end_date)
  WHERE payment_status = 'pending';

-- Index 20: Paid profit sharing (for reporting)
CREATE INDEX IF NOT EXISTS idx_profit_sharing_paid
  ON profit_sharing_history(owner_id, payment_date DESC)
  WHERE payment_status = 'paid';

-- Index 21: Revenue analytics
CREATE INDEX IF NOT EXISTS idx_profit_sharing_revenue
  ON profit_sharing_history(owner_id, business_revenue DESC)
  WHERE business_revenue > 0;

-- Index 22: Profit analytics
CREATE INDEX IF NOT EXISTS idx_profit_sharing_profit
  ON profit_sharing_history(owner_id, business_profit DESC)
  WHERE business_profit > 0;

-- Index 23: Final amount ranking
CREATE INDEX IF NOT EXISTS idx_profit_sharing_amount_ranking
  ON profit_sharing_history(owner_id, final_amount DESC)
  WHERE payment_status = 'paid';

-- Index 24: Payment method analytics
CREATE INDEX IF NOT EXISTS idx_profit_sharing_payment_method
  ON profit_sharing_history(owner_id, payment_method)
  WHERE payment_status = 'paid';

-- Index 25: Foreign key: expense_id
CREATE INDEX IF NOT EXISTS idx_profit_sharing_expense_link
  ON profit_sharing_history(expense_id)
  WHERE expense_id IS NOT NULL;

-- =====================================================
-- PART 2: DATA INTEGRITY CONSTRAINTS
-- =====================================================

-- ====== investments Constraints ======

-- Constraint 1: Principal amount must be positive
ALTER TABLE investments
  ADD CONSTRAINT chk_investments_principal_positive
  CHECK (principal_amount > 0);

-- Constraint 2: Equity percentage 0-100
ALTER TABLE investments
  ADD CONSTRAINT chk_investments_equity_range
  CHECK (equity_percentage >= 0 AND equity_percentage <= 100);

-- Constraint 3: Profit share percentage 0-100
ALTER TABLE investments
  ADD CONSTRAINT chk_investments_profit_share_range
  CHECK (profit_share_percentage >= 0 AND profit_share_percentage <= 100);

-- Constraint 4: Valid profit share type
ALTER TABLE investments
  ADD CONSTRAINT chk_investments_profit_share_type
  CHECK (profit_share_type IN ('percentage', 'fixed', 'revenue_based'));

-- Constraint 5: Valid profit share frequency
ALTER TABLE investments
  ADD CONSTRAINT chk_investments_profit_frequency
  CHECK (profit_share_frequency IN ('monthly', 'quarterly', 'yearly'));

-- Constraint 6: Valid status
ALTER TABLE investments
  ADD CONSTRAINT chk_investments_status
  CHECK (status IN ('active', 'completed', 'bought_back', 'expired'));

-- Constraint 7: Valid investor type
ALTER TABLE investments
  ADD CONSTRAINT chk_investments_investor_type
  CHECK (
    investor_type IS NULL OR 
    investor_type IN ('individual', 'company', 'vc', 'angel')
  );

-- Constraint 8: Valid investment category
ALTER TABLE investments
  ADD CONSTRAINT chk_investments_category
  CHECK (
    investment_category IS NULL OR 
    investment_category IN ('seed', 'series_a', 'series_b', 'series_c', 'growth', 'working_capital')
  );

-- Constraint 9: Start date <= maturity date
ALTER TABLE investments
  ADD CONSTRAINT chk_investments_date_logic
  CHECK (
    maturity_date IS NULL OR 
    maturity_date >= start_date
  );

-- Constraint 10: Buyback date logic
ALTER TABLE investments
  ADD CONSTRAINT chk_investments_buyback_date_logic
  CHECK (
    buyback_date IS NULL OR 
    buyback_date >= start_date
  );

-- Constraint 11: Buyback multiplier must be positive
ALTER TABLE investments
  ADD CONSTRAINT chk_investments_buyback_multiplier
  CHECK (
    buyback_multiplier IS NULL OR 
    buyback_multiplier > 0
  );

-- Constraint 12: Lock period >= 0
ALTER TABLE investments
  ADD CONSTRAINT chk_investments_lock_period
  CHECK (lock_period_months >= 0);

-- Constraint 13: Total profit shared >= 0
ALTER TABLE investments
  ADD CONSTRAINT chk_investments_total_profit
  CHECK (total_profit_shared >= 0);

-- Constraint 14: Fixed amount >= 0 if profit_share_type = fixed
ALTER TABLE investments
  ADD CONSTRAINT chk_investments_fixed_amount_logic
  CHECK (
    profit_share_type != 'fixed' OR 
    (profit_share_type = 'fixed' AND profit_share_fixed_amount > 0)
  );

-- ====== profit_sharing_history Constraints ======

-- Constraint 15: Period start < period end
ALTER TABLE profit_sharing_history
  ADD CONSTRAINT chk_profit_sharing_period_logic
  CHECK (period_start_date < period_end_date);

-- Constraint 16: Business revenue >= 0
ALTER TABLE profit_sharing_history
  ADD CONSTRAINT chk_profit_sharing_revenue_positive
  CHECK (business_revenue >= 0);

-- Constraint 17: Share percentage 0-100
ALTER TABLE profit_sharing_history
  ADD CONSTRAINT chk_profit_sharing_percentage_range
  CHECK (share_percentage >= 0 AND share_percentage <= 100);

-- Constraint 18: Calculated amount >= 0
ALTER TABLE profit_sharing_history
  ADD CONSTRAINT chk_profit_sharing_calculated_positive
  CHECK (calculated_amount >= 0);

-- Constraint 19: Final amount >= 0
ALTER TABLE profit_sharing_history
  ADD CONSTRAINT chk_profit_sharing_final_positive
  CHECK (final_amount >= 0);

-- Constraint 20: Valid payment status
ALTER TABLE profit_sharing_history
  ADD CONSTRAINT chk_profit_sharing_payment_status
  CHECK (payment_status IN ('pending', 'paid', 'cancelled'));

-- Constraint 21: Valid payment method
ALTER TABLE profit_sharing_history
  ADD CONSTRAINT chk_profit_sharing_payment_method
  CHECK (
    payment_method IS NULL OR 
    payment_method IN ('transfer', 'cash', 'reinvest', 'check', 'other')
  );

-- Constraint 22: Payment date required if status = paid
ALTER TABLE profit_sharing_history
  ADD CONSTRAINT chk_profit_sharing_payment_date_logic
  CHECK (
    payment_status != 'paid' OR 
    (payment_status = 'paid' AND payment_date IS NOT NULL)
  );

-- Constraint 23: Payment date >= period_end_date
ALTER TABLE profit_sharing_history
  ADD CONSTRAINT chk_profit_sharing_payment_date_range
  CHECK (
    payment_date IS NULL OR 
    payment_date >= period_end_date
  );

-- =====================================================
-- PART 3: UNIQUE CONSTRAINTS
-- =====================================================

-- Unique 1: Investment number per owner (if provided)
CREATE UNIQUE INDEX IF NOT EXISTS idx_investments_number_unique
  ON investments(owner_id, investment_number)
  WHERE investment_number IS NOT NULL;

-- Unique 2: Prevent duplicate profit sharing for same period
CREATE UNIQUE INDEX IF NOT EXISTS idx_profit_sharing_period_unique
  ON profit_sharing_history(investment_id, period_start_date, period_end_date);

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================

-- Investments indexes
COMMENT ON INDEX idx_investments_active_lookup IS 'Fast lookup for active investments';
COMMENT ON INDEX idx_investments_date_range IS 'Investment date range queries';
COMMENT ON INDEX idx_investments_maturity IS 'Track investments approaching maturity';
COMMENT ON INDEX idx_investments_profit_frequency IS 'Support profit share scheduling';
COMMENT ON INDEX idx_investments_investor_search IS 'Search by investor name';
COMMENT ON INDEX idx_investments_category IS 'Analytics by investment category';
COMMENT ON INDEX idx_investments_equity IS 'Track equity percentage distribution';
COMMENT ON INDEX idx_investments_buyback IS 'Track buyback opportunities';
COMMENT ON INDEX idx_investments_lock_period IS 'Monitor lock period expiration';
COMMENT ON INDEX idx_investments_profit_ranking IS 'Rank by total profit shared';

-- Profit sharing indexes
COMMENT ON INDEX idx_profit_sharing_by_investment IS 'History per investment';
COMMENT ON INDEX idx_profit_sharing_period_range IS 'Period-based queries';
COMMENT ON INDEX idx_profit_sharing_payment_status IS 'Track payment status';
COMMENT ON INDEX idx_profit_sharing_pending IS 'Alert for pending payments';
COMMENT ON INDEX idx_profit_sharing_paid IS 'Reporting on paid profit shares';
COMMENT ON INDEX idx_profit_sharing_revenue IS 'Revenue analytics';
COMMENT ON INDEX idx_profit_sharing_profit IS 'Profit analytics';
COMMENT ON INDEX idx_profit_sharing_amount_ranking IS 'Rank by payment amount';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Finance Domain - Investments Indexes & Constraints Created';
  RAISE NOTICE '   - Performance Indexes: 25 (active lookup, maturity tracking, profit scheduling)';
  RAISE NOTICE '   - Data Constraints: 23 (positive amounts, valid ranges, logical dates)';
  RAISE NOTICE '   - Unique Constraints: 2 (investment number, period uniqueness)';
  RAISE NOTICE '   - Features: ROI optimization, buyback tracking, profit share reminders';
END $$;
