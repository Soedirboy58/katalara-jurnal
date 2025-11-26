-- =====================================================
-- DOMAIN: FINANCE
-- TABLE: expenses & expense_items
-- PURPOSE: Tracking all business expenses
-- =====================================================

-- =====================================================
-- TABLE: expenses (Header)
-- Mencatat header transaksi pengeluaran
-- =====================================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Transaction Info
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  invoice_number TEXT, -- Optional: nomor faktur/kwitansi
  
  -- Categorization (3-tier: Type → Category → Description)
  expense_type TEXT NOT NULL CHECK (expense_type IN ('operating', 'investing', 'financing')),
  category TEXT NOT NULL, -- Ex: 'raw_materials', 'salary', 'rent', etc.
  description TEXT NOT NULL,
  
  -- Supplier Info
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT, -- Denormalized for quick access
  
  -- Payment Details
  payment_type TEXT NOT NULL CHECK (payment_type IN ('cash', 'tempo')),
  payment_method TEXT CHECK (payment_method IN ('Cash', 'Transfer', 'QRIS', 'Debit', 'Credit', 'Lainnya')),
  payment_status TEXT DEFAULT 'lunas' CHECK (payment_status IN ('lunas', 'belum_lunas', 'cicilan')),
  
  -- Payment Tracking (for 'tempo')
  due_date DATE,
  payment_term_days INT DEFAULT 0, -- Ex: 30 hari
  down_payment NUMERIC(15,2) DEFAULT 0,
  remaining_payment NUMERIC(15,2) DEFAULT 0,
  
  -- Amounts
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount_percent NUMERIC(5,2) DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  ppn_amount NUMERIC(15,2) DEFAULT 0, -- PPN 11%
  pph_amount NUMERIC(15,2) DEFAULT 0, -- PPh 2%/3%
  other_fees NUMERIC(15,2) DEFAULT 0, -- Biaya lain (ongkir, dll)
  grand_total NUMERIC(15,2) NOT NULL CHECK (grand_total >= 0),
  
  -- Asset Purchase (for expense_type = 'investing')
  is_asset_purchase BOOLEAN DEFAULT FALSE,
  asset_id UUID, -- Link to assets table if exists
  asset_name TEXT,
  asset_useful_life_years INT, -- Umur ekonomis aset (untuk depresiasi)
  
  -- Loan Payment (for expense_type = 'financing')
  is_loan_payment BOOLEAN DEFAULT FALSE,
  loan_id UUID REFERENCES loans(id) ON DELETE SET NULL,
  
  -- Investor Payment (for expense_type = 'financing')
  is_investor_payment BOOLEAN DEFAULT FALSE,
  investor_id UUID REFERENCES investors(id) ON DELETE SET NULL,
  
  -- Receipt/Proof
  receipt_url TEXT,
  receipt_filename TEXT,
  
  -- Additional Info
  notes TEXT,
  tags TEXT[], -- For flexible categorization
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_expenses_owner ON expenses(owner_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(expense_type);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_supplier ON expenses(supplier_id) WHERE supplier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_payment_status ON expenses(payment_status);
CREATE INDEX IF NOT EXISTS idx_expenses_due_date ON expenses(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_owner_date ON expenses(owner_id, expense_date DESC);

-- =====================================================
-- TABLE: expense_items (Line Items)
-- Detail items untuk setiap expense
-- =====================================================
CREATE TABLE IF NOT EXISTS expense_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Item Details
  product_id UUID, -- Link to products table if buying stock
  product_name TEXT NOT NULL,
  description TEXT,
  
  -- Quantity & Unit
  qty NUMERIC(12,2) NOT NULL CHECK (qty > 0),
  unit TEXT NOT NULL DEFAULT 'pcs', -- pcs, kg, liter, jam, etc.
  
  -- Pricing
  price_per_unit NUMERIC(15,2) NOT NULL CHECK (price_per_unit >= 0),
  subtotal NUMERIC(15,2) NOT NULL CHECK (subtotal >= 0),
  
  -- Inventory Tracking (if product_id exists)
  is_restock BOOLEAN DEFAULT FALSE, -- Apakah ini pembelian stok?
  quantity_added NUMERIC(12,2) DEFAULT 0, -- Stok yang ditambahkan
  stock_deducted BOOLEAN DEFAULT FALSE, -- Flag untuk inventory trigger
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expense_items_expense ON expense_items(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_items_owner ON expense_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_expense_items_product ON expense_items(product_id) WHERE product_id IS NOT NULL;

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================
COMMENT ON TABLE expenses IS 'Main expense transactions table - stores all business expenses with type classification';
COMMENT ON COLUMN expenses.expense_type IS 'Type: operating (daily ops), investing (assets), financing (debt/investor)';
COMMENT ON COLUMN expenses.payment_type IS 'Payment: cash (immediate), tempo (credit/installment)';
COMMENT ON COLUMN expenses.payment_status IS 'Status: lunas (paid), belum_lunas (unpaid), cicilan (installment)';
COMMENT ON COLUMN expenses.grand_total IS 'Final amount after discount, tax, and other fees';

COMMENT ON TABLE expense_items IS 'Line items for each expense transaction';
COMMENT ON COLUMN expense_items.is_restock IS 'TRUE if this expense is for restocking inventory (auto-update stock)';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Finance Domain - Expenses Schema Created';
  RAISE NOTICE '   - Table: expenses (header)';
  RAISE NOTICE '   - Table: expense_items (line items)';
  RAISE NOTICE '   - Indexes: 8 created for performance';
END $$;
