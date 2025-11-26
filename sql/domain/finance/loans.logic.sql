-- =====================================================
-- DOMAIN: FINANCE
-- FILE: loans.logic.sql
-- PURPOSE: Business logic untuk loan management
-- =====================================================

-- =====================================================
-- FUNCTION: Auto-update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_loan_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_loan_installment_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCTION: Calculate remaining principal
-- Auto-calculate when principal_paid changes
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_remaining_principal()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.remaining_principal := NEW.original_amount - NEW.principal_paid;
  
  -- Auto-update status based on remaining principal
  IF NEW.remaining_principal <= 0 THEN
    NEW.status := 'completed';
    NEW.is_active := FALSE;
  ELSIF NEW.remaining_principal > 0 AND NEW.status = 'completed' THEN
    NEW.status := 'active'; -- Reactivate if somehow got payment reversed
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCTION: Update loan summary from installments
-- Sync header with sum of installment payments
-- =====================================================
CREATE OR REPLACE FUNCTION update_loan_from_installments()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_loan_id UUID;
  v_principal_paid NUMERIC(15,2);
  v_interest_paid NUMERIC(15,2);
  v_installments_paid INT;
  v_last_payment_date DATE;
BEGIN
  -- Get loan_id from trigger context
  IF TG_OP = 'DELETE' THEN
    v_loan_id := OLD.loan_id;
  ELSE
    v_loan_id := NEW.loan_id;
  END IF;
  
  -- Calculate totals from installments
  SELECT 
    COALESCE(SUM(CASE WHEN status = 'paid' THEN principal_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'paid' THEN interest_amount ELSE 0 END), 0),
    COUNT(*) FILTER (WHERE status = 'paid'),
    MAX(payment_date)
  INTO v_principal_paid, v_interest_paid, v_installments_paid, v_last_payment_date
  FROM loan_installments
  WHERE loan_id = v_loan_id;
  
  -- Update loan header
  UPDATE loans
  SET 
    principal_paid = v_principal_paid,
    interest_paid = v_interest_paid,
    installments_paid = v_installments_paid,
    last_payment_date = v_last_payment_date,
    updated_at = NOW()
  WHERE id = v_loan_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- =====================================================
-- FUNCTION: Calculate installment total
-- Auto-calculate total = principal + interest + late_fee
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_installment_total()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.total_amount := NEW.principal_amount + NEW.interest_amount + NEW.late_fee;
  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCTION: Update installment status
