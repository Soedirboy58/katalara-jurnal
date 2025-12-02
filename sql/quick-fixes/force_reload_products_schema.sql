-- =====================================================
-- QUICK FIX: Force Reload Products Schema Cache
-- Purpose: Enable table view in Supabase dashboard
-- Safe: No data changes, only cache refresh
-- =====================================================

-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Verify table is accessible
DO $$
DECLARE
  table_exists BOOLEAN;
  column_count INTEGER;
BEGIN
  -- Check table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'products'
  ) INTO table_exists;
  
  -- Count columns
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'products';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SCHEMA RELOAD STATUS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Table exists: %', table_exists;
  RAISE NOTICE 'Column count: %', column_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  IF table_exists AND column_count > 0 THEN
    RAISE NOTICE '✅ Schema reloaded successfully';
    RAISE NOTICE '📝 Refresh your browser (Ctrl+Shift+R)';
    RAISE NOTICE '📝 Table view should now be enabled';
  ELSE
    RAISE NOTICE '❌ Table issue detected';
    RAISE NOTICE '📝 Check if products table exists in database';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- Show current table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
