-- =====================================================
-- DOMAIN: CORE
-- TABLE: business_configurations
-- INDEXES & CONSTRAINTS (Performance Optimization)
-- =====================================================

-- =====================================================
-- PART 1: PERFORMANCE INDEXES
-- =====================================================

-- Index 1: User ID lookup (primary access pattern - already in schema)
-- CREATE INDEX IF NOT EXISTS idx_business_config_user_id ON business_configurations(user_id);

-- Index 2: Onboarding status (already in schema)
-- CREATE INDEX IF NOT EXISTS idx_business_config_onboarding ON business_configurations(onboarding_completed);

-- Index 3: Business category distribution
CREATE INDEX IF NOT EXISTS idx_business_config_category
  ON business_configurations(business_category);

-- Index 4: Classification method analytics
CREATE INDEX IF NOT EXISTS idx_business_config_classification
  ON business_configurations(classification_method)
  WHERE classification_method IS NOT NULL;

-- Index 5: In-progress onboarding (step tracking)
CREATE INDEX IF NOT EXISTS idx_business_config_onboarding_progress
  ON business_configurations(onboarding_step, created_at)
  WHERE onboarding_completed = FALSE;

-- Index 6: Completed onboarding by date
CREATE INDEX IF NOT EXISTS idx_business_config_completed
  ON business_configurations(onboarding_completed_at DESC)
  WHERE onboarding_completed = TRUE;

-- Index 7: Revenue targets (for analytics)
CREATE INDEX IF NOT EXISTS idx_business_config_revenue_target
  ON business_configurations(monthly_revenue_target DESC)
  WHERE monthly_revenue_target IS NOT NULL AND monthly_revenue_target > 0;

-- Index 8: Profit margin targets
CREATE INDEX IF NOT EXISTS idx_business_config_profit_target
  ON business_configurations(profit_margin_target DESC)
  WHERE profit_margin_target IS NOT NULL AND profit_margin_target > 0;

-- Index 9: Capital tracking
CREATE INDEX IF NOT EXISTS idx_business_config_capital
  ON business_configurations(initial_capital DESC)
  WHERE initial_capital IS NOT NULL AND initial_capital > 0;

-- Index 10: Alert preferences (for notification system)
CREATE INDEX IF NOT EXISTS idx_business_config_email_alerts
  ON business_configurations(user_id)
  WHERE enable_email_alerts = TRUE;

-- Index 11: Stock alerts enabled
CREATE INDEX IF NOT EXISTS idx_business_config_stock_alerts
  ON business_configurations(user_id)
  WHERE enable_stock_alerts = TRUE;

-- Index 12: Weekly summary subscribers
CREATE INDEX IF NOT EXISTS idx_business_config_weekly_summary
  ON business_configurations(user_id)
  WHERE enable_weekly_summary = TRUE;

-- Index 13: Theme preference (for analytics)
CREATE INDEX IF NOT EXISTS idx_business_config_theme
  ON business_configurations(theme);

-- Index 14: Language preference
CREATE INDEX IF NOT EXISTS idx_business_config_language
  ON business_configurations(language);

-- Index 15: Currency preference
CREATE INDEX IF NOT EXISTS idx_business_config_currency
  ON business_configurations(currency);

-- Index 16: Created date (for cohort analysis)
CREATE INDEX IF NOT EXISTS idx_business_config_created_at
  ON business_configurations(created_at DESC);

-- Index 17: Updated date (for activity tracking)
CREATE INDEX IF NOT EXISTS idx_business_config_updated_at
  ON business_configurations(updated_at DESC);

-- =====================================================
-- PART 2: DATA INTEGRITY CONSTRAINTS
-- =====================================================

-- Constraint 1: Valid business category
ALTER TABLE business_configurations
  ADD CONSTRAINT chk_business_config_category
  CHECK (business_category IN (
    'Produk dengan Stok',
    'Produk Tanpa Stok',
    'Jasa/Layanan',
    'Trading/Reseller',
    'Hybrid'
  ));

-- Constraint 2: Valid classification method
ALTER TABLE business_configurations
  ADD CONSTRAINT chk_business_config_classification_method
  CHECK (
    classification_method IS NULL OR
    classification_method IN ('manual', 'keyword', 'ai')
  );

-- Constraint 3: Classification confidence range (0.0 to 1.0)
ALTER TABLE business_configurations
  ADD CONSTRAINT chk_business_config_confidence_range
  CHECK (
    classification_confidence IS NULL OR
    (classification_confidence >= 0.0 AND classification_confidence <= 1.0)
  );

