-- =====================================================
-- DOMAIN: FINANCE
-- TABLE: investments
-- LOGIC: Functions & Triggers
-- =====================================================

-- =====================================================
-- FUNCTION: Calculate ROI
-- Menghitung ROI berdasarkan profit yang sudah dibagi
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_investment_roi(
  p_investment_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  v_principal NUMERIC;
  v_total_profit_shared NUMERIC;
  v_roi NUMERIC;
BEGIN
  SELECT principal_amount, total_profit_shared
  INTO v_principal, v_total_profit_shared
  FROM investments
  WHERE id = p_investment_id;
  
  IF v_principal IS NULL OR v_principal = 0 THEN
    RETURN 0;
  END IF;
  
  -- ROI = (Total Profit Shared / Principal) * 100
  v_roi := (v_total_profit_shared / v_principal) * 100;
  
  RETURN ROUND(v_roi, 2);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Calculate Next Profit Share Date
-- Menghitung kapan profit share berikutnya
-- =====================================================
CREATE OR REPLACE FUNCTION get_next_profit_share_date(
  p_investment_id UUID
)
RETURNS DATE AS $$
DECLARE
  v_last_date DATE;
  v_frequency TEXT;
  v_next_date DATE;
BEGIN
  SELECT last_profit_share_date, profit_share_frequency
  INTO v_last_date, v_frequency
  FROM investments
  WHERE id = p_investment_id;
  
  -- Jika belum pernah profit share, pakai start_date
  IF v_last_date IS NULL THEN
    SELECT start_date INTO v_last_date FROM investments WHERE id = p_investment_id;
  END IF;
  
  -- Hitung next date berdasarkan frequency
  CASE v_frequency
    WHEN 'monthly' THEN
      v_next_date := v_last_date + INTERVAL '1 month';
    WHEN 'quarterly' THEN
      v_next_date := v_last_date + INTERVAL '3 months';
    WHEN 'yearly' THEN
      v_next_date := v_last_date + INTERVAL '1 year';
    ELSE
      v_next_date := v_last_date + INTERVAL '1 month'; -- Default monthly
  END CASE;
  
  RETURN v_next_date;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Calculate Buyback Amount
-- Menghitung jumlah yang harus dibayar untuk buyback
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_buyback_amount(
  p_investment_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  v_principal NUMERIC;
  v_multiplier NUMERIC;
  v_buyback_amount NUMERIC;
BEGIN
  SELECT principal_amount, buyback_multiplier
  INTO v_principal, v_multiplier
  FROM investments
  WHERE id = p_investment_id;
  
  IF v_principal IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Buyback = Principal * Multiplier
  v_buyback_amount := v_principal * COALESCE(v_multiplier, 1.0);
  
  RETURN ROUND(v_buyback_amount, 2);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Get Investment Summary
-- Summary keuangan untuk satu investment
-- =====================================================
CREATE OR REPLACE FUNCTION get_investment_summary(
  p_investment_id UUID
)
RETURNS TABLE(
  investment_id UUID,
  investor_name TEXT,
  principal_amount NUMERIC,
  total_profit_shared NUMERIC,
  roi_percentage NUMERIC,
  next_share_date DATE,
  buyback_amount NUMERIC,
  investment_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.investor_name,
    i.principal_amount,
    i.total_profit_shared,
    calculate_investment_roi(i.id) AS roi_percentage,
    get_next_profit_share_date(i.id) AS next_share_date,
    calculate_buyback_amount(i.id) AS buyback_amount,
    i.status
  FROM investments i
  WHERE i.id = p_investment_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Get All Active Investments Summary
-- Summary semua investasi aktif untuk owner
-- =====================================================
CREATE OR REPLACE FUNCTION get_active_investments_summary(
  p_owner_id UUID
)
RETURNS TABLE(
  total_investments BIGINT,
  total_principal NUMERIC,
  total_profit_shared NUMERIC,
  average_roi NUMERIC,
  upcoming_shares_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT AS total_investments,
    COALESCE(SUM(principal_amount), 0) AS total_principal,
    COALESCE(SUM(total_profit_shared), 0) AS total_profit_shared,
    COALESCE(AVG(calculate_investment_roi(id)), 0) AS average_roi,
    COUNT(*) FILTER (
      WHERE get_next_profit_share_date(id) <= CURRENT_DATE + INTERVAL '30 days'
    )::BIGINT AS upcoming_shares_count
  FROM investments
  WHERE owner_id = p_owner_id
    AND is_active = TRUE
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Calculate Profit Share Amount
-- Menghitung jumlah profit share untuk suatu periode
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_profit_share_amount(
  p_investment_id UUID,
  p_business_profit NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
  v_share_type TEXT;
  v_share_percentage NUMERIC;
  v_fixed_amount NUMERIC;
  v_calculated_amount NUMERIC;
BEGIN
  SELECT profit_share_type, profit_share_percentage, profit_share_fixed_amount
  INTO v_share_type, v_share_percentage, v_fixed_amount
  FROM investments
  WHERE id = p_investment_id;
  
  -- Hitung berdasarkan type
  CASE v_share_type
    WHEN 'percentage' THEN
      v_calculated_amount := p_business_profit * (v_share_percentage / 100);
    WHEN 'fixed' THEN
      v_calculated_amount := v_fixed_amount;
    WHEN 'revenue_based' THEN
      -- Revenue based akan dihitung di aplikasi, karena perlu data revenue
      v_calculated_amount := 0;
    ELSE
      v_calculated_amount := 0;
  END CASE;
  
  RETURN ROUND(v_calculated_amount, 2);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Get Profit Sharing Due
-- Ambil investment yang sudah saatnya profit share
-- =====================================================
CREATE OR REPLACE FUNCTION get_investments_due_for_profit_share(
  p_owner_id UUID,
  p_as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  investment_id UUID,
  investor_name TEXT,
  principal_amount NUMERIC,
  profit_share_percentage NUMERIC,
  last_profit_share_date DATE,
  next_share_date DATE,
  days_overdue INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.investor_name,
    i.principal_amount,
    i.profit_share_percentage,
    i.last_profit_share_date,
    get_next_profit_share_date(i.id) AS next_share_date,
    (p_as_of_date - get_next_profit_share_date(i.id))::INT AS days_overdue
  FROM investments i
  WHERE i.owner_id = p_owner_id
    AND i.is_active = TRUE
    AND i.status = 'active'
    AND get_next_profit_share_date(i.id) <= p_as_of_date
  ORDER BY next_share_date ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Update Investment Total Profit Shared
-- Recalculate total profit shared dari history
-- =====================================================
CREATE OR REPLACE FUNCTION update_investment_total_profit_shared(
  p_investment_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_total NUMERIC;
BEGIN
  -- Sum dari profit sharing history yang sudah paid
  SELECT COALESCE(SUM(final_amount), 0)
  INTO v_total
  FROM profit_sharing_history
  WHERE investment_id = p_investment_id
    AND payment_status = 'paid';
  
  -- Update di investment
  UPDATE investments
  SET 
    total_profit_shared = v_total,
    updated_at = NOW()
  WHERE id = p_investment_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- TRIGGER 1: Auto-update updated_at
CREATE OR REPLACE FUNCTION trigger_investments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_investments_updated_at
  BEFORE UPDATE ON investments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_investments_updated_at();

-- TRIGGER 2: Auto-update updated_at (profit_sharing_history)
CREATE TRIGGER trg_profit_sharing_updated_at
  BEFORE UPDATE ON profit_sharing_history
  FOR EACH ROW
  EXECUTE FUNCTION trigger_investments_updated_at();

-- TRIGGER 3: Update investment when profit share is paid
CREATE OR REPLACE FUNCTION trigger_update_investment_on_profit_paid()
RETURNS TRIGGER AS $$
BEGIN
  -- Jika status berubah jadi 'paid'
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    
    -- Update last_profit_share_date di investment
    UPDATE investments
    SET 
      last_profit_share_date = NEW.payment_date,
      updated_at = NOW()
    WHERE id = NEW.investment_id;
    
    -- Recalculate total profit shared
    PERFORM update_investment_total_profit_shared(NEW.investment_id);
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_investment_on_profit_paid
  AFTER INSERT OR UPDATE ON profit_sharing_history
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_investment_on_profit_paid();

-- TRIGGER 4: Prevent delete if has profit history
CREATE OR REPLACE FUNCTION trigger_prevent_investment_delete_with_history()
RETURNS TRIGGER AS $$
DECLARE
  v_history_count INT;
BEGIN
  SELECT COUNT(*)
  INTO v_history_count
  FROM profit_sharing_history
  WHERE investment_id = OLD.id;
  
  IF v_history_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete investment with profit sharing history. Set status to inactive instead.';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_investment_delete_with_history
  BEFORE DELETE ON investments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_prevent_investment_delete_with_history();

-- TRIGGER 5: Auto-calculate final_amount in profit_sharing_history
CREATE OR REPLACE FUNCTION trigger_calculate_profit_share_final_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto calculate final_amount jika belum diset
  IF NEW.final_amount IS NULL OR NEW.final_amount = 0 THEN
    NEW.final_amount := NEW.calculated_amount + COALESCE(NEW.adjustment_amount, 0);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_profit_share_final_amount
  BEFORE INSERT OR UPDATE ON profit_sharing_history
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_profit_share_final_amount();

-- TRIGGER 6: Sync owner_id from investment
CREATE OR REPLACE FUNCTION trigger_sync_profit_sharing_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto set owner_id dari investment
  IF NEW.owner_id IS NULL THEN
    SELECT owner_id INTO NEW.owner_id
    FROM investments
    WHERE id = NEW.investment_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_profit_sharing_owner
  BEFORE INSERT ON profit_sharing_history
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_profit_sharing_owner();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION calculate_investment_roi IS 'Calculate ROI = (Total Profit Shared / Principal) * 100';
COMMENT ON FUNCTION get_next_profit_share_date IS 'Calculate next profit share date based on frequency (monthly/quarterly/yearly)';
COMMENT ON FUNCTION calculate_buyback_amount IS 'Calculate amount needed to buy back investment = Principal * Multiplier';
COMMENT ON FUNCTION get_investment_summary IS 'Get comprehensive summary for single investment';
COMMENT ON FUNCTION get_active_investments_summary IS 'Get aggregated summary for all active investments of owner';
COMMENT ON FUNCTION calculate_profit_share_amount IS 'Calculate profit share based on type (percentage/fixed/revenue_based)';
COMMENT ON FUNCTION get_investments_due_for_profit_share IS 'Get investments where profit share date has passed';
COMMENT ON FUNCTION update_investment_total_profit_shared IS 'Recalculate total profit shared from history (paid only)';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Finance Domain - Investments Logic Created';
  RAISE NOTICE '   - Functions: 8 (ROI calc, profit share calc, summaries, buyback calc)';
  RAISE NOTICE '   - Triggers: 6 (auto-update, profit sync, delete protection)';
  RAISE NOTICE '   - Features: Automatic profit tracking, ROI calculation, reminder system';
END $$;
