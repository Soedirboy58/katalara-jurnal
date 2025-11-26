-- ============================================================================
-- DOMAIN: STOREFRONT
-- Entity: business_storefronts (storefronts)
-- File: storefronts.policies.sql
-- Purpose: Row Level Security (RLS) policies for storefronts
-- ============================================================================
-- Pattern: 4-File Entity Structure
-- 1. schema.sql  (Table Definition)
-- 2. logic.sql   (Functions, Views, Triggers)
-- 3. policies.sql ← YOU ARE HERE
-- 4. index.sql   (Indexes & Constraints)
-- ============================================================================

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
-- Description:
--   Enables RLS on business_storefronts table.
--   ALL queries must pass through RLS policies.
--   Without policies, no rows are accessible (default deny).
--
-- Security Model:
--   - Public users: Can view active storefronts (is_active = true)
--   - Authenticated users: Can view + manage own storefronts
--   - No admin bypass (superuser can bypass, but app users cannot)
--
-- Critical:
--   STOREFRONT is a PUBLIC-FACING domain. RLS must be strict.
--   Public can only see active storefronts. No PII leakage.
-- ============================================================================

ALTER TABLE public.business_storefronts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY: Public can view active storefronts
-- ============================================================================
-- Description:
--   Allows public (unauthenticated) users to read active storefronts.
--   Used for /lapak/[slug] public pages.
--
-- Applies To:
--   - SELECT operations
--   - Unauthenticated users (auth.uid() IS NULL)
--   - Authenticated users (public browse)
--
-- Filter:
--   WHERE is_active = true
--
-- Use Cases:
--   - Public browsing /lapak/[slug]
--   - SEO crawlers indexing storefront pages
--   - Social media preview cards
--
-- Security:
--   - Only exposes active storefronts
--   - Payment info (bank account, QRIS) visible to public (intentional)
--   - Owner contact info (WhatsApp, Instagram) visible (intentional)
-- ============================================================================

DROP POLICY IF EXISTS "Public can view active storefronts" ON public.business_storefronts;
CREATE POLICY "Public can view active storefronts"
    ON public.business_storefronts
    FOR SELECT
    USING (is_active = true);

COMMENT ON POLICY "Public can view active storefronts" ON public.business_storefronts IS 
'Allows public to read active storefronts (WHERE is_active = true). Used for /lapak/[slug] pages.';

-- ============================================================================
-- POLICY: Users can view own storefronts
-- ============================================================================
-- Description:
--   Allows authenticated users to view their own storefronts.
--   Includes inactive storefronts (so owners can edit before publishing).
--
-- Applies To:
--   - SELECT operations
--   - Authenticated users (auth.uid() IS NOT NULL)
--
-- Filter:
--   WHERE user_id = auth.uid()
--
-- Use Cases:
--   - Dashboard: viewing own storefront settings
--   - Preview: viewing inactive storefront before activation
--   - Analytics: viewing own storefront metrics
--
-- Security:
--   - Only owner can see own storefront (even if inactive)
--   - Other users cannot see inactive storefronts
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own storefronts" ON public.business_storefronts;
CREATE POLICY "Users can view own storefronts"
    ON public.business_storefronts
    FOR SELECT
    USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can view own storefronts" ON public.business_storefronts IS 
'Allows authenticated users to view own storefronts (including inactive ones)';

-- ============================================================================
-- POLICY: Users can create own storefront
-- ============================================================================
-- Description:
--   Allows authenticated users to create their own storefront.
--   Enforces user_id = auth.uid() at insertion.
--
-- Applies To:
--   - INSERT operations
--   - Authenticated users (auth.uid() IS NOT NULL)
--
-- Check:
--   WITH CHECK (user_id = auth.uid())
--
-- Use Cases:
--   - User creating first storefront via dashboard
--   - Onboarding flow: setup storefront
--
-- Business Rules:
--   - One user can have one storefront (enforced via unique constraint)
--   - slug must be unique (enforced at schema level)
--   - whatsapp_number is required (NOT NULL constraint)
--
-- Security:
--   - Users cannot create storefronts for other users
--   - user_id is set by auth.uid(), cannot be spoofed
-- ============================================================================

DROP POLICY IF EXISTS "Users can create own storefront" ON public.business_storefronts;
CREATE POLICY "Users can create own storefront"
    ON public.business_storefronts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can create own storefront" ON public.business_storefronts IS 
