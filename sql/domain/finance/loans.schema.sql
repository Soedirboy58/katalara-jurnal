-- =====================================================
-- DOMAIN: FINANCE
-- TABLE: loans
-- PURPOSE: Hutang/pinjaman tracking dengan cicilan
-- =====================================================

-- =====================================================
-- TABLE: loans (Header)
-- Menyimpan data pinjaman/hutang
-- =====================================================
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Loan Information
  loan_number TEXT, -- Nomor pinjaman (optional)
  lender_name TEXT NOT NULL, -- Nama pemberi pinjaman (bank, koperasi, individu)
  lender_type TEXT, -- 'bank', 'cooperative', 'individual', 'fintech'
  
  -- Loan Classification
  loan_category TEXT, -- 'working_capital', 'investment', 'emergency', 'expansion'
  purpose TEXT, -- Tujuan pinjaman (detail)
  
  -- Financial Details
  original_amount NUMERIC(15,2) NOT NULL, -- Jumlah pinjaman awal
  principal_paid NUMERIC(15,2) DEFAULT 0, -- Pokok yang sudah dibayar
  interest_paid NUMERIC(15,2) DEFAULT 0, -- Bunga yang sudah dibayar
  remaining_principal NUMERIC(15,2), -- Sisa pokok (auto-calculated)
  
  -- Interest Configuration
  interest_rate NUMERIC(5,2) DEFAULT 0, -- Bunga per tahun (%)
  interest_type TEXT DEFAULT 'flat', -- 'flat', 'effective', 'fixed'
  
  -- Repayment Schedule
  installment_amount NUMERIC(15,2) DEFAULT 0, -- Cicilan per periode
  installment_frequency TEXT DEFAULT 'monthly', -- 'daily', 'weekly', 'monthly', 'yearly'
  total_installments INT DEFAULT 1, -- Total jumlah cicilan
  installments_paid INT DEFAULT 0, -- Jumlah cicilan yang sudah dibayar
  
  -- Dates
  loan_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Tanggal terima pinjaman
  first_installment_date DATE, -- Tanggal cicilan pertama
  maturity_date DATE, -- Tanggal jatuh tempo pelunasan
  last_payment_date DATE, -- Tanggal pembayaran terakhir
  
  -- Status & Tracking
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'overdue', 'defaulted'
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Linked Transactions
  income_id UUID REFERENCES incomes(id) ON DELETE SET NULL, -- Link ke income (loan receipt)
  
  -- Collateral (Optional)
  collateral_type TEXT, -- 'property', 'vehicle', 'inventory', 'none'
  collateral_description TEXT,
  collateral_value NUMERIC(15,2),
  
  -- Notes & Attachments
  notes TEXT,
  tags TEXT[], -- Flexible tags
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: loan_installments (Payment History)
-- Menyimpan history pembayaran cicilan
-- =====================================================
CREATE TABLE IF NOT EXISTS loan_installments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Installment Details
  installment_number INT NOT NULL, -- Cicilan ke-
  due_date DATE NOT NULL, -- Tanggal jatuh tempo
  
  -- Amounts
  principal_amount NUMERIC(15,2) DEFAULT 0, -- Pokok cicilan
  interest_amount NUMERIC(15,2) DEFAULT 0, -- Bunga cicilan
  total_amount NUMERIC(15,2) DEFAULT 0, -- Total cicilan (pokok + bunga)
  
  -- Payment Info
  payment_date DATE, -- Tanggal dibayar (NULL jika belum bayar)
  amount_paid NUMERIC(15,2) DEFAULT 0, -- Jumlah yang dibayar
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'overdue', 'partial'
  
  -- Late Payment
  days_late INT DEFAULT 0, -- Hari terlambat
  late_fee NUMERIC(15,2) DEFAULT 0, -- Denda keterlambatan
  
  -- Linked Transaction
  expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL, -- Link ke expense (payment)
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES (Basic - more in loans.index.sql)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_loans_owner ON loans(owner_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_loans_maturity ON loans(owner_id, maturity_date) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_loan_installments_loan ON loan_installments(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_installments_due_date ON loan_installments(owner_id, due_date) WHERE status != 'paid';

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================
COMMENT ON TABLE loans IS 'Loan/debt tracking with repayment schedule and interest calculation';
COMMENT ON TABLE loan_installments IS 'Installment payment history for loans';

COMMENT ON COLUMN loans.lender_type IS 'bank, cooperative, individual, fintech, etc';
COMMENT ON COLUMN loans.loan_category IS 'working_capital, investment, emergency, expansion';
COMMENT ON COLUMN loans.interest_type IS 'flat = fixed per period, effective = compound, fixed = fixed total';
COMMENT ON COLUMN loans.installment_frequency IS 'daily, weekly, monthly, yearly';
COMMENT ON COLUMN loans.status IS 'active = ongoing, completed = fully paid, overdue = has overdue installments, defaulted = failed to pay';

COMMENT ON COLUMN loan_installments.principal_amount IS 'Portion of installment that goes to principal';
COMMENT ON COLUMN loan_installments.interest_amount IS 'Portion of installment that goes to interest';
COMMENT ON COLUMN loan_installments.status IS 'pending = not yet due/paid, paid = fully paid, overdue = past due date, partial = partially paid';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Finance Domain - Loans Schema Created';
  RAISE NOTICE '   - Table: loans (header with interest & repayment config)';
  RAISE NOTICE '   - Table: loan_installments (payment history)';
  RAISE NOTICE '   - Features: Interest calculation, repayment schedule, overdue tracking';
  RAISE NOTICE '   - Links to: incomes (loan receipt), expenses (payment)';
END $$;
