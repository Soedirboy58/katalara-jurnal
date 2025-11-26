-- =====================================================
-- DOMAIN: SUPPORTING
-- STORAGE BUCKET: lapak-images
-- INDEXES & CONSTRAINTS
-- =====================================================

-- =====================================================
-- NOTE: Storage Bucket Performance
-- =====================================================

-- The storage.objects table is managed by Supabase and already has:
--   - Primary key index on id
--   - Index on bucket_id
--   - Index on owner (for RLS)
--   - Index on created_at

-- Additional indexes may be created if needed for specific query patterns

-- =====================================================
-- OPTIONAL INDEXES (if needed for performance)
-- =====================================================

-- Index 1: Filter by bucket and folder prefix (user_id)
-- CREATE INDEX IF NOT EXISTS idx_storage_objects_lapak_user
--   ON storage.objects (bucket_id, (storage.foldername(name))[1])
--   WHERE bucket_id = 'lapak-images';

-- Index 2: Filter by bucket and category
-- CREATE INDEX IF NOT EXISTS idx_storage_objects_lapak_category
--   ON storage.objects (bucket_id, (storage.foldername(name))[2])
--   WHERE bucket_id = 'lapak-images';

-- Index 3: Sort by creation date within bucket
-- CREATE INDEX IF NOT EXISTS idx_storage_objects_lapak_created
--   ON storage.objects (bucket_id, created_at DESC)
--   WHERE bucket_id = 'lapak-images';

-- =====================================================
-- BUCKET-LEVEL CONSTRAINTS
-- =====================================================

-- File size limit: 5MB (5,242,880 bytes)
-- Enforced at bucket level via file_size_limit

-- Allowed MIME types: image/jpeg, image/jpg, image/png, image/gif, image/webp
-- Enforced at bucket level via allowed_mime_types

-- Public access: true
-- Enforced at bucket level via public flag

-- =====================================================
-- NAMING CONVENTION VALIDATION
-- =====================================================

-- Recommended folder structure: <user_id>/<category>/<filename>
-- Examples:
--   ✅ 550e8400-e29b-41d4-a716-446655440000/logo/my-logo.png
--   ✅ 550e8400-e29b-41d4-a716-446655440000/products/product-123.jpg
--   ❌ invalid/path.png (no user_id)
--   ❌ 550e8400-e29b-41d4-a716-446655440000/my-logo.png (no category)

-- Categories:
--   - logo: Business logo
--   - products: Product images
--   - banners: Banner/hero images
--   - thumbnails: Auto-generated thumbnails (smaller versions)
--   - qr: QR code images

-- Validation enforced via RLS policies:
--   (storage.foldername(name))[1] = auth.uid()::text

-- =====================================================
-- STATISTICS FOR QUERY PLANNER
-- =====================================================

-- Note: Statistics for storage.objects are managed by Supabase
-- No custom statistics configuration needed

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE storage.buckets IS 'Supabase storage buckets configuration';
COMMENT ON TABLE storage.objects IS 'Supabase storage objects (files)';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ SUPPORTING Domain - Storage (lapak-images) Indexes & Constraints';
  RAISE NOTICE '   - Note: Supabase storage.objects already optimized';
  RAISE NOTICE '   - File Size Limit: 5MB (enforced at bucket level)';
  RAISE NOTICE '   - MIME Types: JPEG, PNG, GIF, WebP (enforced at bucket level)';
  RAISE NOTICE '   - Folder Structure: <user_id>/<category>/<filename> (enforced by RLS)';
  RAISE NOTICE '   - Optional indexes commented out (enable if performance issues)';
END $$;