-- Auto-update status based on payment
-- =====================================================
CREATE OR REPLACE FUNCTION update_installment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Calculate days late
  IF NEW.payment_date IS NOT NULL THEN
    NEW.days_late := GREATEST(EXTRACT(DAY FROM (NEW.payment_date - NEW.due_date))::INT, 0);
  ELSIF CURRENT_DATE > NEW.due_date THEN
    NEW.days_late := EXTRACT(DAY FROM (CURRENT_DATE - NEW.due_date))::INT;
  ELSE
    NEW.days_late := 0;
  END IF;
  
  -- Update status based on payment
  IF NEW.amount_paid >= NEW.total_amount THEN
    NEW.status := 'paid';
  ELSIF NEW.amount_paid > 0 THEN
    NEW.status := 'partial';
  ELSIF CURRENT_DATE > NEW.due_date THEN
    NEW.status := 'overdue';
  ELSE
    NEW.status := 'pending';
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCTION: Generate loan installment schedule
-- Create installment records based on loan config
-- =====================================================
CREATE OR REPLACE FUNCTION generate_loan_installments(p_loan_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_loan RECORD;
  v_installment_date DATE;
  v_principal_per_installment NUMERIC(15,2);
  v_interest_per_installment NUMERIC(15,2);
  v_interval INTERVAL;
  v_i INT;
BEGIN
  -- Get loan details
  SELECT * INTO v_loan FROM loans WHERE id = p_loan_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found: %', p_loan_id;
  END IF;
  
  -- Calculate principal per installment
  v_principal_per_installment := v_loan.original_amount / v_loan.total_installments;
  
  -- Calculate interest per installment based on interest_type
  IF v_loan.interest_type = 'flat' THEN
    -- Flat: Interest calculated on original amount
    v_interest_per_installment := (v_loan.original_amount * v_loan.interest_rate / 100) / v_loan.total_installments;
  ELSIF v_loan.interest_type = 'effective' THEN
    -- Effective: Interest calculated on remaining balance (simplified - use annuity formula in production)
    v_interest_per_installment := (v_loan.original_amount * v_loan.interest_rate / 100) / v_loan.total_installments;
  ELSE
    -- Fixed: No interest or custom calculation
    v_interest_per_installment := 0;
  END IF;
  
  -- Determine interval based on frequency
  v_interval := CASE v_loan.installment_frequency
    WHEN 'daily' THEN INTERVAL '1 day'
    WHEN 'weekly' THEN INTERVAL '1 week'
    WHEN 'monthly' THEN INTERVAL '1 month'
    WHEN 'yearly' THEN INTERVAL '1 year'
    ELSE INTERVAL '1 month'
  END;
  
  -- Generate installments
  v_installment_date := v_loan.first_installment_date;
  
  FOR v_i IN 1..v_loan.total_installments LOOP
    INSERT INTO loan_installments (
      loan_id,
      owner_id,
      installment_number,
      due_date,
      principal_amount,
      interest_amount,
      status
    ) VALUES (
      p_loan_id,
      v_loan.owner_id,
      v_i,
      v_installment_date,
      v_principal_per_installment,
      v_interest_per_installment,
      'pending'
    );
    
    -- Increment date for next installment
    v_installment_date := v_installment_date + v_interval;
  END LOOP;
  
  RAISE NOTICE 'Generated % installments for loan %', v_loan.total_installments, p_loan_id;
END;
$$;

-- =====================================================
-- FUNCTION: Get loan summary with payment progress
-- Analytics helper untuk dashboard
-- =====================================================
CREATE OR REPLACE FUNCTION get_loan_summary(p_owner_id UUID, p_loan_id UUID DEFAULT NULL)
RETURNS TABLE (
  loan_id UUID,
  lender_name TEXT,
  loan_category TEXT,
  original_amount NUMERIC,
  principal_paid NUMERIC,
  interest_paid NUMERIC,
  remaining_principal NUMERIC,
  total_paid NUMERIC,
  payment_progress NUMERIC,
  installments_paid INT,
  total_installments INT,
  next_due_date DATE,
  next_due_amount NUMERIC,
  days_until_due INT,
  status TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id AS loan_id,
    l.lender_name,
    l.loan_category,
    l.original_amount,
    l.principal_paid,
    l.interest_paid,
    l.remaining_principal,
    (l.principal_paid + l.interest_paid) AS total_paid,
    ROUND(((l.principal_paid + l.interest_paid) / NULLIF(l.original_amount + l.interest_paid, 0)) * 100, 2) AS payment_progress,
    l.installments_paid,
    l.total_installments,
    (
      SELECT MIN(li.due_date) 
      FROM loan_installments li 
      WHERE li.loan_id = l.id AND li.status != 'paid'
    ) AS next_due_date,
    (
      SELECT li.total_amount 
      FROM loan_installments li 
      WHERE li.loan_id = l.id AND li.status != 'paid'
      ORDER BY li.due_date ASC 
      LIMIT 1
    ) AS next_due_amount,
    EXTRACT(DAY FROM (
      (SELECT MIN(li.due_date) FROM loan_installments li WHERE li.loan_id = l.id AND li.status != 'paid') - CURRENT_DATE
    ))::INT AS days_until_due,
    l.status
  FROM loans l
  WHERE l.owner_id = p_owner_id
    AND (p_loan_id IS NULL OR l.id = p_loan_id)
  ORDER BY 
    CASE l.status
      WHEN 'overdue' THEN 1
      WHEN 'active' THEN 2
      WHEN 'completed' THEN 3
      ELSE 4
    END,
    next_due_date ASC NULLS LAST;
END;
$$;

-- =====================================================
-- FUNCTION: Get overdue installments for reminders
-- =====================================================
CREATE OR REPLACE FUNCTION get_overdue_installments(p_owner_id UUID)
RETURNS TABLE (
  installment_id UUID,
  loan_id UUID,
  lender_name TEXT,
  installment_number INT,
  due_date DATE,
  days_overdue INT,
  total_amount NUMERIC,
  late_fee NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    li.id AS installment_id,
    li.loan_id,
    l.lender_name,
    li.installment_number,
    li.due_date,
    li.days_late AS days_overdue,
    li.total_amount,
    li.late_fee
  FROM loan_installments li
  JOIN loans l ON l.id = li.loan_id
  WHERE li.owner_id = p_owner_id
    AND li.status IN ('overdue', 'partial')
    AND li.due_date < CURRENT_DATE
  ORDER BY li.days_late DESC, li.due_date ASC;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at (loans)
DROP TRIGGER IF EXISTS loans_updated_at_trigger ON loans;
CREATE TRIGGER loans_updated_at_trigger
  BEFORE UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION update_loan_updated_at();

-- Auto-update updated_at (loan_installments)
DROP TRIGGER IF EXISTS loan_installments_updated_at_trigger ON loan_installments;
CREATE TRIGGER loan_installments_updated_at_trigger
  BEFORE UPDATE ON loan_installments
  FOR EACH ROW
  EXECUTE FUNCTION update_loan_installment_updated_at();

-- Auto-calculate remaining principal
DROP TRIGGER IF EXISTS loans_calculate_remaining_trigger ON loans;
CREATE TRIGGER loans_calculate_remaining_trigger
  BEFORE INSERT OR UPDATE OF original_amount, principal_paid
  ON loans
  FOR EACH ROW
  EXECUTE FUNCTION calculate_remaining_principal();

-- Sync loan header from installments
DROP TRIGGER IF EXISTS loan_installments_sync_loan_trigger ON loan_installments;
CREATE TRIGGER loan_installments_sync_loan_trigger
  AFTER INSERT OR UPDATE OF status, amount_paid OR DELETE
  ON loan_installments
  FOR EACH ROW
  EXECUTE FUNCTION update_loan_from_installments();

-- Auto-calculate installment total
DROP TRIGGER IF EXISTS loan_installments_calculate_total_trigger ON loan_installments;
CREATE TRIGGER loan_installments_calculate_total_trigger
  BEFORE INSERT OR UPDATE OF principal_amount, interest_amount, late_fee
  ON loan_installments
  FOR EACH ROW
  EXECUTE FUNCTION calculate_installment_total();

-- Auto-update installment status
DROP TRIGGER IF EXISTS loan_installments_update_status_trigger ON loan_installments;
CREATE TRIGGER loan_installments_update_status_trigger
  BEFORE INSERT OR UPDATE OF amount_paid, payment_date, due_date
  ON loan_installments
  FOR EACH ROW
  EXECUTE FUNCTION update_installment_status();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Finance Domain - Loans Logic Created';
  RAISE NOTICE '   - 8 Functions: timestamp, remaining calc, installment sync, schedule generation, summary, overdue tracking';
  RAISE NOTICE '   - 6 Triggers: auto-update timestamp, remaining principal, loan sync, installment total, status update';
  RAISE NOTICE '   - Features: Auto-generate installments, payment tracking, overdue detection';
END $$;
