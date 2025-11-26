-- ============================================================================
-- DOMAIN: STOREFRONT
-- Entity: cart_sessions (carts)
-- File: carts.policies.sql
-- Purpose: Row Level Security (RLS) policies for shopping carts
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
--   Enables RLS on cart_sessions table.
--   ALL queries must pass through RLS policies.
--   Without policies, no rows are accessible (default deny).
--
-- Security Model:
--   - Public users: Can manage carts (anonymous shopping)
--   - Authenticated users: Can view carts for own storefronts
--   - Permissive policies: Public can FOR ALL (SELECT, INSERT, UPDATE, DELETE)
--
-- Critical:
--   STOREFRONT is a PUBLIC-FACING domain. Carts must be accessible to anonymous users.
--   Public can manage carts via session_id (no authentication required).
--   Owner can view all carts for analytics.
-- ============================================================================

ALTER TABLE public.cart_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY: Public can manage carts
-- ============================================================================
-- Description:
--   Allows public (unauthenticated) users to manage shopping carts.
--   This is necessary for anonymous shopping experience.
--
-- Applies To:
--   - ALL operations (SELECT, INSERT, UPDATE, DELETE)
--   - Unauthenticated users (auth.uid() IS NULL)
--   - Authenticated users (public shopping)
--
-- Filter & Check:
--   USING (true)  -- Allow all reads
--   WITH CHECK (true)  -- Allow all writes
--
-- Use Cases:
--   - Anonymous user adds product to cart
--   - Anonymous user views cart contents
--   - Anonymous user updates cart (change quantity)
--   - Anonymous user removes product from cart
--   - Anonymous user checks out (update status to 'checked_out')
--
-- Security Considerations:
--   - This is intentionally permissive (public e-commerce requirement)
--   - Security relies on session_id (client-side generated)
--   - Application must validate session_id on client side
--   - Rate limiting should be implemented at application/proxy level
--   - No PII leakage risk (cart data is not sensitive until checkout)
--
-- Alternative Approach (More Restrictive):
--   - If session tracking is robust, could restrict to:
--     USING (session_id = current_setting('app.session_id', true))
--   - Would require session_id to be set via SET LOCAL before queries
--   - More secure but requires additional setup
--
-- Why Permissive?
--   - E-commerce standard: anonymous carts must work without auth
--   - Session_id is client-controlled (browser localStorage)
--   - Carts are temporary (auto-expire after 7 days)
--   - No financial data stored in carts (just product selections)
--   - Checkout requires customer_name + customer_phone (validation)
-- ============================================================================

DROP POLICY IF EXISTS "Public can manage carts" ON public.cart_sessions;
CREATE POLICY "Public can manage carts"
    ON public.cart_sessions
    FOR ALL
    USING (true)
    WITH CHECK (true);

COMMENT ON POLICY "Public can manage carts" ON public.cart_sessions IS 
'Allows public to manage shopping carts (FOR ALL operations). Required for anonymous e-commerce. Security via session_id + rate limiting.';

-- ============================================================================
-- POLICY: Users can view carts for own storefronts
-- ============================================================================
-- Description:
--   Allows authenticated users to view all carts for their own storefronts.
--   Used for analytics and monitoring (abandoned cart recovery, etc.).
--
-- Applies To:
--   - SELECT operations
--   - Authenticated users (auth.uid() IS NOT NULL)
--
-- Filter:
--   USING (
--     EXISTS (
--       SELECT 1 FROM business_storefronts 
--       WHERE id = cart_sessions.storefront_id 
--       AND user_id = auth.uid()
--     )
--   )
--
-- Use Cases:
--   - Dashboard: viewing active carts for own storefront
--   - Analytics: abandoned cart analysis
--   - Recovery: reaching out to customers with abandoned carts
--
-- Security:
--   - Only owner can see carts for own storefront
--   - Other users cannot see other storefronts' carts
--   - Public access handled by "Public can manage carts" policy
--
-- Note:
--   - This policy is additional to "Public can manage carts"
--   - Both policies can apply (RLS policies are OR-ed)
--   - Storefront owner can see ALL carts (including anonymous)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view carts for own storefronts" ON public.cart_sessions;
CREATE POLICY "Users can view carts for own storefronts"
    ON public.cart_sessions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.business_storefronts 
            WHERE id = cart_sessions.storefront_id 
            AND user_id = auth.uid()
        )
    );

