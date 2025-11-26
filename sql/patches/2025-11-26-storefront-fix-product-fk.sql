-- =====================================================
-- PATCH: STOREFRONT - FIX PRODUCT FK (For Existing Database)
-- Date: 2025-11-26
-- Purpose: Ensure storefront_products.product_id properly links to inventory.products
-- =====================================================
-- PREREQUISITE:
-- - INVENTORY domain must be deployed first
-- - Run: 2025-11-26-inventory-domain-setup.sql
-- =====================================================

-- =================================================
-- PATCH: STOREFRONT - FIX PRODUCT FK
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
-- STEP 2: Check storefront_products table structure
-- =====================================================

-- Check if product_id column exists
DO $$
DECLARE
  product_id_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'storefront_products'
      AND column_name = 'product_id'
  ) INTO product_id_exists;
  
  IF NOT product_id_exists THEN
    -- Add product_id column if missing
    RAISE NOTICE 'Adding product_id column to storefront_products...';
    ALTER TABLE storefront_products 
      ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ product_id column added';
  ELSE
    RAISE NOTICE '✅ product_id column already exists';
  END IF;
END $$;

-- =====================================================
-- STEP 3: Ensure FK constraint exists & is correct
-- =====================================================

DO $$
DECLARE
  fk_exists BOOLEAN;
  fk_name TEXT;
BEGIN
  -- Check if FK constraint exists
  SELECT constraint_name INTO fk_name
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
    AND table_name = 'storefront_products'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%product_id%'
  LIMIT 1;
  
  IF fk_name IS NULL THEN
    RAISE NOTICE 'Adding FK constraint...';
    ALTER TABLE storefront_products
      ADD CONSTRAINT storefront_products_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ FK constraint added';
  ELSE
    RAISE NOTICE '✅ FK constraint already exists: %', fk_name;
  END IF;
END $$;

-- =====================================================
-- STEP 4: Add index for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_storefront_products_product_id ON storefront_products(product_id);

-- Check if idx_products_master_link exists (from original schema) and drop if different
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = 'storefront_products' 
      AND indexname = 'idx_products_master_link'
  ) THEN
    DROP INDEX IF EXISTS idx_products_master_link;
    RAISE NOTICE '✅ Dropped old idx_products_master_link (replaced with idx_storefront_products_product_id)';
  END IF;
END $$;

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
  AND table_name = 'storefront_products'
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
  AND tablename = 'storefront_products'
  AND indexname = 'idx_storefront_products_product_id';

-- Check publish_product_to_storefront function
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ publish_product_to_storefront function exists'
    ELSE '❌ WARNING: Function missing!'
  END AS status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'publish_product_to_storefront';

-- =====================================================
-- STEP 6: Data Migration (Optional)
-- =====================================================
-- OPTIONAL: Link existing storefront_products to master products
--
-- If you have existing storefront_products without product_id:
-- 1. Create corresponding products in INVENTORY domain first
-- 2. Then link via UPDATE:
--
-- Example SQL:
--   -- Create products from storefront_products
--   INSERT INTO products (user_id, name, selling_price, is_active)
--   SELECT user_id, name, price, true
--   FROM storefront_products
--   WHERE product_id IS NULL;
--
--   -- Link storefront_products to newly created products
--   UPDATE storefront_products sp
--   SET product_id = p.id
--   FROM products p
--   WHERE sp.name = p.name
--     AND sp.user_id = p.user_id
--     AND sp.product_id IS NULL;
--
-- WARNING: Test this query in staging first!

-- =====================================================
-- STEP 7: Test publish_product_to_storefront function
-- =====================================================
-- To test the function after authentication:
--
--   -- 1. Create a test product in INVENTORY
--   INSERT INTO products (user_id, name, selling_price)
--   VALUES (auth.uid(), 'Test Product', 50000)
--   RETURNING id;
--
--   -- 2. Get your storefront_id
--   SELECT id FROM business_storefronts WHERE user_id = auth.uid();
--
--   -- 3. Publish product to storefront
--   SELECT publish_product_to_storefront(
--     p_product_id := '<product_id>'::UUID,
--     p_storefront_id := '<storefront_id>'::UUID,
--     p_display_price := 45000, -- optional: override price
--     p_is_featured := TRUE
--   );
--
--   -- 4. Verify link
--   SELECT id, product_id, name, price
--   FROM storefront_products
--   WHERE product_id IS NOT NULL
--   ORDER BY created_at DESC LIMIT 1;

-- =====================================================
-- SUMMARY
-- =====================================================
-- STOREFRONT DOMAIN PATCH COMPLETE!
-- =================================================
--
-- ✅ storefront_products.product_id → products(id) FK added
-- ✅ Index created for performance
--
-- Next Steps:
-- 1. Test publish_product_to_storefront function (see Step 7 above)
-- 2. Migrate existing storefront_products (optional)
-- 3. Run storefront health check: storefront.debug.sql
--
-- INTEGRATION COMPLETE:
--   INVENTORY (products) ← FINANCE (income_items.product_id)
--   INVENTORY (products) ← STOREFRONT (storefront_products.product_id)
--
-- =================================================
