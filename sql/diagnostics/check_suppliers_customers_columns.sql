-- =====================================================
-- DIAGNOSTIC: Check Suppliers & Customers Columns
-- Cek struktur kolom untuk debugging
-- =====================================================

-- Cek kolom di table suppliers
SELECT 
  'SUPPLIERS' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'suppliers'
  AND column_name IN ('id', 'user_id', 'owner_id', 'name')
ORDER BY ordinal_position;

-- Cek kolom di table customers
SELECT 
  'CUSTOMERS' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'customers'
  AND column_name IN ('id', 'user_id', 'owner_id', 'name')
ORDER BY ordinal_position;

-- Cek semua indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('suppliers', 'customers')
  AND (indexdef LIKE '%user_id%' OR indexdef LIKE '%owner_id%')
ORDER BY tablename, indexname;

-- Count data
SELECT 'Suppliers' as table_name, COUNT(*) as total_records FROM suppliers
UNION ALL
SELECT 'Customers' as table_name, COUNT(*) as total_records FROM customers;
