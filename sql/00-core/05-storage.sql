-- ============================================
-- SUPABASE STORAGE SETUP FOR PRODUCT IMAGES
-- ============================================

-- NOTE: Using existing 'lapak-images' bucket (already public)
-- No need to create new bucket, just add RLS policies for product images

-- ============================================
-- RLS POLICIES FOR PRODUCT IMAGES (lapak-images bucket)
-- ============================================

-- Policy 1: Allow authenticated users to upload product images
-- Path format: products/{user_id}/{timestamp}.{extension}
CREATE POLICY "Users can upload product images to lapak-images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lapak-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'products'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy 2: Allow authenticated users to update their product images
CREATE POLICY "Users can update product images in lapak-images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lapak-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'products'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy 3: Allow authenticated users to delete their product images
CREATE POLICY "Users can delete product images in lapak-images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lapak-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'products'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy 4: Allow public read access (already handled by bucket being public)
-- No need for additional SELECT policy since bucket is already public

-- ============================================
-- HELPER: Get signed URL for private bucket
-- (Only needed if you want private bucket instead)
-- ============================================
/*
-- Example usage in your API:
const { data } = await supabase.storage
  .from('product-images')
  .createSignedUrl('user_id/product_id.jpg', 3600)
*/

-- ============================================
-- EXECUTION NOTES
-- ============================================
-- 1. Create bucket 'product-images' via Dashboard first
-- 2. Then execute this script in SQL Editor
-- 3. Verify policies in Storage → product-images → Policies
-- ============================================
