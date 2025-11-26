-- =====================================================
-- DOMAIN: INVENTORY
-- TABLE: products
-- PURPOSE: Master data produk (barang & jasa) untuk seluruh sistem
-- =====================================================

-- =====================================================
-- TABLE: products
-- Master produk yang digunakan oleh:
-- - finance domain (income_items)
-- - storefront domain (storefront_products)
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Information
  name TEXT NOT NULL,
  sku TEXT, -- Stock Keeping Unit (auto-generated if empty)
  category TEXT, -- Kategori produk: 'makanan', 'minuman', 'elektronik', 'jasa', dll
  unit TEXT DEFAULT 'pcs', -- Satuan: 'pcs', 'kg', 'liter', 'jam', 'paket', dll
  description TEXT,
  
  -- Pricing
  cost_price NUMERIC(15,2) DEFAULT 0, -- Harga beli/modal
  selling_price NUMERIC(15,2) DEFAULT 0, -- Harga jual default
  
  -- Media
  image_url TEXT, -- URL gambar produk (dari storage)
  
  -- Inventory Tracking
  track_inventory BOOLEAN DEFAULT TRUE, -- FALSE untuk produk jasa
  min_stock_alert INTEGER DEFAULT 0, -- Alert jika stok < nilai ini
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_cost_price CHECK (cost_price >= 0),
  CONSTRAINT positive_selling_price CHECK (selling_price >= 0),
  CONSTRAINT positive_min_stock CHECK (min_stock_alert >= 0)
);

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================
COMMENT ON TABLE products IS 'Master produk untuk seluruh sistem - digunakan oleh finance (income_items) dan storefront (storefront_products)';
COMMENT ON COLUMN products.sku IS 'Stock Keeping Unit - auto-generated jika kosong (format: PRD-YYYY-001)';
COMMENT ON COLUMN products.category IS 'Kategori produk untuk filtering & analytics';
COMMENT ON COLUMN products.unit IS 'Satuan: pcs (default), kg, liter, jam, paket, box, dll';
COMMENT ON COLUMN products.cost_price IS 'Harga beli/modal - untuk perhitungan profit';
COMMENT ON COLUMN products.selling_price IS 'Harga jual default - bisa di-override di income_items atau storefront_products';
COMMENT ON COLUMN products.track_inventory IS 'FALSE untuk produk jasa (tidak perlu tracking stok)';
COMMENT ON COLUMN products.min_stock_alert IS 'Alert jika current_stock < nilai ini (untuk produk fisik)';
COMMENT ON COLUMN products.is_active IS 'FALSE = produk tidak aktif (archived), tidak muncul di dropdown';

-- =====================================================
-- BASIC INDEXES (Performance essentials)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active) WHERE is_active = TRUE;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Inventory Domain - Products Schema Created';
  RAISE NOTICE '   - Table: products (master produk untuk seluruh sistem)';
  RAISE NOTICE '   - Features: SKU, pricing, inventory tracking, categories';
  RAISE NOTICE '   - Linked by: finance.income_items, storefront.storefront_products';
END $$;
