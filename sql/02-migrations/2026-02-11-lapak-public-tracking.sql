-- =====================================================
-- Lapak Order: Public Tracking
-- Adds public tracking code and RPC for public status
-- =====================================================

ALTER TABLE public.storefront_orders
  ADD COLUMN IF NOT EXISTS public_tracking_code TEXT;

CREATE INDEX IF NOT EXISTS idx_storefront_orders_public_tracking_code
  ON public.storefront_orders(public_tracking_code);

CREATE OR REPLACE FUNCTION public.get_public_order_status(
  p_slug TEXT,
  p_code TEXT
)
RETURNS TABLE(
  order_code TEXT,
  status TEXT,
  total_amount NUMERIC,
  customer_name TEXT,
  payment_method TEXT,
  delivery_method TEXT,
  order_items JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  storefront_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.order_code,
    o.status,
    o.total_amount,
    o.customer_name,
    o.payment_method,
    o.delivery_method,
    o.order_items,
    o.created_at,
    o.updated_at,
    s.store_name
  FROM public.storefront_orders o
  JOIN public.business_storefronts s ON s.id = o.storefront_id
  WHERE s.slug = p_slug
    AND o.public_tracking_code = p_code
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_order_status(TEXT, TEXT) TO anon, authenticated;