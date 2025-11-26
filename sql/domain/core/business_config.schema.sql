-- =====================================================
-- DOMAIN: CORE
-- TABLE: business_configurations
-- PURPOSE: Business setup & onboarding configuration
-- =====================================================

-- =====================================================
-- TABLE: business_configurations
-- Per-user business configuration & onboarding data
-- =====================================================
CREATE TABLE IF NOT EXISTS business_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Business Type Classification
  business_category TEXT NOT NULL, -- 'Produk dengan Stok', 'Produk Tanpa Stok', 'Jasa/Layanan', 'Trading/Reseller', 'Hybrid'
  business_description TEXT, -- Original user input from onboarding
  classification_method TEXT, -- 'manual', 'keyword', 'ai'
  classification_confidence FLOAT, -- 0.0 to 1.0 (AI confidence score)
  
  -- Business Goals & Targets
  monthly_revenue_target BIGINT, -- Target revenue per month (Rupiah)
  profit_margin_target FLOAT, -- Target profit margin percentage (e.g., 25.5)
  break_even_months INTEGER, -- Expected months to break even
  
  -- Capital & Finance Tracking
  initial_capital BIGINT, -- Modal awal bisnis (Rupiah)
  monthly_operational_cost BIGINT, -- Biaya operasional per bulan (Rupiah)
  minimum_cash_alert BIGINT, -- Alert threshold untuk cash rendah (Rupiah)
  
  -- User Preferences & Alerts
  enable_email_alerts BOOLEAN DEFAULT TRUE,
  enable_stock_alerts BOOLEAN DEFAULT TRUE,
  enable_weekly_summary BOOLEAN DEFAULT TRUE,
  
  -- Onboarding Progress Tracking
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_completed_at TIMESTAMPTZ,
  onboarding_step INTEGER DEFAULT 0, -- Track current step if user exits
  
  -- Additional Settings (from user menu feature)
  theme TEXT DEFAULT 'light', -- 'light', 'dark', 'auto'
  language TEXT DEFAULT 'id', -- 'id', 'en'
  currency TEXT DEFAULT 'IDR', -- 'IDR', 'USD', etc
  
  -- Alert Thresholds (from general settings)
  expense_alert_threshold BIGINT, -- Alert if expense > this amount
  low_stock_alert_threshold INTEGER DEFAULT 10, -- Alert if stock < this number
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BASIC INDEXES (More in business_config.index.sql)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_business_config_user_id ON business_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_business_config_onboarding ON business_configurations(onboarding_completed);

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================
COMMENT ON TABLE business_configurations IS 'Per-user business configuration, onboarding data, and preferences';
COMMENT ON COLUMN business_configurations.user_id IS 'One config per user - FK to auth.users';
COMMENT ON COLUMN business_configurations.business_category IS '5 categories: Produk dengan Stok, Produk Tanpa Stok, Jasa/Layanan, Trading/Reseller, Hybrid';
COMMENT ON COLUMN business_configurations.business_description IS 'User''s original business description from onboarding wizard';
COMMENT ON COLUMN business_configurations.classification_method IS 'How category was determined: manual (user selected), keyword (auto-detected), ai (AI classified)';
COMMENT ON COLUMN business_configurations.classification_confidence IS 'AI confidence score 0.0-1.0 (only for ai method)';
COMMENT ON COLUMN business_configurations.monthly_revenue_target IS 'User''s monthly revenue goal in Rupiah';
COMMENT ON COLUMN business_configurations.profit_margin_target IS 'Target profit margin as percentage (e.g., 25.5 = 25.5%)';
COMMENT ON COLUMN business_configurations.break_even_months IS 'Expected months to reach break-even point';
COMMENT ON COLUMN business_configurations.initial_capital IS 'Starting business capital in Rupiah';
COMMENT ON COLUMN business_configurations.monthly_operational_cost IS 'Monthly operational expenses in Rupiah';
COMMENT ON COLUMN business_configurations.minimum_cash_alert IS 'Alert threshold for low cash warning';
COMMENT ON COLUMN business_configurations.onboarding_completed IS 'TRUE if user finished onboarding wizard';
COMMENT ON COLUMN business_configurations.onboarding_step IS 'Current step (0-5) if user exited mid-onboarding';
COMMENT ON COLUMN business_configurations.theme IS 'UI theme: light, dark, or auto';
COMMENT ON COLUMN business_configurations.language IS 'Interface language: id (Indonesian) or en (English)';
COMMENT ON COLUMN business_configurations.currency IS 'Default currency: IDR, USD, etc';
COMMENT ON COLUMN business_configurations.expense_alert_threshold IS 'Alert if single expense exceeds this amount';
COMMENT ON COLUMN business_configurations.low_stock_alert_threshold IS 'Alert if product stock falls below this number';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ CORE Domain - Business Configurations Schema Created';
  RAISE NOTICE '   - Table: business_configurations (per-user business setup)';
  RAISE NOTICE '   - Features: Onboarding tracking, goals/targets, alerts, preferences';
  RAISE NOTICE '   - Links to: auth.users (one config per user)';
END $$;
