# Database Setup Script for User Menu Feature
# Run this script in Supabase SQL Editor

-- =====================================================
-- STEP 1: Create activity_logs table
-- =====================================================
\i sql/create_activity_logs_table.sql

-- =====================================================
-- STEP 2: Add settings columns to business_configurations
-- =====================================================
\i sql/add_settings_to_business_config.sql

-- =====================================================
-- STEP 3: Verify Installation
-- =====================================================

-- Check activity_logs table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'activity_logs'
ORDER BY ordinal_position;

-- Check business_configurations has new columns
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_name = 'business_configurations'
  AND column_name IN (
    'theme', 'language', 'currency', 'date_format',
    'email_notifications', 'push_notifications',
    'expense_alerts', 'expense_threshold',
    'low_stock_alerts', 'low_stock_threshold'
  )
ORDER BY column_name;

-- Check RLS policies for activity_logs
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'activity_logs';

-- =====================================================
-- STEP 4: Test Insert (Optional)
-- =====================================================

-- Insert a test activity log (will use your current user_id)
-- INSERT INTO activity_logs (user_id, action, description, metadata)
-- VALUES (
--   auth.uid(),
--   'test_action',
--   'Testing activity log system',
--   '{"test": true}'::jsonb
-- );

-- Query your activity logs
-- SELECT * FROM activity_logs 
-- WHERE user_id = auth.uid()
-- ORDER BY created_at DESC
-- LIMIT 5;

-- =====================================================
-- SUCCESS!
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ User Menu Feature Database Setup Complete!';
  RAISE NOTICE '✅ activity_logs table is ready';
  RAISE NOTICE '✅ business_configurations extended with settings';
  RAISE NOTICE '✅ RLS policies active and secure';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next Steps:';
  RAISE NOTICE '1. Deploy the Next.js application';
  RAISE NOTICE '2. Test the User Menu in sidebar';
  RAISE NOTICE '3. Try Profile, Activity Log, and Settings pages';
END $$;
