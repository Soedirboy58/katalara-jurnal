-- Recipe System for Product-Ingredient Relationship
-- This allows products (like "Nasi Goreng") to have ingredients/raw materials

-- 1. Create product_recipes table
CREATE TABLE IF NOT EXISTS product_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  finished_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ingredient_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_needed DECIMAL(10, 2) NOT NULL DEFAULT 0, -- berapa qty bahan untuk 1 unit produk jadi
  unit TEXT NOT NULL, -- unit bahan (kg, gram, liter, dll)
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(finished_product_id, ingredient_product_id)
);

-- 2. Add index for performance
CREATE INDEX IF NOT EXISTS idx_product_recipes_finished ON product_recipes(finished_product_id);
CREATE INDEX IF NOT EXISTS idx_product_recipes_ingredient ON product_recipes(ingredient_product_id);
CREATE INDEX IF NOT EXISTS idx_product_recipes_user ON product_recipes(user_id);

-- 3. Add is_raw_material flag to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_raw_material BOOLEAN DEFAULT false;

-- 4. Add has_recipe flag to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS has_recipe BOOLEAN DEFAULT false;

-- 5. Add auto_deduct_ingredients flag to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS auto_deduct_ingredients BOOLEAN DEFAULT true;

-- 6. Create function to auto-update timestamps
CREATE OR REPLACE FUNCTION update_product_recipes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for auto-update
DROP TRIGGER IF EXISTS trigger_update_product_recipes_timestamp ON product_recipes;
CREATE TRIGGER trigger_update_product_recipes_timestamp
  BEFORE UPDATE ON product_recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_product_recipes_timestamp();

-- 8. Enable RLS
ALTER TABLE product_recipes ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies
DROP POLICY IF EXISTS "Users can view own recipes" ON product_recipes;
CREATE POLICY "Users can view own recipes" ON product_recipes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own recipes" ON product_recipes;
CREATE POLICY "Users can insert own recipes" ON product_recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own recipes" ON product_recipes;
CREATE POLICY "Users can update own recipes" ON product_recipes
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own recipes" ON product_recipes;
CREATE POLICY "Users can delete own recipes" ON product_recipes
  FOR DELETE USING (auth.uid() = user_id);

-- 10. Add comments for documentation
COMMENT ON TABLE product_recipes IS 'Defines ingredient relationships for finished products';
COMMENT ON COLUMN product_recipes.finished_product_id IS 'The final product (e.g., Nasi Goreng)';
COMMENT ON COLUMN product_recipes.ingredient_product_id IS 'The raw material/ingredient needed';
COMMENT ON COLUMN product_recipes.quantity_needed IS 'Amount of ingredient needed to make 1 unit of finished product';
COMMENT ON COLUMN products.is_raw_material IS 'Flag: true if this product is a raw material/ingredient';
COMMENT ON COLUMN products.has_recipe IS 'Flag: true if this product has a recipe defined';
COMMENT ON COLUMN products.auto_deduct_ingredients IS 'Flag: auto deduct ingredients when selling this product';
