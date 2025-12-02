-- =====================================================
-- ULTIMATE FIX: Enable Table View in Supabase Dashboard
-- =====================================================
-- Simple and safe approach - no transactions
-- =====================================================

-- Step 1: Force PostgREST schema cache reload
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

-- Step 2: Update table statistics
ANALYZE products;

-- Step 3: Verify table is accessible
SELECT 
  'products' as table_name,
  COUNT(*) as row_count,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'products') as column_count
FROM products;

-- Step 4: Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- Final message
SELECT '✅ Schema reloaded! Now do:
1. Close this SQL Editor tab
2. Press Ctrl+Shift+R (hard refresh)
3. Go to Table Editor > products
4. Table view should now work' as instructions;
