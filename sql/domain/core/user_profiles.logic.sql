-- =====================================================
-- DOMAIN: CORE
-- TABLE: user_profiles
-- LOGIC: Functions & Triggers
-- =====================================================

-- =====================================================
-- FUNCTION: Auto-create profile after user registration
-- Triggered when new user signs up via Supabase Auth
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    user_id,
    full_name,
    phone,
    role
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, ignore
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail auth
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_profiles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Get user with full profile
-- Returns combined auth.users + user_profiles data
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_with_profile(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  business_name TEXT,
  role TEXT,
  is_verified BOOLEAN,
  is_approved BOOLEAN,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.email::TEXT,
    p.full_name,
    p.phone,
    p.address,
    p.business_name,
    p.role,
    p.is_verified,
    p.is_approved,
    p.is_active,
    p.created_at
  FROM auth.users u
  LEFT JOIN user_profiles p ON u.id = p.user_id
  WHERE u.id = COALESCE(p_user_id, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Get pending approval users
-- For admin dashboard
-- =====================================================
CREATE OR REPLACE FUNCTION get_pending_approval_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  business_name TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Only super_admins can call this
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Permission denied: super_admin role required';
  END IF;
  
  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.email::TEXT,
    p.full_name,
    p.phone,
    p.business_name,
    p.created_at
  FROM auth.users u
  INNER JOIN user_profiles p ON u.id = p.user_id
  WHERE p.is_approved = FALSE
    AND p.role = 'user'
  ORDER BY p.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Approve user account
-- Admin function to approve pending users
-- =====================================================
CREATE OR REPLACE FUNCTION approve_user_account(
  p_user_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Verify caller is super_admin
  SELECT user_id INTO v_admin_id
  FROM user_profiles
  WHERE user_id = auth.uid()
    AND role = 'super_admin';
  
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Permission denied: super_admin role required';
  END IF;
  
  -- Update user profile
  UPDATE user_profiles
  SET
    is_approved = TRUE,
    approved_by = v_admin_id,
    approved_at = NOW(),
    notes = COALESCE(p_notes, notes),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Reject/Deactivate user account
-- Admin function to reject or deactivate users
-- =====================================================
CREATE OR REPLACE FUNCTION deactivate_user_account(
  p_user_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Verify caller is super_admin
  SELECT user_id INTO v_admin_id
  FROM user_profiles
  WHERE user_id = auth.uid()
    AND role = 'super_admin';
  
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Permission denied: super_admin role required';
  END IF;
  
  -- Update user profile
  UPDATE user_profiles
  SET
    is_active = FALSE,
    approved_by = v_admin_id,
    approved_at = NOW(),
    notes = COALESCE(p_notes, notes),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Get user statistics
-- For admin dashboard overview
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_statistics()
RETURNS TABLE (
  total_users BIGINT,
  pending_approval BIGINT,
  approved_users BIGINT,
  active_users BIGINT,
  inactive_users BIGINT,
  super_admins BIGINT
) AS $$
BEGIN
  -- Only super_admins can call this
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Permission denied: super_admin role required';
  END IF;
  
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_users,
    COUNT(*) FILTER (WHERE is_approved = FALSE AND role = 'user')::BIGINT AS pending_approval,
    COUNT(*) FILTER (WHERE is_approved = TRUE)::BIGINT AS approved_users,
    COUNT(*) FILTER (WHERE is_active = TRUE)::BIGINT AS active_users,
    COUNT(*) FILTER (WHERE is_active = FALSE)::BIGINT AS inactive_users,
    COUNT(*) FILTER (WHERE role = 'super_admin')::BIGINT AS super_admins
  FROM user_profiles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- TRIGGER 1: Auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- TRIGGER 2: Auto-update updated_at timestamp
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_timestamp();

-- =====================================================
-- VIEW: Admin Users Overview
-- Comprehensive view for admin dashboard
-- =====================================================
CREATE OR REPLACE VIEW admin_users_overview AS
SELECT
  u.id AS user_id,
  u.email,
  u.created_at AS registered_at,
  p.full_name,
  p.phone,
  p.address,
  p.business_name,
  p.role,
  p.is_verified,
  p.is_approved,
  p.is_active,
  p.approved_at,
  p.notes,
  approver.full_name AS approved_by_name,
  COALESCE(bc.onboarding_completed, FALSE) AS onboarding_completed
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.user_id
LEFT JOIN user_profiles approver ON p.approved_by = approver.user_id
LEFT JOIN business_configurations bc ON u.id = bc.user_id
WHERE p.role = 'user'
ORDER BY u.created_at DESC;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION handle_new_user IS 'Auto-create user_profiles record when new user signs up via Supabase Auth';
COMMENT ON FUNCTION get_user_with_profile IS 'Get combined auth.users + user_profiles data for current or specified user';
COMMENT ON FUNCTION get_pending_approval_users IS 'Admin function: List users waiting for approval';
COMMENT ON FUNCTION approve_user_account IS 'Admin function: Approve user account and grant platform access';
COMMENT ON FUNCTION deactivate_user_account IS 'Admin function: Deactivate user account';
COMMENT ON FUNCTION get_user_statistics IS 'Admin function: Get user statistics for dashboard';
COMMENT ON VIEW admin_users_overview IS 'Admin dashboard view with user details and approval status';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ CORE Domain - User Profiles Logic Created';
  RAISE NOTICE '   - Functions: 6 (profile management, approval workflow, statistics)';
  RAISE NOTICE '   - Triggers: 2 (auto-create profile, timestamp update)';
  RAISE NOTICE '   - View: admin_users_overview (admin dashboard)';
  RAISE NOTICE '   - Features: Auto profile creation, approval system, admin functions';
END $$;
