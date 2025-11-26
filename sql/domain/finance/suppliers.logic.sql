-- =====================================================
-- DOMAIN: FINANCE
-- FILE: suppliers.logic.sql
-- PURPOSE: Business logic untuk supplier management
-- =====================================================

-- =====================================================
-- FUNCTION: Auto-update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_supplier_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCTION: Update supplier outstanding balance from expenses
-- Dipanggil otomatis ketika ada perubahan di expenses table
-- =====================================================
CREATE OR REPLACE FUNCTION update_supplier_outstanding_balance(p_supplier_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_outstanding NUMERIC(15,2);
BEGIN
  -- Calculate total unpaid expenses for this supplier
  SELECT COALESCE(SUM(remaining_payment), 0)
  INTO v_outstanding
  FROM expenses
  WHERE supplier_id = p_supplier_id
    AND payment_status IN ('unpaid', 'partial');
  
  -- Update supplier record
  UPDATE suppliers
  SET outstanding_balance = v_outstanding,
      updated_at = NOW()
  WHERE id = p_supplier_id;
END;
$$;

-- =====================================================
-- FUNCTION: Update supplier total purchases
-- Dipanggil ketika expense baru dibuat atau dihapus
-- =====================================================
CREATE OR REPLACE FUNCTION update_supplier_total_purchases(p_supplier_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_total NUMERIC(15,2);
  v_last_date DATE;
BEGIN
  -- Calculate lifetime total purchases
  SELECT 
    COALESCE(SUM(grand_total), 0),
    MAX(expense_date)
  INTO v_total, v_last_date
  FROM expenses
  WHERE supplier_id = p_supplier_id;
  
  -- Update supplier record
  UPDATE suppliers
  SET total_purchases = v_total,
      last_purchase_date = v_last_date,
      updated_at = NOW()
  WHERE id = p_supplier_id;
END;
$$;

-- =====================================================
-- FUNCTION: Check credit limit before creating expense
-- Mencegah melebihi credit_limit supplier
-- =====================================================
CREATE OR REPLACE FUNCTION check_supplier_credit_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_credit_limit NUMERIC(15,2);
  v_outstanding NUMERIC(15,2);
  v_new_total NUMERIC(15,2);
  v_supplier_name TEXT;
BEGIN
  -- Only check if supplier_id exists and payment is tempo
  IF NEW.supplier_id IS NOT NULL AND NEW.payment_method = 'tempo' THEN
    -- Get supplier credit limit and current outstanding
    SELECT credit_limit, outstanding_balance, name
    INTO v_credit_limit, v_outstanding, v_supplier_name
    FROM suppliers
    WHERE id = NEW.supplier_id;
    
    -- Calculate potential new outstanding
    v_new_total := v_outstanding + NEW.remaining_payment;
    
    -- Check if exceeds limit (only if credit_limit > 0, meaning it's enforced)
    IF v_credit_limit > 0 AND v_new_total > v_credit_limit THEN
      RAISE EXCEPTION 'Credit limit exceeded for supplier "%". Limit: %, Current: %, New expense: %. Total would be: %',
        v_supplier_name,
        v_credit_limit,
        v_outstanding,
        NEW.remaining_payment,
        v_new_total;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCTION: Get supplier summary for reports
-- Helper untuk dashboard & analytics
-- =====================================================
CREATE OR REPLACE FUNCTION get_supplier_summary(p_owner_id UUID, p_supplier_id UUID DEFAULT NULL)
RETURNS TABLE (
  supplier_id UUID,
  supplier_name TEXT,
  total_expenses NUMERIC,
  outstanding_balance NUMERIC,
  paid_amount NUMERIC,
  expense_count BIGINT,
  last_purchase_date DATE,
  avg_payment_days NUMERIC,
  is_over_limit BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS supplier_id,
    s.name AS supplier_name,
    COALESCE(SUM(e.grand_total), 0) AS total_expenses,
    COALESCE(SUM(e.remaining_payment), 0) AS outstanding_balance,
    COALESCE(SUM(e.paid_amount), 0) AS paid_amount,
    COUNT(e.id) AS expense_count,
    MAX(e.expense_date) AS last_purchase_date,
    ROUND(AVG(EXTRACT(DAY FROM (e.payment_date - e.expense_date))), 1) AS avg_payment_days,
    (s.credit_limit > 0 AND s.outstanding_balance > s.credit_limit) AS is_over_limit
  FROM suppliers s
  LEFT JOIN expenses e ON e.supplier_id = s.id AND e.owner_id = p_owner_id
  WHERE s.owner_id = p_owner_id
    AND (p_supplier_id IS NULL OR s.id = p_supplier_id)
  GROUP BY s.id, s.name, s.credit_limit, s.outstanding_balance
  ORDER BY total_expenses DESC;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at
DROP TRIGGER IF EXISTS suppliers_updated_at_trigger ON suppliers;
CREATE TRIGGER suppliers_updated_at_trigger
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_updated_at();

-- Check credit limit when creating/updating expenses
-- Note: This trigger goes on expenses table, not suppliers!
-- We'll document this as a requirement when expenses are linked
COMMENT ON FUNCTION check_supplier_credit_limit() IS 
'INSTALL THIS TRIGGER ON expenses TABLE:
CREATE TRIGGER expenses_check_credit_limit
  BEFORE INSERT OR UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION check_supplier_credit_limit();';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Finance Domain - Suppliers Logic Created';
  RAISE NOTICE '   - 5 Functions: timestamp, balance tracking, purchases tracking, credit check, summary';
  RAISE NOTICE '   - 1 Trigger: auto-update timestamp';
  RAISE NOTICE '   ⚠️  IMPORTANT: Add check_supplier_credit_limit trigger to expenses table!';
END $$;
