-- =====================================================
-- PRODUCTS TABLE: SCHEMA SYNCHRONIZATION PATCH
-- =====================================================
-- Purpose: Ensure products table has all required columns
-- Domain: INVENTORY
-- Date: 2024-11-27
--
-- GOAL: Make database match the official INVENTORY domain spec:
-- - user_id, name, sku, category, unit, description
-- - cost_price, selling_price (NOT sell_price)
-- - image_url
-- - track_inventory, min_stock_alert (NOT min_stock)
-- - is_active, created_at, updated_at
--
-- This patch adds missing columns WITHOUT dropping existing ones.
-- Safe to run multiple times (uses IF NOT EXISTS).
-- =====================================================

-- =====================================================
-- STEP 1: ADD MISSING COLUMNS (IF NOT EXISTS)
-- =====================================================

-- Add cost_price if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'cost_price'
  ) THEN
    ALTER TABLE products ADD COLUMN cost_price NUMERIC(15,2) DEFAULT 0;
    RAISE NOTICE '✅ Added column: cost_price';
  ELSE
    RAISE NOTICE '⏭️  Column already exists: cost_price';
  END IF;
END $$;

-- Add selling_price if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'selling_price'
  ) THEN
    ALTER TABLE products ADD COLUMN selling_price NUMERIC(15,2) DEFAULT 0;
    RAISE NOTICE '✅ Added column: selling_price';
  ELSE
    RAISE NOTICE '⏭️  Column already exists: selling_price';
  END IF;
END $$;

-- Add track_inventory if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'track_inventory'
  ) THEN
    ALTER TABLE products ADD COLUMN track_inventory BOOLEAN DEFAULT TRUE;
    RAISE NOTICE '✅ Added column: track_inventory';
  ELSE
    RAISE NOTICE '⏭️  Column already exists: track_inventory';
  END IF;
END $$;

-- Add min_stock_alert if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'min_stock_alert'
  ) THEN
    ALTER TABLE products ADD COLUMN min_stock_alert INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Added column: min_stock_alert';
  ELSE
    RAISE NOTICE '⏭️  Column already exists: min_stock_alert';
  END IF;
END $$;

-- Add image_url if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'image_url'
  ) THEN
    ALTER TABLE products ADD COLUMN image_url TEXT;
    RAISE NOTICE '✅ Added column: image_url';
  ELSE
    RAISE NOTICE '⏭️  Column already exists: image_url';
  END IF;
END $$;

-- Add is_active if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'is_active'
  ) THEN
    ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    RAISE NOTICE '✅ Added column: is_active';
  ELSE
    RAISE NOTICE '⏭️  Column already exists: is_active';
  END IF;
END $$;

-- Add created_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'created_at'
  ) THEN
    ALTER TABLE products ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '✅ Added column: created_at';
  ELSE
    RAISE NOTICE '⏭️  Column already exists: created_at';
  END IF;
END $$;

-- Add updated_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE products ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '✅ Added column: updated_at';
  ELSE
    RAISE NOTICE '⏭️  Column already exists: updated_at';
  END IF;
END $$;

-- =====================================================
-- STEP 2: ADD CONSTRAINTS (IF NOT EXISTS)
-- =====================================================

-- Add positive_cost_price constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'positive_cost_price'
      AND conrelid = 'products'::regclass
  ) THEN
    ALTER TABLE products ADD CONSTRAINT positive_cost_price CHECK (cost_price >= 0);
    RAISE NOTICE '✅ Added constraint: positive_cost_price';
  ELSE
    RAISE NOTICE '⏭️  Constraint already exists: positive_cost_price';
  END IF;
END $$;

-- Add positive_selling_price constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'positive_selling_price'
      AND conrelid = 'products'::regclass
  ) THEN
    ALTER TABLE products ADD CONSTRAINT positive_selling_price CHECK (selling_price >= 0);
    RAISE NOTICE '✅ Added constraint: positive_selling_price';
  ELSE
    RAISE NOTICE '⏭️  Constraint already exists: positive_selling_price';
  END IF;
END $$;

-- Add positive_min_stock_alert constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'positive_min_stock_alert'
      AND conrelid = 'products'::regclass
  ) THEN
    ALTER TABLE products ADD CONSTRAINT positive_min_stock_alert CHECK (min_stock_alert >= 0);
    RAISE NOTICE '✅ Added constraint: positive_min_stock_alert';
  ELSE
    RAISE NOTICE '⏭️  Constraint already exists: positive_min_stock_alert';
  END IF;
END $$;

-- =====================================================
-- STEP 3: MIGRATE DATA FROM OLD COLUMNS (IF THEY EXIST)
-- =====================================================

-- Migrate sell_price → selling_price (if sell_price exists)
DO $$
DECLARE
  has_sell_price BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'sell_price'
  ) INTO has_sell_price;

  IF has_sell_price THEN
    -- Copy data from sell_price to selling_price where selling_price is 0 or NULL
    UPDATE products
    SET selling_price = sell_price
    WHERE (selling_price = 0 OR selling_price IS NULL)
      AND sell_price IS NOT NULL
      AND sell_price > 0;
    
    RAISE NOTICE '✅ Migrated data: sell_price → selling_price';
  ELSE
    RAISE NOTICE '⏭️  No sell_price column found (nothing to migrate)';
  END IF;
END $$;

-- Migrate min_stock → min_stock_alert (if min_stock exists)
DO $$
DECLARE
  has_min_stock BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'min_stock'
  ) INTO has_min_stock;

  IF has_min_stock THEN
    -- Copy data from min_stock to min_stock_alert where min_stock_alert is 0 or NULL
    UPDATE products
    SET min_stock_alert = min_stock
    WHERE (min_stock_alert = 0 OR min_stock_alert IS NULL)
      AND min_stock IS NOT NULL
      AND min_stock > 0;
    
    RAISE NOTICE '✅ Migrated data: min_stock → min_stock_alert';
  ELSE
    RAISE NOTICE '⏭️  No min_stock column found (nothing to migrate)';
  END IF;
END $$;

-- =====================================================
-- STEP 4: VERIFICATION
-- =====================================================

-- Show all columns in products table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
ORDER BY column_name;

-- Show constraints
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'products'::regclass
  AND contype = 'c'
ORDER BY conname;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ PRODUCTS TABLE SCHEMA SYNCHRONIZED!';
  RAISE NOTICE '   Required columns: user_id, name, sku, category, unit, description';
  RAISE NOTICE '   Pricing: cost_price, selling_price';
  RAISE NOTICE '   Tracking: track_inventory, min_stock_alert';
  RAISE NOTICE '   Media: image_url';
  RAISE NOTICE '   Status: is_active, created_at, updated_at';
END $$;

-- =====================================================
-- NOTES FOR FRONTEND
-- =====================================================

-- CORRECT INSERT PAYLOAD:
-- {
--   "user_id": "uuid",
--   "name": "Product Name",
--   "sku": "PRD-001",
--   "category": "electronics",
--   "unit": "pcs",
--   "description": "Product description",
--   "cost_price": 50000,
--   "selling_price": 75000,
--   "image_url": "https://...",
--   "track_inventory": true,
--   "min_stock_alert": 10,
--   "is_active": true
-- }
