-- =====================================================
-- SUPPORTING DOMAIN - SMOKE TESTS & DEBUG QUERIES
-- =====================================================
-- Purpose: Health check for SUPPORTING domain after deployment
-- Version: 1.0
-- Usage: \i sql/domain/supporting/supporting.debug.sql
-- =====================================================

\echo ''
\echo '════════════════════════════════════════════════════'
\echo '   SUPPORTING DOMAIN - HEALTH CHECK & SMOKE TESTS'
\echo '════════════════════════════════════════════════════'
\echo ''

-- =====================================================
-- SECTION 1: TABLE EXISTENCE & STRUCTURE
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '1. Table Existence & Structure'
\echo '─────────────────────────────────────────────────────'

SELECT 
  schemaname AS schema,
  tablename AS table_name,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.tablename) AS column_count
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename IN ('user_unit_settings', 'activity_logs')
ORDER BY tablename;

\echo ''
\echo '✅ Expected: 2 tables (user_unit_settings, activity_logs)'
\echo ''

-- =====================================================
-- SECTION 2: STORAGE BUCKET EXISTENCE
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '2. Storage Bucket Existence'
\echo '─────────────────────────────────────────────────────'

SELECT 
  id,
  name,
  public,
  file_size_limit,
  array_length(allowed_mime_types, 1) AS mime_type_count,
  created_at
FROM storage.buckets
WHERE id = 'lapak-images';

\echo ''
\echo '✅ Expected: 1 bucket (lapak-images) with public=true, 5MB limit'
\echo ''

-- =====================================================
-- SECTION 3: RLS STATUS
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '3. Row Level Security (RLS) Status'
\echo '─────────────────────────────────────────────────────'

SELECT 
  tablename AS table_name,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_unit_settings', 'activity_logs')
ORDER BY tablename;

\echo ''
\echo '✅ Expected: Both tables with RLS ENABLED'
\echo ''

-- =====================================================
-- SECTION 4: RLS POLICIES COUNT
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '4. RLS Policies Count'
\echo '─────────────────────────────────────────────────────'

SELECT 
  tablename AS table_name,
  COUNT(*) AS policy_count,
  string_agg(policyname, ', ' ORDER BY policyname) AS policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('user_unit_settings', 'activity_logs')
GROUP BY tablename
ORDER BY tablename;

\echo ''
\echo '✅ Expected: user_unit_settings (6), activity_logs (4)'
\echo ''

-- =====================================================
-- SECTION 5: STORAGE POLICIES COUNT
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '5. Storage Policies Count'
\echo '─────────────────────────────────────────────────────'

SELECT 
  COUNT(*) AS policy_count,
  string_agg(policyname, ', ' ORDER BY policyname) AS policies
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%lapak%';

\echo ''
\echo '✅ Expected: 7 policies for lapak-images bucket'
\echo ''

-- =====================================================
-- SECTION 6: FUNCTIONS INVENTORY
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '6. Functions Inventory'
\echo '─────────────────────────────────────────────────────'

SELECT 
  proname AS function_name,
  pg_get_function_arguments(oid) AS arguments,
  pg_get_function_result(oid) AS return_type
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    -- user_units functions
    'get_user_unit_settings', 'initialize_user_unit_settings', 
    'add_custom_physical_unit', 'add_custom_service_unit',
    'remove_custom_physical_unit', 'remove_custom_service_unit',
    'update_default_units', 'get_all_available_units',
    -- storage_lapak functions
    'get_user_storage_usage', 'get_user_images_by_category',
    'check_user_storage_quota', 'get_storage_statistics',
    -- activity_logs functions
    'log_activity', 'get_user_activity_logs', 'get_activity_logs_by_action',
    'get_activity_statistics', 'get_recent_activity_summary',
    'get_admin_activity_overview', 'search_activity_logs'
  )
ORDER BY proname;

\echo ''
\echo '✅ Expected: 19 functions (8 user_units, 4 storage, 7 activity_logs)'
\echo ''

-- =====================================================
-- SECTION 7: TRIGGERS INVENTORY
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '7. Triggers Inventory'
\echo '─────────────────────────────────────────────────────'

SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  CASE 
    WHEN tgtype & 2 = 2 THEN 'BEFORE'
    WHEN tgtype & 64 = 64 THEN 'INSTEAD OF'
    ELSE 'AFTER'
  END AS timing,
  CASE 
    WHEN tgtype & 4 = 4 THEN 'INSERT'
    WHEN tgtype & 8 = 8 THEN 'DELETE'
    WHEN tgtype & 16 = 16 THEN 'UPDATE'
  END AS event
FROM pg_trigger
WHERE tgname IN (
  'trigger_update_user_unit_settings_timestamp'
)
ORDER BY tgrelid, tgname;

