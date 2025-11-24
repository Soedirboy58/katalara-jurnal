-- =====================================================
-- USER PROFILES & ROLES SCHEMA
-- Extends Supabase Auth with business information
-- Note: Assumes 01_schema.sql has been run (business_categories table exists)
-- =====================================================

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  business_name TEXT,
  business_category_id INT REFERENCES business_categories(id),
  
  -- Status flags
  is_verified BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Role (redundant with auth.users metadata, but easier to query)
  role TEXT DEFAULT 'user' CHECK (role IN ('super_admin', 'user')),
  
  -- Metadata
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  notes TEXT, -- Admin notes
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_category ON user_profiles(business_category_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_approved ON user_profiles(is_approved);

-- 4. RLS Policies for user_profiles

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own profile (during registration)
CREATE POLICY "Users can create own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Super admins can view all profiles
CREATE POLICY "Super admins view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Super admins can update any profile (for approval)
CREATE POLICY "Super admins update all profiles"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- 5. RLS Policies for business_categories (skip if already defined in 02_rls_policies.sql)
-- ALTER TABLE business_categories ENABLE ROW LEVEL SECURITY;
-- 
-- DROP POLICY IF EXISTS "Anyone can view active categories" ON business_categories;
-- CREATE POLICY "Anyone can view active categories"
--   ON business_categories FOR SELECT
--   USING (true);

-- 6. Function to auto-create profile after user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Function to update updated_at timestamp (use existing one from 01_schema.sql if available)
CREATE OR REPLACE FUNCTION update_updated_at_user_profiles()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger for user_profiles updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_user_profiles();

-- 10. Function to get user with profile
CREATE OR REPLACE FUNCTION get_user_with_profile()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  business_name TEXT,
  business_category TEXT,
  role TEXT,
  is_verified BOOLEAN,
  is_approved BOOLEAN,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.email,
    p.full_name,
    p.phone,
    p.address,
    p.business_name,
    bc.name as business_category,
    p.role,
    p.is_verified,
    p.is_approved,
    p.is_active
  FROM auth.users u
  LEFT JOIN user_profiles p ON u.id = p.user_id
  LEFT JOIN business_categories bc ON p.business_category_id = bc.id
  WHERE u.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Update existing tables (skip for now - will be added when products table is created)
-- DO $$ 
-- BEGIN
--   IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
--     ALTER TABLE products ADD COLUMN IF NOT EXISTS business_name TEXT;
--   END IF;
-- END $$;

-- 12. Create view for admin dashboard
CREATE OR REPLACE VIEW admin_users_overview AS
SELECT
  u.id as user_id,
  u.email,
  u.created_at as registered_at,
  p.full_name,
  p.phone,
  p.business_name,
  bc.name as business_category,
  p.is_verified,
  p.is_approved,
  p.is_active,
  p.approved_at,
  approver.full_name as approved_by_name,
  0 as total_products,
  0 as total_transactions
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.user_id
LEFT JOIN business_categories bc ON p.business_category_id = bc.id
LEFT JOIN user_profiles approver ON p.approved_by = approver.user_id
WHERE p.role = 'user'
ORDER BY u.created_at DESC;

-- Grant access to view for super admins
GRANT SELECT ON admin_users_overview TO authenticated;

-- 13. Create first super admin (CHANGE EMAIL!)
-- Run this manually after deployment:
-- INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_user_meta_data)
-- VALUES ('admin@katalara.com', crypt('your-secure-password', gen_salt('bf')), NOW(), '{"role": "super_admin"}');

-- =====================================================
-- NOTES:
-- 1. After running this migration, create first super admin manually
-- 2. Regular users register through the app (role = 'user' by default)
-- 3. Super admin can approve users via admin dashboard
-- 4. Email verification handled by Supabase Auth
-- =====================================================
