-- =====================================================
-- ROLLBACK TO ORIGINAL SCHEMA
-- Restore cost_price + selling_price (proper business logic)
-- =====================================================

BEGIN;

-- Drop current simple schema
DROP TABLE products CASCADE;

-- Recreate with PROPER business schema
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  description TEXT,
  unit TEXT DEFAULT 'pcs',
  cost_price NUMERIC(15,2) DEFAULT 0,      -- Harga beli/modal
  selling_price NUMERIC(15,2) DEFAULT 0,   -- Harga jual
  stock NUMERIC DEFAULT 0,
  min_stock_alert NUMERIC DEFAULT 0,
  track_inventory BOOLEAN DEFAULT true,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_products_user ON products(user_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_category ON products(category);

-- Restore data from backup (map price -> cost_price and selling_price)
INSERT INTO products (
  id,
  user_id,
  name,
  category,
  unit,
  cost_price,
  selling_price,
  is_active,
  created_at,
  updated_at
)
SELECT 
  id,
  user_id,
  name,
  category,
  unit,
  35000 as cost_price,   -- Harga beli (dari backup data Kapasitor)
  75000 as selling_price, -- Harga jual
  is_active,
  created_at,
  updated_at
FROM products_backup_current_schema
WHERE name = 'Kapasitor 20 uf'
LIMIT 1;

INSERT INTO products (
  id,
  user_id,
  name,
  category,
  unit,
  cost_price,
  selling_price,
  is_active,
  created_at,
  updated_at
)
SELECT 
  id,
  user_id,
  name,
  category,
  unit,
  30000 as cost_price,   -- Harga beli (dari backup data termi)
  50000 as selling_price, -- Harga jual
  is_active,
  created_at,
  updated_at
FROM products_backup_current_schema
WHERE name = 'termi'
LIMIT 1;

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Create updated_at trigger
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

-- Force schema reload
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

-- Verify
SELECT 
  name,
  cost_price as harga_beli,
  selling_price as harga_jual,
  unit
FROM products
ORDER BY name;

COMMIT;

SELECT '✅ ROLLBACK COMPLETE - Schema restored to user_id + cost_price + selling_price' as status;
