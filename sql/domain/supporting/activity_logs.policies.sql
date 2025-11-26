-- =====================================================
-- DOMAIN: SUPPORTING
-- TABLE: activity_logs
-- ROW LEVEL SECURITY (RLS) Policies
-- =====================================================

-- =====================================================
-- ENABLE RLS
-- =====================================================
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES: activity_logs
-- Append-only audit trail: Users can INSERT and SELECT own logs only
-- No UPDATE or DELETE (immutable audit trail)
-- =====================================================

-- Policy 1: Users can view their own activity logs
CREATE POLICY activity_logs_select_own
  ON activity_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own activity logs
CREATE POLICY activity_logs_insert_own
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Super admins can view all activity logs
CREATE POLICY activity_logs_select_admin
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- Policy 4: Super admins can insert activity logs for any user (for admin actions)
CREATE POLICY activity_logs_insert_admin
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- =====================================================
-- NO UPDATE/DELETE POLICIES
-- Activity logs are immutable for audit integrity
-- =====================================================

-- Rationale:
-- 1. Audit trail must be tamper-proof
-- 2. No legitimate use case for modifying historical logs
-- 3. If data is sensitive, don't log it in the first place
-- 4. For GDPR compliance, use metadata to flag deleted users

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION log_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_activity_logs TO authenticated;
GRANT EXECUTE ON FUNCTION get_activity_logs_by_action TO authenticated;
GRANT EXECUTE ON FUNCTION get_activity_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_activity_summary TO authenticated;
GRANT EXECUTE ON FUNCTION search_activity_logs TO authenticated;

-- Grant execute on admin functions to authenticated (RLS will handle access)
GRANT EXECUTE ON FUNCTION get_admin_activity_overview TO authenticated;

-- Grant select on views to authenticated
GRANT SELECT ON activity_logs_with_user TO authenticated;
GRANT SELECT ON recent_activity TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON POLICY activity_logs_select_own ON activity_logs IS 'Users can view their own activity logs';
COMMENT ON POLICY activity_logs_insert_own ON activity_logs IS 'Users can insert their own activity logs';
COMMENT ON POLICY activity_logs_select_admin ON activity_logs IS 'Super admins can view all activity logs';
COMMENT ON POLICY activity_logs_insert_admin ON activity_logs IS 'Super admins can insert activity logs for any user';

-- =====================================================
-- AUDIT TRAIL BEST PRACTICES
-- =====================================================

-- 1. Log all significant actions (CRUD operations, login/logout)
-- 2. Include context in metadata:
--    - affected_id: UUID of modified record
--    - old_value: Previous state (for updates)
--    - new_value: New state (for updates)
--    - reason: Why action was performed (for admin actions)
-- 3. Never log sensitive data (passwords, tokens, PII)
-- 4. Use action naming convention: <verb>_<resource> (e.g., create_income, delete_customer)
-- 5. Periodically archive old logs (e.g., > 1 year) to separate table/bucket

-- Example metadata structure:
-- {
--   "affected_id": "550e8400-e29b-41d4-a716-446655440000",
--   "old_value": {"status": "pending", "amount": 100000},
--   "new_value": {"status": "approved", "amount": 100000},
--   "reason": "Manual approval by admin"
-- }

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ SUPPORTING Domain - Activity Logs RLS Policies Created';
  RAISE NOTICE '   - Policies: 4 (user own: 2, admin: 2)';
  RAISE NOTICE '   - Security: Append-only audit trail (no UPDATE/DELETE)';
  RAISE NOTICE '   - Users: Can view and insert own logs';
  RAISE NOTICE '   - Admins: Can view all logs and insert for any user';
  RAISE NOTICE '   - Functions: All granted to authenticated users';
END $$;