\echo ''
\echo '✅ Expected: 1 trigger (user_unit_settings timestamp)'
\echo ''

-- =====================================================
-- SECTION 8: INDEXES COUNT
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '8. Indexes Count'
\echo '─────────────────────────────────────────────────────'

SELECT 
  tablename AS table_name,
  COUNT(*) AS index_count,
  string_agg(indexname, ', ' ORDER BY indexname) AS indexes
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('user_unit_settings', 'activity_logs')
GROUP BY tablename
ORDER BY tablename;

\echo ''
\echo '✅ Expected: user_unit_settings (11+), activity_logs (10+)'
\echo ''

-- =====================================================
-- SECTION 9: CONSTRAINTS VALIDATION
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '9. Constraints Validation'
\echo '─────────────────────────────────────────────────────'

SELECT 
  conrelid::regclass AS table_name,
  conname AS constraint_name,
  CASE contype
    WHEN 'c' THEN 'CHECK'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
  END AS constraint_type
FROM pg_constraint
WHERE conrelid IN (
  'user_unit_settings'::regclass,
  'activity_logs'::regclass
)
ORDER BY conrelid, contype, conname;

\echo ''
\echo '✅ Expected: PKs, FKs, CHECK constraints, UNIQUE constraints'
\echo ''

-- =====================================================
-- SECTION 10: FOREIGN KEY RELATIONSHIPS
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '10. Foreign Key Relationships'
\echo '─────────────────────────────────────────────────────'

SELECT
  tc.table_name AS from_table,
  kcu.column_name AS from_column,
  ccu.table_name AS to_table,
  ccu.column_name AS to_column,
  rc.delete_rule,
  rc.update_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('user_unit_settings', 'activity_logs')
ORDER BY tc.table_name, kcu.column_name;

\echo ''
\echo '✅ Expected FK Chain: auth.users → user_unit_settings, auth.users → activity_logs'
\echo ''

-- =====================================================
-- SECTION 11: DATA EXISTENCE CHECK
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '11. Data Existence Check'
\echo '─────────────────────────────────────────────────────'

SELECT 
  'user_unit_settings' AS table_name,
  COUNT(*) AS row_count,
  COUNT(*) FILTER (WHERE has_physical_products) AS has_physical,
  COUNT(*) FILTER (WHERE has_services) AS has_services,
  AVG(array_length(custom_physical_units, 1))::int AS avg_custom_physical
FROM user_unit_settings

UNION ALL

SELECT 
  'activity_logs' AS table_name,
  COUNT(*) AS row_count,
  COUNT(DISTINCT user_id) AS unique_users,
  COUNT(DISTINCT action) AS unique_actions,
  NULL AS col4
FROM activity_logs

UNION ALL

SELECT 
  'storage.objects (lapak-images)' AS table_name,
  COUNT(*) AS row_count,
  COUNT(DISTINCT (storage.foldername(name))[1]) AS unique_users,
  SUM((metadata->>'size')::bigint) / 1048576 AS total_size_mb,
  NULL AS col4
FROM storage.objects
WHERE bucket_id = 'lapak-images';

\echo ''
\echo '✅ Expected: Row counts for all entities'
\echo ''

-- =====================================================
-- SECTION 12: VIEWS VERIFICATION
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '12. Views Verification'
\echo '─────────────────────────────────────────────────────'

SELECT 
  table_name AS view_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN (
    'user_unit_settings_summary',
    'storage_usage_summary',
    'activity_logs_with_user',
    'recent_activity'
  )
ORDER BY table_name;

\echo ''
\echo '✅ Expected: 4 views (user_unit_settings_summary, storage_usage_summary, activity_logs_with_user, recent_activity)'
\echo ''

-- =====================================================
-- SECTION 13: FUNCTION SMOKE TEST - get_all_available_units()
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '13. Function Smoke Test: get_all_available_units()'
\echo '─────────────────────────────────────────────────────'

-- Note: Replace with actual user_id for testing
-- SELECT get_all_available_units('<user_uuid>') AS available_units;

\echo ''
\echo '✅ Expected: Returns JSONB with physical/service units (standard + custom)'
\echo '   Test manually: SELECT get_all_available_units(auth.uid());'
\echo ''

-- =====================================================
-- SECTION 14: FUNCTION SMOKE TEST - get_storage_statistics()
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '14. Function Smoke Test: get_storage_statistics()'
\echo '─────────────────────────────────────────────────────'

SELECT * FROM get_storage_statistics();

\echo ''
\echo '✅ Expected: Storage statistics (total_users, total_files, total_size_mb, etc.)'
\echo ''

-- =====================================================
-- SECTION 15: USER UNIT SETTINGS STATISTICS
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '15. User Unit Settings Statistics'
\echo '─────────────────────────────────────────────────────'

