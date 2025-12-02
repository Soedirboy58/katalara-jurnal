-- =====================================================
-- FIX SUPPLIERS & CUSTOMERS SCHEMA
-- Memastikan kolom owner_id ada dan konsisten
-- Date: 2025-12-02
-- =====================================================

-- =====================================================
-- 1. CEK DAN PERBAIKI TABLE SUPPLIERS
-- =====================================================

DO $$ 
BEGIN
  -- Cek apakah kolom user_id ada (struktur lama)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'suppliers' AND column_name = 'user_id'
  ) THEN
    -- Rename user_id menjadi owner_id
    RAISE NOTICE '🔄 Renaming suppliers.user_id to owner_id...';
    ALTER TABLE suppliers RENAME COLUMN user_id TO owner_id;
    RAISE NOTICE '✅ Renamed suppliers.user_id to owner_id';
  END IF;

  -- Cek apakah kolom owner_id sudah ada
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'suppliers' AND column_name = 'owner_id'
  ) THEN
    -- Jika tidak ada sama sekali, tambahkan
    RAISE NOTICE '➕ Adding owner_id column to suppliers...';
    ALTER TABLE suppliers ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Added owner_id column to suppliers';
  END IF;

  -- Pastikan kolom owner_id NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'suppliers' 
    AND column_name = 'owner_id' 
    AND is_nullable = 'YES'
  ) THEN
    RAISE NOTICE '🔒 Setting owner_id as NOT NULL...';
    ALTER TABLE suppliers ALTER COLUMN owner_id SET NOT NULL;
    RAISE NOTICE '✅ Set owner_id as NOT NULL';
  END IF;
END $$;

-- =====================================================
-- 2. CEK DAN PERBAIKI TABLE CUSTOMERS
-- =====================================================

DO $$ 
BEGIN
  -- Cek apakah kolom user_id ada (struktur lama)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'user_id'
  ) THEN
    -- Rename user_id menjadi owner_id
    RAISE NOTICE '🔄 Renaming customers.user_id to owner_id...';
    ALTER TABLE customers RENAME COLUMN user_id TO owner_id;
    RAISE NOTICE '✅ Renamed customers.user_id to owner_id';
  END IF;

  -- Cek apakah kolom owner_id sudah ada
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'owner_id'
  ) THEN
    -- Jika tidak ada sama sekali, tambahkan
    RAISE NOTICE '➕ Adding owner_id column to customers...';
    ALTER TABLE customers ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Added owner_id column to customers';
  END IF;

  -- Pastikan kolom owner_id NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' 
    AND column_name = 'owner_id' 
    AND is_nullable = 'YES'
  ) THEN
    RAISE NOTICE '🔒 Setting owner_id as NOT NULL...';
    ALTER TABLE customers ALTER COLUMN owner_id SET NOT NULL;
    RAISE NOTICE '✅ Set owner_id as NOT NULL';
  END IF;
END $$;

-- =====================================================
-- 3. PERBAIKI INDEXES
-- =====================================================

-- Drop old indexes jika ada
DROP INDEX IF EXISTS idx_suppliers_user_id;
DROP INDEX IF EXISTS idx_customers_user_id;

-- Create new indexes untuk owner_id
CREATE INDEX IF NOT EXISTS idx_suppliers_owner_id ON suppliers(owner_id);
CREATE INDEX IF NOT EXISTS idx_customers_owner_id ON customers(owner_id);

-- =====================================================
-- 4. RELOAD SCHEMA CACHE
-- =====================================================

-- Force Supabase PostgREST untuk reload schema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- =====================================================
-- 5. VERIFIKASI HASIL
-- =====================================================

DO $$
DECLARE
  suppliers_ok BOOLEAN;
  customers_ok BOOLEAN;
BEGIN
  -- Cek suppliers
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'suppliers' AND column_name = 'owner_id'
  ) INTO suppliers_ok;

  -- Cek customers
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'owner_id'
  ) INTO customers_ok;

  -- Report
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION SUMMARY';
  RAISE NOTICE '========================================';
  
  IF suppliers_ok THEN
    RAISE NOTICE '✅ suppliers.owner_id = READY';
  ELSE
    RAISE NOTICE '❌ suppliers.owner_id = FAILED';
  END IF;

  IF customers_ok THEN
    RAISE NOTICE '✅ customers.owner_id = READY';
  ELSE
    RAISE NOTICE '❌ customers.owner_id = FAILED';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Please refresh your browser to clear cache';
  RAISE NOTICE '📝 PostgREST schema has been reloaded';
  
END $$;
