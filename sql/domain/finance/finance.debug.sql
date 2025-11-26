-- =====================================================
-- FINANCE DOMAIN - DEBUG & SMOKE TEST QUERIES
-- PURPOSE: Manual testing & validation setelah deployment
-- =====================================================

-- =====================================================
-- SECTION 1: TABLE HEALTH CHECK
-- =====================================================

-- Check all finance tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'expenses', 'expense_items',
    'suppliers',
    'incomes', 'income_items',
    'customers',
    'loans', 'loan_installments',
    'investments', 'profit_sharing_history'
  )
ORDER BY table_name;

-- Check RLS enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('expenses', 'incomes', 'suppliers', 'customers', 'loans', 'investments')
ORDER BY tablename;

-- Check all functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND (
    routine_name LIKE '%income%' 
    OR routine_name LIKE '%expense%'
    OR routine_name LIKE '%supplier%'
    OR routine_name LIKE '%customer%'
  )
ORDER BY routine_name;

-- =====================================================
-- SECTION 2: REVENUE SUMMARY QUERIES
-- =====================================================

-- ✅ TEST: Show revenue summary per month (current year)
SELECT 
  TO_CHAR(income_date, 'YYYY-MM') as month,
  income_type,
  COUNT(*) as transaction_count,
  SUM(grand_total) as total_revenue,
  SUM(paid_amount) as total_paid,
  SUM(remaining_payment) as total_outstanding,
  ROUND(AVG(grand_total), 2) as avg_transaction_value
FROM incomes
WHERE owner_id = auth.uid()
  AND income_date >= DATE_TRUNC('year', CURRENT_DATE)
GROUP BY TO_CHAR(income_date, 'YYYY-MM'), income_type
ORDER BY month DESC, income_type;

-- ✅ TEST: Revenue by income type (Operating vs Investing vs Financing)
SELECT 
  income_type,
  income_category,
  COUNT(*) as count,
  SUM(grand_total) as total_revenue,
  ROUND(SUM(grand_total) / NULLIF((SELECT SUM(grand_total) FROM incomes WHERE owner_id = auth.uid()), 0) * 100, 2) as percentage
FROM incomes
WHERE owner_id = auth.uid()
  AND income_date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY income_type, income_category
ORDER BY total_revenue DESC;

-- ✅ TEST: Daily revenue trend (last 30 days)
SELECT 
  income_date,
  COUNT(*) as transactions,
  SUM(grand_total) as revenue,
  SUM(CASE WHEN payment_status = 'paid' THEN grand_total ELSE 0 END) as paid,
  SUM(CASE WHEN payment_status != 'paid' THEN remaining_payment ELSE 0 END) as outstanding
FROM incomes
WHERE owner_id = auth.uid()
  AND income_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY income_date
ORDER BY income_date DESC;

-- ✅ TEST: Using built-in revenue summary function
SELECT * FROM get_revenue_summary(
  p_owner_id := auth.uid(),
  p_start_date := DATE_TRUNC('month', CURRENT_DATE),
  p_end_date := CURRENT_DATE,
  p_income_type := NULL
);

-- =====================================================
-- SECTION 3: PIUTANG (ACCOUNTS RECEIVABLE) QUERIES
-- =====================================================

-- ✅ TEST: List piutang jatuh tempo > 30 hari
SELECT 
  i.invoice_number,
  i.customer_name,
  i.income_date,
  i.due_date,
  EXTRACT(DAY FROM (CURRENT_DATE - i.due_date))::INT as days_overdue,
  i.grand_total,
  i.paid_amount,
  i.remaining_payment,
  i.payment_status
FROM incomes i
WHERE i.owner_id = auth.uid()
  AND i.payment_status IN ('unpaid', 'partial')
  AND i.due_date IS NOT NULL
  AND i.due_date < CURRENT_DATE - INTERVAL '30 days'
ORDER BY days_overdue DESC, remaining_payment DESC;

-- ✅ TEST: Piutang aging report (using built-in function)
SELECT * FROM get_piutang_aging(auth.uid())
ORDER BY days_overdue DESC;

