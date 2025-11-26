-- =====================================================
-- CORE DOMAIN - SMOKE TESTS & DEBUG QUERIES
-- =====================================================
-- Purpose: Health check for CORE domain after deployment
-- Version: 1.0
-- Usage: \i sql/domain/core/core.debug.sql
-- =====================================================

\echo ''
\echo '════════════════════════════════════════════════════'
\echo '   CORE DOMAIN - HEALTH CHECK & SMOKE TESTS'
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
  AND tablename IN ('user_profiles', 'business_configurations', 'business_type_mappings')
ORDER BY tablename;

\echo ''
\echo '✅ Expected: 3 tables (user_profiles, business_configurations, business_type_mappings)'
\echo ''

-- =====================================================
-- SECTION 2: RLS STATUS
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '2. Row Level Security (RLS) Status'
\echo '─────────────────────────────────────────────────────'

SELECT 
  tablename AS table_name,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'business_configurations', 'business_type_mappings')
ORDER BY tablename;

\echo ''
\echo '✅ Expected: All 3 tables with RLS ENABLED'
\echo ''

-- =====================================================
-- SECTION 3: RLS POLICIES COUNT
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '3. RLS Policies Count'
\echo '─────────────────────────────────────────────────────'

SELECT 
  tablename AS table_name,
  COUNT(*) AS policy_count,
  string_agg(policyname, ', ' ORDER BY policyname) AS policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'business_configurations', 'business_type_mappings')
GROUP BY tablename
ORDER BY tablename;

\echo ''
\echo '✅ Expected: user_profiles (7), business_configurations (8), business_type_mappings (4)'
\echo ''

-- =====================================================
-- SECTION 4: FUNCTIONS INVENTORY
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '4. Functions Inventory'
\echo '─────────────────────────────────────────────────────'

SELECT 
  proname AS function_name,
  pg_get_function_arguments(oid) AS arguments,
  pg_get_function_result(oid) AS return_type
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    -- user_profiles functions
    'handle_new_user', 'get_user_with_profile', 'get_pending_approval_users',
    'approve_user_account', 'deactivate_user_account', 'get_user_statistics',
    -- business_config functions
    'get_business_config', 'initialize_business_config', 'complete_onboarding',
    'update_onboarding_step', 'get_onboarding_statistics', 'get_users_by_category',
    'calculate_business_health_score',
    -- business_types functions
    'classify_business_by_keywords', 'get_business_type_by_category', 
    'get_all_business_types', 'search_business_types_by_keyword',
    'get_recommended_features', 'update_business_type_mapping',
    'get_category_usage_statistics'
  )
ORDER BY proname;

\echo ''
\echo '✅ Expected: 20 functions (6 user_profiles, 7 business_config, 7 business_types)'
\echo ''

-- =====================================================
-- SECTION 5: TRIGGERS INVENTORY
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '5. Triggers Inventory'
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
  END AS event,
  pg_get_triggerdef(oid) AS definition
FROM pg_trigger
WHERE tgname IN (
  'on_auth_user_created',
  'update_user_profiles_timestamp',
  'update_business_config_timestamp',
  'check_onboarding_completion',
  'update_business_types_timestamp'
)
ORDER BY tgrelid, tgname;

\echo ''
\echo '✅ Expected: 5 triggers (2 user_profiles, 2 business_config, 1 business_types)'
\echo ''

-- =====================================================
-- SECTION 6: INDEXES COUNT
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '6. Indexes Count'
\echo '─────────────────────────────────────────────────────'

SELECT 
  tablename AS table_name,
  COUNT(*) AS index_count,
  string_agg(indexname, ', ' ORDER BY indexname) AS indexes
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'business_configurations', 'business_type_mappings')
GROUP BY tablename
ORDER BY tablename;

\echo ''
\echo '✅ Expected: user_profiles (14+), business_configurations (17+), business_type_mappings (8+)'
\echo ''

-- =====================================================
-- SECTION 7: CONSTRAINTS VALIDATION
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '7. Constraints Validation'
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
  'user_profiles'::regclass,
  'business_configurations'::regclass,
  'business_type_mappings'::regclass
)
ORDER BY conrelid, contype, conname;

