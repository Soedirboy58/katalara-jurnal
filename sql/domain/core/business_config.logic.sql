-- =====================================================
-- DOMAIN: CORE
-- TABLE: business_configurations
-- LOGIC: Functions & Triggers
-- =====================================================

-- =====================================================
-- FUNCTION: Get business configuration for user
-- =====================================================
CREATE OR REPLACE FUNCTION get_business_config(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  business_category TEXT,
  business_description TEXT,
  monthly_revenue_target BIGINT,
  profit_margin_target FLOAT,
  initial_capital BIGINT,
  onboarding_completed BOOLEAN,
  theme TEXT,
  language TEXT,
  currency TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bc.id,
    bc.user_id,
    bc.business_category,
    bc.business_description,
    bc.monthly_revenue_target,
    bc.profit_margin_target,
    bc.initial_capital,
    bc.onboarding_completed,
    bc.theme,
    bc.language,
    bc.currency
  FROM business_configurations bc
  WHERE bc.user_id = COALESCE(p_user_id, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Initialize default business config
-- Called during onboarding or profile creation
-- =====================================================
CREATE OR REPLACE FUNCTION initialize_business_config(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_config_id UUID;
BEGIN
  INSERT INTO business_configurations (
    user_id,
    business_category,
    classification_method,
    onboarding_step
  )
  VALUES (
    p_user_id,
    'Produk dengan Stok', -- Default category
    'manual',
    0 -- Start at step 0
  )
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO v_config_id;
  
  RETURN v_config_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Complete onboarding
-- Mark onboarding as completed
-- =====================================================
CREATE OR REPLACE FUNCTION complete_onboarding(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID := COALESCE(p_user_id, auth.uid());
BEGIN
  UPDATE business_configurations
  SET
    onboarding_completed = TRUE,
    onboarding_completed_at = NOW(),
    onboarding_step = 5, -- Final step
    updated_at = NOW()
  WHERE user_id = v_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Update onboarding progress
-- Save current step when user exits
-- =====================================================
CREATE OR REPLACE FUNCTION update_onboarding_step(
  p_user_id UUID,
  p_step INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE business_configurations
  SET
    onboarding_step = p_step,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Get onboarding statistics
-- For analytics dashboard
-- =====================================================
CREATE OR REPLACE FUNCTION get_onboarding_statistics()
RETURNS TABLE (
  total_users BIGINT,
  completed_onboarding BIGINT,
  in_progress BIGINT,
  not_started BIGINT,
  completion_rate FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_users,
    COUNT(*) FILTER (WHERE onboarding_completed = TRUE)::BIGINT AS completed_onboarding,
    COUNT(*) FILTER (WHERE onboarding_completed = FALSE AND onboarding_step > 0)::BIGINT AS in_progress,
    COUNT(*) FILTER (WHERE onboarding_completed = FALSE AND onboarding_step = 0)::BIGINT AS not_started,
    ROUND(
      (COUNT(*) FILTER (WHERE onboarding_completed = TRUE)::FLOAT / NULLIF(COUNT(*), 0)) * 100,
      2
    ) AS completion_rate
  FROM business_configurations;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Get users by business category
-- For segmentation and analytics
-- =====================================================
CREATE OR REPLACE FUNCTION get_users_by_category()
RETURNS TABLE (
  business_category TEXT,
  user_count BIGINT,
  percentage FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bc.business_category,
    COUNT(*)::BIGINT AS user_count,
    ROUND(
      (COUNT(*)::FLOAT / NULLIF((SELECT COUNT(*) FROM business_configurations WHERE onboarding_completed = TRUE), 0)) * 100,
      2
    ) AS percentage
  FROM business_configurations bc
  WHERE bc.onboarding_completed = TRUE
  GROUP BY bc.business_category
  ORDER BY user_count DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Calculate business health score
-- Based on configuration completeness and targets
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_business_health_score(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_config RECORD;
BEGIN
  SELECT * INTO v_config
  FROM business_configurations
  WHERE user_id = p_user_id;
  
  IF v_config IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Base score for completing onboarding
  IF v_config.onboarding_completed THEN
    v_score := v_score + 20;
  END IF;
  
  -- Score for setting financial targets
  IF v_config.monthly_revenue_target IS NOT NULL AND v_config.monthly_revenue_target > 0 THEN
    v_score := v_score + 15;
  END IF;
  
  IF v_config.profit_margin_target IS NOT NULL AND v_config.profit_margin_target > 0 THEN
    v_score := v_score + 15;
  END IF;
  
  -- Score for capital tracking
  IF v_config.initial_capital IS NOT NULL AND v_config.initial_capital > 0 THEN
    v_score := v_score + 15;
  END IF;
  
  IF v_config.monthly_operational_cost IS NOT NULL AND v_config.monthly_operational_cost > 0 THEN
    v_score := v_score + 10;
  END IF;
  
  -- Score for alert configuration
  IF v_config.minimum_cash_alert IS NOT NULL AND v_config.minimum_cash_alert > 0 THEN
    v_score := v_score + 10;
  END IF;
  
  IF v_config.expense_alert_threshold IS NOT NULL AND v_config.expense_alert_threshold > 0 THEN
    v_score := v_score + 5;
  END IF;
  
  -- Score for having business description
  IF v_config.business_description IS NOT NULL AND LENGTH(v_config.business_description) > 10 THEN
    v_score := v_score + 10;
  END IF;
  
  RETURN LEAST(v_score, 100); -- Cap at 100
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_business_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- TRIGGER 1: Auto-update updated_at timestamp
DROP TRIGGER IF EXISTS update_business_config_updated_at ON business_configurations;
CREATE TRIGGER update_business_config_updated_at
  BEFORE UPDATE ON business_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_business_config_timestamp();

-- TRIGGER 2: Auto-set onboarding_completed_at when completed
CREATE OR REPLACE FUNCTION set_onboarding_completed_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.onboarding_completed = TRUE AND OLD.onboarding_completed = FALSE THEN
    NEW.onboarding_completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_onboarding_completed_at ON business_configurations;
CREATE TRIGGER set_onboarding_completed_at
  BEFORE UPDATE ON business_configurations
  FOR EACH ROW
  EXECUTE FUNCTION set_onboarding_completed_timestamp();

-- =====================================================
-- VIEW: Business Configuration Overview
-- Comprehensive view with user profile data
-- =====================================================
CREATE OR REPLACE VIEW business_config_overview AS
SELECT
  bc.id AS config_id,
  bc.user_id,
  up.full_name,
  up.business_name,
  bc.business_category,
  bc.business_description,
  bc.classification_method,
  bc.monthly_revenue_target,
  bc.profit_margin_target,
  bc.initial_capital,
  bc.onboarding_completed,
  bc.onboarding_completed_at,
  bc.onboarding_step,
  bc.theme,
  bc.language,
  bc.currency,
  bc.created_at,
  bc.updated_at
FROM business_configurations bc
LEFT JOIN user_profiles up ON bc.user_id = up.user_id;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION get_business_config IS 'Get business configuration for current or specified user';
COMMENT ON FUNCTION initialize_business_config IS 'Create default business config during onboarding';
COMMENT ON FUNCTION complete_onboarding IS 'Mark onboarding as completed for user';
COMMENT ON FUNCTION update_onboarding_step IS 'Save current onboarding step when user exits';
COMMENT ON FUNCTION get_onboarding_statistics IS 'Analytics: onboarding completion statistics';
COMMENT ON FUNCTION get_users_by_category IS 'Analytics: user distribution by business category';
COMMENT ON FUNCTION calculate_business_health_score IS 'Calculate configuration completeness score (0-100)';
COMMENT ON VIEW business_config_overview IS 'Combined view of business config with user profile';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ CORE Domain - Business Configurations Logic Created';
  RAISE NOTICE '   - Functions: 7 (config management, onboarding, analytics, health score)';
  RAISE NOTICE '   - Triggers: 2 (timestamp update, completion tracking)';
  RAISE NOTICE '   - View: business_config_overview (combined with user profiles)';
  RAISE NOTICE '   - Features: Onboarding workflow, health scoring, analytics';
END $$;
