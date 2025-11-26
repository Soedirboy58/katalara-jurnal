-- =====================================================
-- DOMAIN: SUPPORTING
-- STORAGE BUCKET: lapak-images
-- SCHEMA DEFINITION
-- =====================================================

-- =====================================================
-- STORAGE BUCKET: lapak-images
-- Purpose: Store product images, logos, and other media for online storefronts
-- =====================================================

-- Create storage bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lapak-images',
  'lapak-images',
  true, -- Public access so customers can view images
  5242880, -- 5MB limit per file
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON COLUMN storage.buckets.id IS 'Bucket identifier (lapak-images)';
COMMENT ON COLUMN storage.buckets.name IS 'Bucket display name';
COMMENT ON COLUMN storage.buckets.public IS 'Whether bucket allows public read access';
COMMENT ON COLUMN storage.buckets.file_size_limit IS 'Maximum file size in bytes (5MB)';
COMMENT ON COLUMN storage.buckets.allowed_mime_types IS 'Allowed image MIME types (JPEG, PNG, GIF, WebP)';

-- =====================================================
-- FOLDER STRUCTURE CONVENTION
-- =====================================================

-- Folder structure: <user_id>/<category>/<filename>
-- Examples:
--   550e8400-e29b-41d4-a716-446655440000/logo/my-logo.png
--   550e8400-e29b-41d4-a716-446655440000/products/product-123.jpg
--   550e8400-e29b-41d4-a716-446655440000/banners/banner-main.webp

-- Categories:
--   - logo: Business logo
--   - products: Product images
--   - banners: Banner/hero images
--   - thumbnails: Auto-generated thumbnails
--   - qr: QR code images

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ SUPPORTING Domain - Storage Bucket (lapak-images) Created';
  RAISE NOTICE '   - Bucket: lapak-images';
  RAISE NOTICE '   - Purpose: Product images, logos, banners for online storefronts';
  RAISE NOTICE '   - Public: true (read access)';
  RAISE NOTICE '   - Size Limit: 5MB';
  RAISE NOTICE '   - MIME Types: JPEG, PNG, GIF, WebP';
  RAISE NOTICE '   - Folder Structure: <user_id>/<category>/<filename>';
END $$;