-- Constraint 4: Positive monetary values
ALTER TABLE business_configurations
  ADD CONSTRAINT chk_business_config_positive_amounts
  CHECK (
    (monthly_revenue_target IS NULL OR monthly_revenue_target >= 0) AND
    (initial_capital IS NULL OR initial_capital >= 0) AND
    (monthly_operational_cost IS NULL OR monthly_operational_cost >= 0) AND
    (minimum_cash_alert IS NULL OR minimum_cash_alert >= 0) AND
    (expense_alert_threshold IS NULL OR expense_alert_threshold >= 0)
  );

-- Constraint 5: Profit margin percentage range (0 to 100)
ALTER TABLE business_configurations
  ADD CONSTRAINT chk_business_config_profit_margin_range
  CHECK (
    profit_margin_target IS NULL OR
    (profit_margin_target >= 0 AND profit_margin_target <= 100)
  );

-- Constraint 6: Break even months positive
ALTER TABLE business_configurations
  ADD CONSTRAINT chk_business_config_break_even_positive
  CHECK (
    break_even_months IS NULL OR
    break_even_months > 0
  );

-- Constraint 7: Onboarding step range (0 to 5)
ALTER TABLE business_configurations
  ADD CONSTRAINT chk_business_config_onboarding_step_range
  CHECK (onboarding_step >= 0 AND onboarding_step <= 5);

-- Constraint 8: Valid theme values
ALTER TABLE business_configurations
  ADD CONSTRAINT chk_business_config_theme
  CHECK (theme IN ('light', 'dark', 'auto'));

-- Constraint 9: Valid language values
ALTER TABLE business_configurations
  ADD CONSTRAINT chk_business_config_language
  CHECK (language IN ('id', 'en'));

-- Constraint 10: Valid currency values
ALTER TABLE business_configurations
  ADD CONSTRAINT chk_business_config_currency
  CHECK (currency IN ('IDR', 'USD', 'EUR', 'SGD', 'MYR'));

-- Constraint 11: Low stock threshold positive
ALTER TABLE business_configurations
  ADD CONSTRAINT chk_business_config_stock_threshold
  CHECK (
    low_stock_alert_threshold IS NULL OR
    low_stock_alert_threshold >= 0
  );

-- Constraint 12: Onboarding completed_at logic
ALTER TABLE business_configurations
  ADD CONSTRAINT chk_business_config_completion_logic
  CHECK (
    (onboarding_completed = FALSE) OR
    (onboarding_completed = TRUE AND onboarding_completed_at IS NOT NULL)
  );

-- Constraint 13: Created_at cannot be in future
ALTER TABLE business_configurations
  ADD CONSTRAINT chk_business_config_created_at_past
  CHECK (created_at <= NOW());

-- Constraint 14: Updated_at must be >= created_at
ALTER TABLE business_configurations
  ADD CONSTRAINT chk_business_config_updated_after_created
  CHECK (updated_at >= created_at);

-- Constraint 15: Completion date after creation
ALTER TABLE business_configurations
  ADD CONSTRAINT chk_business_config_completed_after_created
  CHECK (
    onboarding_completed_at IS NULL OR
    onboarding_completed_at >= created_at
  );

-- =====================================================
-- PART 3: UNIQUE CONSTRAINTS
-- =====================================================

-- Unique 1: One configuration per user (already enforced by UNIQUE on user_id in schema)

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================

-- Performance indexes
COMMENT ON INDEX idx_business_config_category IS 'Business category distribution for analytics';
COMMENT ON INDEX idx_business_config_classification IS 'Classification method breakdown';
COMMENT ON INDEX idx_business_config_onboarding_progress IS 'Track in-progress onboarding users';
COMMENT ON INDEX idx_business_config_completed IS 'Completed onboarding sorted by date';
COMMENT ON INDEX idx_business_config_revenue_target IS 'Revenue target analytics';
COMMENT ON INDEX idx_business_config_profit_target IS 'Profit margin target analytics';
COMMENT ON INDEX idx_business_config_capital IS 'Capital tracking and analytics';
COMMENT ON INDEX idx_business_config_email_alerts IS 'Users with email alerts enabled';
COMMENT ON INDEX idx_business_config_stock_alerts IS 'Users with stock alerts enabled';
COMMENT ON INDEX idx_business_config_weekly_summary IS 'Users subscribed to weekly summary';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ CORE Domain - Business Configurations Indexes & Constraints Created';
  RAISE NOTICE '   - Performance Indexes: 17 (onboarding, analytics, preferences)';
  RAISE NOTICE '   - Data Constraints: 15 (validation, ranges, logic checks)';
  RAISE NOTICE '   - Features: Onboarding tracking, alert optimization, preference indexing';
END $$;
