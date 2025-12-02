-- =====================================================
-- DOMAIN: INVENTORY
-- PURPOSE: Fix products table schema conflicts and duplications
-- AFFECTED TABLES: products
-- DATE: 2024-11-27
-- =====================================================
-- CRITICAL: Database has BOTH old and new column names!
-- This migration will:
-- 1. Migrate data from old columns to new columns
-- 2. Drop old/duplicate columns
-- 3. Add missing columns
-- 4. Standardize naming
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 0: BACKUP EXISTING DATA
-- =====================================================
DO $$ 
BEGIN
  RAISE NOTICE '🔒 Creating backup table...';
  
  -- Create backup if not exists
  CREATE TABLE IF NOT EXISTS products_backup_pre_standardization AS 
  SELECT * FROM products;
  
  RAISE NOTICE '✅ Backup created: products_backup_pre_standardization';
EXCEPTION
  WHEN duplicate_table THEN
    RAISE NOTICE '⚠️ Backup table already exists, skipping...';
END $$;

-- =====================================================
-- STEP 1: ADD MISSING COLUMNS
-- =====================================================

-- Add selling_price if doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'selling_price'
  ) THEN
    ALTER TABLE products ADD COLUMN selling_price NUMERIC(15,2) DEFAULT 0;
    RAISE NOTICE '✅ Added: selling_price';
  END IF;
END $$;

-- Add min_stock_alert if doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'min_stock_alert'
  ) THEN
    ALTER TABLE products ADD COLUMN min_stock_alert INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Added: min_stock_alert';
  END IF;
END $$;

-- Add track_inventory if doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'track_inventory'
  ) THEN
    ALTER TABLE products ADD COLUMN track_inventory BOOLEAN DEFAULT TRUE;
    RAISE NOTICE '✅ Added: track_inventory';
  END IF;
END $$;

-- =====================================================
-- STEP 2: MIGRATE DATA FROM OLD COLUMNS TO NEW COLUMNS
-- =====================================================

-- Migrate sell_price → selling_price
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'sell_price'
  ) THEN
    UPDATE products 
    SET selling_price = COALESCE(sell_price, 0)
    WHERE selling_price = 0 OR selling_price IS NULL;
    
    RAISE NOTICE '✅ Migrated data: sell_price → selling_price';
  END IF;
END $$;

-- Ensure cost_price has data from buy_price if empty
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'buy_price'
  ) THEN
    UPDATE products 
    SET cost_price = COALESCE(buy_price, 0)
    WHERE cost_price = 0 OR cost_price IS NULL;
    
    RAISE NOTICE '✅ Migrated data: buy_price → cost_price';
  END IF;
END $$;

-- Migrate min_stock → min_stock_alert
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'min_stock'
  ) THEN
    UPDATE products 
    SET min_stock_alert = COALESCE(min_stock::INTEGER, 0)
    WHERE min_stock_alert = 0 OR min_stock_alert IS NULL;
    
    RAISE NOTICE '✅ Migrated data: min_stock → min_stock_alert';
  END IF;
END $$;

-- =====================================================
-- STEP 3: DROP OLD/DUPLICATE COLUMNS
-- =====================================================

-- Drop sell_price (replaced by selling_price)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'sell_price'
  ) THEN
    ALTER TABLE products DROP COLUMN sell_price;
    RAISE NOTICE '✅ Dropped: sell_price (replaced by selling_price)';
  END IF;
END $$;

-- Drop buy_price (replaced by cost_price)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'buy_price'
  ) THEN
    ALTER TABLE products DROP COLUMN buy_price;
    RAISE NOTICE '✅ Dropped: buy_price (replaced by cost_price)';
  END IF;
END $$;

-- Drop stock_quantity (will be managed separately)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'stock_quantity'
  ) THEN
    ALTER TABLE products DROP COLUMN stock_quantity;
    RAISE NOTICE '✅ Dropped: stock_quantity (will use stock_movements table)';
  END IF;
END $$;

-- Drop stock_unit (replaced by unit)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'stock_unit'
  ) THEN
    ALTER TABLE products DROP COLUMN stock_unit;
    RAISE NOTICE '✅ Dropped: stock_unit (use unit column)';
  END IF;
END $$;

-- Drop min_stock (replaced by min_stock_alert)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'min_stock'
  ) THEN
    ALTER TABLE products DROP COLUMN min_stock;
    RAISE NOTICE '✅ Dropped: min_stock (replaced by min_stock_alert)';
  END IF;
END $$;

-- Drop price (ambiguous - use cost_price or selling_price explicitly)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'price'
  ) THEN
    ALTER TABLE products DROP COLUMN price;
    RAISE NOTICE '✅ Dropped: price (use cost_price or selling_price)';
  END IF;
