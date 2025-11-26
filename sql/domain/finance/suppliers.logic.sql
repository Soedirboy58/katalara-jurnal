-- =====================================================
-- DOMAIN: FINANCE
-- FILE: suppliers.logic.sql
-- PURPOSE: Business logic untuk supplier/vendor management
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
-- FUNCTION: Update supplier total purchases metrics
-- Dipanggil ketika expense baru dibuat atau dihapus
-- =====================================================
CREATE OR REPLACE FUNCTION update_supplier_purchase_metrics(p_supplier_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_total NUMERIC(15,2);
  v_last_date DATE;
BEGIN
  -- Calculate purchase metrics
  SELECT 
    COALESCE(SUM(grand_total), 0),
    MAX(expense_date)
  INTO v_total, v_last_date
  FROM expenses
  WHERE supplier_id = p_supplier_id;
  
  -- Update supplier record
  UPDATE suppliers
  SET 
    total_purchases = v_total,
    last_purchase_date = v_last_date,
    updated_at = NOW()
  WHERE id = p_supplier_id;
END;
$$;

-- =====================================================
-- FUNCTION: Check credit limit before creating expense
-- Mencegah melebihi credit_limit supplier (hutang maksimal)
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
-- FUNCTION: Auto-generate supplier code
-- Format: SUP-{YYYY}-{sequence} e.g., SUP-2025-001
-- =====================================================
CREATE OR REPLACE FUNCTION generate_supplier_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_year TEXT;
  v_sequence INT;
  v_code TEXT;
BEGIN
  -- Only generate if code is not provided
  IF NEW.code IS NULL OR TRIM(NEW.code) = '' THEN
    v_year := TO_CHAR(NOW(), 'YYYY');
    
    -- Get next sequence for this year and owner
    SELECT COALESCE(MAX(
      CASE 
        WHEN code ~ '^SUP-\d{4}-\d+$' THEN
          CAST(SUBSTRING(code FROM 'SUP-\d{4}-(\d+)$') AS INT)
        ELSE 0
      END
    ), 0) + 1
    INTO v_sequence
    FROM suppliers
    WHERE owner_id = NEW.owner_id
      AND code LIKE 'SUP-' || v_year || '-%';
    
    -- Generate code: SUP-2025-001
    v_code := 'SUP-' || v_year || '-' || LPAD(v_sequence::TEXT, 3, '0');
    NEW.code := v_code;
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
  supplier_code TEXT,
  supplier_category TEXT,
  total_purchases NUMERIC,
  outstanding_balance NUMERIC,
  paid_amount NUMERIC,
  expense_count BIGINT,
  avg_expense_value NUMERIC,
  last_purchase_date DATE,
  avg_payment_days NUMERIC,
  is_over_limit BOOLEAN,
  rating INT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS supplier_id,
    s.name AS supplier_name,
    s.code AS supplier_code,
    s.category AS supplier_category,
    COALESCE(SUM(e.grand_total), 0) AS total_purchases,
    COALESCE(SUM(e.remaining_payment), 0) AS outstanding_balance,
    COALESCE(SUM(e.paid_amount), 0) AS paid_amount,
    COUNT(e.id) AS expense_count,
    COALESCE(AVG(e.grand_total), 0) AS avg_expense_value,
    MAX(e.expense_date) AS last_purchase_date,
    ROUND(AVG(EXTRACT(DAY FROM (e.payment_date - e.expense_date))), 1) AS avg_payment_days,
    (s.credit_limit > 0 AND s.outstanding_balance > s.credit_limit) AS is_over_limit,
    s.rating
  FROM suppliers s
  LEFT JOIN expenses e ON e.supplier_id = s.id AND e.owner_id = p_owner_id
  WHERE s.owner_id = p_owner_id
    AND (p_supplier_id IS NULL OR s.id = p_supplier_id)
  GROUP BY s.id, s.name, s.code, s.category, s.credit_limit, s.outstanding_balance, s.rating
  ORDER BY total_purchases DESC;
END;
$$;

-- =====================================================
-- FUNCTION: Get top suppliers by spending (leaderboard)
-- =====================================================
CREATE OR REPLACE FUNCTION get_top_suppliers(
  p_owner_id UUID,
  p_limit INT DEFAULT 10,
  p_period TEXT DEFAULT 'all' -- 'all', 'year', 'month', 'week'
)
RETURNS TABLE (
  rank BIGINT,
  supplier_id UUID,
  supplier_name TEXT,
  supplier_category TEXT,
  total_spending NUMERIC,
  expense_count BIGINT,
  avg_expense_value NUMERIC,
  rating INT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_start_date DATE;
BEGIN
  -- Determine date filter
  CASE p_period
    WHEN 'year' THEN v_start_date := DATE_TRUNC('year', CURRENT_DATE);
    WHEN 'month' THEN v_start_date := DATE_TRUNC('month', CURRENT_DATE);
    WHEN 'week' THEN v_start_date := DATE_TRUNC('week', CURRENT_DATE);
    ELSE v_start_date := '1900-01-01'::DATE; -- All time
  END CASE;
  
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY SUM(e.grand_total) DESC) AS rank,
    s.id AS supplier_id,
    s.name AS supplier_name,
    s.category AS supplier_category,
    COALESCE(SUM(e.grand_total), 0) AS total_spending,
    COUNT(e.id) AS expense_count,
    COALESCE(AVG(e.grand_total), 0) AS avg_expense_value,
    s.rating
  FROM suppliers s
  LEFT JOIN expenses e ON e.supplier_id = s.id 
    AND e.owner_id = p_owner_id
    AND e.expense_date >= v_start_date
  WHERE s.owner_id = p_owner_id
    AND s.is_active = TRUE
  GROUP BY s.id, s.name, s.category, s.rating
  HAVING COUNT(e.id) > 0 -- Only suppliers with expenses
  ORDER BY total_spending DESC
  LIMIT p_limit;
END;
$$;

-- =====================================================
-- FUNCTION: Get suppliers by category
-- Untuk filtering & grouping
-- =====================================================
CREATE OR REPLACE FUNCTION get_suppliers_by_category(p_owner_id UUID)
RETURNS TABLE (
  category TEXT,
  supplier_count BIGINT,
  total_spending NUMERIC,
  avg_spending_per_supplier NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(s.category, 'uncategorized') AS category,
    COUNT(DISTINCT s.id) AS supplier_count,
    COALESCE(SUM(e.grand_total), 0) AS total_spending,
    COALESCE(AVG(e.grand_total), 0) AS avg_spending_per_supplier
  FROM suppliers s
  LEFT JOIN expenses e ON e.supplier_id = s.id AND e.owner_id = p_owner_id
  WHERE s.owner_id = p_owner_id
    AND s.is_active = TRUE
  GROUP BY s.category
  ORDER BY total_spending DESC;
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

-- Auto-generate supplier code
DROP TRIGGER IF EXISTS suppliers_code_trigger ON suppliers;
CREATE TRIGGER suppliers_code_trigger
  BEFORE INSERT ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION generate_supplier_code();

-- Check credit limit when creating/updating expenses
-- Note: This trigger goes on expenses table, not suppliers!
COMMENT ON FUNCTION check_supplier_credit_limit() IS 
'INSTALL THIS TRIGGER ON expenses TABLE:
CREATE TRIGGER expenses_check_supplier_credit_limit
  BEFORE INSERT OR UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION check_supplier_credit_limit();';

-- =====================================================
-- VIEWS
-- =====================================================

-- View: Active suppliers with financial metrics
CREATE OR REPLACE VIEW active_suppliers_summary AS
SELECT 
  s.id,
  s.owner_id,
  s.code,
  s.name,
  s.category,
  s.contact_person,
  s.phone,
  s.email,
  s.rating,
  s.default_payment_term_days,
  s.credit_limit,
  s.total_purchases,
  s.outstanding_balance,
  s.last_purchase_date,
  CASE 
    WHEN s.credit_limit > 0 AND s.outstanding_balance > s.credit_limit THEN TRUE
    ELSE FALSE
  END AS is_over_limit,
  CASE 
    WHEN s.last_purchase_date >= CURRENT_DATE - INTERVAL '30 days' THEN 'active'
    WHEN s.last_purchase_date >= CURRENT_DATE - INTERVAL '90 days' THEN 'dormant'
    ELSE 'inactive'
  END AS activity_status,
  s.created_at,
  s.updated_at
FROM suppliers s
WHERE s.is_active = TRUE;

COMMENT ON VIEW active_suppliers_summary IS 'Active suppliers with computed fields: is_over_limit, activity_status';

-- View: Suppliers with outstanding balance
CREATE OR REPLACE VIEW suppliers_with_outstanding AS
SELECT 
  s.id,
  s.owner_id,
  s.code,
  s.name,
  s.category,
  s.contact_person,
  s.phone,
  s.email,
  s.outstanding_balance,
  s.credit_limit,
  s.default_payment_term_days,
  CASE 
    WHEN s.credit_limit > 0 THEN ROUND((s.outstanding_balance / s.credit_limit * 100), 2)
    ELSE 0
  END AS credit_utilization_percentage,
  s.last_purchase_date
FROM suppliers s
WHERE s.is_active = TRUE
  AND s.outstanding_balance > 0
ORDER BY s.outstanding_balance DESC;

COMMENT ON VIEW suppliers_with_outstanding IS 'Suppliers with unpaid balances and credit utilization metrics';

-- View: My suppliers for dropdown lists (lightweight)
CREATE OR REPLACE VIEW my_suppliers_list AS
SELECT 
  id,
  owner_id,
  code,
  name,
  category,
  phone,
  is_active
FROM suppliers
WHERE is_active = TRUE
ORDER BY name ASC;

COMMENT ON VIEW my_suppliers_list IS 'Lightweight supplier list for dropdowns and autocomplete';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Finance Domain - Suppliers Logic Created';
  RAISE NOTICE '   - 8 Functions: timestamp, balance tracking, purchase metrics, credit check, code generation, summaries, top suppliers, category grouping';
  RAISE NOTICE '   - 2 Triggers: auto-update timestamp, auto-generate code';
  RAISE NOTICE '   - 3 Views: active_suppliers_summary, suppliers_with_outstanding, my_suppliers_list';
  RAISE NOTICE '   ⚠️  IMPORTANT: Add check_supplier_credit_limit trigger to expenses table!';
END $$;
