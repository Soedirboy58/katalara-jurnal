-- Schema audit: income vs transactions
-- Run this in Supabase SQL Editor, then copy/paste results here.

-- 1) What tables exist in public?
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2) Tables that look like income/sales/transaction modules
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND (
    table_name ILIKE '%income%'
    OR table_name ILIKE '%sales%'
    OR table_name ILIKE '%transaction%'
    OR table_name ILIKE '%invoice%'
    OR table_name ILIKE '%payment%'
    OR table_name ILIKE '%customer%'
    OR table_name ILIKE '%product%'
    OR table_name ILIKE '%stock%'
  )
ORDER BY table_name;

-- 3) Column inventory for the key tables (if they exist)
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'income',
    'income_items',
    'sales',
    'sale_items',
    'transactions',
    'transaction_items',
    'payments',
    'customers',
    'products',
    'stock_movements'
  )
ORDER BY table_name, ordinal_position;

-- 4) Ownership columns present across tables (owner_id vs user_id)
SELECT c.table_name,
       MAX(CASE WHEN c.column_name = 'user_id' THEN 1 ELSE 0 END) AS has_user_id,
       MAX(CASE WHEN c.column_name = 'owner_id' THEN 1 ELSE 0 END) AS has_owner_id
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name IN (
    'income','income_items','sales','sale_items',
    'transactions','transaction_items','payments',
    'customers','products','stock_movements'
  )
GROUP BY c.table_name
ORDER BY c.table_name;

-- 5) Which "transactions" columns required by Next.js are missing?
WITH required AS (
  SELECT 'transactions'::text AS table_name, 'id'::text AS column_name UNION ALL
  SELECT 'transactions', 'user_id' UNION ALL
  SELECT 'transactions', 'owner_id' UNION ALL
  SELECT 'transactions', 'invoice_number' UNION ALL
  SELECT 'transactions', 'transaction_date' UNION ALL
  SELECT 'transactions', 'customer_id' UNION ALL
  SELECT 'transactions', 'customer_name' UNION ALL
  SELECT 'transactions', 'payment_type' UNION ALL
  SELECT 'transactions', 'subtotal' UNION ALL
  SELECT 'transactions', 'discount_type' UNION ALL
  SELECT 'transactions', 'discount_value' UNION ALL
  SELECT 'transactions', 'discount_amount' UNION ALL
  SELECT 'transactions', 'ppn_rate' UNION ALL
  SELECT 'transactions', 'ppn_amount' UNION ALL
  SELECT 'transactions', 'total' UNION ALL
  SELECT 'transactions', 'paid_amount' UNION ALL
  SELECT 'transactions', 'remaining_amount' UNION ALL
  SELECT 'transactions', 'payment_status' UNION ALL
  SELECT 'transactions', 'created_at' UNION ALL
  SELECT 'transactions', 'updated_at'
), present AS (
  SELECT c.table_name, c.column_name
  FROM information_schema.columns c
  WHERE c.table_schema='public'
)
SELECT r.table_name,
       r.column_name,
       CASE WHEN p.column_name IS NOT NULL THEN true ELSE false END AS exists
FROM required r
LEFT JOIN present p
  ON p.table_name = r.table_name AND p.column_name = r.column_name
ORDER BY r.table_name, r.column_name;

-- 6) Indexes currently present on transactions (helps explain failing CREATE INDEX)
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname='public' AND tablename IN ('transactions','transaction_items','products','customers')
ORDER BY tablename, indexname;

-- 7) Relevant RPC/functions present
SELECT n.nspname AS schema_name,
       p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS args,
       pg_get_function_result(p.oid) AS returns
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname IN ('public')
  AND p.proname IN ('generate_invoice_number', 'adjust_stock')
ORDER BY schema_name, function_name;
