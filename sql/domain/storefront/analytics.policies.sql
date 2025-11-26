-- ============================================================================
-- DOMAIN: STOREFRONT
-- Entity: storefront_analytics (analytics)
-- File: analytics.policies.sql
-- Purpose: Row Level Security (RLS) policies for storefront analytics
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
--   Enables RLS on storefront_analytics table.
--   ALL queries must pass through RLS policies.
--   Without policies, no rows are accessible (default deny).
--
-- Security Model:
--   - Public users: Can INSERT events (for tracking)
--   - Authenticated users: Can SELECT events for own storefronts
--   - No one: Can UPDATE/DELETE (immutable log)
--
-- Critical:
--   STOREFRONT is a PUBLIC-FACING domain. RLS must be strict.
--   Public can only INSERT (append-only). No SELECT/UPDATE/DELETE.
--   Owner can SELECT own analytics. No one can UPDATE/DELETE.
-- ============================================================================

ALTER TABLE public.storefront_analytics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY: Public can insert analytics
-- ============================================================================
-- Description:
--   Allows public (unauthenticated) users to log analytics events.
--   Used for tracking visitor behavior on /lapak/[slug] pages.
--
-- Applies To:
--   - INSERT operations
--   - Unauthenticated users (auth.uid() IS NULL)
--   - Authenticated users (public tracking)
--
-- Check:
--   WITH CHECK (true)  -- Allow all INSERTs
--
-- Use Cases:
--   - Public browsing: logging page views, product views
--   - Visitor actions: cart adds, WhatsApp clicks
--   - Anonymous tracking: no authentication required
--
-- Security:
--   - Append-only access (INSERT only, no SELECT/UPDATE/DELETE)
--   - No data leakage (public cannot read analytics)
--   - Rate limiting should be implemented at application level
--
-- Note:
--   - Consider rate limiting to prevent spam/abuse
--   - App-level validation of event_type and metadata
--   - Use log_analytics_event() function for validation
-- ============================================================================

DROP POLICY IF EXISTS "Public can insert analytics" ON public.storefront_analytics;
CREATE POLICY "Public can insert analytics"
    ON public.storefront_analytics
    FOR INSERT
    WITH CHECK (true);

COMMENT ON POLICY "Public can insert analytics" ON public.storefront_analytics IS 
'Allows public to log analytics events (INSERT only, for tracking). No SELECT/UPDATE/DELETE.';

-- ============================================================================
-- POLICY: Users can view own analytics
-- ============================================================================
-- Description:
--   Allows authenticated users to view analytics for their own storefronts.
--   Used for analytics dashboards and insights.
--
-- Applies To:
--   - SELECT operations
--   - Authenticated users (auth.uid() IS NOT NULL)
--
-- Filter:
--   USING (
--     EXISTS (
--       SELECT 1 FROM business_storefronts 
--       WHERE id = storefront_analytics.storefront_id 
--       AND user_id = auth.uid()
--     )
--   )
--
-- Use Cases:
--   - Dashboard: viewing own storefront analytics
--   - Insights: analyzing visitor behavior
--   - Reports: generating analytics reports
--   - Product analytics: viewing product performance
--
-- Security:
--   - Only owner can see analytics for own storefront
--   - Other users cannot see other storefronts' analytics
--   - Public cannot read analytics (no data leakage)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own analytics" ON public.storefront_analytics;
CREATE POLICY "Users can view own analytics"
    ON public.storefront_analytics
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.business_storefronts 
            WHERE id = storefront_analytics.storefront_id 
            AND user_id = auth.uid()
        )
    );

COMMENT ON POLICY "Users can view own analytics" ON public.storefront_analytics IS 
'Allows authenticated users to view analytics for own storefronts only';

-- ============================================================================
-- POLICY: No UPDATE allowed
-- ============================================================================
-- Description:
--   Explicitly deny all UPDATE operations on analytics table.
--   Analytics is an immutable append-only log (audit trail integrity).
--
-- Rationale:
--   - Analytics events are historical facts, cannot be modified
--   - Prevents tampering with analytics data
--   - Maintains audit trail integrity
--   - If correction needed, add new event (e.g., "event_corrected")
--
-- Note:
--   - No UPDATE policy = implicit deny
--   - This policy is explicit for documentation purposes
--   - Applies to all users (including superuser via app)
-- ============================================================================

