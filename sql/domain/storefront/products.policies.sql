-- ============================================================================
-- DOMAIN: STOREFRONT
-- Entity: storefront_products (products)
-- File: products.policies.sql
-- Purpose: Row Level Security (RLS) policies for storefront products
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
--   Enables RLS on storefront_products table.
--   ALL queries must pass through RLS policies.
--   Without policies, no rows are accessible (default deny).
--
-- Security Model:
--   - Public users: Can view visible products in active storefronts
--   - Authenticated users: Can view + manage own products
--   - No admin bypass (superuser can bypass, but app users cannot)
--
-- Critical:
--   STOREFRONT is a PUBLIC-FACING domain. RLS must be strict.
--   Public can only see visible products in active storefronts.
-- ============================================================================

ALTER TABLE public.storefront_products ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY: Public can view visible products
-- ============================================================================
-- Description:
--   Allows public (unauthenticated) users to read visible products.
--   Products are visible only if:
--     1. Product is_visible = true
--     2. Parent storefront is_active = true
--
-- Applies To:
--   - SELECT operations
--   - Unauthenticated users (auth.uid() IS NULL)
--   - Authenticated users (public browse)
--
-- Filter:
--   WHERE is_visible = true 
--     AND EXISTS (
--       SELECT 1 FROM business_storefronts 
--       WHERE id = storefront_products.storefront_id 
--       AND is_active = true
--     )
--
-- Use Cases:
--   - Public browsing /lapak/[slug]
--   - Product listing on storefront page
--   - Product detail pages
--   - SEO crawlers indexing products
--
-- Security:
--   - Only exposes visible products (is_visible = true)
--   - Only exposes products in active storefronts (is_active = true)
--   - Hides draft/inactive products from public
-- ============================================================================

DROP POLICY IF EXISTS "Public can view visible products" ON public.storefront_products;
CREATE POLICY "Public can view visible products"
    ON public.storefront_products
    FOR SELECT
    USING (
        is_visible = true 
        AND EXISTS (
            SELECT 1 FROM public.business_storefronts 
            WHERE id = storefront_products.storefront_id 
            AND is_active = true
        )
    );

COMMENT ON POLICY "Public can view visible products" ON public.storefront_products IS 
'Allows public to read visible products in active storefronts (WHERE is_visible = true AND storefront.is_active = true)';

-- ============================================================================
-- POLICY: Users can view own products
-- ============================================================================
-- Description:
--   Allows authenticated users to view their own products.
--   Includes invisible/draft products (so owners can edit before publishing).
--
-- Applies To:
--   - SELECT operations
--   - Authenticated users (auth.uid() IS NOT NULL)
--
-- Filter:
--   WHERE user_id = auth.uid()
--
-- Use Cases:
--   - Dashboard: viewing own products (all statuses)
--   - Edit form: viewing draft products
--   - Analytics: viewing own product metrics
--
-- Security:
--   - Only owner can see own products (even if invisible)
--   - Other users cannot see draft products
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own products" ON public.storefront_products;
CREATE POLICY "Users can view own products"
    ON public.storefront_products
    FOR SELECT
    USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can view own products" ON public.storefront_products IS 
'Allows authenticated users to view own products (including invisible/draft products)';

-- ============================================================================
-- POLICY: Users can create own products
-- ============================================================================
-- Description:
--   Allows authenticated users to create products in their own storefront.
--   Enforces user_id = auth.uid() at insertion.
--   Enforces storefront ownership (storefront.user_id = auth.uid()).
--
-- Applies To:
--   - INSERT operations
--   - Authenticated users (auth.uid() IS NOT NULL)
--
-- Check:
--   WITH CHECK (
--     user_id = auth.uid() 
--     AND EXISTS (
--       SELECT 1 FROM business_storefronts 
--       WHERE id = storefront_products.storefront_id 
--       AND user_id = auth.uid()
--     )
--   )
--
-- Use Cases:
--   - User adding new product to storefront via dashboard
--   - Using publish_product_to_storefront() function
--
-- Business Rules:
--   - user_id must match auth.uid()
--   - storefront_id must belong to the user (cannot add to other's storefront)
--   - price must be positive (enforced via CHECK constraint)
--
-- Security:
--   - Users cannot create products for other users
--   - Users cannot add products to other users' storefronts
--   - user_id is set by auth.uid(), cannot be spoofed
-- ============================================================================

DROP POLICY IF EXISTS "Users can create own products" ON public.storefront_products;
CREATE POLICY "Users can create own products"
    ON public.storefront_products
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        AND EXISTS (
            SELECT 1 FROM public.business_storefronts 
            WHERE id = storefront_products.storefront_id 
            AND user_id = auth.uid()
        )
    );

