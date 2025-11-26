-- =====================================================
-- FINANCE DOMAIN - HEALTH CHECK & DEBUG SCRIPT
-- Purpose: Validate deployment & test functionality
-- Version: 1.0
-- =====================================================

\echo '================================================='
\echo 'FINANCE DOMAIN - HEALTH CHECK'
\echo '================================================='
\echo ''

-- =====================================================
-- SECTION 1: TABLE EXISTENCE
-- =====================================================
\echo '1️⃣  CHECKING TABLES...'
\echo ''

SELECT 
  CASE 
    WHEN COUNT(*) = 12 THEN '✅ All tables exist (12/12)'
    ELSE '❌ Missing tables: ' || (12 - COUNT(*))::TEXT
  END AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'expenses', 'expense_items',
    'suppliers',
    'customers',
    'incomes', 'income_items',
    'loans', 'loan_installments',
    'investments', 'profit_sharing_history'
  );

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'expenses', 'expense_items',
    'suppliers',
    'customers',
    'incomes', 'income_items',
    'loans', 'loan_installments',
    'investments', 'profit_sharing_history'
  )
ORDER BY table_name;

\echo ''

-- =====================================================
-- SECTION 2: RLS STATUS
-- =====================================================
\echo '2️⃣  CHECKING RLS (Row Level Security)...'
\echo ''

SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'expenses', 'expense_items',
    'suppliers',
    'customers',
    'incomes', 'income_items',
    'loans', 'loan_installments',
    'investments', 'profit_sharing_history'
  )
ORDER BY tablename;

\echo ''

-- =====================================================
-- SECTION 3: POLICIES
-- =====================================================
\echo '3️⃣  CHECKING RLS POLICIES...'
\echo ''

SELECT 
  tablename,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'expenses', 'expense_items',
    'suppliers',
    'customers',
    'incomes', 'income_items',
    'loans', 'loan_installments',
    'investments', 'profit_sharing_history'
  )
GROUP BY tablename
ORDER BY tablename;

SELECT 
  CASE 
    WHEN COUNT(*) >= 36 THEN '✅ All policies exist (' || COUNT(*) || '/36+)'
    ELSE '❌ Missing policies: ' || (36 - COUNT(*))::TEXT
  END AS status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'expenses', 'expense_items',
    'suppliers',
    'customers',
    'incomes', 'income_items',
    'loans', 'loan_installments',
    'investments', 'profit_sharing_history'
  );

\echo ''

-- =====================================================
-- SECTION 4: FUNCTIONS
-- =====================================================
\echo '4️⃣  CHECKING FUNCTIONS...'
\echo ''

SELECT 
  routine_name AS function_name,
  routine_type AS type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    -- Customers
    'update_customer_updated_at',
    'update_customer_outstanding_balance',
    'update_customer_clv_metrics',
    'check_customer_credit_limit',
    'update_customer_tier',
    'get_customer_summary',
    -- Suppliers
    'update_supplier_updated_at',
    'update_supplier_outstanding_balance',
    'update_supplier_purchase_metrics',
    'check_supplier_credit_limit',
    'generate_supplier_code',
    'get_supplier_summary',
    'get_top_suppliers',
    'get_suppliers_by_category',
    -- Expenses
    'update_expense_updated_at',
    'calculate_expense_totals',
    'get_expense_summary',
    -- Incomes
    'update_income_updated_at',
    'calculate_income_totals',
    'calculate_income_profit',
    'get_revenue_summary',
    'get_piutang_aging',
    -- Loans
    'update_loan_updated_at',
    'generate_loan_repayment_schedule',
    'get_loan_summary',
    -- Investments
    'update_investment_updated_at',
    'calculate_investment_roi',
    'get_investment_summary'
  )
ORDER BY routine_name;

