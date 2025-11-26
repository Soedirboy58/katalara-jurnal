-- =====================================================
-- DOMAIN: SUPPORTING
-- TABLE: activity_logs
-- INDEXES & CONSTRAINTS
-- =====================================================

-- =====================================================
-- INDEXES
-- =====================================================

-- Index 1: Fast lookup by user_id (most common query)
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id
  ON activity_logs(user_id);

-- Index 2: Sort by creation date (most common ORDER BY)
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at
  ON activity_logs(created_at DESC);

-- Index 3: Filter by action type
CREATE INDEX IF NOT EXISTS idx_activity_logs_action
  ON activity_logs(action);

-- Index 4: Composite index for user + date range queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created
  ON activity_logs(user_id, created_at DESC);

-- Index 5: Composite index for user + action queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_action
  ON activity_logs(user_id, action);

-- Index 6: GIN index for metadata JSONB search
CREATE INDEX IF NOT EXISTS idx_activity_logs_metadata_gin
  ON activity_logs USING GIN (metadata);

-- Index 7: GIN index for full-text search on description
CREATE INDEX IF NOT EXISTS idx_activity_logs_description_gin
  ON activity_logs USING gin (to_tsvector('english', description));

-- Index 8: Partial index for recent activity (last 30 days)
CREATE INDEX IF NOT EXISTS idx_activity_logs_recent
  ON activity_logs(user_id, created_at DESC)
  WHERE created_at >= NOW() - INTERVAL '30 days';

-- Index 9: Partial index for admin actions
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin_actions
  ON activity_logs(action, created_at DESC)
  WHERE action LIKE 'admin_%' OR action LIKE 'approve_%' OR action LIKE 'suspend_%';

-- Index 10: IP address for security audit
CREATE INDEX IF NOT EXISTS idx_activity_logs_ip_address
  ON activity_logs(ip_address)
  WHERE ip_address IS NOT NULL;

-- =====================================================
-- CONSTRAINTS
-- =====================================================

-- Constraint 1: Action must not be empty
ALTER TABLE activity_logs
  ADD CONSTRAINT chk_activity_logs_action_not_empty
  CHECK (length(trim(action)) > 0);

-- Constraint 2: Description must not be empty
ALTER TABLE activity_logs
  ADD CONSTRAINT chk_activity_logs_description_not_empty
  CHECK (length(trim(description)) > 0);

-- Constraint 3: Action must follow naming convention (lowercase, underscore-separated)
ALTER TABLE activity_logs
  ADD CONSTRAINT chk_activity_logs_action_format
  CHECK (action ~ '^[a-z_]+$');

-- Constraint 4: Metadata must be valid JSON object (not array)
ALTER TABLE activity_logs
  ADD CONSTRAINT chk_activity_logs_metadata_is_object
  CHECK (jsonb_typeof(metadata) = 'object');

-- Constraint 5: Created_at must be in the past or present (not future)
ALTER TABLE activity_logs
  ADD CONSTRAINT chk_activity_logs_created_not_future
  CHECK (created_at <= NOW());

-- =====================================================
-- STATISTICS FOR QUERY PLANNER
-- =====================================================

-- Increase statistics target for user_id (frequent WHERE clause)
ALTER TABLE activity_logs
  ALTER COLUMN user_id SET STATISTICS 1000;

-- Increase statistics for action (frequent WHERE/GROUP BY)
ALTER TABLE activity_logs
  ALTER COLUMN action SET STATISTICS 500;

-- Increase statistics for created_at (frequent ORDER BY/WHERE)
ALTER TABLE activity_logs
  ALTER COLUMN created_at SET STATISTICS 500;

-- Increase statistics for metadata (JSONB queries)
ALTER TABLE activity_logs
  ALTER COLUMN metadata SET STATISTICS 300;

-- =====================================================
-- PARTITIONING RECOMMENDATION (for high-volume systems)
-- =====================================================

-- For systems with > 1 million logs, consider partitioning by created_at:
-- 
-- CREATE TABLE activity_logs_2024_01 PARTITION OF activity_logs
--   FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
-- 
-- CREATE TABLE activity_logs_2024_02 PARTITION OF activity_logs
--   FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- 
-- Benefits:
-- 1. Faster queries (scan only relevant partitions)
-- 2. Easier archival (detach old partitions)
-- 3. Better index performance (smaller indexes per partition)

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON INDEX idx_activity_logs_user_id IS 'Fast lookup by user_id';
COMMENT ON INDEX idx_activity_logs_created_at IS 'Sort by creation date (newest first)';
COMMENT ON INDEX idx_activity_logs_action IS 'Filter by action type';
COMMENT ON INDEX idx_activity_logs_user_created IS 'Composite index for user + date range queries';
COMMENT ON INDEX idx_activity_logs_user_action IS 'Composite index for user + action queries';
COMMENT ON INDEX idx_activity_logs_metadata_gin IS 'GIN index for JSONB metadata search';
COMMENT ON INDEX idx_activity_logs_description_gin IS 'Full-text search on description';
COMMENT ON INDEX idx_activity_logs_recent IS 'Partial index for recent activity (last 30 days)';
COMMENT ON INDEX idx_activity_logs_admin_actions IS 'Partial index for admin-related actions';
COMMENT ON INDEX idx_activity_logs_ip_address IS 'IP address lookup for security audit';

COMMENT ON CONSTRAINT chk_activity_logs_action_not_empty ON activity_logs IS 'Action must not be empty string';
COMMENT ON CONSTRAINT chk_activity_logs_description_not_empty ON activity_logs IS 'Description must not be empty';
COMMENT ON CONSTRAINT chk_activity_logs_action_format ON activity_logs IS 'Action must be lowercase with underscores (e.g., create_income)';
COMMENT ON CONSTRAINT chk_activity_logs_metadata_is_object ON activity_logs IS 'Metadata must be JSON object, not array';
COMMENT ON CONSTRAINT chk_activity_logs_created_not_future ON activity_logs IS 'Created timestamp cannot be in the future';

-- =====================================================
-- MAINTENANCE RECOMMENDATIONS
-- =====================================================

-- 1. Regularly VACUUM ANALYZE activity_logs (especially after bulk inserts)
-- 2. Archive logs older than 1 year to cold storage (S3/separate table)
-- 3. Monitor table size: SELECT pg_size_pretty(pg_total_relation_size('activity_logs'));
-- 4. Set up automated archival cron job (monthly)
-- 5. Consider log retention policy (e.g., keep 13 months, delete older)

-- Example archival query:
-- DELETE FROM activity_logs 
-- WHERE created_at < NOW() - INTERVAL '1 year'
-- RETURNING *; -- Export to CSV/JSON before DELETE

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ SUPPORTING Domain - Activity Logs Indexes & Constraints Created';
  RAISE NOTICE '   - Indexes: 10 (user, date, action, composites, GIN, partials)';
  RAISE NOTICE '   - Constraints: 5 (validation, format, timestamp logic)';
  RAISE NOTICE '   - Statistics: Optimized for query planner';
  RAISE NOTICE '   - Recommendation: Consider partitioning for > 1M logs';
END $$;
