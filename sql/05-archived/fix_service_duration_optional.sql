-- ============================================
-- FIX: Make service_duration truly optional
-- Purpose: Remove CHECK constraint that prevents NULL values
-- Reason: Some services have unpredictable duration (troubleshooting, custom work, etc.)
-- ============================================

-- Drop existing constraint if exists
DO $$ 
BEGIN
    -- Drop check constraint on service_duration
    ALTER TABLE public.products 
    DROP CONSTRAINT IF EXISTS products_service_duration_check;
EXCEPTION
    WHEN undefined_object THEN 
        -- Constraint doesn't exist, that's fine
        NULL;
END $$;

-- Update comment to reflect optional nature
COMMENT ON COLUMN public.products.service_duration IS 
'Duration of service in minutes (OPTIONAL - leave NULL for unpredictable services like troubleshooting, custom work, etc.). Examples: 30 for haircut, 120 for car service';

-- ============================================
-- VERIFICATION
-- ============================================

-- Check constraint is removed
-- SELECT 
--   conname AS constraint_name,
--   contype AS constraint_type,
--   pg_get_constraintdef(oid) AS constraint_definition
-- FROM pg_constraint
-- WHERE conrelid = 'public.products'::regclass
-- AND conname LIKE '%service_duration%';

-- Test: This should work now (NULL duration)
-- INSERT INTO public.products (owner_id, name, category, product_type, sell_price, service_duration, track_inventory, is_active, description)
-- VALUES
-- ('YOUR_USER_ID', 'Troubleshooting IT', 'service', 'service', 500000, NULL, false, true, 'Perbaikan masalah teknis (waktu tidak pasti)');

-- ============================================
-- END OF FIX
-- ============================================
