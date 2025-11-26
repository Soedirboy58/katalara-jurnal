-- =====================================================
-- DOMAIN: FINANCE
-- TABLE: investments
-- PURPOSE: Modal investor & profit sharing tracking
-- =====================================================

-- =====================================================
-- TABLE: investments (Header)
-- Menyimpan data investasi/modal dari investor
-- =====================================================
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Investor Information
  investor_name TEXT NOT NULL, -- Nama investor
  investor_type TEXT, -- 'individual', 'company', 'vc', 'angel'
  investor_contact TEXT, -- Email/phone investor
  
  -- Investment Details
  investment_number TEXT, -- Nomor kontrak investasi (optional)
  investment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  investment_category TEXT, -- 'seed', 'series_a', 'growth', 'working_capital'
  
  -- Financial Terms
  principal_amount NUMERIC(15,2) NOT NULL, -- Modal yang diterima
  equity_percentage NUMERIC(5,2) DEFAULT 0, -- % kepemilikan saham (jika equity)
  
  -- Profit Sharing Configuration
  profit_share_type TEXT DEFAULT 'percentage', -- 'percentage', 'fixed', 'revenue_based'
  profit_share_percentage NUMERIC(5,2) DEFAULT 0, -- % bagi hasil (jika percentage)
  profit_share_fixed_amount NUMERIC(15,2) DEFAULT 0, -- Fixed bagi hasil per periode
  profit_share_frequency TEXT DEFAULT 'monthly', -- 'monthly', 'quarterly', 'yearly'
  
  -- Tracking
  total_profit_shared NUMERIC(15,2) DEFAULT 0, -- Total bagi hasil yang sudah dibayar
  last_profit_share_date DATE, -- Tanggal bagi hasil terakhir
  
  -- Investment Period
  start_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Mulai investasi
  maturity_date DATE, -- Jatuh tempo (optional - jika ada)
  lock_period_months INT DEFAULT 0, -- Lock period (bulan)
  
  -- Exit Strategy
  buyback_clause BOOLEAN DEFAULT FALSE, -- Ada klausul buyback?
  buyback_multiplier NUMERIC(5,2) DEFAULT 1.0, -- Multiplier untuk buyback (e.g., 2x)
  buyback_date DATE, -- Target buyback date
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'bought_back', 'expired'
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Linked Transactions
  income_id UUID REFERENCES incomes(id) ON DELETE SET NULL, -- Link ke income (investment receipt)
  loan_id UUID REFERENCES loans(id) ON DELETE SET NULL, -- Optional: jika ada konversi loan to equity
  
  -- Contract & Documents
  contract_url TEXT, -- Link ke dokumen kontrak
  notes TEXT,
  tags TEXT[], -- Flexible tags
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: profit_sharing_history (Payment History)
-- Menyimpan history pembagian profit ke investor
-- =====================================================
CREATE TABLE IF NOT EXISTS profit_sharing_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Period Information
  period_start_date DATE NOT NULL, -- Awal periode profit
  period_end_date DATE NOT NULL, -- Akhir periode profit
  
  -- Financial Data
  business_revenue NUMERIC(15,2) DEFAULT 0, -- Revenue bisnis di periode ini
  business_profit NUMERIC(15,2) DEFAULT 0, -- Profit bisnis di periode ini
  
  -- Profit Share Calculation
  share_percentage NUMERIC(5,2) DEFAULT 0, -- % yang digunakan untuk hitung
  calculated_amount NUMERIC(15,2) DEFAULT 0, -- Jumlah yang dihitung
  adjustment_amount NUMERIC(15,2) DEFAULT 0, -- Adjustment (+ atau -)
  final_amount NUMERIC(15,2) DEFAULT 0, -- Total yang dibayar
  
  -- Payment Information
  payment_date DATE, -- Tanggal dibayar
  payment_method TEXT, -- 'transfer', 'cash', 'reinvest'
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
  
  -- Linked Transaction
  expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL, -- Link ke expense (profit distribution)
  
  -- Notes
  notes TEXT,
  calculation_notes TEXT, -- Catatan cara kalkulasi
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES (Basic - more in investments.index.sql)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_investments_owner ON investments(owner_id);
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_investments_active ON investments(owner_id, is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_profit_sharing_investment ON profit_sharing_history(investment_id);
CREATE INDEX IF NOT EXISTS idx_profit_sharing_period ON profit_sharing_history(owner_id, period_start_date, period_end_date);

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================
COMMENT ON TABLE investments IS 'Investor capital tracking with profit sharing configuration';
COMMENT ON TABLE profit_sharing_history IS 'Profit distribution history to investors';

COMMENT ON COLUMN investments.investor_type IS 'individual, company, vc (venture capital), angel investor';
COMMENT ON COLUMN investments.investment_category IS 'seed, series_a, series_b, growth, working_capital';
COMMENT ON COLUMN investments.profit_share_type IS 'percentage = % of profit, fixed = fixed amount per period, revenue_based = % of revenue';
COMMENT ON COLUMN investments.profit_share_frequency IS 'monthly, quarterly, yearly';
COMMENT ON COLUMN investments.status IS 'active = ongoing, completed = term ended, bought_back = owner repurchased, expired = term expired';
COMMENT ON COLUMN investments.buyback_multiplier IS 'Multiplier for buyback amount (e.g., 2.0 = 2x original investment)';

COMMENT ON COLUMN profit_sharing_history.business_revenue IS 'Total revenue for the profit period';
COMMENT ON COLUMN profit_sharing_history.business_profit IS 'Net profit for the profit period (revenue - expenses)';
COMMENT ON COLUMN profit_sharing_history.adjustment_amount IS 'Manual adjustment to calculated amount (can be + or -)';
COMMENT ON COLUMN profit_sharing_history.final_amount IS 'Final amount paid = calculated_amount + adjustment_amount';
COMMENT ON COLUMN profit_sharing_history.payment_method IS 'transfer, cash, reinvest (add to principal)';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Finance Domain - Investments Schema Created';
  RAISE NOTICE '   - Table: investments (investor capital with profit sharing config)';
  RAISE NOTICE '   - Table: profit_sharing_history (profit distribution records)';
  RAISE NOTICE '   - Features: Equity tracking, profit sharing, buyback clause';
  RAISE NOTICE '   - Links to: incomes (investment receipt), expenses (profit distribution), loans (conversion)';
END $$;
