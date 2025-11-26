-- =====================================================
-- DOMAIN: INVENTORY
-- FILE: product_stock_movements.logic.sql
-- PURPOSE: Business logic untuk stock movement tracking
-- =====================================================

-- =====================================================
-- FUNCTION: Record stock movement
-- Helper untuk mencatat pergerakan stok
-- =====================================================
CREATE OR REPLACE FUNCTION record_stock_movement(
  p_product_id UUID,
  p_quantity INTEGER,
  p_movement_type TEXT,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_movement_id UUID;
BEGIN
  -- Validate movement type
  IF p_movement_type NOT IN ('in', 'out', 'adjust') THEN
    RAISE EXCEPTION 'Invalid movement_type: %. Must be in, out, or adjust', p_movement_type;
  END IF;
  
  -- Validate quantity is positive
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be positive. Got: %', p_quantity;
  END IF;
  
  -- Insert movement record
  INSERT INTO product_stock_movements (
    product_id,
    quantity,
    movement_type,
    reference_type,
    reference_id,
    note,
    created_by
  ) VALUES (
    p_product_id,
    p_quantity,
    p_movement_type,
    p_reference_type,
    p_reference_id,
    p_note,
    auth.uid()
  )
  RETURNING id INTO v_movement_id;
  
  RETURN v_movement_id;
END;
$$;

-- =====================================================
-- FUNCTION: Get stock movements for a product
-- Dengan pagination support
-- =====================================================
CREATE OR REPLACE FUNCTION get_product_stock_history(
  p_product_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  movement_id UUID,
  quantity INTEGER,
  movement_type TEXT,
  reference_type TEXT,
  reference_id UUID,
  note TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  running_stock INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    psm.id AS movement_id,
    psm.quantity,
    psm.movement_type,
    psm.reference_type,
    psm.reference_id,
    psm.note,
    psm.created_by,
    psm.created_at,
    SUM(
      CASE 
        WHEN psm2.movement_type = 'in' THEN psm2.quantity
        WHEN psm2.movement_type = 'out' THEN -psm2.quantity
        WHEN psm2.movement_type = 'adjust' THEN psm2.quantity
        ELSE 0
      END
    )::INTEGER AS running_stock
  FROM product_stock_movements psm
  CROSS JOIN product_stock_movements psm2
  WHERE psm.product_id = p_product_id
    AND psm2.product_id = p_product_id
    AND psm2.created_at <= psm.created_at
  GROUP BY psm.id, psm.quantity, psm.movement_type, psm.reference_type, psm.reference_id, psm.note, psm.created_by, psm.created_at
  ORDER BY psm.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- =====================================================
-- FUNCTION: Get stock summary by product
-- Untuk dashboard/reporting
-- =====================================================
CREATE OR REPLACE FUNCTION get_stock_summary_by_product(p_user_id UUID)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  sku TEXT,
  total_in INTEGER,
  total_out INTEGER,
  total_adjust INTEGER,
  current_stock INTEGER,
  last_movement_date TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.sku,
    COALESCE(SUM(CASE WHEN psm.movement_type = 'in' THEN psm.quantity ELSE 0 END), 0)::INTEGER AS total_in,
    COALESCE(SUM(CASE WHEN psm.movement_type = 'out' THEN psm.quantity ELSE 0 END), 0)::INTEGER AS total_out,
    COALESCE(SUM(CASE WHEN psm.movement_type = 'adjust' THEN psm.quantity ELSE 0 END), 0)::INTEGER AS total_adjust,
    get_current_stock(p.id) AS current_stock,
    MAX(psm.created_at) AS last_movement_date
  FROM products p
  LEFT JOIN product_stock_movements psm ON psm.product_id = p.id
  WHERE p.user_id = p_user_id
    AND p.track_inventory = TRUE
  GROUP BY p.id, p.name, p.sku
  ORDER BY p.name ASC;
END;
$$;

-- =====================================================
-- FUNCTION: Validate stock before OUT movement
-- Mencegah stok negatif
-- =====================================================
CREATE OR REPLACE FUNCTION validate_stock_before_out()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_stock INTEGER;
  v_product_name TEXT;
  v_track_inventory BOOLEAN;
BEGIN
  -- Only validate for OUT movements
  IF NEW.movement_type = 'out' THEN
    -- Check if product tracks inventory
    SELECT track_inventory, name
    INTO v_track_inventory, v_product_name
    FROM products
    WHERE id = NEW.product_id;
    
    -- Only validate if tracking is enabled
    IF v_track_inventory THEN
      -- Get current stock
      v_current_stock := get_current_stock(NEW.product_id);
      
      -- Check if sufficient stock
      IF v_current_stock < NEW.quantity THEN
        RAISE EXCEPTION 'Insufficient stock for product "%". Current: %, Requested: %',
          v_product_name,
          v_current_stock,
          NEW.quantity;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Validate stock before OUT movement
DROP TRIGGER IF EXISTS stock_movements_validate_out_trigger ON product_stock_movements;
CREATE TRIGGER stock_movements_validate_out_trigger
  BEFORE INSERT ON product_stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION validate_stock_before_out();

-- =====================================================
-- VIEWS
-- =====================================================

-- View: Recent stock movements (last 100)
CREATE OR REPLACE VIEW recent_stock_movements AS
SELECT 
  psm.id,
  psm.product_id,
  p.name AS product_name,
  p.sku,
  psm.quantity,
  psm.movement_type,
  psm.reference_type,
  psm.reference_id,
  psm.note,
  psm.created_by,
  psm.created_at
FROM product_stock_movements psm
JOIN products p ON p.id = psm.product_id
ORDER BY psm.created_at DESC
LIMIT 100;

COMMENT ON VIEW recent_stock_movements IS 'Last 100 stock movements across all products';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Inventory Domain - Product Stock Movements Logic Created';
  RAISE NOTICE '   - 4 Functions: record movement, get history, stock summary, validate stock';
  RAISE NOTICE '   - 1 Trigger: prevent negative stock (for OUT movements)';
  RAISE NOTICE '   - 1 View: recent_stock_movements';
END $$;