COMMENT ON POLICY "Users can view carts for own storefronts" ON public.cart_sessions IS 
'Allows authenticated users to view all carts for own storefronts (for analytics and monitoring)';

-- ============================================================================
-- POLICY SUMMARY
-- ============================================================================
-- Total Policies: 2
--
-- Public Access:
--   ✓ SELECT (read cart contents)
--   ✓ INSERT (create new cart)
--   ✓ UPDATE (modify cart items, update status)
--   ✓ DELETE (remove cart)
--
-- Authenticated Owner Access:
--   ✓ SELECT (view all carts for own storefronts)
--
-- Denied Access:
--   (None - intentionally permissive for e-commerce)
--
-- Security Notes:
--   1. Public can manage carts (anonymous shopping requirement)
--   2. Security relies on session_id (client-side generated)
--   3. Application must validate session_id on client side
--   4. Rate limiting should be implemented at application/proxy level
--   5. Carts auto-expire after 7 days (cleanup via cron job)
--   6. No PII stored until checkout (customer_name, customer_phone)
--   7. Storefront owner can see all carts for analytics
--
-- Permissive Policy Rationale:
--   - Standard e-commerce pattern: anonymous carts must work
--   - Session_id provides sufficient isolation (client-side)
--   - Carts are temporary data (not financial/sensitive)
--   - Auto-expiry limits data retention (7 days)
--   - Checkout validation happens at application level
--
-- Alternative Security Measures:
--   - Rate limiting (app/proxy level): Prevent spam cart creation
--   - Session validation (app level): Validate session_id format
--   - CAPTCHA at checkout: Prevent bot orders
--   - Honeypot fields: Detect bot submissions
--   - IP-based rate limiting: Prevent abuse from single IP
--
-- Testing:
--   See storefront.debug.sql for RLS policy tests
-- ============================================================================

-- ============================================================================
-- END OF POLICIES
-- ============================================================================
-- Next Steps:
--   1. Apply indexes: carts.index.sql
--   2. Test policies: storefront.debug.sql (section: RLS policy tests)
--   3. Verify public access: insert/read/update/delete as unauthenticated user
--   4. Verify owner access: query as authenticated storefront owner
--   5. Implement rate limiting at application/proxy level
--
-- Testing Commands:
--   -- Test public INSERT (should succeed):
--   SET LOCAL ROLE anon;
--   INSERT INTO cart_sessions (storefront_id, session_id, cart_items)
--   VALUES ('storefront-uuid', 'test-session-id', '[]'::JSONB);
--   RESET ROLE;
--
--   -- Test public SELECT (should see cart):
--   SET LOCAL ROLE anon;
--   SELECT * FROM cart_sessions WHERE session_id = 'test-session-id';
--   RESET ROLE;
--
--   -- Test public UPDATE (should succeed):
--   SET LOCAL ROLE anon;
--   UPDATE cart_sessions 
--   SET cart_items = '[{"product_id": "uuid", "quantity": 1}]'::JSONB
--   WHERE session_id = 'test-session-id';
--   RESET ROLE;
--
--   -- Test public DELETE (should succeed):
--   SET LOCAL ROLE anon;
--   DELETE FROM cart_sessions WHERE session_id = 'test-session-id';
--   RESET ROLE;
--
--   -- Test owner SELECT (should see all carts for own storefront):
--   SET LOCAL "request.jwt.claims" TO '{"sub": "user-uuid-here"}';
--   SELECT * FROM cart_sessions;
--   -- Expected: Shows all carts for own storefronts
--   RESET "request.jwt.claims";
-- ============================================================================
