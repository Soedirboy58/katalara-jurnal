-- ============================================
-- FINANCING & INVESTMENT TRACKING SCHEMA
-- Phase 1: Database Tables
-- ============================================

-- 1. LOANS TABLE (Pinjaman)
-- Tracks loan details and installment schedules
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  income_transaction_id UUID REFERENCES incomes(id) ON DELETE SET NULL,
  
  -- Loan Details
  loan_amount DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL, -- Annual interest rate (%)
  loan_term_months INTEGER NOT NULL,
  installment_amount DECIMAL(15,2) NOT NULL,
  installment_frequency TEXT NOT NULL DEFAULT 'monthly', -- monthly, quarterly
  
  -- Dates
  loan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  first_payment_date DATE NOT NULL,
  
  -- Lender Info
  lender_name TEXT NOT NULL,
  lender_contact TEXT,
  
  -- Purpose & Notes
  purpose TEXT,
  notes TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active', -- active, paid_off, defaulted
  
  -- Tracking
  total_paid DECIMAL(15,2) DEFAULT 0,
  remaining_balance DECIMAL(15,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. LOAN INSTALLMENTS TABLE (Jadwal Cicilan)
-- Individual installment records with payment tracking
CREATE TABLE IF NOT EXISTS loan_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES loans(id) ON DELETE CASCADE NOT NULL,
  
  -- Installment Details
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  
  -- Amount Breakdown
  principal_amount DECIMAL(15,2) NOT NULL,
  interest_amount DECIMAL(15,2) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  
  -- Payment Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, overdue
  paid_date DATE,
  paid_amount DECIMAL(15,2),
  
  -- Link to expense when paid
  expense_transaction_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  
  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INVESTOR FUNDING TABLE (Dana Investor)
-- Tracks investor partnerships and profit sharing agreements
CREATE TABLE IF NOT EXISTS investor_funding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  income_transaction_id UUID REFERENCES incomes(id) ON DELETE SET NULL,
  
  -- Investment Details
  investment_amount DECIMAL(15,2) NOT NULL,
  profit_share_percentage DECIMAL(5,2) NOT NULL, -- % of net profit
  
  -- Schedule
  payment_frequency TEXT NOT NULL DEFAULT 'monthly', -- monthly, quarterly, annually
  start_date DATE NOT NULL,
  end_date DATE,
  duration_months INTEGER,
  
  -- Investor Info
  investor_name TEXT NOT NULL,
  investor_contact TEXT,
  investor_bank_account TEXT,
  
  -- Agreement Details
  agreement_number TEXT,
  notes TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, terminated
  
  -- Tracking
  total_profit_shared DECIMAL(15,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PROFIT SHARING PAYMENTS TABLE (Pembayaran Bagi Hasil)
-- Records of periodic profit sharing payments to investors
CREATE TABLE IF NOT EXISTS profit_sharing_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funding_id UUID REFERENCES investor_funding(id) ON DELETE CASCADE NOT NULL,
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Business Performance
  business_revenue DECIMAL(15,2) NOT NULL,
  business_expenses DECIMAL(15,2) NOT NULL,
  net_profit DECIMAL(15,2) NOT NULL,
  
  -- Investor Share
  share_percentage DECIMAL(5,2) NOT NULL,
  share_amount DECIMAL(15,2) NOT NULL,
  
  -- Payment Details
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, overdue
  paid_date DATE,
  
  -- Link to expense when paid
  expense_transaction_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. INVESTMENTS TABLE (Aset Investasi)
-- Tracks business investments (deposits, stocks, bonds, etc.)
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Investment Type
  investment_type TEXT NOT NULL, -- deposit, stocks, bonds, mutual_funds, property
  investment_name TEXT NOT NULL,
  
  -- Amounts
  principal_amount DECIMAL(15,2) NOT NULL,
  current_value DECIMAL(15,2) NOT NULL,
  
  -- Terms (for fixed-term investments like deposits)
  interest_rate DECIMAL(5,2),
  investment_term_months INTEGER,
  
  -- Dates
  start_date DATE NOT NULL,
  maturity_date DATE,
  
  -- Institution Details
  bank_name TEXT,
  account_number TEXT,
  
  -- Options
  auto_rollover BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active', -- active, matured, liquidated
  
  -- Link to expense (initial deposit/purchase)
  expense_transaction_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  
  -- Tracking
  total_returns DECIMAL(15,2) DEFAULT 0,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. INVESTMENT RETURNS TABLE (Return Investasi)
-- Records of returns/interest/dividends received from investments
CREATE TABLE IF NOT EXISTS investment_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id UUID REFERENCES investments(id) ON DELETE CASCADE NOT NULL,
  
  -- Return Details
  return_date DATE NOT NULL,
  return_amount DECIMAL(15,2) NOT NULL,
  return_type TEXT NOT NULL, -- interest, dividend, capital_gain, liquidation
  
  -- Link to income transaction
  income_transaction_id UUID REFERENCES incomes(id) ON DELETE SET NULL,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Loans
CREATE INDEX idx_loans_user_id ON loans(user_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_loan_date ON loans(loan_date);

-- Loan Installments
CREATE INDEX idx_loan_installments_loan_id ON loan_installments(loan_id);
CREATE INDEX idx_loan_installments_due_date ON loan_installments(due_date);
CREATE INDEX idx_loan_installments_status ON loan_installments(status);

-- Investor Funding
CREATE INDEX idx_investor_funding_user_id ON investor_funding(user_id);
CREATE INDEX idx_investor_funding_status ON investor_funding(status);

-- Profit Sharing Payments
CREATE INDEX idx_profit_sharing_funding_id ON profit_sharing_payments(funding_id);
CREATE INDEX idx_profit_sharing_due_date ON profit_sharing_payments(due_date);
CREATE INDEX idx_profit_sharing_status ON profit_sharing_payments(status);

-- Investments
CREATE INDEX idx_investments_user_id ON investments(user_id);
CREATE INDEX idx_investments_type ON investments(investment_type);
CREATE INDEX idx_investments_status ON investments(status);

-- Investment Returns
CREATE INDEX idx_investment_returns_investment_id ON investment_returns(investment_id);
CREATE INDEX idx_investment_returns_return_date ON investment_returns(return_date);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_funding ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_sharing_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_returns ENABLE ROW LEVEL SECURITY;

-- Loans Policies
CREATE POLICY "Users can view their own loans"
  ON loans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own loans"
  ON loans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loans"
  ON loans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own loans"
  ON loans FOR DELETE
  USING (auth.uid() = user_id);

-- Loan Installments Policies
CREATE POLICY "Users can view their loan installments"
  ON loan_installments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM loans WHERE loans.id = loan_installments.loan_id AND loans.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their loan installments"
  ON loan_installments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM loans WHERE loans.id = loan_installments.loan_id AND loans.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their loan installments"
  ON loan_installments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM loans WHERE loans.id = loan_installments.loan_id AND loans.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their loan installments"
  ON loan_installments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM loans WHERE loans.id = loan_installments.loan_id AND loans.user_id = auth.uid()
  ));

-- Investor Funding Policies
CREATE POLICY "Users can view their investor funding"
  ON investor_funding FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their investor funding"
  ON investor_funding FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their investor funding"
  ON investor_funding FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their investor funding"
  ON investor_funding FOR DELETE
  USING (auth.uid() = user_id);

-- Profit Sharing Policies
CREATE POLICY "Users can view their profit sharing"
  ON profit_sharing_payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM investor_funding WHERE investor_funding.id = profit_sharing_payments.funding_id AND investor_funding.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their profit sharing"
  ON profit_sharing_payments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM investor_funding WHERE investor_funding.id = profit_sharing_payments.funding_id AND investor_funding.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their profit sharing"
  ON profit_sharing_payments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM investor_funding WHERE investor_funding.id = profit_sharing_payments.funding_id AND investor_funding.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their profit sharing"
  ON profit_sharing_payments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM investor_funding WHERE investor_funding.id = profit_sharing_payments.funding_id AND investor_funding.user_id = auth.uid()
  ));

