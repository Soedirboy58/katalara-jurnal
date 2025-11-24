-- =====================================================
-- ADMIN PANEL - ENHANCED INSIGHTS FOR UMKM GROWTH
-- Supporting: Finance, Monitoring, Upskilling, Integration
-- =====================================================

-- 1. GEOGRAPHIC DATA (untuk regional analysis & support)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS province TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT;

CREATE INDEX IF NOT EXISTS idx_user_profiles_province ON user_profiles(province);
CREATE INDEX IF NOT EXISTS idx_user_profiles_city ON user_profiles(city);

-- 2. BUSINESS HEALTH SCORING SYSTEM
-- Score 0-100 berdasarkan: Revenue consistency, Profit margin, Transaction frequency, Growth trend
CREATE TABLE IF NOT EXISTS business_health_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Overall Score (0-100)
  total_score INT DEFAULT 0,
  
  -- Component Scores (each 0-25)
  revenue_score INT DEFAULT 0,      -- Konsistensi pendapatan
  profit_score INT DEFAULT 0,       -- Margin keuntungan
  activity_score INT DEFAULT 0,     -- Frekuensi transaksi
  growth_score INT DEFAULT 0,       -- Tren pertumbuhan
  
  -- Business Readiness Indicators
  is_finance_ready BOOLEAN DEFAULT FALSE,  -- Siap untuk pinjaman/investasi
  is_digital_ready BOOLEAN DEFAULT FALSE,  -- Siap untuk integrasi digital
  is_scale_ready BOOLEAN DEFAULT FALSE,    -- Siap untuk scale-up
  
  -- Recommendations
  recommended_courses TEXT[],       -- Course IDs yang disarankan
  support_needed TEXT[],            -- Jenis support yang dibutuhkan
  
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USER BEHAVIOR TRACKING (untuk AI-driven recommendations)
CREATE TABLE IF NOT EXISTS user_behaviors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Feature Usage Frequency
  income_entry_count INT DEFAULT 0,
  expense_entry_count INT DEFAULT 0,
  product_management_count INT DEFAULT 0,
  customer_management_count INT DEFAULT 0,
  supplier_management_count INT DEFAULT 0,
  lapak_access_count INT DEFAULT 0,
  report_view_count INT DEFAULT 0,
  
  -- Time-based patterns
  most_active_hour INT,             -- 0-23 (jam paling aktif)
  most_active_day TEXT,             -- monday, tuesday, etc
  avg_session_duration_minutes INT,
  
  -- Pain Points (detected from behavior)
  has_inventory_issues BOOLEAN DEFAULT FALSE,
  has_cashflow_issues BOOLEAN DEFAULT FALSE,
  has_customer_retention_issues BOOLEAN DEFAULT FALSE,
  
  -- Engagement Level
  engagement_score INT DEFAULT 0,   -- 0-100
  last_active_at TIMESTAMPTZ,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_behaviors_user_id ON user_behaviors(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_engagement ON user_behaviors(engagement_score DESC);

-- 4. UPSKILLING / COURSES SYSTEM
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'finance', 'digital_marketing', 'operations', 'sales'
  level TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced
  duration_hours INT,
  
  -- Targeting
  for_business_categories TEXT[],   -- Which business types need this
  for_health_score_range INT[],     -- [min, max] score range
  
  content_url TEXT,
  instructor TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  is_free BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_course_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  progress_percentage INT DEFAULT 0,
  
  -- Recommendation source
  recommended_by_ai BOOLEAN DEFAULT FALSE,
  recommended_by_admin BOOLEAN DEFAULT FALSE,
  
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user ON user_course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON user_course_enrollments(course_id);

-- 5. SUPPORT TICKETS / REQUESTS
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL, -- 'finance_support', 'digital_integration', 'technical', 'business_consulting'
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
  status TEXT DEFAULT 'open', -- open, in_progress, waiting_user, resolved, closed
  
  subject TEXT NOT NULL,
  description TEXT,
  attachments TEXT[], -- URLs to uploaded files
  
  assigned_to UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  
  -- Internal notes for admin
  admin_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_type ON support_tickets(type);

-- 6. LAPAK ONLINE ANALYTICS (untuk track digital adoption)
CREATE TABLE IF NOT EXISTS lapak_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Traffic metrics
  total_page_views INT DEFAULT 0,
  unique_visitors INT DEFAULT 0,
  
  -- Product interaction
  product_views INT DEFAULT 0,
  product_clicks INT DEFAULT 0,
  whatsapp_clicks INT DEFAULT 0,
  
  -- Engagement
  avg_time_on_page_seconds INT DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Conversion (if applicable)
  total_inquiries INT DEFAULT 0,
  
  last_viewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lapak_analytics_user ON lapak_analytics(user_id);

-- 7. ADMIN ACTIONS LOG (audit trail)
CREATE TABLE IF NOT EXISTS admin_action_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES auth.users(id),
  target_user_id UUID REFERENCES auth.users(id),
  
  action TEXT NOT NULL, -- 'approve_user', 'suspend_user', 'assign_course', 'create_ticket', etc
  details JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_action_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON admin_action_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_action_logs(created_at DESC);

-- =====================================================
-- ENHANCED VIEWS FOR ADMIN DASHBOARD
-- =====================================================

-- VIEW: Geographic Distribution
CREATE OR REPLACE VIEW admin_geographic_stats AS
SELECT 
  province,
  city,
  COUNT(DISTINCT user_id) as user_count,
  COUNT(DISTINCT CASE WHEN is_active = TRUE THEN user_id END) as active_users,
  ROUND(AVG(CASE WHEN bhs.total_score > 0 THEN bhs.total_score ELSE NULL END), 1) as avg_health_score
FROM user_profiles up
LEFT JOIN business_health_scores bhs ON up.user_id = bhs.user_id
WHERE province IS NOT NULL AND role != 'super_admin'
GROUP BY province, city
ORDER BY user_count DESC;

GRANT SELECT ON admin_geographic_stats TO authenticated;

-- VIEW: Business Category Distribution with Health
CREATE OR REPLACE VIEW admin_category_stats AS
SELECT 
  bc.name as category_name,
  COUNT(DISTINCT up.user_id) as user_count,
  COUNT(DISTINCT CASE WHEN up.is_active = TRUE THEN up.user_id END) as active_users,
  ROUND(AVG(bhs.total_score), 1) as avg_health_score,
  COUNT(DISTINCT CASE WHEN bhs.is_finance_ready = TRUE THEN up.user_id END) as finance_ready_count
FROM user_profiles up
LEFT JOIN business_categories bc ON up.business_category_id = bc.id
LEFT JOIN business_health_scores bhs ON up.user_id = bhs.user_id
WHERE up.role != 'super_admin'
GROUP BY bc.name
ORDER BY user_count DESC;

GRANT SELECT ON admin_category_stats TO authenticated;

-- VIEW: Lapak Adoption Rate
CREATE OR REPLACE VIEW admin_lapak_adoption AS
SELECT 
  COUNT(DISTINCT la.user_id) as users_with_lapak,
  COUNT(DISTINCT CASE WHEN la.total_page_views > 0 THEN la.user_id END) as users_with_traffic,
  COUNT(DISTINCT CASE WHEN la.whatsapp_clicks > 0 THEN la.user_id END) as users_with_conversions,
  ROUND(AVG(la.total_page_views), 0) as avg_page_views,
  ROUND(AVG(la.whatsapp_clicks), 0) as avg_whatsapp_clicks
FROM lapak_analytics la;

GRANT SELECT ON admin_lapak_adoption TO authenticated;

-- VIEW: Users Needing Support (AI-driven insights)
CREATE OR REPLACE VIEW admin_users_needing_support AS
SELECT 
  up.user_id,
  up.email,
  up.full_name,
  up.business_name,
  bc.name as business_category,
  bhs.total_score as health_score,
  
  -- Support needs
  CASE 
    WHEN bhs.total_score < 40 THEN 'urgent_support'
    WHEN bhs.total_score < 60 THEN 'moderate_support'
    ELSE 'guidance_only'
  END as support_priority,
  
  ARRAY_AGG(DISTINCT bhs.support_needed) as support_types,
  ARRAY_AGG(DISTINCT bhs.recommended_courses) as recommended_courses,
  
  -- Behavioral flags
  ub.has_cashflow_issues,
  ub.has_inventory_issues,
  ub.has_customer_retention_issues,
  
  aua.last_activity_date,
  aua.days_registered
  
FROM user_profiles up
LEFT JOIN business_categories bc ON up.business_category_id = bc.id
LEFT JOIN business_health_scores bhs ON up.user_id = bhs.user_id
LEFT JOIN user_behaviors ub ON up.user_id = ub.user_id
LEFT JOIN admin_user_analytics aua ON up.user_id = aua.user_id
WHERE up.role != 'super_admin' 
  AND (bhs.total_score < 60 OR ub.has_cashflow_issues = TRUE OR ub.has_inventory_issues = TRUE)
GROUP BY up.user_id, up.email, up.full_name, up.business_name, bc.name, 
         bhs.total_score, ub.has_cashflow_issues, ub.has_inventory_issues, 
         ub.has_customer_retention_issues, aua.last_activity_date, aua.days_registered
ORDER BY bhs.total_score ASC NULLS LAST, aua.last_activity_date DESC;

GRANT SELECT ON admin_users_needing_support TO authenticated;

-- VIEW: Course Effectiveness
CREATE OR REPLACE VIEW admin_course_effectiveness AS
SELECT 
  c.id as course_id,
  c.title,
  c.category,
  COUNT(DISTINCT uce.user_id) as total_enrollments,
  COUNT(DISTINCT CASE WHEN uce.completed_at IS NOT NULL THEN uce.user_id END) as completions,
  ROUND(
    COUNT(DISTINCT CASE WHEN uce.completed_at IS NOT NULL THEN uce.user_id END)::numeric / 
    NULLIF(COUNT(DISTINCT uce.user_id), 0) * 100, 
    1
  ) as completion_rate,
  AVG(uce.progress_percentage) as avg_progress
FROM courses c
LEFT JOIN user_course_enrollments uce ON c.id = uce.course_id
GROUP BY c.id, c.title, c.category
ORDER BY total_enrollments DESC;

GRANT SELECT ON admin_course_effectiveness TO authenticated;

-- =====================================================
-- FUNCTION: Calculate Business Health Score
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_business_health_score(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_revenue_score INT := 0;
  v_profit_score INT := 0;
  v_activity_score INT := 0;
  v_growth_score INT := 0;
  v_total_score INT := 0;
  
  v_monthly_revenue NUMERIC;
  v_monthly_expense NUMERIC;
  v_profit_margin NUMERIC;
  v_transaction_count INT;
  v_growth_rate NUMERIC;
  
  v_is_finance_ready BOOLEAN := FALSE;
  v_is_digital_ready BOOLEAN := FALSE;
  v_is_scale_ready BOOLEAN := FALSE;
  
  v_recommended_courses TEXT[] := ARRAY[]::TEXT[];
  v_support_needed TEXT[] := ARRAY[]::TEXT[];
BEGIN
  
  -- 1. Revenue Score (0-25): Konsistensi pendapatan bulanan
  SELECT 
    COALESCE(SUM(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0)
  INTO v_monthly_revenue
  FROM incomes 
  WHERE user_id = target_user_id;
  
  v_revenue_score := LEAST(25, GREATEST(0, (v_monthly_revenue / 5000000 * 25)::INT));
  
  -- 2. Profit Score (0-25): Margin keuntungan
  SELECT 
    COALESCE(SUM(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0)
  INTO v_monthly_expense
  FROM expenses 
  WHERE user_id = target_user_id;
  
  IF v_monthly_revenue > 0 THEN
    v_profit_margin := ((v_monthly_revenue - v_monthly_expense) / v_monthly_revenue) * 100;
    v_profit_score := LEAST(25, GREATEST(0, (v_profit_margin / 40 * 25)::INT));
  END IF;
  
  -- 3. Activity Score (0-25): Frekuensi transaksi
  SELECT 
    COUNT(*)
  INTO v_transaction_count
  FROM (
    SELECT created_at FROM incomes WHERE user_id = target_user_id AND created_at > NOW() - INTERVAL '30 days'
    UNION ALL
    SELECT created_at FROM expenses WHERE user_id = target_user_id AND created_at > NOW() - INTERVAL '30 days'
  ) t;
  
  v_activity_score := LEAST(25, (v_transaction_count::NUMERIC / 30 * 25)::INT);
  
  -- 4. Growth Score (0-25): Tren pertumbuhan
  -- Compare last 30 days vs previous 30 days
  WITH current_period AS (
    SELECT COALESCE(SUM(amount), 0) as revenue
    FROM incomes 
    WHERE user_id = target_user_id 
      AND created_at > NOW() - INTERVAL '30 days'
  ),
  previous_period AS (
    SELECT COALESCE(SUM(amount), 0) as revenue
    FROM incomes 
    WHERE user_id = target_user_id 
      AND created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days'
  )
  SELECT 
    CASE 
      WHEN prev.revenue > 0 THEN ((curr.revenue - prev.revenue) / prev.revenue * 100)
      WHEN curr.revenue > 0 THEN 100
      ELSE 0
    END
  INTO v_growth_rate
  FROM current_period curr, previous_period prev;
  
  v_growth_score := LEAST(25, GREATEST(0, ((v_growth_rate + 20) / 40 * 25)::INT));
  
  -- Total Score
  v_total_score := v_revenue_score + v_profit_score + v_activity_score + v_growth_score;
  
  -- Readiness Indicators
  v_is_finance_ready := v_total_score >= 60 AND v_profit_margin > 10 AND v_monthly_revenue > 5000000;
  v_is_digital_ready := v_activity_score >= 15;
  v_is_scale_ready := v_total_score >= 75 AND v_growth_rate > 10;
  
  -- Recommendations based on weak areas
  IF v_revenue_score < 15 THEN
    v_recommended_courses := array_append(v_recommended_courses, 'sales_mastery');
    v_support_needed := array_append(v_support_needed, 'sales_training');
  END IF;
  
  IF v_profit_score < 15 THEN
    v_recommended_courses := array_append(v_recommended_courses, 'cost_management');
    v_support_needed := array_append(v_support_needed, 'finance_consulting');
  END IF;
  
  IF v_activity_score < 10 THEN
    v_recommended_courses := array_append(v_recommended_courses, 'digital_tools_basics');
    v_support_needed := array_append(v_support_needed, 'user_engagement');
  END IF;
  
  IF v_growth_score < 10 THEN
    v_recommended_courses := array_append(v_recommended_courses, 'growth_strategy');
    v_support_needed := array_append(v_support_needed, 'business_consulting');
  END IF;
  
  -- Upsert into business_health_scores
  INSERT INTO business_health_scores (
    user_id, total_score, revenue_score, profit_score, activity_score, growth_score,
    is_finance_ready, is_digital_ready, is_scale_ready,
    recommended_courses, support_needed, last_calculated_at
  )
  VALUES (
    target_user_id, v_total_score, v_revenue_score, v_profit_score, v_activity_score, v_growth_score,
    v_is_finance_ready, v_is_digital_ready, v_is_scale_ready,
    v_recommended_courses, v_support_needed, NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_score = EXCLUDED.total_score,
    revenue_score = EXCLUDED.revenue_score,
    profit_score = EXCLUDED.profit_score,
    activity_score = EXCLUDED.activity_score,
    growth_score = EXCLUDED.growth_score,
    is_finance_ready = EXCLUDED.is_finance_ready,
    is_digital_ready = EXCLUDED.is_digital_ready,
    is_scale_ready = EXCLUDED.is_scale_ready,
    recommended_courses = EXCLUDED.recommended_courses,
    support_needed = EXCLUDED.support_needed,
    last_calculated_at = NOW();
    
END;
$$;

-- Function: Calculate health scores for all users
CREATE OR REPLACE FUNCTION calculate_all_health_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT user_id FROM user_profiles WHERE role != 'super_admin'
  LOOP
    PERFORM calculate_business_health_score(user_record.user_id);
  END LOOP;
END;
$$;

-- =====================================================
-- SEED DATA: Sample Courses
-- =====================================================
INSERT INTO courses (title, description, category, level, duration_hours, for_business_categories, for_health_score_range, is_free)
VALUES
  ('Sales Mastery untuk UMKM', 'Tingkatkan penjualan dengan teknik closing yang efektif', 'sales', 'beginner', 4, ARRAY['retail', 'f&b', 'fashion'], ARRAY[0, 50], TRUE),
  ('Manajemen Keuangan Dasar', 'Kelola cashflow dan profit dengan benar', 'finance', 'beginner', 3, ARRAY['all'], ARRAY[0, 60], TRUE),
  ('Digital Marketing 101', 'Promosi online di Instagram, TikTok, dan Facebook', 'digital_marketing', 'beginner', 5, ARRAY['all'], ARRAY[0, 100], TRUE),
  ('Cost Control & Efficiency', 'Potong biaya tanpa mengurangi kualitas', 'finance', 'intermediate', 4, ARRAY['all'], ARRAY[30, 70], TRUE),
  ('Growth Strategy & Scaling', 'Cara scale bisnis dari omzet 10jt ke 100jt', 'operations', 'advanced', 6, ARRAY['all'], ARRAY[60, 100], FALSE);

-- =====================================================
-- PERMISSIONS
-- =====================================================
GRANT SELECT ON business_health_scores TO authenticated;
GRANT SELECT ON user_behaviors TO authenticated;
GRANT SELECT ON courses TO authenticated;
GRANT SELECT ON user_course_enrollments TO authenticated;
GRANT SELECT ON support_tickets TO authenticated;
GRANT SELECT ON lapak_analytics TO authenticated;
GRANT SELECT ON admin_action_logs TO authenticated;

-- =====================================================
-- MANUAL RUN COMMANDS (for initial setup)
-- =====================================================
-- Run this to calculate health scores for existing users:
-- SELECT calculate_all_health_scores();

-- =====================================================
-- DONE! Admin panel now has rich data for:
-- 1. Geographic analysis
-- 2. Business health monitoring
-- 3. User behavior tracking
-- 4. AI-driven course recommendations
-- 5. Support ticket management
-- 6. Lapak adoption tracking
-- =====================================================