-- ✅ TEST: Piutang summary by aging category
SELECT 
  CASE 
    WHEN due_date IS NULL THEN 'No Due Date'
    WHEN CURRENT_DATE <= due_date THEN 'Current'
    WHEN EXTRACT(DAY FROM (CURRENT_DATE - due_date)) <= 30 THEN '1-30 Days'
    WHEN EXTRACT(DAY FROM (CURRENT_DATE - due_date)) <= 60 THEN '31-60 Days'
    WHEN EXTRACT(DAY FROM (CURRENT_DATE - due_date)) <= 90 THEN '61-90 Days'
    ELSE 'Over 90 Days'
  END as aging_category,
  COUNT(*) as invoice_count,
  SUM(remaining_payment) as total_outstanding
FROM incomes
WHERE owner_id = auth.uid()
  AND payment_status IN ('unpaid', 'partial')
  AND remaining_payment > 0
GROUP BY aging_category
ORDER BY 
  CASE aging_category
    WHEN 'Current' THEN 1
    WHEN '1-30 Days' THEN 2
    WHEN '31-60 Days' THEN 3
    WHEN '61-90 Days' THEN 4
    WHEN 'Over 90 Days' THEN 5
    ELSE 6
  END;

-- ✅ TEST: Total piutang by customer
SELECT 
  customer_id,
  customer_name,
  COUNT(*) as unpaid_invoices,
  SUM(remaining_payment) as total_piutang,
  MIN(due_date) as oldest_due_date,
  MAX(income_date) as last_transaction_date
FROM incomes
WHERE owner_id = auth.uid()
  AND payment_status IN ('unpaid', 'partial')
  AND remaining_payment > 0
GROUP BY customer_id, customer_name
ORDER BY total_piutang DESC;

-- =====================================================
-- SECTION 4: CUSTOMER ANALYTICS
-- =====================================================

-- ✅ TEST: Top 10 customers by CLV (Customer Lifetime Value)
SELECT 
  c.id,
  c.name,
  c.tier,
  c.total_purchases,
  c.lifetime_value,
  c.purchase_frequency,
  c.average_order_value,
  c.outstanding_balance,
  c.last_purchase_date
FROM customers c
WHERE c.owner_id = auth.uid()
  AND c.is_active = TRUE
ORDER BY c.lifetime_value DESC
LIMIT 10;

-- ✅ TEST: Customer segmentation by tier
SELECT 
  tier,
  COUNT(*) as customer_count,
  SUM(total_purchases) as total_revenue,
  ROUND(AVG(total_purchases), 2) as avg_revenue_per_customer,
  SUM(outstanding_balance) as total_outstanding,
  ROUND(AVG(purchase_frequency), 1) as avg_purchase_frequency
FROM customers
WHERE owner_id = auth.uid()
  AND is_active = TRUE
GROUP BY tier
ORDER BY 
  CASE tier
    WHEN 'platinum' THEN 1
    WHEN 'gold' THEN 2
    WHEN 'silver' THEN 3
    WHEN 'bronze' THEN 4
    ELSE 5
  END;

-- ✅ TEST: Customer summary using built-in function
SELECT * FROM get_customer_summary(
  p_owner_id := auth.uid(),
  p_customer_id := NULL
)
LIMIT 10;

-- ✅ TEST: Customers exceeding credit limit
SELECT 
  c.name,
  c.credit_limit,
  c.outstanding_balance,
  (c.outstanding_balance - c.credit_limit) as over_amount,
  ROUND((c.outstanding_balance / NULLIF(c.credit_limit, 0)) * 100, 2) as utilization_pct
FROM customers c
WHERE c.owner_id = auth.uid()
  AND c.credit_limit > 0
  AND c.outstanding_balance > c.credit_limit
ORDER BY over_amount DESC;

-- =====================================================
-- SECTION 5: SUPPLIER ANALYTICS
-- =====================================================

-- ✅ TEST: Top 10 suppliers by total purchases
SELECT 
  s.id,
  s.name,
  s.total_purchases,
  s.outstanding_balance,
  s.last_purchase_date,
  ROUND((s.outstanding_balance / NULLIF(s.total_purchases, 0)) * 100, 2) as payable_ratio
FROM suppliers s
WHERE s.owner_id = auth.uid()
  AND s.is_active = TRUE
ORDER BY s.total_purchases DESC
LIMIT 10;

-- ✅ TEST: Suppliers with outstanding payables
SELECT 
  s.name,
  s.credit_limit,
  s.outstanding_balance,
  COUNT(e.id) as unpaid_expenses,
  MIN(e.due_date) as oldest_due_date