-- Investments Policies
CREATE POLICY "Users can view their investments"
  ON investments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their investments"
  ON investments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their investments"
  ON investments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their investments"
  ON investments FOR DELETE
  USING (auth.uid() = user_id);

-- Investment Returns Policies
CREATE POLICY "Users can view their investment returns"
  ON investment_returns FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM investments WHERE investments.id = investment_returns.investment_id AND investments.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their investment returns"
  ON investment_returns FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM investments WHERE investments.id = investment_returns.investment_id AND investments.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their investment returns"
  ON investment_returns FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM investments WHERE investments.id = investment_returns.investment_id AND investments.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their investment returns"
  ON investment_returns FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM investments WHERE investments.id = investment_returns.investment_id AND investments.user_id = auth.uid()
  ));

-- ============================================
-- TRIGGERS FOR AUTO-UPDATE
-- ============================================

-- Update loans.updated_at on change
CREATE OR REPLACE FUNCTION update_loans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER loans_updated_at_trigger
BEFORE UPDATE ON loans
FOR EACH ROW
EXECUTE FUNCTION update_loans_updated_at();

-- Update loan_installments.updated_at on change
CREATE OR REPLACE FUNCTION update_loan_installments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER loan_installments_updated_at_trigger
BEFORE UPDATE ON loan_installments
FOR EACH ROW
EXECUTE FUNCTION update_loan_installments_updated_at();

