-- ============================================================================
-- BUG REPORTS & USER MONITORING SYSTEM
-- ============================================================================
-- Tables untuk bug reports, feedback, dan user activity monitoring
-- ============================================================================

-- 1. BUG REPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Report Details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'bug', 'feature_request', 'feedback', 'complaint'
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status TEXT DEFAULT 'new', -- 'new', 'in_progress', 'resolved', 'wont_fix', 'duplicate'
  
  -- Technical Details
  page_url TEXT,
  browser_info TEXT,
  device_info TEXT,
  screenshot_url TEXT,
  error_message TEXT,
  
  -- User Contact
  user_email TEXT,
  user_phone TEXT,
  user_name TEXT,
  
  -- Admin Notes
  admin_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. USER ACTIVITY LOG
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Activity Details
  action TEXT NOT NULL, -- 'login', 'register', 'add_expense', 'add_product', 'view_dashboard', etc.
  page TEXT,
  details JSONB,
  
  -- Session Info
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. USER STATS (Aggregated)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Activity Stats
  total_logins INT DEFAULT 0,
  last_login_at TIMESTAMP WITH TIME ZONE,
  total_expenses_created INT DEFAULT 0,
  total_products_created INT DEFAULT 0,
  total_sales INT DEFAULT 0,
  
  -- Engagement Stats
  days_active INT DEFAULT 0,
  last_active_at TIMESTAMP WITH TIME ZONE,
  onboarding_completed BOOLEAN DEFAULT false,
  
  -- Business Stats
  total_revenue DECIMAL(15, 2) DEFAULT 0,
  total_expenses_amount DECIMAL(15, 2) DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. SYSTEM NOTIFICATIONS (Admin alerts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Notification Details
  type TEXT NOT NULL, -- 'new_user', 'new_bug', 'critical_bug', 'user_milestone', 'system_error'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
  
  -- Related Data
  related_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  related_bug_id UUID REFERENCES bug_reports(id) ON DELETE SET NULL,
  data JSONB,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Bug Reports Indexes
CREATE INDEX IF NOT EXISTS idx_bug_reports_user ON bug_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_category ON bug_reports(category);
CREATE INDEX IF NOT EXISTS idx_bug_reports_severity ON bug_reports(severity);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created ON bug_reports(created_at DESC);

-- User Activity Log Indexes
CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_action ON user_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_created ON user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_user_date ON user_activity_log(user_id, created_at DESC);

-- User Stats Indexes
CREATE INDEX IF NOT EXISTS idx_user_stats_last_active ON user_stats(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_total_revenue ON user_stats(total_revenue DESC);

-- System Notifications Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_type ON system_notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON system_notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON system_notifications(created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update updated_at on bug_reports
CREATE OR REPLACE FUNCTION update_bug_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_bug_reports_updated_at ON bug_reports;
CREATE TRIGGER trigger_bug_reports_updated_at
  BEFORE UPDATE ON bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_bug_reports_updated_at();

-- Trigger: Update updated_at on user_stats
CREATE OR REPLACE FUNCTION update_user_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_stats_updated_at ON user_stats;
CREATE TRIGGER trigger_user_stats_updated_at
  BEFORE UPDATE ON user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_updated_at();

-- Trigger: Create notification on new critical bug
CREATE OR REPLACE FUNCTION notify_critical_bug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.severity = 'critical' THEN
    INSERT INTO system_notifications (
      type,
      title,
      message,
      severity,
      related_user_id,
      related_bug_id,
      data
    ) VALUES (
      'critical_bug',
      '🚨 Critical Bug Reported',
      'Critical bug: ' || NEW.title,
      'error',
      NEW.user_id,
      NEW.id,
      jsonb_build_object(
        'bug_id', NEW.id,
        'title', NEW.title,
        'user_email', NEW.user_email
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_critical_bug ON bug_reports;
CREATE TRIGGER trigger_notify_critical_bug
  AFTER INSERT ON bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION notify_critical_bug();

-- Trigger: Create notification on new user registration
CREATE OR REPLACE FUNCTION notify_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO system_notifications (
    type,
    title,
    message,
    severity,
    related_user_id,
    data
  ) VALUES (
    'new_user',
    '👤 New User Registered',
    'New user: ' || COALESCE(NEW.email, 'Unknown'),
    'info',
    NEW.id,
    jsonb_build_object(
      'user_id', NEW.id,
      'email', NEW.email,
      'created_at', NEW.created_at
    )
  );
  
  -- Initialize user stats
  INSERT INTO user_stats (user_id, created_at)
  VALUES (NEW.id, NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_new_user ON auth.users;
CREATE TRIGGER trigger_notify_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_user();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Bug Reports RLS
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create bug reports" ON bug_reports;
CREATE POLICY "Users can create bug reports"
  ON bug_reports FOR INSERT
  WITH CHECK (true); -- Anyone can report bugs (even anonymous)

DROP POLICY IF EXISTS "Users can view own bug reports" ON bug_reports;
CREATE POLICY "Users can view own bug reports"
  ON bug_reports FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update own bug reports" ON bug_reports;
CREATE POLICY "Users can update own bug reports"
  ON bug_reports FOR UPDATE
  USING (auth.uid() = user_id AND status = 'new');

-- User Activity Log RLS
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can log own activity" ON user_activity_log;
CREATE POLICY "Users can log own activity"
  ON user_activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own activity" ON user_activity_log;
CREATE POLICY "Users can view own activity"
  ON user_activity_log FOR SELECT
  USING (auth.uid() = user_id);

-- User Stats RLS
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own stats" ON user_stats;
CREATE POLICY "Users can view own stats"
  ON user_stats FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can update user stats" ON user_stats;
CREATE POLICY "System can update user stats"
  ON user_stats FOR UPDATE
  USING (true);

-- System Notifications RLS (Admin only - will be handled in API)
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_action TEXT,
  p_page TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO user_activity_log (
    user_id,
    action,
    page,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_action,
    p_page,
    p_details,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_activity_id;
  
  -- Update user stats
  UPDATE user_stats
  SET 
    last_active_at = NOW(),
    days_active = days_active + 1
  WHERE user_id = p_user_id;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update user stats on expense
CREATE OR REPLACE FUNCTION update_stats_on_expense()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_stats
  SET 
    total_expenses_created = total_expenses_created + 1,
    total_expenses_amount = total_expenses_amount + NEW.amount,
    last_active_at = NOW()
  WHERE user_id = NEW.owner_id OR user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_stats_on_expense ON expenses;
CREATE TRIGGER trigger_update_stats_on_expense
  AFTER INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_stats_on_expense();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE bug_reports IS 'User bug reports and feedback submissions';
COMMENT ON TABLE user_activity_log IS 'Log of all user activities for monitoring';
COMMENT ON TABLE user_stats IS 'Aggregated user statistics and metrics';
COMMENT ON TABLE system_notifications IS 'System-wide notifications for admin monitoring';

COMMENT ON COLUMN bug_reports.severity IS 'Bug severity: low, medium, high, critical';
COMMENT ON COLUMN bug_reports.status IS 'Bug status: new, in_progress, resolved, wont_fix, duplicate';
COMMENT ON COLUMN user_activity_log.action IS 'User action: login, register, add_expense, etc.';
COMMENT ON COLUMN user_stats.days_active IS 'Total days user has been active';
