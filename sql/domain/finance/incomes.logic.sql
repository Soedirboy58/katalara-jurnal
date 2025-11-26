-- =====================================================
-- DOMAIN: FINANCE
-- FILE: incomes.logic.sql
-- PURPOSE: Business logic untuk income management
-- =====================================================

-- =====================================================
-- FUNCTION: Auto-update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_income_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCTION: Calculate grand total
-- Formula: subtotal - discount + ppn - pph + other_fees
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_income_grand_total()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Calculate discount amount based on mode
  IF NEW.discount_mode = 'percent' THEN
    NEW.discount_amount := NEW.subtotal * (NEW.discount_value / 100);
  ELSE
    NEW.discount_amount := NEW.discount_value;
  END IF;
  
  -- Calculate tax amounts
  NEW.ppn_amount := CASE 
    WHEN NEW.ppn_enabled THEN (NEW.subtotal - NEW.discount_amount) * (NEW.ppn_rate / 100)
    ELSE 0 
  END;
  
  NEW.pph_amount := CASE 
    WHEN NEW.pph_enabled THEN (NEW.subtotal - NEW.discount_amount) * (NEW.pph_rate / 100)
    ELSE 0 
  END;
  
  -- Calculate grand total
  NEW.grand_total := NEW.subtotal 
                     - NEW.discount_amount 
                     + NEW.ppn_amount 
                     - NEW.pph_amount 
                     + NEW.other_fees;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCTION: Update remaining payment (piutang)
-- Called when paid_amount changes
-- =====================================================
CREATE OR REPLACE FUNCTION update_income_remaining_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Calculate remaining payment
  NEW.remaining_payment := NEW.grand_total - NEW.paid_amount;
  
  -- Auto-update payment status
  IF NEW.paid_amount = 0 THEN
    NEW.payment_status := 'unpaid';
  ELSIF NEW.paid_amount >= NEW.grand_total THEN
    NEW.payment_status := 'paid';
    NEW.remaining_payment := 0; -- Ensure no negative
    IF NEW.payment_date IS NULL THEN
      NEW.payment_date := CURRENT_DATE;
    END IF;
  ELSE
    NEW.payment_status := 'partial';
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCTION: Update subtotal from income_items
-- Sync header subtotal with sum of line items
-- =====================================================
CREATE OR REPLACE FUNCTION update_income_subtotal_from_items()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_income_id UUID;
  v_subtotal NUMERIC(15,2);
BEGIN
  -- Get income_id from trigger context
  IF TG_OP = 'DELETE' THEN
    v_income_id := OLD.income_id;
  ELSE
    v_income_id := NEW.income_id;
  END IF;
  
  -- Calculate total subtotal from all items
  SELECT COALESCE(SUM(subtotal), 0)
  INTO v_subtotal
  FROM income_items
  WHERE income_id = v_income_id;
  
  -- Update income header
  UPDATE incomes
  SET subtotal = v_subtotal
  WHERE id = v_income_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- =====================================================
-- FUNCTION: Calculate income_item subtotal & profit
-- Auto-calculate when qty or price changes
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_income_item_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Calculate subtotal
  NEW.subtotal := NEW.qty * NEW.price_per_unit;
  
  -- Calculate profit
  NEW.profit_per_unit := NEW.price_per_unit - NEW.buy_price;
  NEW.total_profit := NEW.qty * NEW.profit_per_unit;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCTION: Update customer outstanding balance
