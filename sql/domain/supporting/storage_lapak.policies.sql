-- =====================================================
-- DOMAIN: SUPPORTING
-- STORAGE BUCKET: lapak-images
-- ROW LEVEL SECURITY (RLS) Policies
-- =====================================================

-- =====================================================
-- STORAGE POLICIES: lapak-images bucket
-- Folder structure: <user_id>/<category>/<filename>
-- =====================================================

-- Policy 1: Public can view all images (bucket is public)
CREATE POLICY storage_lapak_select_public
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'lapak-images');

-- Policy 2: Authenticated users can upload to their own folder
CREATE POLICY storage_lapak_insert_own
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'lapak-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy 3: Users can update their own images
CREATE POLICY storage_lapak_update_own
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'lapak-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy 4: Users can delete their own images
CREATE POLICY storage_lapak_delete_own
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'lapak-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy 5: Super admins can view all images
CREATE POLICY storage_lapak_select_admin
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'lapak-images'
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- Policy 6: Super admins can update any image
CREATE POLICY storage_lapak_update_admin
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'lapak-images'
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- Policy 7: Super admins can delete any image
CREATE POLICY storage_lapak_delete_admin
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'lapak-images'
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_storage_usage TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_images_by_category TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_storage_quota TO authenticated;

-- Grant execute on admin functions to authenticated (RLS will handle access)
GRANT EXECUTE ON FUNCTION get_storage_statistics TO authenticated;

-- Grant select on view to authenticated
GRANT SELECT ON storage_usage_summary TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON POLICY storage_lapak_select_public ON storage.objects IS 'Public can view all images in lapak-images bucket';
COMMENT ON POLICY storage_lapak_insert_own ON storage.objects IS 'Users can upload images to their own folder (/<user_id>/...)';
COMMENT ON POLICY storage_lapak_update_own ON storage.objects IS 'Users can update their own images';
COMMENT ON POLICY storage_lapak_delete_own ON storage.objects IS 'Users can delete their own images';
COMMENT ON POLICY storage_lapak_select_admin ON storage.objects IS 'Super admins can view all images';
COMMENT ON POLICY storage_lapak_update_admin ON storage.objects IS 'Super admins can update any image';
COMMENT ON POLICY storage_lapak_delete_admin ON storage.objects IS 'Super admins can delete any image';

-- =====================================================
-- SECURITY NOTES
-- =====================================================

-- Folder naming convention enforces user isolation:
--   ✅ Correct:   550e8400-e29b-41d4-a716-446655440000/logo/my-logo.png
--   ❌ Incorrect: some-folder/my-logo.png
--   ❌ Incorrect: another-user-id/logo/my-logo.png

-- The policy (storage.foldername(name))[1] = auth.uid()::text ensures:
--   - Users can only upload to folders starting with their user_id
--   - Users cannot access other users' folders
--   - Public can still view all images (read-only)

-- File size limit (5MB) enforced at bucket level
-- MIME type restriction (images only) enforced at bucket level

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ SUPPORTING Domain - Storage (lapak-images) RLS Policies Created';
  RAISE NOTICE '   - Policies: 7 (public read, user own CRUD, admin full access)';
  RAISE NOTICE '   - Security: Folder-based isolation (/<user_id>/...)';
  RAISE NOTICE '   - Public: Read access enabled for customer viewing';
  RAISE NOTICE '   - Functions: All granted to authenticated users';
END $$;
