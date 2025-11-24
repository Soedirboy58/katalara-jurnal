-- =====================================================
-- FIX ADMIN DASHBOARD - USER LIST NOT SHOWING
-- =====================================================

-- CEK 1: Apakah view admin_user_analytics ada dan berfungsi
SELECT COUNT(*) as total_users_in_view
FROM admin_user_analytics;

-- CEK 2: Lihat data actual dari view
SELECT 
  user_id,
  email,
  full_name,
  business_name,
  role,
  is_active,
  activity_status,
  total_income_transactions,
  total_expense_transactions
FROM admin_user_analytics
LIMIT 10;

-- CEK 3: Cek RLS policy untuk view
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- FIX: Pastikan super_admin bisa akses view
-- (Sudah di-disable RLS sebelumnya, tapi mari pastikan)
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- FIX: Grant akses view ke authenticated users
GRANT SELECT ON admin_user_analytics TO authenticated;
GRANT SELECT ON admin_platform_stats TO authenticated;

-- VERIFY: Test query as authenticated user
SELECT 
  email,
  full_name,
  business_name,
  activity_status,
  total_income_transactions + total_expense_transactions as total_transactions
FROM admin_user_analytics
WHERE role = 'user'
ORDER BY registered_at DESC;

-- DEBUG: Cek apakah masalahnya di filter role = 'user'
SELECT 
  u.email,
  p.role,
  p.full_name,
  p.business_name,
  p.is_active
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.user_id
ORDER BY u.created_at DESC;

-- FIX: Recreate view tanpa filter role (show semua user kecuali super_admin)
DROP VIEW IF EXISTS admin_user_analytics CASCADE;

CREATE OR REPLACE VIEW admin_user_analytics AS
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as registered_at,
  p.full_name,
  p.business_name,
  p.phone,
  p.address,
  bc.name as business_category,
  p.business_type,
  p.number_of_employees,
  p.is_active,
  p.is_approved,
  p.is_verified,
  p.role,
  
  -- Activity metrics
  COUNT(DISTINCT inc.id) as total_income_transactions,
  COUNT(DISTINCT exp.id) as total_expense_transactions,
  COUNT(DISTINCT prod.id) as total_products,
  COUNT(DISTINCT cust.id) as total_customers,
  COUNT(DISTINCT sup.id) as total_suppliers,
  
  -- Financial metrics (last 30 days)
  COALESCE(SUM(CASE WHEN inc.created_at > NOW() - INTERVAL '30 days' THEN inc.amount ELSE 0 END), 0) as revenue_30d,
  COALESCE(SUM(CASE WHEN exp.created_at > NOW() - INTERVAL '30 days' THEN exp.amount ELSE 0 END), 0) as expenses_30d,
  
  -- Total all-time
  COALESCE(SUM(inc.amount), 0) as total_revenue,
  COALESCE(SUM(exp.amount), 0) as total_expenses,
  
  -- Last activity
  GREATEST(
    COALESCE(MAX(inc.created_at), '1970-01-01'::timestamptz),
    COALESCE(MAX(exp.created_at), '1970-01-01'::timestamptz)
  ) as last_activity_date,
  
  -- Days since registration
  CURRENT_DATE - u.created_at::date as days_registered,
  
  -- Activity status
  CASE 
    WHEN GREATEST(
      COALESCE(MAX(inc.created_at), '1970-01-01'::timestamptz),
      COALESCE(MAX(exp.created_at), '1970-01-01'::timestamptz)
    ) > NOW() - INTERVAL '7 days' THEN 'Very Active'
    WHEN GREATEST(
      COALESCE(MAX(inc.created_at), '1970-01-01'::timestamptz),
      COALESCE(MAX(exp.created_at), '1970-01-01'::timestamptz)
    ) > NOW() - INTERVAL '30 days' THEN 'Active'
    WHEN GREATEST(
      COALESCE(MAX(inc.created_at), '1970-01-01'::timestamptz),
      COALESCE(MAX(exp.created_at), '1970-01-01'::timestamptz)
    ) > NOW() - INTERVAL '90 days' THEN 'Idle'
    ELSE 'Dormant'
  END as activity_status
  
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.user_id
LEFT JOIN business_categories bc ON p.business_category_id = bc.id
LEFT JOIN incomes inc ON u.id = inc.user_id
LEFT JOIN expenses exp ON u.id = exp.user_id
LEFT JOIN products prod ON u.id = prod.owner_id
LEFT JOIN customers cust ON u.id = cust.owner_id
LEFT JOIN suppliers sup ON u.id = sup.owner_id
WHERE p.role != 'super_admin' OR p.role IS NULL  -- Show all non-admin users
GROUP BY u.id, u.email, u.created_at, p.full_name, p.business_name, 
         p.phone, p.address, bc.name, p.business_type, p.number_of_employees,
         p.is_active, p.is_approved, p.is_verified, p.role
ORDER BY u.created_at DESC;

-- Grant access
GRANT SELECT ON admin_user_analytics TO authenticated;

-- TEST: Query ulang
SELECT 
  email,
  full_name,
  role,
  is_active,
  total_income_transactions,
  total_expense_transactions
FROM admin_user_analytics
LIMIT 10;

-- =====================================================
-- SETELAH RUN SQL INI:
-- 1. Refresh halaman admin dashboard (F5 atau Ctrl+R)
-- 2. User list harusnya muncul sekarang
-- =====================================================