\echo ''
\echo '✅ Expected: PKs, FKs, CHECK constraints, UNIQUE constraints'
\echo ''

-- =====================================================
-- SECTION 8: FOREIGN KEY RELATIONSHIPS
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '8. Foreign Key Relationships'
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
  AND tc.table_name IN ('user_profiles', 'business_configurations')
ORDER BY tc.table_name, kcu.column_name;

\echo ''
\echo '✅ Expected FK Chain: auth.users → user_profiles → business_configurations → business_type_mappings'
\echo ''

-- =====================================================
-- SECTION 9: DATA EXISTENCE CHECK
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '9. Data Existence Check'
\echo '─────────────────────────────────────────────────────'

SELECT 
  'user_profiles' AS table_name,
  COUNT(*) AS row_count,
  COUNT(*) FILTER (WHERE account_status = 'active') AS active_users,
  COUNT(*) FILTER (WHERE account_status = 'pending_approval') AS pending_users,
  COUNT(*) FILTER (WHERE role = 'super_admin') AS super_admins
FROM user_profiles

UNION ALL

SELECT 
  'business_configurations' AS table_name,
  COUNT(*) AS row_count,
  COUNT(*) FILTER (WHERE onboarding_completed) AS completed_onboarding,
  COUNT(*) FILTER (WHERE NOT onboarding_completed) AS incomplete_onboarding,
  COUNT(*) FILTER (WHERE business_category IS NOT NULL) AS with_category
FROM business_configurations

UNION ALL

SELECT 
  'business_type_mappings' AS table_name,
  COUNT(*) AS row_count,
  SUM(usage_count) AS total_usage,
  AVG(array_length(keywords, 1))::int AS avg_keywords,
  NULL AS col4
FROM business_type_mappings;

\echo ''
\echo '✅ Expected: business_type_mappings has 5 rows (seed data)'
\echo ''

-- =====================================================
-- SECTION 10: BUSINESS TYPE SEED DATA
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '10. Business Type Seed Data'
\echo '─────────────────────────────────────────────────────'

SELECT 
  category,
  array_length(keywords, 1) AS keyword_count,
  array_length(indicators, 1) AS indicator_count,
  array_length(examples, 1) AS example_count,
  array_length(recommended_features, 1) AS feature_count,
  usage_count
FROM business_type_mappings
ORDER BY category;

\echo ''
\echo '✅ Expected: 5 categories with keyword counts ranging 15-70'
\echo ''

-- =====================================================
-- SECTION 11: VIEWS VERIFICATION
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '11. Views Verification'
\echo '─────────────────────────────────────────────────────'

SELECT 
  table_name AS view_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN (
    'admin_users_overview',
    'business_config_overview',
    'business_type_summary'
  )
ORDER BY table_name;

\echo ''
\echo '✅ Expected: 3 views (admin_users_overview, business_config_overview, business_type_summary)'
\echo ''

-- =====================================================
-- SECTION 12: FUNCTION SMOKE TEST - classify_business_by_keywords()
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '12. Function Smoke Test: classify_business_by_keywords()'
\echo '─────────────────────────────────────────────────────'

SELECT classify_business_by_keywords(
  'Saya punya toko kelontong yang menjual berbagai produk retail seperti sembako dan snack'
) AS classification_result;

\echo ''
\echo '✅ Expected: Returns JSON with category "Produk Dengan Stok" and confidence score > 0'
\echo ''

-- =====================================================
-- SECTION 13: FUNCTION SMOKE TEST - get_all_business_types()
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '13. Function Smoke Test: get_all_business_types()'
\echo '─────────────────────────────────────────────────────'

SELECT 
  category,
  (data->>'keyword_count')::int AS keyword_count,
  (data->>'usage_count')::int AS usage_count
FROM get_all_business_types()
ORDER BY category;

\echo ''
\echo '✅ Expected: 5 rows (all business categories with metadata)'
\echo ''

-- =====================================================
-- SECTION 14: ONBOARDING STATISTICS
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '14. Onboarding Statistics'
\echo '─────────────────────────────────────────────────────'

SELECT 
  COUNT(*) AS total_users,
  COUNT(*) FILTER (WHERE onboarding_completed) AS completed,
  COUNT(*) FILTER (WHERE NOT onboarding_completed) AS incomplete,
  ROUND(AVG(onboarding_step), 2) AS avg_step,
  MAX(onboarding_step) AS max_step,
  MIN(onboarding_step) AS min_step
