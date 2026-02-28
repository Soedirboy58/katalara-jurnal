-- Affiliate/agent tracking for storefront orders
CREATE TABLE IF NOT EXISTS public.storefront_affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id UUID NOT NULL REFERENCES public.business_storefronts(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  commission_rate NUMERIC(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (storefront_id, code)
);

ALTER TABLE IF EXISTS public.storefront_orders
  ADD COLUMN IF NOT EXISTS affiliate_code TEXT;

CREATE INDEX IF NOT EXISTS idx_storefront_orders_affiliate_code
  ON public.storefront_orders(affiliate_code);

ALTER TABLE public.storefront_affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own affiliates"
  ON public.storefront_affiliates
  FOR SELECT
  USING (
    storefront_id IN (
      SELECT id FROM public.business_storefronts
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can insert own affiliates"
  ON public.storefront_affiliates
  FOR INSERT
  WITH CHECK (
    storefront_id IN (
      SELECT id FROM public.business_storefronts
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update own affiliates"
  ON public.storefront_affiliates
  FOR UPDATE
  USING (
    storefront_id IN (
      SELECT id FROM public.business_storefronts
      WHERE user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION update_storefront_affiliates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_storefront_affiliates_updated_at_trigger
  ON public.storefront_affiliates;

CREATE TRIGGER update_storefront_affiliates_updated_at_trigger
  BEFORE UPDATE ON public.storefront_affiliates
  FOR EACH ROW
  EXECUTE FUNCTION update_storefront_affiliates_updated_at();
