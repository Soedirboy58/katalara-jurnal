-- =====================================================
-- USER PROFILES: RLS FIX & UUID MIGRATION
-- =====================================================
-- Purpose: Fix RLS recursion + Add UUID column for business_category
-- Architecture: ADDITIVE ONLY - No data destroyed
-- Domain: CORE
-- Date: 2024-11-27
--
-- ISSUES FIXED:
-- 1. ❌ "infinite recursion detected in policy" → ✅ Flat policies
-- 2. ❌ "invalid input syntax for type integer: UUID" → ✅ New UUID column
--
-- STRATEGY:
-- 1. ADD new UUID column (parallel to old INTEGER column)
-- 2. DROP all recursive policies
-- 3. CREATE new flat, non-recursive policies
-- 4. Keep old column for backward compatibility
-- =====================================================

-- =====================================================
-- STEP 1: SCHEMA CHANGES (ADDITIVE ONLY)
-- =====================================================

-- Add new UUID column for business category
-- Old: business_category_id INTEGER (deprecated, keep for now)
-- New: business_category_uuid UUID (active)
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS business_category_uuid UUID;

-- Add foreign key constraint to business_type_mappings
-- Assumes: business_type_mappings.id is UUID (created by business_categories_ux_upgrade.sql)
ALTER TABLE public.user_profiles
  ADD CONSTRAINT fk_user_profiles_business_category_uuid
  FOREIGN KEY (business_category_uuid)
  REFERENCES public.business_type_mappings(id)
  ON DELETE SET NULL;

-- Add index for performance (foreign key queries)
CREATE INDEX IF NOT EXISTS idx_user_profiles_business_category_uuid
  ON public.user_profiles(business_category_uuid);

-- Add index for user_id (used heavily in RLS policies)
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id
  ON public.user_profiles(user_id);

-- Comment on columns for documentation
COMMENT ON COLUMN public.user_profiles.business_category_id IS 
  'DEPRECATED: Old INTEGER reference to business categories. Use business_category_uuid instead.';

COMMENT ON COLUMN public.user_profiles.business_category_uuid IS 
  'ACTIVE: UUID reference to business_type_mappings.id (UX-friendly categories).';

-- =====================================================
-- STEP 2: DROP EXISTING POLICIES (CLEANUP)
-- =====================================================

-- Drop all existing policies (including recursive ones)
DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_admin" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_admin" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_admin" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete_admin" ON public.user_profiles;

-- =====================================================
-- STEP 3: CREATE NEW FLAT POLICIES (NON-RECURSIVE)
-- =====================================================

-- Policy Design:
-- - User (own): Can only access their own profile (user_id = auth.uid())
-- - Admin: Can access all profiles (JWT claim: role = 'admin')
-- - NO SUBQUERIES to user_profiles (prevents infinite recursion)

-- ┌─────────────────────────────────────────────────┐
-- │ SELECT (READ) POLICIES                          │
-- └─────────────────────────────────────────────────┘

-- Policy 1: Users can view their own profile
CREATE POLICY "user_profiles_select_own"
  ON public.user_profiles
  FOR SELECT
  TO public
  USING (auth.uid() = user_id);

-- Policy 2: Admins can view all profiles
CREATE POLICY "user_profiles_select_admin"
  ON public.user_profiles
  FOR SELECT
  TO public
  USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- ┌─────────────────────────────────────────────────┐
-- │ INSERT (CREATE) POLICIES                        │
-- └─────────────────────────────────────────────────┘

-- Policy 3: Users can insert their own profile (onboarding)
-- WITH CHECK ensures user_id in new row matches auth.uid()
CREATE POLICY "user_profiles_insert_own"
  ON public.user_profiles
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Admins can insert profiles for any user
CREATE POLICY "user_profiles_insert_admin"
  ON public.user_profiles
  FOR INSERT
  TO public
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- ┌─────────────────────────────────────────────────┐
-- │ UPDATE (MODIFY) POLICIES                        │
-- └─────────────────────────────────────────────────┘

-- Policy 5: Users can update their own profile
-- USING: Can only update rows where user_id matches
-- WITH CHECK: Updated row must still have same user_id
-- Note: Frontend should prevent editing 'role' and 'is_approved' fields
--       (No trigger enforcement yet, trust UI validation)
CREATE POLICY "user_profiles_update_own"
  ON public.user_profiles
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 6: Admins can update any profile
CREATE POLICY "user_profiles_update_admin"
  ON public.user_profiles
  FOR UPDATE
  TO public
  USING ((auth.jwt() ->> 'role'::text) = 'admin'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- ┌─────────────────────────────────────────────────┐
-- │ DELETE (REMOVE) POLICIES                        │
-- └─────────────────────────────────────────────────┘

-- Policy 7: Only admins can delete profiles
-- Regular users cannot delete their own profile
CREATE POLICY "user_profiles_delete_admin"
  ON public.user_profiles
  FOR DELETE
  TO public
  USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- =====================================================
-- STEP 4: VERIFICATION QUERIES
-- =====================================================

-- Check new column exists
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
  AND column_name IN ('business_category_id', 'business_category_uuid')
ORDER BY column_name;

-- Check foreign key constraint
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'user_profiles'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'business_category_uuid';

-- Check indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'user_profiles'
  AND indexname LIKE '%business_category%'
ORDER BY indexname;

-- Check RLS policies (should show 7 new policies)
SELECT
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY cmd, policyname;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 
  '✅ RLS FIX COMPLETE!' as status,
  'Schema: business_category_uuid column added (UUID)' as schema_change,
  'Policies: 7 flat, non-recursive policies created' as rls_change,
  'Old column: business_category_id kept for backward compatibility' as compatibility,
  'Next step: Update frontend to use business_category_uuid' as action_needed;

-- =====================================================
-- NOTES FOR FRONTEND DEVELOPER
-- =====================================================

-- OLD PAYLOAD (will cause error):
-- {
--   "user_id": "uuid-xxx",
--   "business_category_id": "uuid-yyy"  ← ERROR: INTEGER column gets UUID
-- }

-- NEW PAYLOAD (correct):
-- {
--   "user_id": "uuid-xxx",
--   "business_category_uuid": "uuid-yyy"  ← SUCCESS: UUID column gets UUID
-- }

-- File to update: src/app/register/business-info/page.tsx
-- Change: formData.business_category_id → formData.business_category_uuid

-- =====================================================
-- ROLLBACK PLAN (IF NEEDED)
-- =====================================================

-- To rollback this migration:
-- 1. Drop new column:
--    ALTER TABLE public.user_profiles DROP COLUMN business_category_uuid;
-- 2. Restore old policies (from backup or recreate manually)
-- 3. Revert frontend code changes

-- =====================================================
-- FUTURE CLEANUP (AFTER VERIFICATION)
-- =====================================================

-- After 100% verification that business_category_uuid works:
-- 1. DROP old column:
--    ALTER TABLE public.user_profiles DROP COLUMN business_category_id;
-- 2. RENAME new column (optional):
--    ALTER TABLE public.user_profiles 
--      RENAME COLUMN business_category_uuid TO business_category_id;
-- 3. Update all references in codebase
