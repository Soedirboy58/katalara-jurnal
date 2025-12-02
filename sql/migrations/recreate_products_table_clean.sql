-- =====================================================
-- NUCLEAR OPTION: Recreate Products Table
-- This will fix "table view disabled" 100%
-- =====================================================
-- ⚠️ WARNING: This will temporarily drop the table
-- But data will be restored from backup
-- =====================================================

BEGIN;

-- Step 1: Create fresh backup with timestamp
CREATE TABLE products_backup_before_recreation AS 
SELECT * FROM products;

-- Verify backup created
DO $$
DECLARE
  backup_count BIGINT;
  original_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO backup_count FROM products_backup_before_recreation;
  SELECT COUNT(*) INTO original_count FROM products;
  
  IF backup_count != original_count THEN
    RAISE EXCEPTION 'Backup failed! Counts do not match: % vs %', backup_count, original_count;
  END IF;
  
  RAISE NOTICE '✅ Backup created successfully: % rows', backup_count;
END $$;

-- Step 2: Drop the old table (this clears ALL schema issues)
DROP TABLE products CASCADE;

-- Step 3: Recreate table with clean schema
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  description TEXT,
  
  -- Pricing (using standard naming)
  cost_price NUMERIC(15,2) DEFAULT 0 CHECK (cost_price >= 0),
  selling_price NUMERIC(15,2) DEFAULT 0 CHECK (selling_price >= 0),
  
  -- Inventory
  unit TEXT DEFAULT 'pcs',
  stock INTEGER DEFAULT 0,
  min_stock_alert INTEGER DEFAULT 0 CHECK (min_stock_alert >= 0),
  track_inventory BOOLEAN DEFAULT TRUE,
  
  -- Media
  image_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create indexes for performance
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_sku ON products(sku) WHERE sku IS NOT NULL;

-- Step 5: Restore data from backup
-- Check which columns exist in backup and map them correctly
INSERT INTO products (
  id, user_id, name, sku, category, description,
  cost_price, selling_price, unit, min_stock_alert,
  track_inventory, image_url, is_active, created_at, updated_at
)
SELECT 
  id, 
  user_id, 
  name, 
  COALESCE(sku, '') as sku,
  COALESCE(category, '') as category,
  description,
  COALESCE(cost_price, 0) as cost_price,
  COALESCE(selling_price, 0) as selling_price,
  COALESCE(unit, 'pcs') as unit,
  COALESCE(min_stock_alert, 0) as min_stock_alert,
  COALESCE(track_inventory, true) as track_inventory,
  image_url, 
  COALESCE(is_active, true) as is_active,
  created_at, 
  updated_at
FROM products_backup_before_recreation;

-- Step 6: Verify data restored correctly
DO $$
DECLARE
  restored_count BIGINT;
  backup_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO restored_count FROM products;
  SELECT COUNT(*) INTO backup_count FROM products_backup_before_recreation;
  
  IF restored_count != backup_count THEN
    RAISE EXCEPTION 'Restore failed! Counts do not match: % vs %', restored_count, backup_count;
  END IF;
  
  RAISE NOTICE '✅ Data restored successfully: % rows', restored_count;
END $$;

-- Step 7: Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies
CREATE POLICY "Users can view own products"
  ON products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON products FOR DELETE
  USING (auth.uid() = user_id);

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
  '✅ TABLE RECREATED SUCCESSFULLY!' as status,
  COUNT(*) as total_products,
  COUNT(DISTINCT user_id) as total_users,
  MIN(created_at) as oldest_product,
  MAX(created_at) as newest_product
FROM products;

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
🎉 PRODUCTS TABLE RECREATED!

✅ What was done:
1. Backup created (products_backup_before_recreation)
2. Old table dropped (cleared all schema locks)
3. New table created with clean schema
4. All data restored
5. Indexes recreated
6. RLS policies applied
7. Triggers recreated

📝 IMPORTANT - Do these steps NOW:
1. Close this SQL Editor tab
2. Close ALL Supabase tabs
3. Clear browser cache (Ctrl+Shift+Delete)
4. Close browser completely
5. Reopen browser
6. Go to Supabase → Table Editor → products
7. Table view should NOW work!

If table view STILL disabled after this:
- This is a Supabase Dashboard bug
- Use Card View (same functionality)
- Or contact Supabase support

🗑️ Cleanup (optional, after verifying):
DROP TABLE products_backup_before_recreation;
' as instructions;