'Allows authenticated users to create own storefront (enforces user_id = auth.uid())';

-- ============================================================================
-- POLICY: Users can update own storefront
-- ============================================================================
-- Description:
--   Allows authenticated users to update their own storefront settings.
--   Enforces user_id = auth.uid() on both USING and WITH CHECK.
--
-- Applies To:
--   - UPDATE operations
--   - Authenticated users (auth.uid() IS NOT NULL)
--
-- Filter:
--   USING (user_id = auth.uid())
--   WITH CHECK (user_id = auth.uid())
--
-- Use Cases:
--   - Editing storefront settings (name, description, branding)
--   - Updating contact info (WhatsApp, Instagram, location)
--   - Changing payment methods (QRIS, bank account)
--   - Toggling is_active flag (publish/unpublish)
--
-- Security:
--   - Users cannot update other users' storefronts
--   - Users cannot change user_id to another user (WITH CHECK)
--   - All updates require authentication
-- ============================================================================

DROP POLICY IF EXISTS "Users can update own storefront" ON public.business_storefronts;
CREATE POLICY "Users can update own storefront"
    ON public.business_storefronts
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can update own storefront" ON public.business_storefronts IS 
'Allows authenticated users to update own storefront settings';

-- ============================================================================
-- POLICY: Users can delete own storefront
-- ============================================================================
-- Description:
--   Allows authenticated users to delete their own storefront.
--   This is a destructive operation (cascades to products, analytics, carts).
--
-- Applies To:
--   - DELETE operations
--   - Authenticated users (auth.uid() IS NOT NULL)
--
-- Filter:
--   USING (user_id = auth.uid())
--
-- Use Cases:
--   - User wants to close storefront permanently
--   - User wants to start fresh (delete + recreate)
--
-- Cascade Behavior:
--   - ON DELETE CASCADE: storefront_products, storefront_analytics, cart_sessions
--   - All related data is deleted automatically
--
-- Warning:
--   - This is PERMANENT deletion (no soft delete)
--   - Consider adding confirmation in UI before executing
--   - Analytics data will be lost (consider archiving first)
--
-- Security:
--   - Users cannot delete other users' storefronts
--   - All deletes require authentication
-- ============================================================================

DROP POLICY IF EXISTS "Users can delete own storefront" ON public.business_storefronts;
CREATE POLICY "Users can delete own storefront"
    ON public.business_storefronts
    FOR DELETE
    USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can delete own storefront" ON public.business_storefronts IS 
'Allows authenticated users to delete own storefront (cascades to products, analytics, carts)';

-- ============================================================================
-- POLICY SUMMARY
-- ============================================================================
-- Total Policies: 5
--
-- Public Access:
--   ✓ SELECT (WHERE is_active = true)
--
-- Authenticated Owner Access:
--   ✓ SELECT (own storefronts, including inactive)
--   ✓ INSERT (create own storefront)
--   ✓ UPDATE (edit own storefront)
--   ✓ DELETE (delete own storefront + cascades)
--
-- Denied Access:
--   ✗ Public cannot INSERT/UPDATE/DELETE
--   ✗ Users cannot access other users' inactive storefronts
--   ✗ Users cannot modify other users' storefronts
--
-- Security Notes:
--   1. Public can only see active storefronts (is_active = true)
--   2. Payment info (bank, QRIS) is intentionally public (for checkout)
--   3. Contact info (WhatsApp) is intentionally public (for orders)
--   4. Owner isolation: users can only manage own storefronts
--   5. CASCADE DELETE: be careful when deleting storefronts
--
-- Testing:
--   See storefront.debug.sql for RLS policy tests
-- ============================================================================

-- ============================================================================
-- END OF POLICIES
-- ============================================================================
-- Next Steps:
--   1. Apply indexes: storefronts.index.sql
--   2. Test policies: storefront.debug.sql (section: RLS policy tests)
--   3. Verify public access: query as unauthenticated user
--   4. Verify owner access: query as authenticated user
--
-- Testing Commands:
--   -- Test public access (should only see active):
--   SET LOCAL ROLE anon;
--   SELECT * FROM business_storefronts;
--   RESET ROLE;
--
--   -- Test owner access (should see own, including inactive):
--   SET LOCAL "request.jwt.claims" TO '{"sub": "user-uuid-here"}';
--   SELECT * FROM business_storefronts;
--   RESET "request.jwt.claims";
-- ============================================================================
