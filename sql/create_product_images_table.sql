-- =====================================================
-- CREATE product_images TABLE
-- =====================================================
-- Migration: Add product_images table to support multiple images per product
-- Date: 2025-11-27
-- ADDITIVE ONLY: No changes to existing tables

-- Create product_images table
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_images_product_id 
  ON public.product_images(product_id);

CREATE INDEX IF NOT EXISTS idx_product_images_primary 
  ON public.product_images(product_id, is_primary) 
  WHERE is_primary = TRUE;

CREATE INDEX IF NOT EXISTS idx_product_images_sort 
  ON public.product_images(product_id, sort_order);

-- Enable Row Level Security
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access images for their own products
DROP POLICY IF EXISTS "Users can view own product images" ON public.product_images;
CREATE POLICY "Users can view own product images"
  ON public.product_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.id = product_images.product_id 
      AND products.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own product images" ON public.product_images;
CREATE POLICY "Users can insert own product images"
  ON public.product_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.id = product_images.product_id 
      AND products.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own product images" ON public.product_images;
CREATE POLICY "Users can update own product images"
  ON public.product_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.id = product_images.product_id 
      AND products.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own product images" ON public.product_images;
CREATE POLICY "Users can delete own product images"
  ON public.product_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.id = product_images.product_id 
      AND products.user_id = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON TABLE public.product_images IS 'Multiple images per product with primary flag and sort order';
COMMENT ON COLUMN public.product_images.product_id IS 'Foreign key to products table';
COMMENT ON COLUMN public.product_images.image_url IS 'Public URL from Supabase Storage (product-images bucket)';
COMMENT ON COLUMN public.product_images.is_primary IS 'TRUE for the main product image (only one per product)';
COMMENT ON COLUMN public.product_images.sort_order IS 'Display order (0 = first, 1 = second, etc.)';

-- Create Storage Bucket (run this in Supabase Dashboard > Storage or via SQL)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('product-images', 'product-images', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Allow authenticated users to upload
-- CREATE POLICY "Users can upload product images"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'product-images' AND
--   auth.role() = 'authenticated'
-- );

-- CREATE POLICY "Users can view product images"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'product-images');

-- CREATE POLICY "Users can delete own product images"
-- ON storage.objects FOR DELETE
-- USING (
--   bucket_id = 'product-images' AND
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- =====================================================
-- VERIFICATION
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ product_images table created successfully';
  RAISE NOTICE '   - Indexes: product_id, is_primary, sort_order';
  RAISE NOTICE '   - RLS Policies: 4 policies (SELECT, INSERT, UPDATE, DELETE)';
  RAISE NOTICE '   - Foreign Key: CASCADE delete when product is deleted';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NEXT STEPS:';
  RAISE NOTICE '   1. Create Storage bucket: product-images (set as public)';
  RAISE NOTICE '   2. Add Storage policies for upload/view/delete';
  RAISE NOTICE '   3. Test upload from frontend modal';
END $$;
