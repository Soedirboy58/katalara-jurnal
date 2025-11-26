-- =====================================================
-- DOMAIN: CORE
-- TABLE: user_profiles
-- INDEXES & CONSTRAINTS (Performance Optimization)
-- =====================================================

-- =====================================================
-- PART 1: PERFORMANCE INDEXES
-- =====================================================

-- Index 1: User ID lookup (primary foreign key - already created in schema)
-- CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Index 2: Role-based queries
-- CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Index 3: Active users lookup
CREATE INDEX IF NOT EXISTS idx_user_profiles_active
  ON user_profiles(user_id, is_active)
  WHERE is_active = TRUE;

-- Index 4: Pending approval (admin dashboard)
CREATE INDEX IF NOT EXISTS idx_user_profiles_pending_approval
  ON user_profiles(is_approved, created_at)
  WHERE is_approved = FALSE AND role = 'user';

-- Index 5: Approved users lookup
CREATE INDEX IF NOT EXISTS idx_user_profiles_approved
  ON user_profiles(is_approved, approved_at DESC)
  WHERE is_approved = TRUE;

-- Index 6: Business category lookup (legacy)
CREATE INDEX IF NOT EXISTS idx_user_profiles_category
  ON user_profiles(business_category_id)
  WHERE business_category_id IS NOT NULL;

-- Index 7: Verified users
CREATE INDEX IF NOT EXISTS idx_user_profiles_verified
  ON user_profiles(is_verified, user_id)
  WHERE is_verified = TRUE;

-- Index 8: Approver tracking (who approved which users)
CREATE INDEX IF NOT EXISTS idx_user_profiles_approved_by
  ON user_profiles(approved_by)
  WHERE approved_by IS NOT NULL;

-- Index 9: Full name search (for admin search)
CREATE INDEX IF NOT EXISTS idx_user_profiles_full_name
  ON user_profiles(full_name);

-- Index 10: Phone search (for admin lookup)
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone
  ON user_profiles(phone)
  WHERE phone IS NOT NULL AND phone != '';

-- Index 11: Business name search
CREATE INDEX IF NOT EXISTS idx_user_profiles_business_name
  ON user_profiles(business_name)
  WHERE business_name IS NOT NULL;

-- Index 12: Created date range (for analytics)
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at
  ON user_profiles(created_at DESC);

-- Index 13: Updated date (for change tracking)
CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at
  ON user_profiles(updated_at DESC);

-- Index 14: Combined: role + active + approved (admin filters)
CREATE INDEX IF NOT EXISTS idx_user_profiles_status_combo
  ON user_profiles(role, is_active, is_approved, created_at DESC);

-- =====================================================
-- PART 2: DATA INTEGRITY CONSTRAINTS
-- =====================================================

-- Constraint 1: Valid role values
-- Already enforced by CHECK constraint in schema

-- Constraint 2: Phone cannot be empty string (enforce NULL or valid value)
ALTER TABLE user_profiles
  ADD CONSTRAINT chk_user_profiles_phone_not_empty
  CHECK (phone IS NULL OR LENGTH(TRIM(phone)) > 0);

-- Constraint 3: Full name minimum length
ALTER TABLE user_profiles
  ADD CONSTRAINT chk_user_profiles_full_name_length
  CHECK (LENGTH(TRIM(full_name)) >= 2);

-- Constraint 4: Business name minimum length (if provided)
ALTER TABLE user_profiles
  ADD CONSTRAINT chk_user_profiles_business_name_length
  CHECK (business_name IS NULL OR LENGTH(TRIM(business_name)) >= 2);

-- Constraint 5: Approved_at must be set if is_approved = true
ALTER TABLE user_profiles
  ADD CONSTRAINT chk_user_profiles_approval_logic
  CHECK (
    (is_approved = FALSE) OR
    (is_approved = TRUE AND approved_at IS NOT NULL)
  );

-- Constraint 6: Approved_by must be set if is_approved = true
ALTER TABLE user_profiles
  ADD CONSTRAINT chk_user_profiles_approver_logic
  CHECK (
    (is_approved = FALSE) OR
    (is_approved = TRUE AND approved_by IS NOT NULL)
  );

-- Constraint 7: Cannot approve own account (except super_admin setup)
ALTER TABLE user_profiles
  ADD CONSTRAINT chk_user_profiles_no_self_approval
  CHECK (
    approved_by IS NULL OR
    approved_by != user_id OR
    role = 'super_admin' -- Allow for initial super_admin setup
  );

-- Constraint 8: Created_at cannot be in the future
ALTER TABLE user_profiles
  ADD CONSTRAINT chk_user_profiles_created_at_past
  CHECK (created_at <= NOW());

-- Constraint 9: Updated_at must be >= created_at
ALTER TABLE user_profiles
  ADD CONSTRAINT chk_user_profiles_updated_after_created
  CHECK (updated_at >= created_at);

-- Constraint 10: Approved_at must be >= created_at (if set)
ALTER TABLE user_profiles
  ADD CONSTRAINT chk_user_profiles_approved_after_created
  CHECK (
    approved_at IS NULL OR
    approved_at >= created_at
  );

-- =====================================================
-- PART 3: UNIQUE CONSTRAINTS
-- =====================================================

-- Unique 1: One profile per user (already enforced by UNIQUE on user_id in schema)
-- Unique 2: Prevent duplicate phone numbers (optional - uncomment if needed)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_phone_unique
--   ON user_profiles(phone)
--   WHERE phone IS NOT NULL AND phone != '';

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================

-- Performance indexes
COMMENT ON INDEX idx_user_profiles_active IS 'Fast lookup for active users';
COMMENT ON INDEX idx_user_profiles_pending_approval IS 'Admin dashboard: pending approvals';
COMMENT ON INDEX idx_user_profiles_approved IS 'Approved users sorted by approval date';
COMMENT ON INDEX idx_user_profiles_category IS 'Legacy: business category filter';
COMMENT ON INDEX idx_user_profiles_verified IS 'Verified users lookup';
COMMENT ON INDEX idx_user_profiles_approved_by IS 'Track which admin approved which users';
COMMENT ON INDEX idx_user_profiles_full_name IS 'Admin search by name';
COMMENT ON INDEX idx_user_profiles_phone IS 'Admin lookup by phone';
COMMENT ON INDEX idx_user_profiles_business_name IS 'Search businesses by name';
COMMENT ON INDEX idx_user_profiles_status_combo IS 'Combined status filters for admin dashboard';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ CORE Domain - User Profiles Indexes & Constraints Created';
  RAISE NOTICE '   - Performance Indexes: 14 (status filters, search, tracking)';
  RAISE NOTICE '   - Data Constraints: 10 (validation, logic checks, temporal rules)';
  RAISE NOTICE '   - Features: Approval workflow optimization, admin search, data integrity';
END $$;