SELECT 
  CASE 
    WHEN COUNT(*) >= 27 THEN '✅ All functions exist (' || COUNT(*) || '/27+)'
    ELSE '❌ Missing functions: ' || (27 - COUNT(*))::TEXT
  END AS status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_customer_updated_at', 'update_customer_outstanding_balance',
    'update_customer_clv_metrics', 'check_customer_credit_limit',
    'update_customer_tier', 'get_customer_summary',
    'update_supplier_updated_at', 'update_supplier_outstanding_balance',
    'update_supplier_purchase_metrics', 'check_supplier_credit_limit',
    'generate_supplier_code', 'get_supplier_summary',
    'get_top_suppliers', 'get_suppliers_by_category',
    'update_expense_updated_at', 'calculate_expense_totals',
    'get_expense_summary',
    'update_income_updated_at', 'calculate_income_totals',
    'calculate_income_profit', 'get_revenue_summary',
    'get_piutang_aging',
    'update_loan_updated_at', 'generate_loan_repayment_schedule',
    'get_loan_summary',
    'update_investment_updated_at', 'calculate_investment_roi',
    'get_investment_summary'
  );

\echo ''

-- =====================================================
-- SECTION 5: INDEXES
-- =====================================================
\echo '5️⃣  CHECKING INDEXES...'
\echo ''

SELECT 
  tablename,
  COUNT(*) AS index_count
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'expenses', 'expense_items',
    'suppliers',
    'customers',
    'incomes', 'income_items',
    'loans', 'loan_installments',
    'investments', 'profit_sharing_history'
  )
GROUP BY tablename
ORDER BY tablename;

SELECT 
  CASE 
    WHEN COUNT(*) >= 128 THEN '✅ All indexes exist (' || COUNT(*) || '/128+)'
    ELSE '⚠️  Indexes: ' || COUNT(*) || ' (expected 128+)'
  END AS status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'expenses', 'expense_items',
    'suppliers',
    'customers',
    'incomes', 'income_items',
    'loans', 'loan_installments',
    'investments', 'profit_sharing_history'
  );

\echo ''

-- =====================================================
-- SECTION 6: CONSTRAINTS
-- =====================================================
\echo '6️⃣  CHECKING CONSTRAINTS...'
\echo ''

SELECT 
  table_name,
  COUNT(*) AS constraint_count
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name IN (
    'expenses', 'expense_items',
    'suppliers',
    'customers',
    'incomes', 'income_items',
    'loans', 'loan_installments',
    'investments', 'profit_sharing_history'
  )
GROUP BY table_name
ORDER BY table_name;

SELECT 
  CASE 
    WHEN COUNT(*) >= 91 THEN '✅ All constraints exist (' || COUNT(*) || '/91+)'
    ELSE '⚠️  Constraints: ' || COUNT(*) || ' (expected 91+)'
  END AS status
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name IN (
    'expenses', 'expense_items',
    'suppliers',
    'customers',
    'incomes', 'income_items',
    'loans', 'loan_installments',
    'investments', 'profit_sharing_history'
  );

\echo ''

-- =====================================================
-- SECTION 7: VIEWS
-- =====================================================
\echo '7️⃣  CHECKING VIEWS...'
\echo ''

SELECT 
  table_name AS view_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN (
    'active_customers_summary',
    'customers_with_outstanding',
    'my_customers_list',
    'active_suppliers_summary',
    'suppliers_with_outstanding',
    'my_suppliers_list'
  )
ORDER BY table_name;

SELECT 
  CASE 
    WHEN COUNT(*) >= 6 THEN '✅ All views exist (' || COUNT(*) || '/6+)'
    ELSE '⚠️  Views: ' || COUNT(*) || ' (expected 6+)'
  END AS status
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN (
    'active_customers_summary',
    'customers_with_outstanding',
    'my_customers_list',
    'active_suppliers_summary',
    'suppliers_with_outstanding',
    'my_suppliers_list'
  );

\echo ''

-- =====================================================
-- SECTION 8: DATA OVERVIEW
-- =====================================================
\echo '8️⃣  DATA OVERVIEW...'
\echo ''

