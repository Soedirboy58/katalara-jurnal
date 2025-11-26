-- =====================================================
-- DOMAIN: INVENTORY
-- FILE: products.logic.sql
-- PURPOSE: Business logic untuk product management
-- =====================================================

-- =====================================================
-- FUNCTION: Auto-update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_product_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCTION: Auto-generate SKU
-- Format: PRD-{YYYY}-{sequence} e.g., PRD-2025-001
-- =====================================================
CREATE OR REPLACE FUNCTION generate_product_sku()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_year TEXT;
  v_sequence INT;
  v_sku TEXT;
BEGIN
  -- Only generate if SKU is not provided
  IF NEW.sku IS NULL OR TRIM(NEW.sku) = '' THEN
    v_year := TO_CHAR(NOW(), 'YYYY');
    
    -- Get next sequence for this year and user
    SELECT COALESCE(MAX(
      CASE 
        WHEN sku ~ '^PRD-\d{4}-\d+$' THEN
          CAST(SUBSTRING(sku FROM 'PRD-\d{4}-(\d+)$') AS INT)
        ELSE 0
      END
    ), 0) + 1
    INTO v_sequence
    FROM products
    WHERE user_id = NEW.user_id
      AND sku LIKE 'PRD-' || v_year || '-%';
    
    -- Generate SKU: PRD-2025-001
    v_sku := 'PRD-' || v_year || '-' || LPAD(v_sequence::TEXT, 3, '0');
    NEW.sku := v_sku;
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCTION: Get current stock for a product
-- Menghitung stok dari product_stock_movements
-- =====================================================
CREATE OR REPLACE FUNCTION get_current_stock(p_product_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_stock INTEGER;
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN movement_type = 'in' THEN quantity
      WHEN movement_type = 'out' THEN -quantity
      WHEN movement_type = 'adjust' THEN quantity
      ELSE 0
    END
  ), 0)
  INTO v_stock
  FROM product_stock_movements
  WHERE product_id = p_product_id;
  
  RETURN v_stock;
END;
$$;

-- =====================================================
-- FUNCTION: Get products with low stock
-- Untuk alert/notifikasi
-- =====================================================
CREATE OR REPLACE FUNCTION get_low_stock_products(p_user_id UUID)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  sku TEXT,
  category TEXT,
  current_stock INTEGER,
  min_stock_alert INTEGER,
  stock_status TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.sku,
    p.category,
    get_current_stock(p.id) AS current_stock,
    p.min_stock_alert,
    CASE 
      WHEN get_current_stock(p.id) <= 0 THEN 'out_of_stock'
      WHEN get_current_stock(p.id) < p.min_stock_alert THEN 'low_stock'
      ELSE 'sufficient'
    END AS stock_status
  FROM products p
  WHERE p.user_id = p_user_id
    AND p.track_inventory = TRUE
    AND p.is_active = TRUE
    AND get_current_stock(p.id) < p.min_stock_alert
  ORDER BY get_current_stock(p.id) ASC;
END;
$$;

-- =====================================================
-- FUNCTION: Get product profit margin
-- (selling_price - cost_price) / selling_price * 100
-- =====================================================
CREATE OR REPLACE FUNCTION get_product_profit_margin(p_product_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  v_cost NUMERIC(15,2);
  v_selling NUMERIC(15,2);
  v_margin NUMERIC;
BEGIN
  SELECT cost_price, selling_price
  INTO v_cost, v_selling
  FROM products
  WHERE id = p_product_id;
  
  IF v_selling IS NULL OR v_selling = 0 THEN
    RETURN 0;
  END IF;
  
  v_margin := ((v_selling - v_cost) / v_selling) * 100;
  RETURN ROUND(v_margin, 2);
END;
$$;

-- =====================================================
-- FUNCTION: Get product summary for analytics
-- =====================================================
CREATE OR REPLACE FUNCTION get_product_summary(p_user_id UUID, p_product_id UUID DEFAULT NULL)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  sku TEXT,
  category TEXT,
  unit TEXT,
  cost_price NUMERIC,
  selling_price NUMERIC,
  profit_margin NUMERIC,
  current_stock INTEGER,
  stock_status TEXT,
  is_active BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.sku,
    p.category,
    p.unit,
    p.cost_price,
    p.selling_price,
    get_product_profit_margin(p.id) AS profit_margin,
    CASE 
      WHEN p.track_inventory THEN get_current_stock(p.id)
      ELSE NULL
    END AS current_stock,
    CASE 
      WHEN NOT p.track_inventory THEN 'not_tracked'
      WHEN get_current_stock(p.id) <= 0 THEN 'out_of_stock'
      WHEN get_current_stock(p.id) < p.min_stock_alert THEN 'low_stock'
      ELSE 'sufficient'
    END AS stock_status,
    p.is_active
  FROM products p
  WHERE p.user_id = p_user_id
    AND (p_product_id IS NULL OR p.id = p_product_id)
  ORDER BY p.name ASC;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at
DROP TRIGGER IF EXISTS products_updated_at_trigger ON products;
CREATE TRIGGER products_updated_at_trigger
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_updated_at();

-- Auto-generate SKU
DROP TRIGGER IF EXISTS products_sku_trigger ON products;
CREATE TRIGGER products_sku_trigger
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION generate_product_sku();

-- =====================================================
-- VIEWS
-- =====================================================

-- View: Active products with stock status (lightweight for dropdowns)
CREATE OR REPLACE VIEW active_products_list AS
SELECT 
  p.id,
  p.user_id,
  p.name,
  p.sku,
  p.category,
  p.unit,
  p.selling_price,
  p.track_inventory,
  CASE 
    WHEN p.track_inventory THEN get_current_stock(p.id)
    ELSE NULL
  END AS current_stock,
  p.is_active
FROM products p
WHERE p.is_active = TRUE
ORDER BY p.name ASC;

COMMENT ON VIEW active_products_list IS 'Lightweight product list for dropdowns and autocomplete';

-- View: Products with detailed metrics
CREATE OR REPLACE VIEW products_with_metrics AS
SELECT 
  p.id,
  p.user_id,
  p.name,
  p.sku,
  p.category,
  p.unit,
  p.cost_price,
  p.selling_price,
  get_product_profit_margin(p.id) AS profit_margin_percentage,
  p.track_inventory,
  CASE 
    WHEN p.track_inventory THEN get_current_stock(p.id)
    ELSE NULL
  END AS current_stock,
  p.min_stock_alert,
  CASE 
    WHEN NOT p.track_inventory THEN 'not_tracked'
    WHEN get_current_stock(p.id) <= 0 THEN 'out_of_stock'
    WHEN get_current_stock(p.id) < p.min_stock_alert THEN 'low_stock'
    ELSE 'sufficient'
  END AS stock_status,
  p.is_active,
  p.created_at,
  p.updated_at
FROM products p
ORDER BY p.name ASC;

COMMENT ON VIEW products_with_metrics IS 'Products with computed metrics: profit margin, current stock, stock status';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Inventory Domain - Products Logic Created';
  RAISE NOTICE '   - 5 Functions: timestamp, SKU generation, stock calculation, low stock alert, profit margin, summary';
  RAISE NOTICE '   - 2 Triggers: auto-update timestamp, auto-generate SKU';
  RAISE NOTICE '   - 2 Views: active_products_list, products_with_metrics';
END $$;
