-- =====================================================
-- DOMAIN: INVENTORY
-- FILE: products.index.sql
-- PURPOSE: Performance indexes & constraints untuk products
-- =====================================================

-- =====================================================
-- INDEXES: Performance Optimization
-- =====================================================

-- User-based queries (primary filter)
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);

-- Active products filter (most common)
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active) WHERE is_active = TRUE;

-- SKU lookup (unique within user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_unique ON products(user_id, sku) WHERE sku IS NOT NULL;

-- Category filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category) WHERE category IS NOT NULL;

-- Inventory tracking filter
CREATE INDEX IF NOT EXISTS idx_products_track_inventory ON products(track_inventory) WHERE track_inventory = TRUE;

-- Composite: user + active + category (dashboard queries)
CREATE INDEX IF NOT EXISTS idx_products_user_active_category ON products(user_id, is_active, category);

-- Search by name (partial match)
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin(name gin_trgm_ops);

-- Timestamp queries (reporting)
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at DESC);

-- =====================================================
-- CONSTRAINTS: Data Validation
-- =====================================================

-- Name required
ALTER TABLE products ADD CONSTRAINT products_name_not_empty CHECK (TRIM(name) != '');

-- Valid unit values
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_unit_valid;
ALTER TABLE products ADD CONSTRAINT products_unit_valid 
  CHECK (unit IN ('pcs', 'kg', 'gram', 'liter', 'ml', 'meter', 'cm', 'jam', 'hari', 'paket', 'box', 'lusin', 'kodi', 'bundle'));

-- Valid category values (flexible - add more as needed)
COMMENT ON COLUMN products.category IS 'Valid categories: makanan, minuman, elektronik, fashion, kesehatan, jasa, material, alat, lainnya';

-- Cost price cannot exceed selling price warning (soft constraint via comment)
COMMENT ON CONSTRAINT positive_cost_price ON products IS 'Cost price must be >= 0';
COMMENT ON CONSTRAINT positive_selling_price ON products IS 'Selling price must be >= 0';

-- SKU format validation (if provided)
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_sku_format;
ALTER TABLE products ADD CONSTRAINT products_sku_format 
  CHECK (sku IS NULL OR sku ~ '^[A-Z0-9-]+$');

-- Image URL format validation
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_image_url_format;
ALTER TABLE products ADD CONSTRAINT products_image_url_format 
  CHECK (image_url IS NULL OR image_url ~ '^https?://');

-- Min stock alert reasonable range
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_min_stock_range;
ALTER TABLE products ADD CONSTRAINT products_min_stock_range 
  CHECK (min_stock_alert >= 0 AND min_stock_alert <= 10000);

-- =====================================================
-- COMMENTS ON INDEXES
-- =====================================================
COMMENT ON INDEX idx_products_user_id IS 'Primary filter: user owns products';
COMMENT ON INDEX idx_products_is_active IS 'Partial index: filter archived products';
COMMENT ON INDEX idx_products_sku_unique IS 'Unique SKU per user';
COMMENT ON INDEX idx_products_category IS 'Filter by product category';
COMMENT ON INDEX idx_products_track_inventory IS 'Filter products with inventory tracking';
COMMENT ON INDEX idx_products_user_active_category IS 'Composite for dashboard queries';
COMMENT ON INDEX idx_products_name_trgm IS 'Full-text search by product name using trigram';
COMMENT ON INDEX idx_products_created_at IS 'Sort by creation date (newest first)';
COMMENT ON INDEX idx_products_updated_at IS 'Sort by update date (newest first)';

-- =====================================================
-- STATISTICS
-- =====================================================
DO $$
DECLARE
  index_count INTEGER;
  constraint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE tablename = 'products';
  
  SELECT COUNT(*) INTO constraint_count
  FROM pg_constraint
  WHERE conrelid = 'products'::regclass;
  
  RAISE NOTICE '✅ Inventory Domain - Products Indexes & Constraints Created';
  RAISE NOTICE '   - % Indexes created for performance', index_count;
  RAISE NOTICE '   - % Constraints created for data validation', constraint_count;
  RAISE NOTICE '   - Full-text search enabled (trigram on name)';
  RAISE NOTICE '   - Unique constraint: SKU per user';
END $$;
