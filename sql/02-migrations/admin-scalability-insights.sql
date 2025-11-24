-- =====================================================
-- SCALABILITY IMPROVEMENTS FOR ADMIN PANEL
-- =====================================================

-- IMPROVEMENT 1: Add Pagination Support
-- Modify view untuk support LIMIT + OFFSET

-- IMPROVEMENT 2: Add Indexes untuk Performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_incomes_user_id_created_at ON incomes(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id_created_at ON expenses(user_id, created_at);

-- IMPROVEMENT 3: Materialized View untuk Heavy Queries (Optional - untuk 1000+ users)
CREATE MATERIALIZED VIEW IF NOT EXISTS admin_user_analytics_cached AS
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as registered_at,
  p.full_name,
  p.business_name,
  p.role,
  p.is_active,
  
  -- Cached counts (update setiap 1 jam via CRON)
  COUNT(DISTINCT inc.id) as total_income_transactions,
  COUNT(DISTINCT exp.id) as total_expense_transactions,
  COUNT(DISTINCT prod.id) as total_products,
  
  COALESCE(SUM(inc.amount), 0) as total_revenue,
  COALESCE(SUM(exp.amount), 0) as total_expenses,
  
  GREATEST(
    COALESCE(MAX(inc.created_at), '1970-01-01'::timestamptz),
    COALESCE(MAX(exp.created_at), '1970-01-01'::timestamptz)
  ) as last_activity_date
  
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.user_id
LEFT JOIN incomes inc ON u.id = inc.user_id
LEFT JOIN expenses exp ON u.id = exp.user_id
LEFT JOIN products prod ON u.id = prod.owner_id
WHERE p.role = 'user'
GROUP BY u.id, u.email, u.created_at, p.full_name, p.business_name, p.role, p.is_active;

-- Refresh materialized view (jalankan via CRON setiap 1 jam)
-- REFRESH MATERIALIZED VIEW admin_user_analytics_cached;

-- =====================================================
-- FEATURE ADOPTION - ADVANCED METRICS
-- =====================================================

-- Cohort Analysis: User retention per bulan registrasi
CREATE OR REPLACE VIEW admin_cohort_analysis AS
SELECT 
  DATE_TRUNC('month', u.created_at) as cohort_month,
  COUNT(DISTINCT u.id) as users_registered,
  COUNT(DISTINCT CASE WHEN inc.created_at > NOW() - INTERVAL '30 days' THEN u.id END) as active_users_30d,
  ROUND(
    COUNT(DISTINCT CASE WHEN inc.created_at > NOW() - INTERVAL '30 days' THEN u.id END)::numeric / 
    NULLIF(COUNT(DISTINCT u.id), 0) * 100, 
    1
  ) as retention_rate_percent
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.user_id
LEFT JOIN incomes inc ON u.id = inc.user_id
WHERE p.role = 'user'
GROUP BY DATE_TRUNC('month', u.created_at)
ORDER BY cohort_month DESC;

-- Feature Usage Trend (30 hari terakhir)
CREATE OR REPLACE VIEW admin_feature_usage_trend AS
SELECT 
  DATE(created_at) as usage_date,
  COUNT(DISTINCT user_id) FILTER (WHERE type = 'income') as income_users,
  COUNT(DISTINCT user_id) FILTER (WHERE type = 'expense') as expense_users,
  COUNT(*) FILTER (WHERE type = 'income') as income_transactions,
  COUNT(*) FILTER (WHERE type = 'expense') as expense_transactions
FROM (
  SELECT user_id, created_at, 'income' as type FROM incomes WHERE created_at > NOW() - INTERVAL '30 days'
  UNION ALL
  SELECT user_id, created_at, 'expense' as type FROM expenses WHERE created_at > NOW() - INTERVAL '30 days'
) combined
GROUP BY DATE(created_at)
ORDER BY usage_date DESC;

-- User Engagement Score (0-100)
CREATE OR REPLACE VIEW admin_user_engagement AS
SELECT 
  u.id as user_id,
  u.email,
  p.full_name,
  
  -- Engagement score calculation
  LEAST(100, (
    -- Activity recency (40 points max)
    CASE 
      WHEN MAX(GREATEST(inc.created_at, exp.created_at)) > NOW() - INTERVAL '7 days' THEN 40
      WHEN MAX(GREATEST(inc.created_at, exp.created_at)) > NOW() - INTERVAL '30 days' THEN 20
      ELSE 0
    END +
    
    -- Transaction volume (30 points max)
    LEAST(30, (COUNT(inc.id) + COUNT(exp.id)) * 2) +
    
    -- Feature diversity (30 points max)
    CASE WHEN COUNT(DISTINCT inc.id) > 0 THEN 10 ELSE 0 END +
    CASE WHEN COUNT(DISTINCT exp.id) > 0 THEN 10 ELSE 0 END +
    CASE WHEN COUNT(DISTINCT prod.id) > 0 THEN 10 ELSE 0 END
  )) as engagement_score,
  
  COUNT(inc.id) + COUNT(exp.id) as total_transactions
  
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.user_id
LEFT JOIN incomes inc ON u.id = inc.user_id
LEFT JOIN expenses exp ON u.id = exp.user_id
LEFT JOIN products prod ON u.id = prod.owner_id
WHERE p.role = 'user'
GROUP BY u.id, u.email, p.full_name
ORDER BY engagement_score DESC;

-- =====================================================
-- BUG REPORTING SYSTEM
-- =====================================================

-- Table: bug_reports
CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  page_url TEXT,
  browser_info JSONB,
  screenshot_url TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk performance
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_severity ON bug_reports(severity);
CREATE INDEX IF NOT EXISTS idx_bug_reports_user_id ON bug_reports(user_id);

-- View: Admin bug dashboard
CREATE OR REPLACE VIEW admin_bug_reports AS
SELECT 
  br.id,
  br.title,
  br.description,
  br.severity,
  br.status,
  br.page_url,
  br.created_at,
  u.email as reporter_email,
  up.full_name as reporter_name,
  admin_user.email as resolver_email,
  br.resolved_at
FROM bug_reports br
LEFT JOIN auth.users u ON br.user_id = u.id
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN auth.users admin_user ON br.resolved_by = admin_user.id
ORDER BY 
  CASE br.severity 
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  br.created_at DESC;

-- Function: Submit bug report (user-facing)
CREATE OR REPLACE FUNCTION submit_bug_report(
  p_title TEXT,
  p_description TEXT,
  p_severity TEXT DEFAULT 'medium',
  p_page_url TEXT DEFAULT NULL,
  p_browser_info JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_bug_id UUID;
BEGIN
  INSERT INTO bug_reports (user_id, title, description, severity, page_url, browser_info)
  VALUES (auth.uid(), p_title, p_description, p_severity, p_page_url, p_browser_info)
  RETURNING id INTO v_bug_id;
  
  RETURN v_bug_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Resolve bug (admin-only)
CREATE OR REPLACE FUNCTION resolve_bug_report(
  p_bug_id UUID,
  p_resolution_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  v_admin_id := auth.uid();
  
  -- Verify caller is super_admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = v_admin_id AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only super_admin can resolve bugs';
  END IF;
  
  UPDATE bug_reports
  SET 
    status = 'resolved',
    resolved_by = v_admin_id,
    resolved_at = NOW(),
    updated_at = NOW()
  WHERE id = p_bug_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON bug_reports TO authenticated;
GRANT INSERT ON bug_reports TO authenticated;
GRANT SELECT ON admin_bug_reports TO authenticated;

-- =====================================================
-- OPTIMAL INSIGHTS - DATA ANALYSIS QUERIES
-- =====================================================

-- INSIGHT 1: Revenue per User Segment
CREATE OR REPLACE VIEW admin_revenue_by_segment AS
SELECT 
  CASE 
    WHEN total_revenue = 0 THEN 'Inactive'
    WHEN total_revenue < 1000000 THEN 'Low (<1M)'
    WHEN total_revenue < 10000000 THEN 'Medium (1M-10M)'
    WHEN total_revenue < 100000000 THEN 'High (10M-100M)'
    ELSE 'Very High (>100M)'
  END as revenue_segment,
  COUNT(*) as user_count,
  ROUND(AVG(total_revenue)) as avg_revenue_per_user,
  SUM(total_revenue) as total_segment_revenue
FROM admin_user_analytics
GROUP BY revenue_segment
ORDER BY total_segment_revenue DESC;

-- INSIGHT 2: Power Users (Top 10% contributors)
CREATE OR REPLACE VIEW admin_power_users AS
WITH user_percentile AS (
  SELECT 
    user_id,
    email,
    full_name,
    business_name,
    total_revenue,
    total_income_transactions,
    PERCENT_RANK() OVER (ORDER BY total_revenue DESC) as revenue_percentile
  FROM admin_user_analytics
  WHERE total_revenue > 0
)
SELECT *
FROM user_percentile
WHERE revenue_percentile <= 0.10
ORDER BY total_revenue DESC;

-- INSIGHT 3: Churn Risk Prediction
CREATE OR REPLACE VIEW admin_churn_risk AS
SELECT 
  user_id,
  email,
  full_name,
  business_name,
  EXTRACT(DAY FROM NOW() - last_activity_date) as days_inactive,
  CASE 
    WHEN EXTRACT(DAY FROM NOW() - last_activity_date) > 90 THEN 'Critical'
    WHEN EXTRACT(DAY FROM NOW() - last_activity_date) > 60 THEN 'High'
    WHEN EXTRACT(DAY FROM NOW() - last_activity_date) > 30 THEN 'Medium'
    ELSE 'Low'
  END as churn_risk_level,
  total_revenue as lifetime_value
FROM admin_user_analytics
WHERE last_activity_date IS NOT NULL
ORDER BY days_inactive DESC;

-- INSIGHT 4: Feature Cross-Usage Analysis
CREATE OR REPLACE VIEW admin_feature_cross_usage AS
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE total_income_transactions > 0) as income_users,
  COUNT(*) FILTER (WHERE total_expense_transactions > 0) as expense_users,
  COUNT(*) FILTER (WHERE total_products > 0) as inventory_users,
  COUNT(*) FILTER (WHERE total_customers > 0) as crm_users,
  
  -- Cross-usage patterns
  COUNT(*) FILTER (WHERE total_income_transactions > 0 AND total_expense_transactions > 0) as income_and_expense,
  COUNT(*) FILTER (WHERE total_income_transactions > 0 AND total_products > 0) as income_and_inventory,
  COUNT(*) FILTER (WHERE total_income_transactions > 0 AND total_customers > 0) as income_and_crm,
  
  -- Full platform users
  COUNT(*) FILTER (
    WHERE total_income_transactions > 0 
    AND total_expense_transactions > 0 
    AND total_products > 0 
    AND total_customers > 0
  ) as full_platform_users
FROM admin_user_analytics;

-- =====================================================
-- RUN SEMUA SQL DI ATAS, LALU QUERY INSIGHTS:
-- =====================================================

-- Test insights
SELECT * FROM admin_cohort_analysis;
SELECT * FROM admin_revenue_by_segment;
SELECT * FROM admin_power_users;
SELECT * FROM admin_churn_risk LIMIT 20;
SELECT * FROM admin_feature_cross_usage;
