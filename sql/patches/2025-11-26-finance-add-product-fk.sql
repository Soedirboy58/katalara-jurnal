-- =====================================================
-- PATCH: FINANCE - ADD PRODUCT FK (For Existing Database)
-- Date: 2025-11-26
-- Purpose: Ensure income_items.product_id properly links to inventory.products
-- =====================================================
-- PREREQUISITE:
-- - INVENTORY domain must be deployed first
-- - Run: 2025-11-26-inventory-domain-setup.sql
-- =====================================================

-- =================================================
-- PATCH: FINANCE - ADD PRODUCT FK
-- =================================================

-- =====================================================
-- STEP 1: Check if products table exists
-- =====================================================

DO $$
DECLARE
  products_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'products'
  ) INTO products_exists;
  
  IF NOT products_exists THEN
    RAISE EXCEPTION 'ERROR: products table does not exist! Deploy INVENTORY domain first.';
  ELSE
    RAISE NOTICE '✅ products table exists';
  END IF;
END $$;

-- =====================================================
-- STEP 2: Check income_items table structure
-- =====================================================

-- Check if product_id column exists
DO $$
DECLARE
  product_id_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'income_items'
      AND column_name = 'product_id'
  ) INTO product_id_exists;
  
  IF NOT product_id_exists THEN
    -- Add product_id column if missing
    RAISE NOTICE 'Adding product_id column to income_items...';
    ALTER TABLE income_items 
      ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ product_id column added';
  ELSE
    RAISE NOTICE '✅ product_id column already exists';
  END IF;
END $$;

-- =====================================================
-- STEP 3: Ensure FK constraint exists
-- =====================================================

DO $$
DECLARE
  fk_exists BOOLEAN;
BEGIN
  -- Check if FK constraint exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'income_items'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%product_id%'
  ) INTO fk_exists;
  
  IF NOT fk_exists THEN
    RAISE NOTICE 'Adding FK constraint...';
    ALTER TABLE income_items
      ADD CONSTRAINT income_items_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ FK constraint added';
  ELSE
    RAISE NOTICE '✅ FK constraint already exists';
  END IF;
END $$;

-- =====================================================
-- STEP 4: Add index for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_income_items_product_id ON income_items(product_id);

-- =====================================================
-- STEP 5: Verify deployment
-- =====================================================

-- Check FK constraint
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ FK constraint exists'
    ELSE '❌ ERROR: FK constraint missing!'
  END AS status
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'income_items'
  AND constraint_type = 'FOREIGN KEY'
  AND constraint_name LIKE '%product_id%';

-- Check index
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Index exists'
    ELSE '❌ WARNING: Index missing!'
  END AS status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'income_items'
  AND indexname = 'idx_income_items_product_id';

-- =====================================================
-- STEP 6: Data Migration (Optional)
-- =====================================================
-- OPTIONAL: Link existing income_items to products
--
-- If you have existing income_items without product_id:
-- 1. Match by product_name (fuzzy match)
-- 2. Or manually assign product_id via UPDATE
--
-- Example SQL:
--   UPDATE income_items ii
--   SET product_id = p.id
--   FROM products p
--   WHERE ii.product_name = p.name
--     AND ii.owner_id = p.user_id
--     AND ii.product_id IS NULL;
--
-- WARNING: Test this query in staging first!

-- =====================================================
-- SUMMARY
-- =====================================================
-- FINANCE DOMAIN PATCH COMPLETE!
-- =================================================
--
-- ✅ income_items.product_id → products(id) FK added
-- ✅ Index created for performance
--
-- Next Steps:
-- 1. Apply STOREFRONT patch: 2025-11-26-storefront-fix-product-fk.sql
-- 2. Test income creation with product_id
-- 3. Run finance health check: finance.debug.sql
--
-- =================================================
