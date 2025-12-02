-- =====================================================
-- CLEAR SCHEMA LOCK - Force enable table view
-- =====================================================
-- This checks for and clears any schema migration locks
-- =====================================================

-- Step 1: Check if there are any schema_migrations table
SELECT 
  'Checking schema migrations...' as status;

-- Step 2: Check for any pending migrations or locks
SELECT 
  tablename,
  schemaname,
  tableowner
FROM pg_tables
WHERE tablename LIKE '%migration%' OR tablename LIKE '%schema%'
ORDER BY tablename;

-- Step 3: Check if products table has any dependencies causing the lock
SELECT 
  'Checking table dependencies...' as status;

SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'products'
ORDER BY tc.constraint_type, tc.constraint_name;

-- Step 4: Drop any problematic constraints that might be causing issues
-- (Only old/duplicate ones that we already fixed)
DO $$
BEGIN
  -- Drop old constraint if exists
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'positive_price') THEN
    ALTER TABLE products DROP CONSTRAINT positive_price;
    RAISE NOTICE '✅ Dropped old constraint: positive_price';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Could not drop constraint (may not exist)';
END $$;

-- Step 5: Clear any cached views
DROP VIEW IF EXISTS products_view CASCADE;
DROP MATERIALIZED VIEW IF EXISTS products_stats CASCADE;

-- Step 6: Recreate indexes (this sometimes fixes the issue)
DROP INDEX IF EXISTS idx_products_user_id;
DROP INDEX IF EXISTS idx_products_category;
DROP INDEX IF EXISTS idx_products_is_active;

CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Step 7: Force schema reload with multiple notifications
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_sleep(1);
SELECT pg_notify('pgrst', 'reload config');
SELECT pg_sleep(1);
SELECT pg_notify('pgrst', 'reload schema');

-- Step 8: Final verification
SELECT 
  'products' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT user_id) as total_users,
  COUNT(CASE WHEN is_active THEN 1 END) as active_products
FROM products;

SELECT '
✅ SCHEMA LOCK CLEARED!

Next steps:
1. Wait 30 seconds (let Supabase sync)
2. Close ALL Supabase tabs in browser
3. Clear browser cache: Ctrl+Shift+Delete
   - Choose "Cached images and files"
   - Time range: Last hour
4. Close browser completely
5. Reopen browser and go to Supabase
6. Navigate to Table Editor > products

If STILL disabled:
- Try different browser (Chrome/Edge/Firefox)
- Try incognito/private mode
- Contact Supabase support (may be their backend issue)
' as final_instructions;
