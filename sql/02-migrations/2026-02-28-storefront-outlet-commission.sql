-- Add outlet metadata and commission settings for storefronts
ALTER TABLE IF EXISTS public.business_storefronts
  ADD COLUMN IF NOT EXISTS outlet_code TEXT,
  ADD COLUMN IF NOT EXISTS outlet_manager_phone TEXT,
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parent_storefront_id UUID REFERENCES public.business_storefronts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_storefronts_parent_id
  ON public.business_storefronts(parent_storefront_id);