SELECT 
  COUNT(*) AS total_users,
  COUNT(*) FILTER (WHERE has_physical_products) AS with_physical,
  COUNT(*) FILTER (WHERE has_services) AS with_services,
  ROUND(AVG(array_length(physical_units, 1)), 2) AS avg_physical_units,
  ROUND(AVG(array_length(service_units, 1)), 2) AS avg_service_units,
  ROUND(AVG(array_length(custom_physical_units, 1)), 2) AS avg_custom_physical,
  ROUND(AVG(array_length(custom_service_units, 1)), 2) AS avg_custom_service
FROM user_unit_settings;

\echo ''
\echo '✅ Expected: Summary of unit settings across all users'
\echo ''

-- =====================================================
-- SECTION 16: ACTIVITY LOGS STATISTICS
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '16. Activity Logs Statistics'
\echo '─────────────────────────────────────────────────────'

SELECT 
  COUNT(*) AS total_logs,
  COUNT(DISTINCT user_id) AS unique_users,
  COUNT(DISTINCT action) AS unique_actions,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS last_24h,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS last_7d,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS last_30d
FROM activity_logs;

\echo ''
\echo '✅ Expected: Summary of activity logs (total, unique users, recent activity)'
\echo ''

-- =====================================================
-- SECTION 17: STORAGE BUCKET CONFIGURATION
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '17. Storage Bucket Configuration'
\echo '─────────────────────────────────────────────────────'

SELECT 
  id AS bucket_id,
  name,
  public,
  file_size_limit,
  pg_size_pretty(file_size_limit) AS size_limit_readable,
  allowed_mime_types,
  avif_autodetection,
  created_at,
  updated_at
FROM storage.buckets
WHERE id = 'lapak-images';

\echo ''
\echo '✅ Expected: Bucket config with 5MB limit, public=true, image MIME types'
\echo ''

-- =====================================================
-- SECTION 18: PERMISSION VALIDATION (for authenticated role)
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '18. Permission Validation'
\echo '─────────────────────────────────────────────────────'

SELECT 
  proname AS function_name,
  proacl AS permissions
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'get_all_available_units',
    'get_user_storage_usage',
    'log_activity'
  )
ORDER BY proname;

\echo ''
\echo '✅ Expected: Functions have EXECUTE permission for authenticated users'
\echo ''

-- =====================================================
-- SECTION 19: CROSS-DOMAIN READINESS CHECK
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '19. Cross-Domain Readiness Check'
\echo '─────────────────────────────────────────────────────'

-- Check if other domains can reference SUPPORTING entities
SELECT 
  'SUPPORTING → CORE' AS integration,
  EXISTS (SELECT 1 FROM user_profiles LIMIT 1) AS core_available,
  EXISTS (SELECT 1 FROM user_unit_settings LIMIT 1) AS units_available,
  EXISTS (SELECT 1 FROM activity_logs LIMIT 1) AS logs_available;

\echo ''
\echo '✅ Expected: All entities available for cross-domain references'
\echo ''

-- =====================================================
-- SECTION 20: HEALTH SUMMARY
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '20. SUPPORTING Domain Health Summary'
\echo '─────────────────────────────────────────────────────'

WITH health_check AS (
  SELECT
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('user_unit_settings', 'activity_logs')) AS tables_count,
    (SELECT COUNT(*) FROM storage.buckets WHERE id = 'lapak-images') AS buckets_count,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('user_unit_settings', 'activity_logs')) AS policies_count,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%lapak%') AS storage_policies_count,
    (SELECT COUNT(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname IN ('get_all_available_units', 'get_user_storage_usage', 'log_activity')) AS functions_count,
    (SELECT COUNT(*) FROM pg_trigger WHERE tgname LIKE '%user_unit%') AS triggers_count,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('user_unit_settings', 'activity_logs')) AS indexes_count
)
SELECT
  tables_count AS "Tables (expected: 2)",
  buckets_count AS "Buckets (expected: 1)",
  policies_count AS "Table RLS Policies (expected: 10)",
  storage_policies_count AS "Storage Policies (expected: 7)",
  functions_count AS "Functions (expected: 19)",
  triggers_count AS "Triggers (expected: 1)",
  indexes_count AS "Indexes (expected: 21+)"
FROM health_check;

\echo ''
\echo '════════════════════════════════════════════════════'
\echo '   ✅ SUPPORTING DOMAIN HEALTH CHECK COMPLETE'
\echo '════════════════════════════════════════════════════'
\echo ''
\echo 'If all checks passed, SUPPORTING domain is ready for production!'
\echo 'Next steps:'
\echo '  1. Test unit settings creation and custom units'
\echo '  2. Test image upload to lapak-images bucket'
\echo '  3. Test activity logging and search'
\echo '  4. Verify storage quota enforcement'
\echo '  5. Verify cross-domain references (Finance → SUPPORTING)'
\echo ''