-- Update investor_funding.updated_at on change
CREATE OR REPLACE FUNCTION update_investor_funding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER investor_funding_updated_at_trigger
BEFORE UPDATE ON investor_funding
FOR EACH ROW
EXECUTE FUNCTION update_investor_funding_updated_at();

-- Update profit_sharing_payments.updated_at on change
CREATE OR REPLACE FUNCTION update_profit_sharing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profit_sharing_updated_at_trigger
BEFORE UPDATE ON profit_sharing_payments
FOR EACH ROW
EXECUTE FUNCTION update_profit_sharing_updated_at();

-- Update investments.updated_at on change
CREATE OR REPLACE FUNCTION update_investments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER investments_updated_at_trigger
BEFORE UPDATE ON investments
FOR EACH ROW
EXECUTE FUNCTION update_investments_updated_at();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Calculate loan remaining balance
CREATE OR REPLACE FUNCTION calculate_loan_remaining_balance(loan_id_param UUID)
RETURNS DECIMAL AS $$
DECLARE
  loan_amt DECIMAL;
  paid_amt DECIMAL;
BEGIN
  SELECT loan_amount INTO loan_amt FROM loans WHERE id = loan_id_param;
  SELECT COALESCE(SUM(paid_amount), 0) INTO paid_amt 
  FROM loan_installments 
  WHERE loan_id = loan_id_param AND status = 'paid';
  
  RETURN loan_amt - paid_amt;
END;
$$ LANGUAGE plpgsql;

-- Calculate investment current value
CREATE OR REPLACE FUNCTION calculate_investment_value(investment_id_param UUID)
RETURNS DECIMAL AS $$
DECLARE
  principal DECIMAL;
  returns DECIMAL;
BEGIN
  SELECT principal_amount INTO principal FROM investments WHERE id = investment_id_param;
  SELECT COALESCE(SUM(return_amount), 0) INTO returns 
  FROM investment_returns 
  WHERE investment_id = investment_id_param;
  
  RETURN principal + returns;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Uncomment below to insert sample data for testing
/*
-- Sample Loan
INSERT INTO loans (user_id, loan_amount, interest_rate, loan_term_months, installment_amount, installment_frequency, loan_date, first_payment_date, lender_name, purpose, status)
VALUES (
  auth.uid(),
  50000000,
  12.0,
  12,
  4440383,
  'monthly',
  '2025-01-01',
  '2025-02-01',
  'Bank BCA',
  'Modal kerja',
  'active'
);

-- Sample Investment
INSERT INTO investments (user_id, investment_type, investment_name, principal_amount, current_value, interest_rate, investment_term_months, start_date, maturity_date, bank_name, account_number, status)
VALUES (
  auth.uid(),
  'deposit',
  'Deposito BCA 6%',
  50000000,
  50000000,
  6.0,
  12,
  '2025-01-01',
  '2026-01-01',
  'Bank BCA',
  '1234567890',
  'active'
);
*/

-- ============================================
-- EXECUTION NOTES
-- ============================================
-- 1. Execute this script in Supabase SQL Editor
-- 2. Check for any errors in the output
-- 3. Verify tables are created: Go to Table Editor
-- 4. Test RLS policies by querying tables
-- 5. Proceed to Phase 2: API Routes implementation
-- ============================================