SELECT 'expenses' AS table_name, COUNT(*) AS row_count FROM expenses
UNION ALL
SELECT 'expense_items', COUNT(*) FROM expense_items
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'incomes', COUNT(*) FROM incomes
UNION ALL
SELECT 'income_items', COUNT(*) FROM income_items
UNION ALL
SELECT 'loans', COUNT(*) FROM loans
UNION ALL
SELECT 'loan_installments', COUNT(*) FROM loan_installments
UNION ALL
SELECT 'investments', COUNT(*) FROM investments
UNION ALL
SELECT 'profit_sharing_history', COUNT(*) FROM profit_sharing_history
ORDER BY table_name;

\echo ''

-- =====================================================
-- SECTION 9: REVENUE & EXPENSE SUMMARY (if data exists)
-- =====================================================
\echo '9️⃣  REVENUE & EXPENSE SUMMARY...'
\echo ''

DO $$
DECLARE
  income_count INTEGER;
  expense_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO income_count FROM incomes LIMIT 1;
  SELECT COUNT(*) INTO expense_count FROM expenses LIMIT 1;
  
  IF income_count > 0 OR expense_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE 'Revenue by Type:';
  ELSE
    RAISE NOTICE 'No data found - skipping summary queries';
  END IF;
END $$;

-- Revenue by income_type (only if data exists)
SELECT 
  income_type,
  COUNT(*) AS count,
  SUM(grand_total) AS total_revenue
FROM incomes
GROUP BY income_type
ORDER BY total_revenue DESC;

\echo ''

-- Expenses by expense_type (only if data exists)
SELECT 
  expense_type,
  COUNT(*) AS count,
  SUM(grand_total) AS total_expenses
FROM expenses
GROUP BY expense_type
ORDER BY total_expenses DESC;

\echo ''

-- =====================================================
-- SECTION 10: PIUTANG (AR) AGING (if data exists)
-- =====================================================
\echo '🔟 PIUTANG (AR) AGING...'
\echo ''

SELECT 
  payment_status,
  COUNT(*) AS count,
  SUM(remaining_payment) AS total_piutang
FROM incomes
WHERE payment_status IN ('unpaid', 'partial')
GROUP BY payment_status
ORDER BY payment_status;

\echo ''

-- =====================================================
-- SECTION 11: HUTANG (AP) OVERVIEW (if data exists)
-- =====================================================
\echo '1️⃣1️⃣  HUTANG (AP) OVERVIEW...'
\echo ''

SELECT 
  payment_status,
  COUNT(*) AS count,
  SUM(remaining_payment) AS total_hutang
FROM expenses
WHERE payment_status IN ('unpaid', 'partial')
GROUP BY payment_status
ORDER BY payment_status;

\echo ''

-- =====================================================
-- SECTION 12: FUNCTIONAL TEST NOTES
-- =====================================================
\echo '1️⃣2️⃣  FUNCTIONAL TEST (manual after authentication)...'
\echo ''
\echo '   To test FINANCE domain functions:'
\echo ''
\echo '   -- Create test customer'
\echo '   INSERT INTO customers (owner_id, name, phone)'
\echo '   VALUES (auth.uid(), ''Test Customer'', ''628123456789'');'
\echo ''
\echo '   -- Create test supplier'
\echo '   INSERT INTO suppliers (owner_id, name, phone)'
\echo '   VALUES (auth.uid(), ''Test Supplier'', ''628987654321'');'
\echo ''
\echo '   -- Create test income'
\echo '   INSERT INTO incomes (owner_id, income_type, income_category, grand_total)'
\echo '   VALUES (auth.uid(), ''operating'', ''product_sales'', 100000);'
\echo ''
\echo '   -- Create test expense'
\echo '   INSERT INTO expenses (owner_id, expense_type, expense_category, grand_total)'
\echo '   VALUES (auth.uid(), ''operating'', ''raw_materials'', 50000);'
\echo ''
\echo '   -- Test revenue summary'
\echo '   SELECT * FROM get_revenue_summary(auth.uid());'
\echo ''
\echo '   -- Test expense summary'
\echo '   SELECT * FROM get_expense_summary(auth.uid());'
\echo ''
\echo '   -- Clean up test data'
\echo '   DELETE FROM incomes WHERE owner_id = auth.uid() AND grand_total = 100000;'
\echo '   DELETE FROM expenses WHERE owner_id = auth.uid() AND grand_total = 50000;'
\echo '   DELETE FROM customers WHERE owner_id = auth.uid() AND name = ''Test Customer'';'
\echo '   DELETE FROM suppliers WHERE owner_id = auth.uid() AND name = ''Test Supplier'';'
\echo ''