END $$;

-- =====================================================
-- STEP 4: UPDATE CONSTRAINTS
-- =====================================================

-- Drop old constraints if they exist
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'positive_sell_price') THEN
    ALTER TABLE products DROP CONSTRAINT positive_sell_price;
    RAISE NOTICE '✅ Dropped constraint: positive_sell_price';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'positive_buy_price') THEN
    ALTER TABLE products DROP CONSTRAINT positive_buy_price;
    RAISE NOTICE '✅ Dropped constraint: positive_buy_price';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'positive_price') THEN
    ALTER TABLE products DROP CONSTRAINT positive_price;
    RAISE NOTICE '✅ Dropped constraint: positive_price';
  END IF;
END $$;

-- Add new constraints
DO $$ 
BEGIN
  -- Selling price constraint
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'positive_selling_price') THEN
    ALTER TABLE products ADD CONSTRAINT positive_selling_price CHECK (selling_price >= 0);
    RAISE NOTICE '✅ Added constraint: positive_selling_price';
  END IF;
  
  -- Cost price constraint
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'positive_cost_price') THEN
    ALTER TABLE products ADD CONSTRAINT positive_cost_price CHECK (cost_price >= 0);
    RAISE NOTICE '✅ Added constraint: positive_cost_price';
  END IF;
  
  -- Min stock alert constraint
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'positive_min_stock') THEN
    ALTER TABLE products ADD CONSTRAINT positive_min_stock CHECK (min_stock_alert >= 0);
    RAISE NOTICE '✅ Added constraint: positive_min_stock';
  END IF;
END $$;

-- =====================================================
-- STEP 5: REFRESH SCHEMA CACHE
-- =====================================================
DO $$
BEGIN
  NOTIFY pgrst, 'reload schema';
  RAISE NOTICE '✅ PostgREST schema cache refreshed';
END $$;

-- =====================================================
-- STEP 6: VERIFY FINAL SCHEMA
-- =====================================================
DO $$ 
DECLARE
  expected_cols TEXT[] := ARRAY['cost_price', 'selling_price', 'unit', 'min_stock_alert', 'user_id', 'track_inventory'];
  col TEXT;
  found_count INTEGER := 0;
  old_cols TEXT[] := ARRAY['buy_price', 'sell_price', 'stock_quantity', 'stock_unit', 'min_stock', 'price'];
  old_col TEXT;
  old_found_count INTEGER := 0;
BEGIN
  -- Check expected columns exist
  FOREACH col IN ARRAY expected_cols LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = col
    ) THEN
      found_count := found_count + 1;
    END IF;
  END LOOP;
  
  -- Check old columns are gone
  FOREACH old_col IN ARRAY old_cols LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = old_col
    ) THEN
      old_found_count := old_found_count + 1;
      RAISE WARNING '⚠️ Old column still exists: %', old_col;
    END IF;
  END LOOP;
  
  IF found_count = array_length(expected_cols, 1) AND old_found_count = 0 THEN
    RAISE NOTICE '✅✅✅ MIGRATION SUCCESSFUL!';
    RAISE NOTICE 'Expected columns: % / %', found_count, array_length(expected_cols, 1);
    RAISE NOTICE 'Old columns removed: % cleaned', array_length(old_cols, 1);
  ELSE
    RAISE WARNING '⚠️ Migration incomplete:';
    RAISE WARNING 'Expected columns found: % / %', found_count, array_length(expected_cols, 1);
    RAISE WARNING 'Old columns remaining: %', old_found_count;
  END IF;
END $$;

-- =====================================================
-- STEP 7: DISPLAY FINAL COLUMN LIST
-- =====================================================
DO $$
DECLARE
  col_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📋 FINAL PRODUCTS TABLE COLUMNS:';
  RAISE NOTICE '================================';
  
  FOR col_rec IN 
    SELECT column_name, data_type 
    FROM information_schema.columns
    WHERE table_name = 'products'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '  - % (%)', col_rec.column_name, col_rec.data_type;
  END LOOP;
  
  RAISE NOTICE '================================';
END $$;

COMMIT;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Products schema standardization complete!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Next steps:';
  RAISE NOTICE '  1. Verify products table structure';
  RAISE NOTICE '  2. Test product creation in frontend';
  RAISE NOTICE '  3. Check backup table: products_backup_pre_standardization';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- ROLLBACK SCRIPT (EMERGENCY USE ONLY)
-- =====================================================
-- If something goes wrong, restore from backup:
/*
BEGIN;
  DROP TABLE IF EXISTS products;
  ALTER TABLE products_backup_pre_standardization RENAME TO products;
  NOTIFY pgrst, 'reload schema';
COMMIT;
*/
