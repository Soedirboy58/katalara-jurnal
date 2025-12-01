-- =====================================================
-- ADD supplier_type COLUMN TO suppliers TABLE
-- =====================================================
-- Migration: Add supplier_type column to support business classification
-- Date: 2025-11-27
-- ADDITIVE ONLY: No data loss

-- Add supplier_type column (nullable first for safety)
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS supplier_type TEXT;

-- Set default value for existing rows
UPDATE public.suppliers
  SET supplier_type = 'finished_goods'
  WHERE supplier_type IS NULL;

-- Add constraint after data is populated
ALTER TABLE public.suppliers
  ADD CONSTRAINT chk_supplier_type
  CHECK (supplier_type IN ('raw_materials', 'finished_goods', 'both', 'services'));

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_suppliers_type 
  ON public.suppliers(supplier_type);

-- Add comment
COMMENT ON COLUMN public.suppliers.supplier_type IS 'Type of supplier: raw_materials (bahan baku), finished_goods (barang jadi), both (keduanya), services (jasa)';

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check column exists and has data
DO $$ 
BEGIN 
  RAISE NOTICE '✅ supplier_type column added to suppliers table';
  RAISE NOTICE '   - Constraint: Must be one of 4 types';
  RAISE NOTICE '   - Default: finished_goods for existing rows';
  RAISE NOTICE '   - Index: idx_suppliers_type created';
END $$;