COMMENT ON POLICY "Users can create own products" ON public.storefront_products IS 
'Allows authenticated users to create products in own storefront (enforces user_id = auth.uid() and storefront ownership)';

-- ============================================================================
-- POLICY: Users can update own products
-- ============================================================================
-- Description:
--   Allows authenticated users to update their own products.
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
--   - Editing product details (name, description, price)
--   - Updating stock quantity
--   - Changing visibility (is_visible, is_featured)
--   - Updating images, variants
--   - Incrementing analytics counters (view_count, click_count, cart_add_count)
--
-- Security:
--   - Users cannot update other users' products
--   - Users cannot change user_id to another user (WITH CHECK)
--   - All updates require authentication
-- ============================================================================

DROP POLICY IF EXISTS "Users can update own products" ON public.storefront_products;
CREATE POLICY "Users can update own products"
    ON public.storefront_products
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can update own products" ON public.storefront_products IS 
'Allows authenticated users to update own products';

-- ============================================================================
-- POLICY: Users can delete own products
-- ============================================================================
-- Description:
--   Allows authenticated users to delete their own products.
--   This is a destructive operation (cascades to analytics).
--
-- Applies To:
--   - DELETE operations
--   - Authenticated users (auth.uid() IS NOT NULL)
--
-- Filter:
--   USING (user_id = auth.uid())
--
-- Use Cases:
--   - User wants to remove product from storefront
--   - Cleaning up old/discontinued products
--
-- Cascade Behavior:
--   - ON DELETE SET NULL: storefront_analytics.product_id
--     (analytics kept, but product_id set to NULL)
--   - Cart items: Should be handled at application level (remove from carts)
--
-- Warning:
--   - This is PERMANENT deletion (no soft delete)
--   - Consider adding confirmation in UI before executing
--   - Analytics data is preserved (product_id set to NULL)
--
-- Security:
--   - Users cannot delete other users' products
--   - All deletes require authentication
-- ============================================================================

DROP POLICY IF EXISTS "Users can delete own products" ON public.storefront_products;
CREATE POLICY "Users can delete own products"
    ON public.storefront_products
    FOR DELETE
    USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can delete own products" ON public.storefront_products IS 
'Allows authenticated users to delete own products (analytics preserved with product_id = NULL)';

-- ============================================================================
-- POLICY SUMMARY
-- ============================================================================
-- Total Policies: 5
--
-- Public Access:
--   ✓ SELECT (WHERE is_visible = true AND storefront.is_active = true)
--
-- Authenticated Owner Access:
--   ✓ SELECT (own products, including invisible/draft)
--   ✓ INSERT (create products in own storefront)
--   ✓ UPDATE (edit own products)
--   ✓ DELETE (delete own products, analytics preserved)
--
-- Denied Access:
--   ✗ Public cannot INSERT/UPDATE/DELETE
--   ✗ Users cannot access other users' draft products
--   ✗ Users cannot modify other users' products
--   ✗ Users cannot add products to other users' storefronts
--
-- Security Notes:
--   1. Public can only see visible products in active storefronts
--   2. Two-level visibility check: is_visible AND storefront.is_active
--   3. Owner isolation: users can only manage own products
--   4. Storefront ownership enforced: cannot add to other's storefront
--   5. Analytics preserved on DELETE (product_id set to NULL)
--
-- Testing:
--   See storefront.debug.sql for RLS policy tests
-- ============================================================================

-- ============================================================================
-- END OF POLICIES
-- ============================================================================
-- Next Steps:
--   1. Apply indexes: products.index.sql
--   2. Test policies: storefront.debug.sql (section: RLS policy tests)
--   3. Verify public access: query as unauthenticated user
--   4. Verify owner access: query as authenticated user
--
-- Testing Commands:
--   -- Test public access (should only see visible in active storefronts):
--   SET LOCAL ROLE anon;
--   SELECT * FROM storefront_products;
--   RESET ROLE;
--
--   -- Test owner access (should see own, including invisible):
--   SET LOCAL "request.jwt.claims" TO '{"sub": "user-uuid-here"}';
--   SELECT * FROM storefront_products;
--   RESET "request.jwt.claims";
--
--   -- Test insert to other's storefront (should fail):
--   SET LOCAL "request.jwt.claims" TO '{"sub": "user-uuid-here"}';
--   INSERT INTO storefront_products (storefront_id, user_id, name, price, whatsapp_number)
--   VALUES ('other-user-storefront-id', auth.uid(), 'Test Product', 10000, '628123456789');
--   -- Expected: ERROR - policy violation
-- ============================================================================