FROM suppliers s
LEFT JOIN expenses e ON e.supplier_id = s.id 
  AND e.payment_status IN ('unpaid', 'partial')
WHERE s.owner_id = auth.uid()
  AND s.outstanding_balance > 0
GROUP BY s.id, s.name, s.credit_limit, s.outstanding_balance
ORDER BY s.outstanding_balance DESC;

-- ✅ TEST: Supplier summary using built-in function
SELECT * FROM get_supplier_summary(
  p_owner_id := auth.uid(),
  p_supplier_id := NULL
)
LIMIT 10;

-- =====================================================
-- SECTION 6: EXPENSE ANALYTICS
-- =====================================================

-- ✅ TEST: Expense summary per month
SELECT 
  TO_CHAR(expense_date, 'YYYY-MM') as month,
  expense_type,
  COUNT(*) as transaction_count,
  SUM(grand_total) as total_expense,
  SUM(paid_amount) as total_paid,
  SUM(remaining_payment) as total_outstanding
FROM expenses
WHERE owner_id = auth.uid()
  AND expense_date >= DATE_TRUNC('year', CURRENT_DATE)
GROUP BY TO_CHAR(expense_date, 'YYYY-MM'), expense_type
ORDER BY month DESC, expense_type;

-- ✅ TEST: Top expense categories
SELECT 
  category,
  COUNT(*) as count,
  SUM(grand_total) as total,
  ROUND(AVG(grand_total), 2) as avg_per_transaction
FROM expenses
WHERE owner_id = auth.uid()
  AND expense_date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY category
ORDER BY total DESC
LIMIT 10;

-- ✅ TEST: Expense summary using built-in function
SELECT * FROM get_expense_summary(
  p_owner_id := auth.uid(),
  p_start_date := DATE_TRUNC('month', CURRENT_DATE),
  p_end_date := CURRENT_DATE,
  p_expense_type := NULL
);

-- =====================================================
-- SECTION 7: PROFIT & MARGIN ANALYSIS
-- =====================================================

-- ✅ TEST: Gross profit by product (from income_items)
SELECT 
  ii.product_name,
  COUNT(DISTINCT ii.income_id) as sales_count,
  SUM(ii.qty) as total_qty_sold,
  SUM(ii.subtotal) as total_revenue,
  SUM(ii.qty * ii.buy_price) as total_cost,
  SUM(ii.total_profit) as gross_profit,
  ROUND((SUM(ii.total_profit) / NULLIF(SUM(ii.subtotal), 0)) * 100, 2) as profit_margin_pct
FROM income_items ii
WHERE ii.owner_id = auth.uid()
  AND ii.created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY ii.product_name
ORDER BY gross_profit DESC
LIMIT 20;

-- ✅ TEST: Operating income breakdown (using built-in function)
SELECT * FROM get_operating_income_breakdown(
  p_owner_id := auth.uid(),
  p_start_date := CURRENT_DATE - INTERVAL '30 days',
  p_end_date := CURRENT_DATE
);

-- ✅ TEST: Overall profit margin (operating income only)
SELECT 
  SUM(i.grand_total) as total_revenue,
  SUM(
    (SELECT SUM(ii.qty * ii.buy_price) FROM income_items ii WHERE ii.income_id = i.id)
  ) as total_cost,
  SUM(
    (SELECT SUM(ii.total_profit) FROM income_items ii WHERE ii.income_id = i.id)
  ) as gross_profit,
  ROUND(
    (SUM(
      (SELECT SUM(ii.total_profit) FROM income_items ii WHERE ii.income_id = i.id)
    ) / NULLIF(SUM(i.grand_total), 0)) * 100, 
    2
  ) as profit_margin_pct
FROM incomes i
WHERE i.owner_id = auth.uid()
  AND i.income_type = 'operating'
  AND i.income_date >= DATE_TRUNC('month', CURRENT_DATE);

-- =====================================================
-- SECTION 8: PERFORMANCE VALIDATION
-- =====================================================

-- ✅ TEST: Check index usage (should use indexes, not seq scan)
EXPLAIN ANALYZE
SELECT * FROM incomes 
WHERE owner_id = auth.uid() 
  AND income_date >= CURRENT_DATE - INTERVAL '30 days';

