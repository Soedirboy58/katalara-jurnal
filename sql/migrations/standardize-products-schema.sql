-- =====================================================
-- MIGRATION: Standardize Products Schema
-- Date: 2024-11-27
-- Purpose: Fix column naming and remove stock_quantity
-- =====================================================
-- ⚠️ ONLY RUN THIS IF verify-products-schema.sql shows:
--    - sell_price exists (should be selling_price)
--    - stock_quantity exists (should NOT exist)
--    - buy_price exists (should be cost_price)
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CHECK IF MIGRATION NEEDED
-- =====================================================
DO $$ 
DECLARE
  has_sell_price BOOLEAN;
  has_selling_price BOOLEAN;
  has_stock_quantity BOOLEAN;
  has_buy_price BOOLEAN;
  has_cost_price BOOLEAN;
BEGIN
  -- Check current column names
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'sell_price'
  ) INTO has_sell_price;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'selling_price'
  ) INTO has_selling_price;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'stock_quantity'
  ) INTO has_stock_quantity;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'buy_price'
  ) INTO has_buy_price;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'cost_price'
  ) INTO has_cost_price;
  
  RAISE NOTICE '=== CURRENT SCHEMA STATUS ===';
  RAISE NOTICE 'sell_price exists: %', has_sell_price;
  RAISE NOTICE 'selling_price exists: %', has_selling_price;
  RAISE NOTICE 'stock_quantity exists: %', has_stock_quantity;
  RAISE NOTICE 'buy_price exists: %', has_buy_price;
  RAISE NOTICE 'cost_price exists: %', has_cost_price;
  
  IF has_selling_price AND NOT has_sell_price AND has_cost_price AND NOT has_buy_price AND NOT has_stock_quantity THEN
    RAISE NOTICE '✅ Schema already correct! No migration needed.';
    RAISE EXCEPTION 'MIGRATION_NOT_NEEDED' USING ERRCODE = 'P0001';
  END IF;
  
  RAISE NOTICE '⚠️ Migration needed - proceeding...';
END $$;

-- =====================================================
-- 2. RENAME COLUMNS (if exist)
-- =====================================================

-- Rename sell_price → selling_price (if exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'sell_price'
  ) THEN
    ALTER TABLE products RENAME COLUMN sell_price TO selling_price;
    RAISE NOTICE '✅ Renamed: sell_price → selling_price';
  END IF;
END $$;

-- Rename buy_price → cost_price (if exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'buy_price'
  ) THEN
    ALTER TABLE products RENAME COLUMN buy_price TO cost_price;
    RAISE NOTICE '✅ Renamed: buy_price → cost_price';
  END IF;
END $$;

-- Rename stock_unit → unit (if exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'stock_unit'
  ) THEN
    ALTER TABLE products RENAME COLUMN stock_unit TO unit;
    RAISE NOTICE '✅ Renamed: stock_unit → unit';
  END IF;
END $$;

-- Rename min_stock → min_stock_alert (if exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'min_stock'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'min_stock_alert'
  ) THEN
    ALTER TABLE products RENAME COLUMN min_stock TO min_stock_alert;
    RAISE NOTICE '✅ Renamed: min_stock → min_stock_alert';
  END IF;
END $$;

-- Rename owner_id → user_id (if exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'owner_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE products RENAME COLUMN owner_id TO user_id;
    RAISE NOTICE '✅ Renamed: owner_id → user_id';
  END IF;
END $$;

-- =====================================================
-- 3. DROP stock_quantity (if exists)
-- =====================================================
-- Stock will be managed in separate stock_movements table
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

-- Drop other unused stock columns
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'initial_stock'
  ) THEN
    ALTER TABLE products DROP COLUMN initial_stock;
    RAISE NOTICE '✅ Dropped: initial_stock';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'current_stock'
  ) THEN
    ALTER TABLE products DROP COLUMN current_stock;
    RAISE NOTICE '✅ Dropped: current_stock';
  END IF;
END $$;

-- =====================================================
-- 4. ADD MISSING COLUMNS (if needed)
-- =====================================================

-- Add cost_price if doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'cost_price'
  ) THEN
    ALTER TABLE products ADD COLUMN cost_price NUMERIC(15,2) DEFAULT 0;
    RAISE NOTICE '✅ Added: cost_price';
  END IF;
END $$;

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

-- Add unit if doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'unit'
  ) THEN
    ALTER TABLE products ADD COLUMN unit TEXT DEFAULT 'pcs';
    RAISE NOTICE '✅ Added: unit';
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

-- =====================================================
-- 5. UPDATE CONSTRAINTS
-- =====================================================

-- Drop old constraints
DO $$ 
BEGIN
  -- Drop old price constraint
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'positive_sell_price'
  ) THEN
    ALTER TABLE products DROP CONSTRAINT positive_sell_price;
    RAISE NOTICE '✅ Dropped old constraint: positive_sell_price';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'positive_buy_price'
  ) THEN
    ALTER TABLE products DROP CONSTRAINT positive_buy_price;
    RAISE NOTICE '✅ Dropped old constraint: positive_buy_price';
  END IF;
END $$;

-- Add new constraints
DO $$ 
BEGIN
  -- Add selling_price constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'positive_selling_price'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT positive_selling_price CHECK (selling_price >= 0);
    RAISE NOTICE '✅ Added constraint: positive_selling_price';
  END IF;
  
  -- Add cost_price constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'positive_cost_price'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT positive_cost_price CHECK (cost_price >= 0);
    RAISE NOTICE '✅ Added constraint: positive_cost_price';
  END IF;
  
  -- Add min_stock_alert constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'positive_min_stock'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT positive_min_stock CHECK (min_stock_alert >= 0);
    RAISE NOTICE '✅ Added constraint: positive_min_stock';
  END IF;
END $$;

-- =====================================================
-- 6. REFRESH SCHEMA CACHE
-- =====================================================
NOTIFY pgrst, 'reload schema';
RAISE NOTICE '✅ PostgREST schema cache refreshed';

-- =====================================================
-- 7. VERIFY FINAL SCHEMA
-- =====================================================
DO $$ 
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'products'
    AND column_name IN ('cost_price', 'selling_price', 'unit', 'min_stock_alert');
    
  IF col_count = 4 THEN
    RAISE NOTICE '✅✅✅ MIGRATION SUCCESSFUL! All expected columns exist.';
  ELSE
    RAISE NOTICE '⚠️ Migration completed but some columns missing (found % / 4)', col_count;
  END IF;
END $$;

COMMIT;

-- =====================================================
-- ROLLBACK SCRIPT (Save for emergency)
-- =====================================================
-- If something goes wrong, run this:
/*
BEGIN;
  -- Restore old column names (if you have backups)
  ALTER TABLE products RENAME COLUMN selling_price TO sell_price;
  ALTER TABLE products RENAME COLUMN cost_price TO buy_price;
  ALTER TABLE products ADD COLUMN stock_quantity INTEGER DEFAULT 0;
  NOTIFY pgrst, 'reload schema';
COMMIT;
*/