-- No UPDATE policy needed - default deny
-- (Documented here for clarity: analytics is immutable)

COMMENT ON TABLE public.storefront_analytics IS 
'IMMUTABLE LOG: No UPDATE/DELETE allowed. Public can INSERT, owner can SELECT.';

-- ============================================================================
-- POLICY: No DELETE allowed
-- ============================================================================
-- Description:
--   Explicitly deny all DELETE operations on analytics table.
--   Analytics is an immutable append-only log (audit trail integrity).
--
-- Rationale:
--   - Analytics events are historical facts, cannot be deleted
--   - Prevents data loss (intentional or accidental)
--   - Maintains audit trail integrity
--   - For cleanup, use TTL/archiving at database level (not via app)
--
-- Note:
--   - No DELETE policy = implicit deny
--   - This policy is explicit for documentation purposes
--   - Applies to all users (including superuser via app)
--   - Cascade DELETE from storefront deletion is allowed (FK behavior)
-- ============================================================================

-- No DELETE policy needed - default deny
-- (Documented here for clarity: analytics is immutable)
-- Exception: CASCADE DELETE from business_storefronts (FK behavior)

-- ============================================================================
-- POLICY SUMMARY
-- ============================================================================
-- Total Policies: 2
--
-- Public Access:
--   ✓ INSERT (append-only, for tracking)
--
-- Authenticated Owner Access:
--   ✓ SELECT (view analytics for own storefronts)
--
-- Denied Access:
--   ✗ Public cannot SELECT (no data leakage)
--   ✗ No one can UPDATE (immutable log)
--   ✗ No one can DELETE (immutable log)
--   ✗ Users cannot see other users' analytics
--
-- Security Notes:
--   1. Public can only INSERT (append-only tracking)
--   2. Owner can only SELECT (read-only analytics)
--   3. No UPDATE/DELETE policies = immutable log
--   4. CASCADE DELETE from storefront deletion is allowed (FK behavior)
--   5. Consider rate limiting at app level to prevent spam
--   6. Use log_analytics_event() function for validation
--
-- Immutability:
--   - Analytics is an audit trail (historical facts)
--   - No modifications allowed (no UPDATE/DELETE)
--   - Corrections: Add new event, don't modify existing
--   - Cleanup: Use TTL/archiving at database level
--   - Cascade DELETE: Storefront deletion removes analytics (intentional)
--
-- Testing:
--   See storefront.debug.sql for RLS policy tests
-- ============================================================================

-- ============================================================================
-- END OF POLICIES
-- ============================================================================
-- Next Steps:
--   1. Apply indexes: analytics.index.sql
--   2. Test policies: storefront.debug.sql (section: RLS policy tests)
--   3. Verify public INSERT: insert event as unauthenticated user
--   4. Verify owner SELECT: query as authenticated user
--   5. Verify immutability: attempt UPDATE/DELETE (should fail)
--
-- Testing Commands:
--   -- Test public INSERT (should succeed):
--   SET LOCAL ROLE anon;
--   INSERT INTO storefront_analytics (storefront_id, event_type, session_id)
--   VALUES ('storefront-uuid', 'page_view', 'test-session-id');
--   RESET ROLE;
--
--   -- Test public SELECT (should return 0 rows):
--   SET LOCAL ROLE anon;
--   SELECT * FROM storefront_analytics;
--   -- Expected: 0 rows (public cannot read)
--   RESET ROLE;
--
--   -- Test owner SELECT (should see own analytics):
--   SET LOCAL "request.jwt.claims" TO '{"sub": "user-uuid-here"}';
--   SELECT * FROM storefront_analytics;
--   -- Expected: Shows analytics for own storefronts only
--   RESET "request.jwt.claims";
--
--   -- Test UPDATE (should fail):
--   UPDATE storefront_analytics SET event_type = 'modified' WHERE id = 'event-uuid';
--   -- Expected: ERROR - policy violation
--
--   -- Test DELETE (should fail):
--   DELETE FROM storefront_analytics WHERE id = 'event-uuid';
--   -- Expected: ERROR - policy violation
-- ============================================================================