-- Sync with customers table when income payment changes
-- =====================================================
CREATE OR REPLACE FUNCTION sync_income_to_customer()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  -- Get customer_id from trigger context
  IF TG_OP = 'DELETE' THEN
    v_customer_id := OLD.customer_id;
  ELSE
    v_customer_id := NEW.customer_id;
  END IF;
  
  -- Only sync if customer_id exists
  IF v_customer_id IS NOT NULL THEN
    PERFORM update_customer_outstanding_balance(v_customer_id);
    PERFORM update_customer_clv_metrics(v_customer_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- =====================================================
-- FUNCTION: Get revenue summary
-- Analytics helper untuk dashboard & reports
-- =====================================================
CREATE OR REPLACE FUNCTION get_revenue_summary(
  p_owner_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_income_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  income_type TEXT,
  income_category TEXT,
  total_revenue NUMERIC,
  total_paid NUMERIC,
  total_outstanding NUMERIC,
  total_profit NUMERIC,
  transaction_count BIGINT,
  avg_transaction_value NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.income_type,
    i.income_category,
    COALESCE(SUM(i.grand_total), 0) AS total_revenue,
    COALESCE(SUM(i.paid_amount), 0) AS total_paid,
    COALESCE(SUM(i.remaining_payment), 0) AS total_outstanding,
    COALESCE(SUM(
      (SELECT SUM(ii.total_profit) FROM income_items ii WHERE ii.income_id = i.id)
    ), 0) AS total_profit,
    COUNT(i.id) AS transaction_count,
    COALESCE(AVG(i.grand_total), 0) AS avg_transaction_value
  FROM incomes i
  WHERE i.owner_id = p_owner_id
    AND (p_start_date IS NULL OR i.income_date >= p_start_date)
    AND (p_end_date IS NULL OR i.income_date <= p_end_date)
    AND (p_income_type IS NULL OR i.income_type = p_income_type)
  GROUP BY i.income_type, i.income_category
  ORDER BY total_revenue DESC;
END;
$$;

-- =====================================================
-- FUNCTION: Get operating income breakdown
-- Detailed breakdown untuk operating income (sales)
-- =====================================================
CREATE OR REPLACE FUNCTION get_operating_income_breakdown(
  p_owner_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  period_date DATE,
  total_sales NUMERIC,
  total_cost NUMERIC,
  gross_profit NUMERIC,
  profit_margin NUMERIC,
  transaction_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.income_date AS period_date,
    COALESCE(SUM(i.grand_total), 0) AS total_sales,
    COALESCE(SUM(
      (SELECT SUM(ii.qty * ii.buy_price) FROM income_items ii WHERE ii.income_id = i.id)
    ), 0) AS total_cost,
    COALESCE(SUM(
      (SELECT SUM(ii.total_profit) FROM income_items ii WHERE ii.income_id = i.id)
    ), 0) AS gross_profit,
    CASE 
      WHEN SUM(i.grand_total) > 0 
      THEN (SUM(
        (SELECT SUM(ii.total_profit) FROM income_items ii WHERE ii.income_id = i.id)
      ) / SUM(i.grand_total)) * 100
      ELSE 0 
    END AS profit_margin,
    COUNT(i.id) AS transaction_count
  FROM incomes i
  WHERE i.owner_id = p_owner_id
    AND i.income_type = 'operating'
    AND i.income_date BETWEEN p_start_date AND p_end_date
  GROUP BY i.income_date
  ORDER BY i.income_date DESC;
END;
$$;

-- =====================================================
-- FUNCTION: Get piutang aging report
-- Analisis umur piutang (AR aging)
-- =====================================================
CREATE OR REPLACE FUNCTION get_piutang_aging(p_owner_id UUID)
RETURNS TABLE (
  customer_id UUID,
  customer_name TEXT,
  invoice_number TEXT,
  income_date DATE,
  due_date DATE,
  days_overdue INT,
  remaining_payment NUMERIC,
  aging_category TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.customer_id,
    i.customer_name,
    i.invoice_number,
    i.income_date,
    i.due_date,
    CASE 
      WHEN i.due_date IS NOT NULL 
      THEN EXTRACT(DAY FROM (CURRENT_DATE - i.due_date))::INT
      ELSE 0 
    END AS days_overdue,
    i.remaining_payment,
    CASE 
      WHEN i.due_date IS NULL THEN 'no_due_date'
      WHEN CURRENT_DATE <= i.due_date THEN 'current'
      WHEN EXTRACT(DAY FROM (CURRENT_DATE - i.due_date)) <= 30 THEN '1-30_days'
      WHEN EXTRACT(DAY FROM (CURRENT_DATE - i.due_date)) <= 60 THEN '31-60_days'
      WHEN EXTRACT(DAY FROM (CURRENT_DATE - i.due_date)) <= 90 THEN '61-90_days'
      ELSE 'over_90_days'
    END AS aging_category
  FROM incomes i
  WHERE i.owner_id = p_owner_id
    AND i.payment_status IN ('unpaid', 'partial')
    AND i.remaining_payment > 0
  ORDER BY days_overdue DESC, i.remaining_payment DESC;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at
DROP TRIGGER IF EXISTS incomes_updated_at_trigger ON incomes;
CREATE TRIGGER incomes_updated_at_trigger
  BEFORE UPDATE ON incomes
  FOR EACH ROW
  EXECUTE FUNCTION update_income_updated_at();

-- Auto-calculate grand total
DROP TRIGGER IF EXISTS incomes_calculate_grand_total_trigger ON incomes;
CREATE TRIGGER incomes_calculate_grand_total_trigger
  BEFORE INSERT OR UPDATE OF subtotal, discount_mode, discount_value, ppn_enabled, ppn_rate, pph_enabled, pph_rate, other_fees
  ON incomes
  FOR EACH ROW
  EXECUTE FUNCTION calculate_income_grand_total();

-- Auto-update remaining payment
DROP TRIGGER IF EXISTS incomes_update_remaining_payment_trigger ON incomes;
CREATE TRIGGER incomes_update_remaining_payment_trigger
  BEFORE INSERT OR UPDATE OF grand_total, paid_amount
  ON incomes
  FOR EACH ROW
  EXECUTE FUNCTION update_income_remaining_payment();

-- Sync to customer when payment changes
DROP TRIGGER IF EXISTS incomes_sync_customer_trigger ON incomes;
CREATE TRIGGER incomes_sync_customer_trigger
  AFTER INSERT OR UPDATE OF payment_status, paid_amount, remaining_payment OR DELETE
  ON incomes
  FOR EACH ROW
  EXECUTE FUNCTION sync_income_to_customer();

-- Income Items: Auto-calculate totals
DROP TRIGGER IF EXISTS income_items_calculate_totals_trigger ON income_items;
CREATE TRIGGER income_items_calculate_totals_trigger
  BEFORE INSERT OR UPDATE OF qty, price_per_unit, buy_price
  ON income_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_income_item_totals();

-- Income Items: Update header subtotal
DROP TRIGGER IF EXISTS income_items_update_header_trigger ON income_items;
CREATE TRIGGER income_items_update_header_trigger
  AFTER INSERT OR UPDATE OF subtotal OR DELETE
  ON income_items
  FOR EACH ROW
  EXECUTE FUNCTION update_income_subtotal_from_items();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Finance Domain - Incomes Logic Created';
  RAISE NOTICE '   - 9 Functions: timestamp, grand total, payment, subtotal sync, item totals, customer sync, revenue summary, operating breakdown, AR aging';
  RAISE NOTICE '   - 6 Triggers: auto-update timestamp, grand total, remaining payment, customer sync, item totals, header sync';
  RAISE NOTICE '   - Payment handling: cash, transfer, tempo (piutang tracking)';
  RAISE NOTICE '   - Analytics: revenue summary, operating breakdown, piutang aging';
END $$;
