-- =====================================================
-- DOMAIN: SUPPORTING
-- TABLE: activity_logs
-- BUSINESS LOGIC (Functions + Views)
-- =====================================================

-- =====================================================
-- FUNCTION 1: Log Activity
-- =====================================================
CREATE OR REPLACE FUNCTION log_activity(
  p_user_id UUID,
  p_action TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO activity_logs (
    user_id,
    action,
    description,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_action,
    p_description,
    p_metadata,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_activity IS 'Log user action to activity_logs table';

-- =====================================================
-- FUNCTION 2: Get User Activity Logs
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_activity_logs(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  action TEXT,
  description TEXT,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.action,
    al.description,
    al.metadata,
    al.ip_address,
    al.user_agent,
    al.created_at
  FROM activity_logs al
  WHERE al.user_id = p_user_id
  ORDER BY al.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_activity_logs IS 'Get paginated activity logs for specific user';

-- =====================================================
-- FUNCTION 3: Get Activity Logs by Action Type
-- =====================================================
CREATE OR REPLACE FUNCTION get_activity_logs_by_action(
  p_user_id UUID,
  p_action TEXT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.description,
    al.metadata,
    al.created_at
  FROM activity_logs al
  WHERE al.user_id = p_user_id
    AND al.action = p_action
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_activity_logs_by_action IS 'Get activity logs filtered by specific action type';

-- =====================================================
-- FUNCTION 4: Get Activity Statistics
-- =====================================================
CREATE OR REPLACE FUNCTION get_activity_statistics(
  p_user_id UUID,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_actions', COUNT(*),
    'actions_by_type', jsonb_object_agg(action, action_count),
    'date_range', jsonb_build_object(
      'from', COALESCE(p_date_from, MIN(created_at)),
      'to', COALESCE(p_date_to, MAX(created_at))
    ),
    'most_common_action', (
      SELECT action
      FROM activity_logs
      WHERE user_id = p_user_id
        AND (p_date_from IS NULL OR created_at >= p_date_from)
        AND (p_date_to IS NULL OR created_at <= p_date_to)
      GROUP BY action
      ORDER BY COUNT(*) DESC
      LIMIT 1
    )
  ) INTO v_stats
  FROM (
    SELECT 
      action,
      COUNT(*) AS action_count
    FROM activity_logs
    WHERE user_id = p_user_id
      AND (p_date_from IS NULL OR created_at >= p_date_from)
      AND (p_date_to IS NULL OR created_at <= p_date_to)
    GROUP BY action
  ) sub;
  
  RETURN COALESCE(v_stats, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_activity_statistics IS 'Get activity statistics for user within date range';

-- =====================================================
-- FUNCTION 5: Get Recent Activity Summary
-- =====================================================
CREATE OR REPLACE FUNCTION get_recent_activity_summary(
  p_user_id UUID,
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  action TEXT,
  count BIGINT,
  last_occurrence TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.action,
    COUNT(*) AS count,
    MAX(al.created_at) AS last_occurrence
  FROM activity_logs al
  WHERE al.user_id = p_user_id
    AND al.created_at >= NOW() - (p_hours || ' hours')::INTERVAL
  GROUP BY al.action
  ORDER BY count DESC, last_occurrence DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_recent_activity_summary IS 'Get summary of recent activity grouped by action type';

-- =====================================================
-- FUNCTION 6: Get Admin Activity Overview (All Users)
-- =====================================================
CREATE OR REPLACE FUNCTION get_admin_activity_overview(
  p_date_from TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_date_to TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  total_actions BIGINT,
  total_users BIGINT,
  actions_per_day NUMERIC,
  most_active_user UUID,
  most_active_user_actions BIGINT,
  action_breakdown JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT AS total_actions,
    COUNT(DISTINCT user_id)::BIGINT AS total_users,
    ROUND(
      COUNT(*)::NUMERIC / NULLIF(EXTRACT(DAYS FROM (p_date_to - p_date_from)), 0),
      2
    ) AS actions_per_day,
    (
      SELECT user_id
      FROM activity_logs
      WHERE created_at BETWEEN p_date_from AND p_date_to
      GROUP BY user_id
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) AS most_active_user,
    (
      SELECT COUNT(*)::BIGINT
      FROM activity_logs
      WHERE created_at BETWEEN p_date_from AND p_date_to
      GROUP BY user_id
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) AS most_active_user_actions,
    (
      SELECT jsonb_object_agg(action, action_count)
      FROM (
        SELECT action, COUNT(*) AS action_count
        FROM activity_logs
        WHERE created_at BETWEEN p_date_from AND p_date_to
        GROUP BY action
        ORDER BY action_count DESC
      ) sub
    ) AS action_breakdown
  FROM activity_logs
  WHERE created_at BETWEEN p_date_from AND p_date_to;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_admin_activity_overview IS 'Get system-wide activity overview for admin dashboard';

-- =====================================================
-- FUNCTION 7: Search Activity Logs
-- =====================================================
CREATE OR REPLACE FUNCTION search_activity_logs(
  p_user_id UUID,
  p_search_term TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  action TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.action,
    al.description,
    al.metadata,
    al.created_at
  FROM activity_logs al
  WHERE al.user_id = p_user_id
    AND (
      al.action ILIKE '%' || p_search_term || '%'
      OR al.description ILIKE '%' || p_search_term || '%'
      OR al.metadata::text ILIKE '%' || p_search_term || '%'
    )
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_activity_logs IS 'Search activity logs by keyword in action, description, or metadata';

-- =====================================================
-- VIEW: Activity Logs with User Info
-- =====================================================
CREATE OR REPLACE VIEW activity_logs_with_user AS
SELECT 
  al.id,
  al.user_id,
  up.full_name,
  up.business_name,
  up.role,
  al.action,
  al.description,
  al.metadata,
  al.ip_address,
  al.user_agent,
  al.created_at
FROM activity_logs al
LEFT JOIN user_profiles up ON al.user_id = up.user_id;

COMMENT ON VIEW activity_logs_with_user IS 'Activity logs enriched with user profile information';

-- =====================================================
-- VIEW: Recent Activity (Last 7 Days)
-- =====================================================
CREATE OR REPLACE VIEW recent_activity AS
SELECT 
  al.id,
  al.user_id,
  up.full_name,
  up.business_name,
  al.action,
  al.description,
  al.metadata,
  al.created_at
FROM activity_logs al
LEFT JOIN user_profiles up ON al.user_id = up.user_id
WHERE al.created_at >= NOW() - INTERVAL '7 days'
ORDER BY al.created_at DESC;

COMMENT ON VIEW recent_activity IS 'Activity logs from the last 7 days with user info';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ SUPPORTING Domain - Activity Logs Logic Created';
  RAISE NOTICE '   - Functions: 7 (log, get, filter, stats, search, admin overview)';
  RAISE NOTICE '   - Views: 2 (with user info, recent activity)';
  RAISE NOTICE '   - Note: Logs are append-only (no UPDATE/DELETE functions)';
END $$;
