-- =====================================================
-- KATALARA PLATFORM - COMPLETE DATABASE MIGRATION
-- Run this file in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PART 1: BUSINESS CATEGORIES (from 01_schema.sql)
-- =====================================================
CREATE TABLE IF NOT EXISTS business_categories (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE,
  name TEXT NOT NULL
);

-- Seed kategori umum nasional
INSERT INTO business_categories (code, name) VALUES
  ('fnb','Makanan & Minuman'),
  ('fashion','Fashion & Apparel'),
  ('agrikultur','Agrikultur'),
  ('jasa','Jasa'),
  ('kerajinan','Kerajinan'),
  ('kosmetik','Kosmetik & Kecantikan'),
  ('otomotif','Otomotif'),
  ('ritel','Ritel'),
  ('teknologi','Produk Digital'),
  ('pendidikan','Pendidikan')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- PART 2: USER PROFILES & ROLES
-- =====================================================
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
  is_approved BOOLEAN DEFAULT TRUE,  -- Default TRUE agar user langsung bisa login
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Role
  role TEXT DEFAULT 'user' CHECK (role IN ('super_admin', 'user')),
  
  -- Metadata
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_category ON user_profiles(business_category_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_approved ON user_profiles(is_approved);

-- =====================================================
-- PART 3: RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_categories ENABLE ROW LEVEL SECURITY;

-- Business categories: Everyone can read
DROP POLICY IF EXISTS "Anyone can view categories" ON business_categories;
CREATE POLICY "Anyone can view categories"
  ON business_categories FOR SELECT
  TO public
  USING (true);

-- User profiles: Users can view their own
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own profile
DROP POLICY IF EXISTS "Users can create own profile" ON user_profiles;
CREATE POLICY "Users can create own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Super admins can view all
DROP POLICY IF EXISTS "Super admins view all profiles" ON user_profiles;
CREATE POLICY "Super admins view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Super admins can update any profile
DROP POLICY IF EXISTS "Super admins update all profiles" ON user_profiles;
CREATE POLICY "Super admins update all profiles"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- =====================================================
-- PART 4: FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Auto-create profile for new users
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

-- Trigger: Auto-create profile on user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_user_profiles()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_user_profiles();

-- =====================================================
-- PART 5: HELPER FUNCTIONS
-- =====================================================

-- Function: Get current user with profile
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

-- =====================================================
-- PART 6: VIEWS
-- =====================================================

-- Drop existing view if exists
DROP VIEW IF EXISTS admin_users_overview;

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
  approver.full_name as approved_by_name
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.user_id
LEFT JOIN business_categories bc ON p.business_category_id = bc.id
LEFT JOIN user_profiles approver ON p.approved_by = approver.user_id
WHERE p.role = 'user'
ORDER BY u.created_at DESC;

GRANT SELECT ON admin_users_overview TO authenticated;

-- =====================================================
-- PART 7: FIX EXISTING USERS
-- Create profiles for existing auth.users who don't have profiles
-- =====================================================

INSERT INTO user_profiles (user_id, full_name, phone, role, is_approved)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  COALESCE(u.raw_user_meta_data->>'phone', ''),
  COALESCE(u.raw_user_meta_data->>'role', 'user'),
  true  -- Auto-approve existing users
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles p WHERE p.user_id = u.id
);

-- =====================================================
-- DONE! ✅
-- Next steps:
-- 1. Test login with existing account
-- 2. Test registration flow
-- 3. Create super_admin user if needed
-- =====================================================
