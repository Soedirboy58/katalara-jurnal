-- ============================================
-- ADD UNIT COLUMN TO PRODUCTS TABLE
-- Purpose: Store product unit (pcs, meter, kg, dll)
-- ============================================

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'pcs';

COMMENT ON COLUMN public.products.unit IS 'Unit of measurement for product (pcs, meter, kg, liter, etc)';

-- ============================================
-- END OF MIGRATION
-- ============================================
