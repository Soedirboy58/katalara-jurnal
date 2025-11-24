-- =====================================================
-- EXPENSE INPUT REDESIGN - DATABASE SCHEMA
-- =====================================================
-- Phase 1: Add necessary tables and columns
-- Date: 2025-11-23
-- =====================================================

-- =====================================================
-- 1. CREATE SUPPLIERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  supplier_type VARCHAR(50), -- 'raw_materials', 'finished_goods', 'both', 'services'
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  notes TEXT,
  
  -- Financial tracking
  total_purchases NUMERIC(15,2) DEFAULT 0,
  total_payables NUMERIC(15,2) DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_suppliers_owner ON suppliers(owner_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_type ON suppliers(supplier_type);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);

-- RLS Policies
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own suppliers" ON suppliers
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own suppliers" ON suppliers
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own suppliers" ON suppliers
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own suppliers" ON suppliers
  FOR DELETE USING (auth.uid() = owner_id);

-- =====================================================
-- 2. CREATE EXPENSE_ITEMS TABLE (Multi-Items Support)
-- =====================================================
CREATE TABLE IF NOT EXISTS expense_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  
  -- Product reference (optional - if linked to inventory)
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  -- Snapshot data (always stored for historical accuracy)
  product_name VARCHAR(255) NOT NULL,
  quantity NUMERIC(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  price_per_unit NUMERIC(15,2) NOT NULL,
  subtotal NUMERIC(15,2) NOT NULL,
  
  -- Additional info
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expense_items_expense ON expense_items(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_items_product ON expense_items(product_id);

-- RLS Policies (inherit from expenses table)
ALTER TABLE expense_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expense items" ON expense_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM expenses 
      WHERE expenses.id = expense_items.expense_id 
      AND expenses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own expense items" ON expense_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM expenses 
      WHERE expenses.id = expense_items.expense_id 
      AND expenses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own expense items" ON expense_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM expenses 
      WHERE expenses.id = expense_items.expense_id 
      AND expenses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own expense items" ON expense_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM expenses 
      WHERE expenses.id = expense_items.expense_id 
      AND expenses.user_id = auth.uid()
    )
  );

-- =====================================================
-- 3. UPDATE EXPENSES TABLE (Add New Columns)
-- =====================================================

-- Purchase Order Number
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS purchase_order_number VARCHAR(50) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_expenses_po_number ON expenses(purchase_order_number);

-- Supplier Reference
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_expenses_supplier ON expenses(supplier_id);

-- Financial Breakdown (for multi-items)
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS subtotal NUMERIC(15,2) DEFAULT 0;

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) DEFAULT 0;

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(15,2) DEFAULT 0;

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS other_fees NUMERIC(15,2) DEFAULT 0; -- Ongkir, handling fee, etc

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS grand_total NUMERIC(15,2) DEFAULT 0; -- Final total after all calculations

-- Payment Tracking (for tempo/credit)
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS down_payment NUMERIC(15,2) DEFAULT 0;

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS remaining NUMERIC(15,2) DEFAULT 0;

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS supplier_phone VARCHAR(20); -- For WhatsApp reminder

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'cash'; -- 'cash', 'tempo', 'tempo_7', 'tempo_14', etc

-- Metadata
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS is_multi_items BOOLEAN DEFAULT FALSE;

-- =====================================================
-- 4. CREATE FUNCTION: Auto-Update Inventory
-- =====================================================
CREATE OR REPLACE FUNCTION auto_update_inventory_from_expense()
RETURNS TRIGGER AS $$
BEGIN
  -- Only for operating expenses with product purchases
  IF NEW.expense_type = 'operating' AND NEW.category IN ('raw_materials', 'finished_goods', 'Pembelian Barang', 'Pembelian Material') THEN
    
    -- Update inventory from expense_items
    UPDATE products p
    SET 
      stock_quantity = p.stock_quantity + ei.quantity,
      price = ei.price_per_unit, -- Update buy price (cost)
      updated_at = NOW()
    FROM expense_items ei
    WHERE 
      ei.expense_id = NEW.id 
      AND ei.product_id = p.id
      AND ei.product_id IS NOT NULL;
      
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger after expense insert/update
DROP TRIGGER IF EXISTS trigger_auto_update_inventory ON expenses;
CREATE TRIGGER trigger_auto_update_inventory
  AFTER INSERT OR UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_inventory_from_expense();