-- ✅ TEST: Check trigger execution (insert test data)
-- DO NOT RUN IN PRODUCTION - FOR TESTING ONLY
/*
BEGIN;

-- Insert test income
INSERT INTO incomes (
  owner_id, income_type, income_category, income_date,
  subtotal, discount_value, ppn_enabled, payment_method
) VALUES (
  auth.uid(), 'operating', 'product_sales', CURRENT_DATE,
  1000000, 50000, TRUE, 'tempo'
);

-- Verify triggers executed
SELECT 
  discount_amount, -- Should be calculated
  ppn_amount,      -- Should be calculated
  grand_total,     -- Should be calculated
  payment_status,  -- Should be 'unpaid'
  remaining_payment -- Should equal grand_total
FROM incomes 
WHERE owner_id = auth.uid() 
ORDER BY created_at DESC 
LIMIT 1;

ROLLBACK; -- Don't commit test data
*/

-- ✅ TEST: Check RLS policies (should only see own data)
-- User should only see their own records
SELECT COUNT(*) as my_income_count
FROM incomes
WHERE owner_id = auth.uid();

-- Should return 0 or error (cannot see other users' data)
-- SELECT COUNT(*) FROM incomes WHERE owner_id != auth.uid();

-- =====================================================
-- SECTION 9: DATA INTEGRITY CHECKS
-- =====================================================

-- ✅ TEST: Find incomes with mismatched subtotals
SELECT 
  i.id,
  i.invoice_number,
  i.subtotal as header_subtotal,
  COALESCE(SUM(ii.subtotal), 0) as items_subtotal,
  i.subtotal - COALESCE(SUM(ii.subtotal), 0) as difference
FROM incomes i
LEFT JOIN income_items ii ON ii.income_id = i.id
WHERE i.owner_id = auth.uid()
GROUP BY i.id, i.invoice_number, i.subtotal
HAVING ABS(i.subtotal - COALESCE(SUM(ii.subtotal), 0)) > 0.01
ORDER BY difference DESC;

-- ✅ TEST: Find customers with mismatched outstanding balance
SELECT 
  c.id,
  c.name,
  c.outstanding_balance as customer_balance,
  COALESCE(SUM(i.remaining_payment), 0) as calculated_balance,
  c.outstanding_balance - COALESCE(SUM(i.remaining_payment), 0) as difference
FROM customers c
LEFT JOIN incomes i ON i.customer_id = c.id AND i.payment_status IN ('unpaid', 'partial')
WHERE c.owner_id = auth.uid()
GROUP BY c.id, c.name, c.outstanding_balance
HAVING ABS(c.outstanding_balance - COALESCE(SUM(i.remaining_payment), 0)) > 0.01
ORDER BY difference DESC;

-- ✅ TEST: Find suppliers with mismatched outstanding balance
SELECT 
  s.id,
  s.name,
  s.outstanding_balance as supplier_balance,
  COALESCE(SUM(e.remaining_payment), 0) as calculated_balance,
  s.outstanding_balance - COALESCE(SUM(e.remaining_payment), 0) as difference
FROM suppliers s
LEFT JOIN expenses e ON e.supplier_id = s.id AND e.payment_status IN ('unpaid', 'partial')
WHERE s.owner_id = auth.uid()
GROUP BY s.id, s.name, s.outstanding_balance
HAVING ABS(s.outstanding_balance - COALESCE(SUM(e.remaining_payment), 0)) > 0.01
ORDER BY difference DESC;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Finance Domain - Debug Queries Ready';
  RAISE NOTICE '   - Section 1: Health checks (tables, RLS, functions)';
  RAISE NOTICE '   - Section 2: Revenue summary queries';
  RAISE NOTICE '   - Section 3: Piutang (AR) aging analysis';
  RAISE NOTICE '   - Section 4: Customer analytics (CLV, tiers)';
  RAISE NOTICE '   - Section 5: Supplier analytics';
  RAISE NOTICE '   - Section 6: Expense analytics';
  RAISE NOTICE '   - Section 7: Profit & margin analysis';
  RAISE NOTICE '   - Section 8: Performance validation';
  RAISE NOTICE '   - Section 9: Data integrity checks';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Run these queries after deployment for smoke testing!';
END $$;
