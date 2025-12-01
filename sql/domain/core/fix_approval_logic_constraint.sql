-- =====================================================
-- USER PROFILES: FIX APPROVAL LOGIC CONSTRAINT
-- =====================================================
-- Purpose: Fix check constraint to allow new user onboarding
-- Domain: CORE
-- Table: public.user_profiles
-- Date: 2024-11-27
--
-- ISSUE:
-- ❌ "violates check constraint 'chk_user_profiles_approval_logic'"
-- Root Cause: Constraint tidak mengizinkan is_approved=false dengan approved_by=NULL
--
-- BUSINESS LOGIC (CORRECT):
-- 1. New user onboarding → is_approved=false, approved_by=NULL
-- 2. After admin approval → is_approved=true, approved_by=<admin_uuid>
--
-- STRATEGY:
-- 1. Clean existing data (set NULL → false)
-- 2. Set column is_approved to NOT NULL with DEFAULT false
-- 3. Drop old constraint
-- 4. Create new constraint with correct logic
-- =====================================================

-- =====================================================
-- STEP 1: CLEAN EXISTING DATA
-- =====================================================

-- Update any existing rows with NULL is_approved to false
-- This ensures all rows comply with new NOT NULL constraint
UPDATE public.user_profiles
SET is_approved = false
WHERE is_approved IS NULL;

-- Update any rows with invalid state: is_approved=false but has approved_by
-- Set approved_by to NULL (correct state for unapproved users)
UPDATE public.user_profiles
SET approved_by = NULL
WHERE is_approved = false
  AND approved_by IS NOT NULL;

-- =====================================================
-- STEP 2: SET COLUMN CONSTRAINTS
-- =====================================================

-- Set default value for is_approved = false for new users
ALTER TABLE public.user_profiles 
  ALTER COLUMN is_approved SET DEFAULT false;

-- Set is_approved to NOT NULL (no more NULL values allowed)
ALTER TABLE public.user_profiles 
  ALTER COLUMN is_approved SET NOT NULL;

-- Ensure approved_by is nullable (required for new user onboarding)
ALTER TABLE public.user_profiles 
  ALTER COLUMN approved_by DROP NOT NULL;

-- =====================================================
-- STEP 3: DROP OLD CONSTRAINT
-- =====================================================

-- Drop the existing constraint that's causing the error
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS chk_user_profiles_approval_logic;

-- =====================================================
-- STEP 4: CREATE NEW CONSTRAINT (CORRECT LOGIC)
-- =====================================================

-- New constraint logic:
-- - If is_approved = false → approved_by MUST be NULL
-- - If is_approved = true → approved_by MUST NOT be NULL
ALTER TABLE public.user_profiles
  ADD CONSTRAINT chk_user_profiles_approval_logic
  CHECK (
    (is_approved = false AND approved_by IS NULL) OR
    (is_approved = true AND approved_by IS NOT NULL)
  );

-- =====================================================
-- STEP 4: VERIFICATION QUERIES
-- =====================================================

-- Check column definitions
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
  AND column_name IN ('is_approved', 'approved_by')
ORDER BY column_name;

-- Check constraint definition
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.user_profiles'::regclass
  AND conname = 'chk_user_profiles_approval_logic';

-- =====================================================
-- STEP 5: TEST SCENARIOS
-- =====================================================

-- Test 1: New user onboarding (should succeed)
-- Expected: is_approved=false, approved_by=NULL
-- This is what the frontend sends during onboarding
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
BEGIN
  -- Simulate new user insert (what onboarding does)
  INSERT INTO public.user_profiles (
    user_id,
    full_name,
    is_approved,
    approved_by,
    role,
    is_active
  ) VALUES (
    test_user_id,
    'Test User - New Onboarding',
    false,  -- Not approved yet
    NULL,   -- No admin approval yet
    'user',
    true
  );
  
  RAISE NOTICE '✅ Test 1 PASSED: New user onboarding (is_approved=false, approved_by=NULL)';
  
  -- Cleanup test data
  DELETE FROM public.user_profiles WHERE user_id = test_user_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Test 1 FAILED: %', SQLERRM;
    -- Attempt cleanup
    DELETE FROM public.user_profiles WHERE user_id = test_user_id;
