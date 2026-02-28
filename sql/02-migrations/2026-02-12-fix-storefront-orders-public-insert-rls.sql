-- 2026-02-12-fix-storefront-orders-public-insert-rls.sql
-- Purpose: ensure public checkout can create storefront orders safely under RLS.

-- Keep RLS enabled.
ALTER TABLE IF EXISTS public.storefront_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.business_storefronts ENABLE ROW LEVEL SECURITY;

-- Base grants for API roles used by Supabase clients.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT, SELECT ON TABLE public.storefront_orders TO anon, authenticated;
GRANT SELECT ON TABLE public.business_storefronts TO anon, authenticated;

-- Recreate public insert policy for storefront orders (idempotent).
DROP POLICY IF EXISTS "Anyone can create orders" ON public.storefront_orders;
CREATE POLICY "Anyone can create orders"
  ON public.storefront_orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Public read policy for storefront slug lookup and tracking checks.
DROP POLICY IF EXISTS "Public can read storefront slugs" ON public.business_storefronts;
CREATE POLICY "Public can read storefront slugs"
  ON public.business_storefronts
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Public read policy for order tracking by code (non-owner, read-only).
DROP POLICY IF EXISTS "Public can read order tracking code" ON public.storefront_orders;
CREATE POLICY "Public can read order tracking code"
  ON public.storefront_orders
  FOR SELECT
  TO anon, authenticated
  USING (
    public_tracking_code IS NOT NULL
    OR order_code IS NOT NULL
  );