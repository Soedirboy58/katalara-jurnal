-- =====================================================
-- ADMIN PANEL SETUP
-- Create views and functions for admin monitoring
-- =====================================================

-- 1. Create comprehensive user analytics view
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
WHERE p.role = 'user' OR p.role IS NULL
GROUP BY u.id, u.email, u.created_at, p.full_name, p.business_name, 
         p.phone, p.address, bc.name, p.business_type, p.number_of_employees,
         p.is_active, p.is_approved, p.is_verified, p.role
ORDER BY u.created_at DESC;

-- Grant access to authenticated users (will be protected by RLS)
GRANT SELECT ON admin_user_analytics TO authenticated;

-- 2. Create admin statistics view
CREATE OR REPLACE VIEW admin_platform_stats AS
SELECT
  -- User counts
  (SELECT COUNT(*) FROM user_profiles WHERE role = 'user') as total_users,
  (SELECT COUNT(*) FROM user_profiles WHERE role = 'user' AND is_active = true) as active_users,
  (SELECT COUNT(*) FROM user_profiles WHERE role = 'user' AND is_approved = false) as pending_approval,
  (SELECT COUNT(*) FROM user_profiles WHERE role = 'user' AND created_at > NOW() - INTERVAL '1 day') as new_today,
  (SELECT COUNT(*) FROM user_profiles WHERE role = 'user' AND created_at > NOW() - INTERVAL '7 days') as new_this_week,
  (SELECT COUNT(*) FROM user_profiles WHERE role = 'user' AND created_at > NOW() - INTERVAL '30 days') as new_this_month,
  
  -- Transaction counts (last 30 days)
  (SELECT COUNT(*) FROM incomes WHERE created_at > NOW() - INTERVAL '30 days') as income_transactions_30d,
  (SELECT COUNT(*) FROM expenses WHERE created_at > NOW() - INTERVAL '30 days') as expense_transactions_30d,
  
  -- Financial totals (last 30 days)
  (SELECT COALESCE(SUM(amount), 0) FROM incomes WHERE created_at > NOW() - INTERVAL '30 days') as total_revenue_30d,
  (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE created_at > NOW() - INTERVAL '30 days') as total_expenses_30d,
  
  -- Product & customer counts
  (SELECT COUNT(*) FROM products) as total_products,
  (SELECT COUNT(*) FROM customers) as total_customers,
  (SELECT COUNT(*) FROM suppliers) as total_suppliers,
  
  -- Feature adoption
  (SELECT COUNT(DISTINCT user_id) FROM incomes) as users_with_income,
  (SELECT COUNT(DISTINCT user_id) FROM expenses) as users_with_expenses,
  (SELECT COUNT(DISTINCT owner_id) FROM products) as users_with_products,
  (SELECT COUNT(DISTINCT owner_id) FROM customers) as users_with_customers,
  
  -- Calculate percentages
  CASE 
    WHEN (SELECT COUNT(*) FROM user_profiles WHERE role = 'user') > 0 
    THEN ROUND((SELECT COUNT(DISTINCT user_id)::numeric FROM incomes) / (SELECT COUNT(*)::numeric FROM user_profiles WHERE role = 'user') * 100, 1)
    ELSE 0 
  END as income_adoption_rate,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM user_profiles WHERE role = 'user') > 0 
    THEN ROUND((SELECT COUNT(DISTINCT user_id)::numeric FROM expenses) / (SELECT COUNT(*)::numeric FROM user_profiles WHERE role = 'user') * 100, 1)
    ELSE 0 
  END as expense_adoption_rate;

-- Grant access to authenticated users (will be protected by RLS)
GRANT SELECT ON admin_platform_stats TO authenticated;

-- 3. Create RLS policy for admin views (only super_admin can access)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy untuk admin view access
CREATE POLICY "Super admins can view admin analytics"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'super_admin'
    )
  );

-- 4. Create function to approve user
CREATE OR REPLACE FUNCTION approve_user(
  target_user_id UUID,
  admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- Get current admin user_id
  admin_id := auth.uid();
  
  -- Verify caller is super_admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = admin_id AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only super_admin can approve users';
  END IF;
  
  -- Update target user
  UPDATE user_profiles
  SET 
    is_approved = true,
    approved_by = admin_id,
    approved_at = NOW(),
    notes = COALESCE(admin_notes, notes)
  WHERE user_id = target_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to suspend user
CREATE OR REPLACE FUNCTION suspend_user(
  target_user_id UUID,
  reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- Get current admin user_id
  admin_id := auth.uid();
  
  -- Verify caller is super_admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = admin_id AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only super_admin can suspend users';
  END IF;
  
  -- Update target user
  UPDATE user_profiles
  SET 
    is_active = false,
    notes = COALESCE(reason, notes)
  WHERE user_id = target_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to reactivate user
CREATE OR REPLACE FUNCTION activate_user(
  target_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- Get current admin user_id
  admin_id := auth.uid();
  
  -- Verify caller is super_admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = admin_id AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only super_admin can activate users';
  END IF;
  
  -- Update target user
  UPDATE user_profiles
  SET is_active = true
  WHERE user_id = target_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- NOTES:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Create first super admin manually:
--    a. Register via /signup with your email
--    b. Run: UPDATE user_profiles SET role = 'super_admin' WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
-- 3. Login again to access /admin routes
-- =====================================================
