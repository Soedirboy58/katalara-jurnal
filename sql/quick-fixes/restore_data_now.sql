-- =====================================================
-- RESTORE PRODUCTS DATA
-- From backup to current table (owner_id + price schema)
-- =====================================================

BEGIN;

-- Temporarily disable RLS for insert
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Clear any existing data
TRUNCATE products;

-- Insert from backup with column mapping
INSERT INTO products (
  id,
  owner_id,
  name,
  category,
  unit,
  price,
  is_active,
  created_at,
  updated_at
)
SELECT 
  id,
  user_id as owner_id,  -- Map user_id → owner_id
  name,
  category,
  unit,
  COALESCE(selling_price, cost_price, 0) as price,  -- Use selling_price as main price
  is_active,
  created_at,
  updated_at
FROM products_backup_current_schema
WHERE is_active = true;

-- Re-enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT 
  '✅ PRODUCTS RESTORED!' as status,
  COUNT(*) as total_products
FROM products;

-- Show data
SELECT 
  name,
  price,
  unit,
  is_active
FROM products
ORDER BY name;

COMMIT;