FROM business_configurations;

\echo ''
\echo '✅ Expected: Summary of onboarding progress across all users'
\echo ''

-- =====================================================
-- SECTION 15: PERMISSION VALIDATION (for authenticated role)
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '15. Permission Validation'
\echo '─────────────────────────────────────────────────────'

SELECT 
  proname AS function_name,
  proacl AS permissions
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'classify_business_by_keywords',
    'get_business_config',
    'get_user_with_profile'
  )
ORDER BY proname;

\echo ''
\echo '✅ Expected: Functions have EXECUTE permission for authenticated users'
\echo ''

-- =====================================================
-- SECTION 16: CROSS-DOMAIN READINESS CHECK
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '16. Cross-Domain Readiness Check'
\echo '─────────────────────────────────────────────────────'

-- Check if Finance domain tables reference user_profiles
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS references_table
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'user_profiles'
  AND tc.table_name IN ('expenses', 'suppliers', 'customers', 'incomes', 'loans', 'investments')
ORDER BY tc.table_name;

\echo ''
\echo '✅ Expected: Finance domain tables (expenses, suppliers, etc.) reference user_profiles.user_id'
\echo ''

-- =====================================================
-- SECTION 17: ENUM TYPES VALIDATION
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '17. Enum Types Validation'
\echo '─────────────────────────────────────────────────────'

SELECT 
  t.typname AS enum_name,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN ('user_role', 'account_status')
GROUP BY t.typname
ORDER BY t.typname;

\echo ''
\echo '✅ Expected: user_role (super_admin, user), account_status (pending_approval, active, suspended)'
\echo ''

-- =====================================================
-- SECTION 18: TIMESTAMP TRIGGERS VALIDATION
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '18. Timestamp Triggers Validation'
\echo '─────────────────────────────────────────────────────'

SELECT 
  tgrelid::regclass AS table_name,
  tgname AS trigger_name,
  prosrc AS trigger_function_body
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgname LIKE '%timestamp%'
  AND tgrelid IN (
    'user_profiles'::regclass,
    'business_configurations'::regclass,
    'business_type_mappings'::regclass
  )
ORDER BY tgrelid;

\echo ''
\echo '✅ Expected: 3 timestamp update triggers (one per table)'
\echo ''

-- =====================================================
-- SECTION 19: HEALTH SUMMARY
-- =====================================================

\echo '─────────────────────────────────────────────────────'
\echo '19. CORE Domain Health Summary'
\echo '─────────────────────────────────────────────────────'

WITH health_check AS (
  SELECT
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('user_profiles', 'business_configurations', 'business_type_mappings')) AS tables_count,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('user_profiles', 'business_configurations', 'business_type_mappings')) AS policies_count,
    (SELECT COUNT(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname IN ('handle_new_user', 'get_business_config', 'classify_business_by_keywords')) AS functions_count,
    (SELECT COUNT(*) FROM pg_trigger WHERE tgname LIKE '%user%' OR tgname LIKE '%business%') AS triggers_count,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('user_profiles', 'business_configurations', 'business_type_mappings')) AS indexes_count,
    (SELECT COUNT(*) FROM business_type_mappings) AS seed_data_count
)
SELECT
  tables_count AS "Tables (expected: 3)",
  policies_count AS "RLS Policies (expected: 19)",
  functions_count AS "Functions (expected: 20)",
  triggers_count AS "Triggers (expected: 5)",
  indexes_count AS "Indexes (expected: 39+)",
  seed_data_count AS "Seed Data (expected: 5)"
FROM health_check;

\echo ''
\echo '════════════════════════════════════════════════════'
\echo '   ✅ CORE DOMAIN HEALTH CHECK COMPLETE'
\echo '════════════════════════════════════════════════════'
\echo ''
\echo 'If all checks passed, CORE domain is ready for production!'
\echo 'Next steps:'
\echo '  1. Test user signup flow'
\echo '  2. Test business type classification'
\echo '  3. Test onboarding progress tracking'
\echo '  4. Verify cross-domain references (Finance → CORE)'
\echo ''