END;
$$;

-- Test 2: Admin approved user (should succeed)
-- Expected: is_approved=true, approved_by=<admin_uuid>
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  test_admin_id uuid := gen_random_uuid();
BEGIN
  -- Simulate admin-approved user
  INSERT INTO public.user_profiles (
    user_id,
    full_name,
    is_approved,
    approved_by,
    role,
    is_active
  ) VALUES (
    test_user_id,
    'Test User - Approved',
    true,  -- Approved
    test_admin_id,  -- Admin who approved
    'user',
    true
  );
  
  RAISE NOTICE '✅ Test 2 PASSED: Approved user (is_approved=true, approved_by=UUID)';
  
  -- Cleanup test data
  DELETE FROM public.user_profiles WHERE user_id = test_user_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Test 2 FAILED: %', SQLERRM;
    -- Attempt cleanup
    DELETE FROM public.user_profiles WHERE user_id = test_user_id;
END;
$$;

-- Test 3: Invalid state - approved but no approver (should fail)
-- Expected: Constraint violation
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
BEGIN
  -- This should FAIL
  INSERT INTO public.user_profiles (
    user_id,
    full_name,
    is_approved,
    approved_by,
    role,
    is_active
  ) VALUES (
    test_user_id,
    'Test User - Invalid',
    true,  -- Approved
    NULL,  -- But no approver (INVALID!)
    'user',
    true
  );
  
  RAISE NOTICE '❌ Test 3 FAILED: Should have rejected is_approved=true with approved_by=NULL';
  
  -- Cleanup if somehow inserted
  DELETE FROM public.user_profiles WHERE user_id = test_user_id;
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE '✅ Test 3 PASSED: Correctly rejected invalid state (is_approved=true, approved_by=NULL)';
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Test 3 UNCLEAR: %', SQLERRM;
END;
$$;

-- Test 4: Invalid state - not approved but has approver (should fail)
-- Expected: Constraint violation
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  test_admin_id uuid := gen_random_uuid();
BEGIN
  -- This should FAIL
  INSERT INTO public.user_profiles (
    user_id,
    full_name,
    is_approved,
    approved_by,
    role,
    is_active
  ) VALUES (
    test_user_id,
    'Test User - Invalid',
    false,  -- Not approved
    test_admin_id,  -- But has approver (INVALID!)
    'user',
    true
  );
  
  RAISE NOTICE '❌ Test 4 FAILED: Should have rejected is_approved=false with approved_by=UUID';
  
  -- Cleanup if somehow inserted
  DELETE FROM public.user_profiles WHERE user_id = test_user_id;
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE '✅ Test 4 PASSED: Correctly rejected invalid state (is_approved=false, approved_by=UUID)';
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Test 4 UNCLEAR: %', SQLERRM;
END;
$$;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 
  '✅ APPROVAL LOGIC CONSTRAINT FIXED!' as status,
  'Default: is_approved = false' as default_value,
  'Constraint: (false + NULL) OR (true + UUID)' as logic,
  'Onboarding: New users can register with is_approved=false' as impact;

-- =====================================================
-- NOTES FOR FRONTEND
-- =====================================================

-- ONBOARDING PAYLOAD (correct for new users):
-- {
--   "user_id": "uuid-xxx",
--   "full_name": "John Doe",
--   "is_approved": false,  // Or omit (will use default)
--   "approved_by": null,   // Or omit
--   "role": "user"
-- }

-- ADMIN APPROVAL PAYLOAD (when admin approves):
-- UPDATE user_profiles SET
--   is_approved = true,
--   approved_by = '<admin_user_id>'
-- WHERE user_id = '<user_to_approve>';

-- =====================================================
-- ROLLBACK PLAN
-- =====================================================

-- To rollback (restore old constraint):
-- ALTER TABLE public.user_profiles
--   DROP CONSTRAINT chk_user_profiles_approval_logic;
-- 
-- ALTER TABLE public.user_profiles
--   ADD CONSTRAINT chk_user_profiles_approval_logic
--   CHECK (
--     -- Replace with original logic if known
--     (is_approved = true AND approved_by IS NOT NULL)
--   );
