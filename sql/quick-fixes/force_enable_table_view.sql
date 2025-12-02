-- =====================================================
-- FORCE ENABLE TABLE VIEW - Simple Solution
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Check if products table exists and is accessible
SELECT 'Step 1: Checking products table...' as status;

SELECT 
  table_name,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'products'
GROUP BY table_name;

-- Step 2: List all columns
SELECT 'Step 2: Current columns in products table' as status;

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- Step 3: Force reload PostgREST schema cache
SELECT 'Step 3: Reloading schema cache...' as status;

DO $$
BEGIN
  -- Force PostgREST to reload
  PERFORM pg_notify('pgrst', 'reload schema');
  PERFORM pg_notify('pgrst', 'reload config');
  
  RAISE NOTICE '✅ Schema cache reload triggered';
END $$;

-- Step 4: Verify table is in pg_tables (system view)
SELECT 'Step 4: Verifying table registration...' as status;

SELECT 
  schemaname,
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables
WHERE tablename = 'products';

-- Step 5: Check for any locks on the table
SELECT 'Step 5: Checking for table locks...' as status;

SELECT 
  locktype,
  relation::regclass as table_name,
  mode,
  granted
FROM pg_locks
WHERE relation = 'products'::regclass;

-- Step 6: Analyze table to update statistics
SELECT 'Step 6: Analyzing table...' as status;

ANALYZE products;

SELECT '✅ Table analyzed successfully' as result;

-- Step 7: Final verification
DO $$
DECLARE
  table_exists BOOLEAN;
  row_count BIGINT;
BEGIN
  -- Check table exists
  SELECT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'products'
  ) INTO table_exists;
  
  -- Get row count
  SELECT COUNT(*) INTO row_count FROM products;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FINAL STATUS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Table exists: %', table_exists;
  RAISE NOTICE 'Row count: %', row_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 NOW DO THESE STEPS:';
  RAISE NOTICE '1. Close this SQL Editor tab';
  RAISE NOTICE '2. Press Ctrl+Shift+R to hard refresh browser';
  RAISE NOTICE '3. Go to Table Editor > products';
  RAISE NOTICE '4. Table view should now be enabled';
  RAISE NOTICE '';
END $$;
