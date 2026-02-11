-- =====================================================
-- Products: add image_urls for multi-image upload
-- =====================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_urls TEXT[];
