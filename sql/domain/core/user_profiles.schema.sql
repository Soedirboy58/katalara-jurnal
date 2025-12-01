-- =====================================================
-- DOMAIN: CORE
-- TABLE: user_profiles
-- PURPOSE: User identity & business profile management
-- =====================================================

-- =====================================================
-- TABLE: user_profiles
-- Extends Supabase auth.users with business information
-- =====================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal Information
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  
  -- Business Information
  business_name TEXT,
  business_category_id INT, -- Legacy: References business_categories (if exists)
  
  -- Status Flags
  is_verified BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Role Management
  role TEXT DEFAULT 'user' CHECK (role IN ('super_admin', 'user')),
  
  -- Approval Tracking
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  notes TEXT, -- Admin notes for approval/rejection
  
  -- Approval Logic Constraint
  CONSTRAINT chk_user_profiles_approval_logic CHECK (
    (is_approved = false AND approved_by IS NULL) OR
    (is_approved = true AND approved_by IS NOT NULL)
  ),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BASIC INDEXES (More in user_profiles.index.sql)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================
COMMENT ON TABLE user_profiles IS 'User identity and business profile extending Supabase auth.users';
COMMENT ON COLUMN user_profiles.user_id IS 'Foreign key to auth.users - one profile per user';
COMMENT ON COLUMN user_profiles.role IS 'User role: super_admin (platform admin) or user (business owner)';
COMMENT ON COLUMN user_profiles.is_verified IS 'Email/phone verification status';
COMMENT ON COLUMN user_profiles.is_approved IS 'Admin approval status for platform access';
COMMENT ON COLUMN user_profiles.is_active IS 'Account active status (can be deactivated by admin)';
COMMENT ON COLUMN user_profiles.business_category_id IS 'Legacy: FK to business_categories (deprecated - use business_configurations)';
COMMENT ON COLUMN user_profiles.approved_by IS 'Admin user_id who approved this account';
COMMENT ON COLUMN user_profiles.notes IS 'Internal notes for admin approval process';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ CORE Domain - User Profiles Schema Created';
  RAISE NOTICE '   - Table: user_profiles (user identity & business info)';
  RAISE NOTICE '   - Features: Role management, approval workflow, status tracking';
  RAISE NOTICE '   - Links to: auth.users (Supabase auth)';
END $$;
