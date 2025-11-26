-- =====================================================
-- PATCH: INVENTORY DOMAIN SETUP (For Existing Database)
-- Date: 2025-11-26
-- Purpose: Create INVENTORY domain tables in existing database
-- =====================================================
-- APPLY THIS PATCH ONLY IF:
-- - You have FINANCE/STOREFRONT domains already deployed
-- - You need to add INVENTORY domain without disrupting existing data
-- =====================================================
-- IMPORTANT FOR SUPABASE:
-- This file references other SQL files that must be run separately.
-- Run files in this order:
-- 1. domain/inventory/products.schema.sql
-- 2. domain/inventory/product_stock_movements.schema.sql
-- 3. domain/inventory/products.logic.sql
-- 4. domain/inventory/product_stock_movements.logic.sql
-- 5. domain/inventory/products.policies.sql
-- 6. domain/inventory/product_stock_movements.policies.sql
-- 7. domain/inventory/products.index.sql
-- 8. domain/inventory/product_stock_movements.index.sql
-- Then run the verification below:
-- =====================================================

-- =====================================================
-- VERIFICATION: Check INVENTORY Deployment
-- =====================================================

SELECT 
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ All INVENTORY tables exist'
    ELSE '❌ ERROR: Missing tables!'
  END AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('products', 'product_stock_movements');

SELECT 
  CASE 
    WHEN COUNT(*) >= 9 THEN '✅ All INVENTORY functions exist (' || COUNT(*) || '/9+)'
    ELSE '❌ ERROR: Missing functions!'
  END AS status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_product_updated_at',
    'generate_product_sku',
    'get_current_stock',
    'get_low_stock_products',
    'get_product_profit_margin',
    'get_product_summary'
  );

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================
-- INVENTORY DOMAIN DEPLOYED SUCCESSFULLY!
-- =================================================
--
-- Next Steps:
-- 1. Apply FINANCE patch: 2025-11-26-finance-add-product-fk.sql
-- 2. Apply STOREFRONT patch: 2025-11-26-storefront-fix-product-fk.sql
-- 3. Run health check: inventory.debug.sql
--
-- CRITICAL: FINANCE & STOREFRONT now depend on INVENTORY.products table!
--
-- =================================================
