-- =====================================================
-- DOMAIN: FINANCE
-- TABLE: incomes
-- PURPOSE: Master income/revenue tracking dengan sub-classification
-- =====================================================

-- =====================================================
-- TABLE: incomes (Header)
-- Menyimpan data pendapatan/revenue dengan 3 kategori utama
-- =====================================================
CREATE TABLE IF NOT EXISTS incomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Income Classification (3-tier system)
  income_type TEXT NOT NULL, -- 'operating', 'investing', 'financing'
  income_category TEXT NOT NULL, -- Sub-category based on income_type
  income_description TEXT, -- Detail description
  
  -- Customer Reference
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT, -- Denormalized for quick access
  
  -- Transaction Details
  income_date DATE NOT NULL DEFAULT CURRENT_DATE,
  invoice_number TEXT, -- Invoice/receipt number
  reference_number TEXT, -- External reference (e.g., bank transfer ref)
  
  -- Financial Data
  subtotal NUMERIC(15,2) DEFAULT 0,
  discount_mode TEXT DEFAULT 'nominal', -- 'nominal' or 'percent'
  discount_value NUMERIC(15,2) DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0, -- Calculated discount in rupiah
  
  -- Tax & Fees
  ppn_enabled BOOLEAN DEFAULT FALSE,
  ppn_rate NUMERIC(5,2) DEFAULT 11.00,
  ppn_amount NUMERIC(15,2) DEFAULT 0,
  
  pph_enabled BOOLEAN DEFAULT FALSE,
  pph_type TEXT, -- 'pph21', 'pph22', 'pph23', etc
  pph_rate NUMERIC(5,2) DEFAULT 0,
  pph_amount NUMERIC(15,2) DEFAULT 0,
  
  other_fees NUMERIC(15,2) DEFAULT 0,
  
  grand_total NUMERIC(15,2) DEFAULT 0, -- Auto-calculated
  
  -- Payment Information
  payment_method TEXT DEFAULT 'cash', -- 'cash', 'transfer', 'tempo'
  payment_status TEXT DEFAULT 'unpaid', -- 'unpaid', 'partial', 'paid'
  paid_amount NUMERIC(15,2) DEFAULT 0,
  remaining_payment NUMERIC(15,2) DEFAULT 0, -- Piutang
  
  -- Payment Dates
  payment_date DATE, -- Tanggal pelunasan
  due_date DATE, -- Jatuh tempo (untuk tempo)
  
  -- Asset Tracking (untuk investing income)
  asset_id UUID, -- Reference to assets table (if exists)
  asset_name TEXT, -- Denormalized asset name
  
  -- Financing Tracking (untuk financing income)
  loan_id UUID, -- Reference to loans table
  investor_id UUID, -- Reference to investors table
  
  -- Notes & Metadata
  notes TEXT,
  tags TEXT[], -- Flexible tags for categorization
  
  -- Audit Trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: income_items (Line Items)
-- Detail produk/jasa yang dijual
-- =====================================================
CREATE TABLE IF NOT EXISTS income_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  income_id UUID NOT NULL REFERENCES incomes(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Product Reference
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  
  -- Quantity & Pricing
  qty NUMERIC(15,3) DEFAULT 1,
  unit TEXT DEFAULT 'pcs',
  price_per_unit NUMERIC(15,2) DEFAULT 0, -- Harga jual
  
  -- Profit Tracking
  buy_price NUMERIC(15,2) DEFAULT 0, -- Harga beli/modal
  profit_per_unit NUMERIC(15,2) DEFAULT 0, -- price_per_unit - buy_price
  
  -- Calculations
  subtotal NUMERIC(15,2) DEFAULT 0, -- qty * price_per_unit
  total_profit NUMERIC(15,2) DEFAULT 0, -- qty * profit_per_unit
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES (Basic - more in incomes.index.sql)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_incomes_owner_date ON incomes(owner_id, income_date DESC);
CREATE INDEX IF NOT EXISTS idx_incomes_customer ON incomes(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_incomes_payment_status ON incomes(owner_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_incomes_type ON incomes(owner_id, income_type);

CREATE INDEX IF NOT EXISTS idx_income_items_income ON income_items(income_id);
CREATE INDEX IF NOT EXISTS idx_income_items_product ON income_items(product_id) WHERE product_id IS NOT NULL;

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================
COMMENT ON TABLE incomes IS 'Master income/revenue tracking with operating/investing/financing classification';
COMMENT ON TABLE income_items IS 'Line items for income transactions - products/services sold';

COMMENT ON COLUMN incomes.income_type IS 'Main classification: operating (sales), investing (asset sales), financing (loans/investments)';
COMMENT ON COLUMN incomes.income_category IS 'Sub-category: 
  Operating: product_sales, service_income, retail_sales, wholesale_sales, etc
  Investing: asset_sale, dividend_income, interest_income, etc
  Financing: loan_receipt, investor_funding, capital_injection, etc';

COMMENT ON COLUMN incomes.discount_mode IS 'nominal = fixed amount, percent = percentage of subtotal';
COMMENT ON COLUMN incomes.payment_method IS 'cash = paid immediately, transfer = bank transfer, tempo = credit (piutang)';
COMMENT ON COLUMN incomes.payment_status IS 'unpaid = no payment yet, partial = partially paid, paid = fully paid';
COMMENT ON COLUMN incomes.remaining_payment IS 'Piutang (accounts receivable) - updated automatically';

COMMENT ON COLUMN income_items.buy_price IS 'Cost of goods sold (COGS) - for profit calculation';
COMMENT ON COLUMN income_items.profit_per_unit IS 'Gross profit per unit = price_per_unit - buy_price';
COMMENT ON COLUMN income_items.total_profit IS 'Total gross profit = qty * profit_per_unit';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Finance Domain - Incomes Schema Created';
  RAISE NOTICE '   - Table: incomes (header with 3-tier classification)';
  RAISE NOTICE '   - Table: income_items (line items with profit tracking)';
  RAISE NOTICE '   - Income types: operating, investing, financing';
  RAISE NOTICE '   - Payment tracking: cash, transfer, tempo (piutang)';
END $$;
