-- =====================================================
-- DOMAIN: FINANCE
-- FILE: expenses.logic.sql
-- PURPOSE: Business logic, functions, and triggers for expenses
-- =====================================================

-- =====================================================
-- FUNCTION: Update Updated_at Timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_expense_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trg_expenses_updated_at ON expenses;
CREATE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_expense_updated_at();

-- =====================================================
-- FUNCTION: Auto-calculate Grand Total
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_expense_grand_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate grand total from subtotal, discount, taxes, and fees
  NEW.grand_total = (NEW.subtotal - NEW.discount_amount) 
                    + NEW.ppn_amount 
                    + NEW.pph_amount 
                    + NEW.other_fees;
  
  -- Ensure non-negative
  IF NEW.grand_total < 0 THEN
    NEW.grand_total = 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trg_calculate_expense_total ON expenses;
CREATE TRIGGER trg_calculate_expense_total
  BEFORE INSERT OR UPDATE OF subtotal, discount_amount, ppn_amount, pph_amount, other_fees
  ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION calculate_expense_grand_total();

-- =====================================================
-- FUNCTION: Update Remaining Payment
-- =====================================================
CREATE OR REPLACE FUNCTION update_expense_remaining_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate remaining payment for 'tempo' payment type
  IF NEW.payment_type = 'tempo' THEN
    NEW.remaining_payment = NEW.grand_total - NEW.down_payment;
    
    -- Update payment status
    IF NEW.remaining_payment <= 0 THEN
      NEW.payment_status = 'lunas';
      NEW.remaining_payment = 0;
    ELSIF NEW.down_payment > 0 THEN
      NEW.payment_status = 'cicilan';
    ELSE
      NEW.payment_status = 'belum_lunas';
    END IF;
  ELSE
    -- Cash payment = always lunas
    NEW.payment_status = 'lunas';
    NEW.remaining_payment = 0;
    NEW.down_payment = NEW.grand_total;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trg_update_remaining_payment ON expenses;
CREATE TRIGGER trg_update_remaining_payment
  BEFORE INSERT OR UPDATE OF grand_total, down_payment, payment_type
  ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_expense_remaining_payment();

-- =====================================================
-- FUNCTION: Auto-update Expense Subtotal from Items
-- When expense_items are added/updated/deleted
-- =====================================================
CREATE OR REPLACE FUNCTION update_expense_subtotal_from_items()
RETURNS TRIGGER AS $$
DECLARE
  v_expense_id UUID;
  v_new_subtotal NUMERIC(15,2);
BEGIN
  -- Get expense_id from trigger (INSERT/UPDATE/DELETE)
  IF TG_OP = 'DELETE' THEN
    v_expense_id = OLD.expense_id;
  ELSE
    v_expense_id = NEW.expense_id;
  END IF;
  
  -- Calculate new subtotal from all items
  SELECT COALESCE(SUM(subtotal), 0) INTO v_new_subtotal
  FROM expense_items
  WHERE expense_id = v_expense_id;
  
  -- Update expense subtotal
  UPDATE expenses
  SET subtotal = v_new_subtotal
  WHERE id = v_expense_id;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Triggers for INSERT, UPDATE, DELETE on expense_items
DROP TRIGGER IF EXISTS trg_expense_items_update_subtotal_insert ON expense_items;
CREATE TRIGGER trg_expense_items_update_subtotal_insert
  AFTER INSERT ON expense_items
  FOR EACH ROW
  EXECUTE FUNCTION update_expense_subtotal_from_items();

DROP TRIGGER IF EXISTS trg_expense_items_update_subtotal_update ON expense_items;
CREATE TRIGGER trg_expense_items_update_subtotal_update
  AFTER UPDATE OF subtotal ON expense_items
  FOR EACH ROW
  EXECUTE FUNCTION update_expense_subtotal_from_items();

DROP TRIGGER IF EXISTS trg_expense_items_update_subtotal_delete ON expense_items;
CREATE TRIGGER trg_expense_items_update_subtotal_delete
  AFTER DELETE ON expense_items
  FOR EACH ROW
  EXECUTE FUNCTION update_expense_subtotal_from_items();

-- =====================================================
-- FUNCTION: Get Expense Summary (for API)
-- =====================================================
CREATE OR REPLACE FUNCTION get_expense_summary(
  p_owner_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_expense_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  total_count BIGINT,
  total_amount NUMERIC,
  total_paid NUMERIC,
  total_unpaid NUMERIC,
  by_type JSONB,
  by_category JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_count,
    COALESCE(SUM(grand_total), 0)::NUMERIC as total_amount,
    COALESCE(SUM(CASE WHEN payment_status = 'lunas' THEN grand_total ELSE 0 END), 0)::NUMERIC as total_paid,
    COALESCE(SUM(CASE WHEN payment_status != 'lunas' THEN remaining_payment ELSE 0 END), 0)::NUMERIC as total_unpaid,
    
    -- Group by type
    (SELECT jsonb_object_agg(expense_type, total)
     FROM (
       SELECT expense_type, SUM(grand_total) as total
       FROM expenses e2
       WHERE e2.owner_id = p_owner_id
         AND (p_start_date IS NULL OR e2.expense_date >= p_start_date)
         AND (p_end_date IS NULL OR e2.expense_date <= p_end_date)
         AND (p_expense_type IS NULL OR e2.expense_type = p_expense_type)
       GROUP BY expense_type
     ) t
    ) as by_type,
    
    -- Group by category
    (SELECT jsonb_object_agg(category, total)
     FROM (
       SELECT category, SUM(grand_total) as total
       FROM expenses e3
       WHERE e3.owner_id = p_owner_id
         AND (p_start_date IS NULL OR e3.expense_date >= p_start_date)
         AND (p_end_date IS NULL OR e3.expense_date <= p_end_date)
         AND (p_expense_type IS NULL OR e3.expense_type = p_expense_type)
       GROUP BY category
       ORDER BY total DESC
       LIMIT 10
     ) c
    ) as by_category
    
  FROM expenses e
  WHERE e.owner_id = p_owner_id
    AND (p_start_date IS NULL OR e.expense_date >= p_start_date)
    AND (p_end_date IS NULL OR e.expense_date <= p_end_date)
    AND (p_expense_type IS NULL OR e.expense_type = p_expense_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_expense_summary TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Finance Domain - Expenses Logic Created';
  RAISE NOTICE '   - Function: update_expense_updated_at()';
  RAISE NOTICE '   - Function: calculate_expense_grand_total()';
  RAISE NOTICE '   - Function: update_expense_remaining_payment()';
  RAISE NOTICE '   - Function: update_expense_subtotal_from_items()';
  RAISE NOTICE '   - Function: get_expense_summary()';
  RAISE NOTICE '   - Triggers: 6 triggers activated';
END $$;
