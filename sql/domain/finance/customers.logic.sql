-- =====================================================
-- DOMAIN: FINANCE
-- FILE: customers.logic.sql
-- PURPOSE: Business logic untuk customer management
-- =====================================================

-- =====================================================
-- FUNCTION: Auto-update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_customer_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCTION: Update customer outstanding balance from incomes
-- Dipanggil otomatis ketika ada perubahan di incomes table
-- =====================================================
CREATE OR REPLACE FUNCTION update_customer_outstanding_balance(p_customer_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_outstanding NUMERIC(15,2);
BEGIN
  -- Calculate total unpaid incomes for this customer
  SELECT COALESCE(SUM(remaining_payment), 0)
  INTO v_outstanding
  FROM incomes
  WHERE customer_id = p_customer_id
    AND payment_status IN ('unpaid', 'partial');
  
  -- Update customer record
  UPDATE customers
  SET outstanding_balance = v_outstanding,
      updated_at = NOW()
  WHERE id = p_customer_id;
END;
$$;

-- =====================================================
-- FUNCTION: Update customer total purchases & CLV metrics
-- Dipanggil ketika income baru dibuat atau dihapus
-- =====================================================
CREATE OR REPLACE FUNCTION update_customer_clv_metrics(p_customer_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_total NUMERIC(15,2);
  v_count BIGINT;
  v_avg NUMERIC(15,2);
  v_last_date DATE;
BEGIN
  -- Calculate CLV metrics
  SELECT 
    COALESCE(SUM(grand_total), 0),
    COUNT(*),
    COALESCE(AVG(grand_total), 0),
    MAX(income_date)
  INTO v_total, v_count, v_avg, v_last_date
  FROM incomes
  WHERE customer_id = p_customer_id;
  
  -- Update customer record
  UPDATE customers
  SET 
    total_purchases = v_total,
    purchase_frequency = v_count,
    average_order_value = v_avg,
    last_purchase_date = v_last_date,
    updated_at = NOW()
  WHERE id = p_customer_id;
END;
$$;

-- =====================================================
-- FUNCTION: Check credit limit before creating income
-- Mencegah melebihi credit_limit customer
-- =====================================================
CREATE OR REPLACE FUNCTION check_customer_credit_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_credit_limit NUMERIC(15,2);
  v_outstanding NUMERIC(15,2);
  v_new_total NUMERIC(15,2);
  v_customer_name TEXT;
BEGIN
  -- Only check if customer_id exists and payment is tempo
  IF NEW.customer_id IS NOT NULL AND NEW.payment_method = 'tempo' THEN
    -- Get customer credit limit and current outstanding
    SELECT credit_limit, outstanding_balance, name
    INTO v_credit_limit, v_outstanding, v_customer_name
    FROM customers
    WHERE id = NEW.customer_id;
    
    -- Calculate potential new outstanding
    v_new_total := v_outstanding + NEW.remaining_payment;
    
    -- Check if exceeds limit (only if credit_limit > 0, meaning it's enforced)
    IF v_credit_limit > 0 AND v_new_total > v_credit_limit THEN
      RAISE EXCEPTION 'Credit limit exceeded for customer "%". Limit: %, Current: %, New income: %. Total would be: %',
        v_customer_name,
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
-- FUNCTION: Auto-assign customer tier based on total purchases
-- Tiers: Bronze (<10M), Silver (10-50M), Gold (50-100M), Platinum (>100M)
-- =====================================================
CREATE OR REPLACE FUNCTION update_customer_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_tier TEXT;
BEGIN
  -- Calculate tier based on total_purchases
  IF NEW.total_purchases >= 100000000 THEN
    v_tier := 'platinum';
  ELSIF NEW.total_purchases >= 50000000 THEN
    v_tier := 'gold';
  ELSIF NEW.total_purchases >= 10000000 THEN
    v_tier := 'silver';
  ELSE
    v_tier := 'bronze';
  END IF;
  
  -- Update tier if changed
  IF NEW.tier IS DISTINCT FROM v_tier THEN
    NEW.tier := v_tier;
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCTION: Get customer summary for reports
-- Helper untuk dashboard & analytics
-- =====================================================
CREATE OR REPLACE FUNCTION get_customer_summary(p_owner_id UUID, p_customer_id UUID DEFAULT NULL)
RETURNS TABLE (
  customer_id UUID,
  customer_name TEXT,
  customer_tier TEXT,
  total_revenue NUMERIC,
  outstanding_balance NUMERIC,
  paid_amount NUMERIC,
  order_count BIGINT,
  avg_order_value NUMERIC,
  last_purchase_date DATE,
  avg_payment_days NUMERIC,
  is_over_limit BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS customer_id,
    c.name AS customer_name,
    c.tier AS customer_tier,
    COALESCE(SUM(i.grand_total), 0) AS total_revenue,
    COALESCE(SUM(i.remaining_payment), 0) AS outstanding_balance,
    COALESCE(SUM(i.paid_amount), 0) AS paid_amount,
    COUNT(i.id) AS order_count,
    COALESCE(AVG(i.grand_total), 0) AS avg_order_value,
    MAX(i.income_date) AS last_purchase_date,
    ROUND(AVG(EXTRACT(DAY FROM (i.payment_date - i.income_date))), 1) AS avg_payment_days,
    (c.credit_limit > 0 AND c.outstanding_balance > c.credit_limit) AS is_over_limit
  FROM customers c
  LEFT JOIN incomes i ON i.customer_id = c.id AND i.owner_id = p_owner_id
  WHERE c.owner_id = p_owner_id
    AND (p_customer_id IS NULL OR c.id = p_customer_id)
  GROUP BY c.id, c.name, c.tier, c.credit_limit, c.outstanding_balance
  ORDER BY total_revenue DESC;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at
DROP TRIGGER IF EXISTS customers_updated_at_trigger ON customers;
CREATE TRIGGER customers_updated_at_trigger
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_updated_at();

-- Auto-update tier based on total_purchases
DROP TRIGGER IF EXISTS customers_tier_trigger ON customers;
CREATE TRIGGER customers_tier_trigger
  BEFORE INSERT OR UPDATE OF total_purchases ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_tier();

-- Check credit limit when creating/updating incomes
-- Note: This trigger goes on incomes table, not customers!
COMMENT ON FUNCTION check_customer_credit_limit() IS 
'INSTALL THIS TRIGGER ON incomes TABLE:
CREATE TRIGGER incomes_check_credit_limit
  BEFORE INSERT OR UPDATE ON incomes
  FOR EACH ROW
  EXECUTE FUNCTION check_customer_credit_limit();';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Finance Domain - Customers Logic Created';
  RAISE NOTICE '   - 6 Functions: timestamp, balance tracking, CLV metrics, credit check, tier assignment, summary';
  RAISE NOTICE '   - 2 Triggers: auto-update timestamp, auto-assign tier';
  RAISE NOTICE '   ⚠️  IMPORTANT: Add check_customer_credit_limit trigger to incomes table!';
END $$;