-- =====================================================
-- SECTION 13: PERFORMANCE CHECK
-- =====================================================
\echo '1️⃣3️⃣  PERFORMANCE CHECK...'
\echo ''
\echo '   Sample queries with EXPLAIN ANALYZE (run manually):'
\echo ''

DO $$
DECLARE
  income_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO income_count FROM incomes LIMIT 1;
  
  IF income_count > 0 THEN
    RAISE NOTICE 'Data exists - run these queries:';
    RAISE NOTICE '';
    RAISE NOTICE 'EXPLAIN ANALYZE SELECT * FROM get_revenue_summary(auth.uid());';
    RAISE NOTICE 'EXPLAIN ANALYZE SELECT * FROM get_piutang_aging(auth.uid());';
    RAISE NOTICE 'EXPLAIN ANALYZE SELECT * FROM get_customer_summary(auth.uid(), NULL);';
    RAISE NOTICE 'EXPLAIN ANALYZE SELECT * FROM get_supplier_summary(auth.uid(), NULL);';
  ELSE
    RAISE NOTICE 'No data found - add data first before running performance tests';
  END IF;
END $$;

\echo ''

-- =====================================================
-- SECTION 14: SUMMARY
-- =====================================================
\echo '================================================='
\echo 'HEALTH CHECK SUMMARY'
\echo '================================================='
\echo ''

SELECT 
  '✅ FINANCE Domain Health Check Complete' AS status,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('expenses', 'expense_items', 'suppliers', 'customers', 'incomes', 'income_items', 'loans', 'loan_installments', 'investments', 'profit_sharing_history')) AS tables_count,
  (SELECT COUNT(*) FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename IN ('expenses', 'expense_items', 'suppliers', 'customers', 'incomes', 'income_items', 'loans', 'loan_installments', 'investments', 'profit_sharing_history')) AS policies_count,
  (SELECT COUNT(*) FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name IN (
     'update_customer_updated_at', 'update_customer_outstanding_balance',
     'update_supplier_updated_at', 'update_supplier_outstanding_balance',
     'update_expense_updated_at', 'calculate_expense_totals',
     'update_income_updated_at', 'calculate_income_totals',
     'update_loan_updated_at', 'generate_loan_repayment_schedule',
     'update_investment_updated_at', 'calculate_investment_roi'
   )) AS functions_count,
  (SELECT COUNT(*) FROM information_schema.views 
   WHERE table_schema = 'public' 
   AND table_name IN ('active_customers_summary', 'customers_with_outstanding', 'my_customers_list', 'active_suppliers_summary', 'suppliers_with_outstanding', 'my_suppliers_list')) AS views_count,
  (SELECT COUNT(*) FROM pg_indexes 
   WHERE schemaname = 'public' 
   AND tablename IN ('expenses', 'expense_items', 'suppliers', 'customers', 'incomes', 'income_items', 'loans', 'loan_installments', 'investments', 'profit_sharing_history')) AS indexes_count;

\echo ''
\echo 'Next Steps:'
\echo '1. Run functional tests (Section 12) after authentication'
\echo '2. Run performance tests (Section 13) with real data'
\echo '3. Check integration with INVENTORY domain (if deployed)'
\echo '4. Monitor query performance in production'
\echo ''
\echo '================================================='
\echo 'END OF HEALTH CHECK'
\echo '================================================='