-- =====================================================
-- 5. CREATE FUNCTION: Calculate Weighted Average Cost
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_weighted_avg_cost(
  p_product_id UUID,
  p_new_qty NUMERIC,
  p_new_cost NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
  v_current_qty NUMERIC;
  v_current_cost NUMERIC;
  v_total_value NUMERIC;
  v_new_value NUMERIC;
  v_total_qty NUMERIC;
  v_avg_cost NUMERIC;
BEGIN
  -- Get current stock and cost
  SELECT stock_quantity, price 
  INTO v_current_qty, v_current_cost
  FROM products
  WHERE id = p_product_id;
  
  -- If no existing stock, use new cost
  IF v_current_qty IS NULL OR v_current_qty = 0 THEN
    RETURN p_new_cost;
  END IF;
  
  -- Calculate weighted average
  v_total_value := (v_current_qty * v_current_cost) + (p_new_qty * p_new_cost);
  v_total_qty := v_current_qty + p_new_qty;
  v_avg_cost := v_total_value / v_total_qty;
  
  RETURN v_avg_cost;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. CREATE FUNCTION: Generate Purchase Order Number
-- =====================================================
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_counter TEXT;
  v_po_number TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- Get next counter for this year
  SELECT LPAD(
    (COUNT(*) + 1)::TEXT, 
    6, 
    '0'
  ) INTO v_counter
  FROM expenses
  WHERE EXTRACT(YEAR FROM expense_date) = EXTRACT(YEAR FROM NOW());
  
  v_po_number := 'PO/' || v_year || '/' || v_counter;
  
  RETURN v_po_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. CREATE VIEW: Expense with Items Summary
-- =====================================================
CREATE OR REPLACE VIEW expense_with_items AS
SELECT 
  e.*,
  s.name as supplier_name_full,
  s.phone as supplier_phone_full,
  s.supplier_type,
  COUNT(DISTINCT ei.id) as items_count,
  JSON_AGG(
    JSON_BUILD_OBJECT(
      'id', ei.id,
      'product_id', ei.product_id,
      'product_name', ei.product_name,
      'quantity', ei.quantity,
      'unit', ei.unit,
      'price_per_unit', ei.price_per_unit,
      'subtotal', ei.subtotal,
      'notes', ei.notes
    ) ORDER BY ei.created_at
  ) FILTER (WHERE ei.id IS NOT NULL) as line_items
FROM expenses e
LEFT JOIN suppliers s ON e.supplier_id = s.id
LEFT JOIN expense_items ei ON e.id = ei.expense_id
GROUP BY e.id, s.name, s.phone, s.supplier_type;

-- =====================================================
-- 8. UPDATE EXISTING DATA (Migration)
-- =====================================================

-- Backfill payment_type for existing expenses
UPDATE expenses 
SET payment_type = CASE 
  WHEN payment_status = 'Lunas' THEN 'cash'
  WHEN payment_status = 'Pending' AND due_date IS NOT NULL THEN 'tempo'
  ELSE 'cash'
END
WHERE payment_type IS NULL;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check tables created
DO $$
BEGIN
  RAISE NOTICE '✅ Checking tables...';
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'suppliers') THEN
    RAISE NOTICE '  ✓ suppliers table created';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'expense_items') THEN
    RAISE NOTICE '  ✓ expense_items table created';
  END IF;
  
  RAISE NOTICE '✅ Checking expenses table columns...';
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'purchase_order_number'
  ) THEN
    RAISE NOTICE '  ✓ purchase_order_number column added';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'supplier_id'
  ) THEN
    RAISE NOTICE '  ✓ supplier_id column added';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'subtotal'
  ) THEN
    RAISE NOTICE '  ✓ subtotal column added';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'grand_total'
  ) THEN
    RAISE NOTICE '  ✓ grand_total column added';
  END IF;
  
  RAISE NOTICE '✅ Schema migration completed!';
END $$;

-- Test PO number generation
SELECT generate_po_number() as sample_po_number;

-- Show summary
SELECT 
  'Suppliers' as table_name,
  COUNT(*) as row_count
FROM suppliers
UNION ALL
SELECT 
  'Expense Items',
  COUNT(*)
FROM expense_items
UNION ALL
SELECT 
  'Expenses (with PO)',
  COUNT(*)
FROM expenses
WHERE purchase_order_number IS NOT NULL;
