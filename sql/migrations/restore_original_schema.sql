-- =====================================================
-- RESTORE TO ORIGINAL SCHEMA
-- Based on backup in supabase-migration folder
-- This will fix table view disabled issue
-- =====================================================
-- Schema asli yang benar:
-- - owner_id (NOT user_id)
-- - price (NOT cost_price + selling_price)
-- - Simple and clean
-- =====================================================

BEGIN;

-- Step 1: Backup current data
CREATE TABLE products_backup_current_schema AS 
SELECT * FROM products;

-- Verify backup
DO $$
DECLARE
  backup_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO backup_count FROM products_backup_current_schema;
  RAISE NOTICE '✅ Backup created: % rows', backup_count;
END $$;

-- Step 2: Drop current table (clears all schema conflicts)
DROP TABLE products CASCADE;

-- Step 3: Recreate with ORIGINAL CLEAN SCHEMA from backup
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT DEFAULT 'pcs',
  price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create indexes
CREATE INDEX idx_products_owner ON products(owner_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_category ON products(category);

-- Step 5: Restore data with column mapping
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
  user_id as owner_id,  -- Map user_id to owner_id
  name,
  COALESCE(category, '') as category,
  COALESCE(unit, 'pcs') as unit,
  COALESCE(selling_price, cost_price, 0) as price,  -- Use selling_price as main price
  COALESCE(is_active, true) as is_active,
  created_at,
  updated_at
FROM products_backup_current_schema;

-- Step 6: Verify restore
DO $$
DECLARE
  restored_count BIGINT;
  backup_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO restored_count FROM products;
  SELECT COUNT(*) INTO backup_count FROM products_backup_current_schema;
  
  IF restored_count != backup_count THEN
    RAISE EXCEPTION 'Restore failed! Counts: % vs %', restored_count, backup_count;
  END IF;
  
  RAISE NOTICE '✅ Data restored: % rows', restored_count;
END $$;

-- Step 7: Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies (using owner_id)
CREATE POLICY "Users can view own products"
  ON products FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own products"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own products"
  ON products FOR DELETE
  USING (auth.uid() = owner_id);

-- Step 9: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 10: Force schema reload
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

-- Step 11: Final verification
SELECT 
  '✅ SCHEMA RESTORED TO ORIGINAL!' as status,
  COUNT(*) as total_products,
  COUNT(DISTINCT owner_id) as total_owners
FROM products;

-- Show structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

COMMIT;

-- Success message
SELECT '
🎉 SCHEMA RESTORED TO ORIGINAL!

✅ Changes made:
1. Switched user_id → owner_id (correct)
2. Simplified pricing: cost_price + selling_price → price
3. Removed unnecessary columns
4. Schema now matches backup in supabase-migration/

📝 IMPORTANT NEXT STEPS:
1. Close SQL Editor tab
2. Close ALL Supabase tabs
3. Clear browser cache (Ctrl+Shift+Delete)
4. Close browser completely
5. Reopen and go to Table Editor > products
6. Table view should NOW be enabled!

🔄 Frontend needs update:
- API routes need to use owner_id (not user_id)
- Product forms need to use price (not cost_price/selling_price)
- I will update the frontend code next

🗑️ Cleanup after testing:
DROP TABLE products_backup_current_schema;
' as instructions;
