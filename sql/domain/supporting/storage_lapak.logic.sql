-- =====================================================
-- DOMAIN: SUPPORTING
-- STORAGE BUCKET: lapak-images
-- BUSINESS LOGIC (Functions + Views)
-- =====================================================

-- =====================================================
-- FUNCTION 1: Get User Storage Usage
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_storage_usage(p_user_id UUID)
RETURNS TABLE (
  total_files BIGINT,
  total_size_bytes BIGINT,
  total_size_mb NUMERIC,
  avg_file_size_kb NUMERIC,
  mime_type_breakdown JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT AS total_files,
    COALESCE(SUM(
      CASE 
        WHEN metadata IS NOT NULL AND metadata->>'size' IS NOT NULL 
        THEN (metadata->>'size')::BIGINT 
        ELSE 0 
      END
    ), 0) AS total_size_bytes,
    ROUND(
      COALESCE(SUM(
        CASE 
          WHEN metadata IS NOT NULL AND metadata->>'size' IS NOT NULL 
          THEN (metadata->>'size')::BIGINT 
          ELSE 0 
        END
      ), 0) / 1048576.0, 2
    ) AS total_size_mb,
    ROUND(
      COALESCE(AVG(
        CASE 
          WHEN metadata IS NOT NULL AND metadata->>'size' IS NOT NULL 
          THEN (metadata->>'size')::BIGINT 
          ELSE 0 
        END
      ), 0) / 1024.0, 2
    ) AS avg_file_size_kb,
    jsonb_object_agg(
      COALESCE(metadata->>'mimetype', 'unknown'),
      COUNT(*)
    ) AS mime_type_breakdown
  FROM storage.objects
  WHERE bucket_id = 'lapak-images'
    AND (storage.foldername(name))[1] = p_user_id::text;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_storage_usage IS 'Get storage usage statistics for specific user';

-- =====================================================
-- FUNCTION 2: Get User Images by Category
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_images_by_category(
  p_user_id UUID,
  p_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  category TEXT,
  size_bytes BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  public_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    obj.id,
    obj.name,
    (storage.foldername(obj.name))[2] AS category,
    (obj.metadata->>'size')::BIGINT AS size_bytes,
    obj.metadata->>'mimetype' AS mime_type,
    obj.created_at,
    obj.updated_at,
    CONCAT(
      current_setting('app.supabase_url', true),
      '/storage/v1/object/public/lapak-images/',
      obj.name
    ) AS public_url
  FROM storage.objects obj
  WHERE obj.bucket_id = 'lapak-images'
    AND (storage.foldername(obj.name))[1] = p_user_id::text
    AND (p_category IS NULL OR (storage.foldername(obj.name))[2] = p_category)
  ORDER BY obj.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_images_by_category IS 'Get user images filtered by category (logo, products, banners, etc)';

-- =====================================================
-- FUNCTION 3: Check Storage Quota
-- =====================================================
CREATE OR REPLACE FUNCTION check_user_storage_quota(
  p_user_id UUID,
  p_new_file_size BIGINT,
  p_max_quota_mb NUMERIC DEFAULT 50
) RETURNS JSONB AS $$
DECLARE
  v_current_size_mb NUMERIC;
  v_new_total_mb NUMERIC;
  v_remaining_mb NUMERIC;
  v_can_upload BOOLEAN;
BEGIN
  -- Get current storage usage
  SELECT total_size_mb INTO v_current_size_mb
  FROM get_user_storage_usage(p_user_id);
  
  v_current_size_mb := COALESCE(v_current_size_mb, 0);
  v_new_total_mb := v_current_size_mb + (p_new_file_size / 1048576.0);
  v_remaining_mb := p_max_quota_mb - v_new_total_mb;
  v_can_upload := v_new_total_mb <= p_max_quota_mb;
  
  RETURN jsonb_build_object(
    'can_upload', v_can_upload,
    'current_usage_mb', v_current_size_mb,
    'new_file_size_mb', ROUND(p_new_file_size / 1048576.0, 2),
    'new_total_mb', ROUND(v_new_total_mb, 2),
    'max_quota_mb', p_max_quota_mb,
    'remaining_mb', ROUND(v_remaining_mb, 2)
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_user_storage_quota IS 'Check if user can upload new file without exceeding quota';

-- =====================================================
-- FUNCTION 4: Get Storage Statistics (Admin)
-- =====================================================
CREATE OR REPLACE FUNCTION get_storage_statistics()
RETURNS TABLE (
  total_users BIGINT,
  total_files BIGINT,
  total_size_mb NUMERIC,
  avg_files_per_user NUMERIC,
  avg_size_per_user_mb NUMERIC,
  most_common_mime_type TEXT,
  most_common_category TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT (storage.foldername(name))[1])::BIGINT AS total_users,
    COUNT(*)::BIGINT AS total_files,
    ROUND(
      COALESCE(SUM(
        CASE 
          WHEN metadata IS NOT NULL AND metadata->>'size' IS NOT NULL 
          THEN (metadata->>'size')::BIGINT 
          ELSE 0 
        END
      ), 0) / 1048576.0, 2
    ) AS total_size_mb,
    ROUND(
      COUNT(*)::NUMERIC / NULLIF(COUNT(DISTINCT (storage.foldername(name))[1]), 0), 2
    ) AS avg_files_per_user,
    ROUND(
      COALESCE(SUM(
        CASE 
          WHEN metadata IS NOT NULL AND metadata->>'size' IS NOT NULL 
          THEN (metadata->>'size')::BIGINT 
          ELSE 0 
        END
      ), 0) / 1048576.0 / NULLIF(COUNT(DISTINCT (storage.foldername(name))[1]), 0), 2
    ) AS avg_size_per_user_mb,
    (
      SELECT metadata->>'mimetype'
      FROM storage.objects
      WHERE bucket_id = 'lapak-images'
      GROUP BY metadata->>'mimetype'
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) AS most_common_mime_type,
    (
      SELECT (storage.foldername(name))[2]
      FROM storage.objects
      WHERE bucket_id = 'lapak-images'
      GROUP BY (storage.foldername(name))[2]
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) AS most_common_category
  FROM storage.objects
  WHERE bucket_id = 'lapak-images';
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_storage_statistics IS 'Get overall storage statistics for admin dashboard';

-- =====================================================
-- VIEW: Storage Usage Summary
-- =====================================================
CREATE OR REPLACE VIEW storage_usage_summary AS
SELECT 
  (storage.foldername(obj.name))[1]::UUID AS user_id,
  up.full_name,
  up.business_name,
  COUNT(*) AS file_count,
  ROUND(
    COALESCE(SUM(
      CASE 
        WHEN obj.metadata IS NOT NULL AND obj.metadata->>'size' IS NOT NULL 
        THEN (obj.metadata->>'size')::BIGINT 
        ELSE 0 
      END
    ), 0) / 1048576.0, 2
  ) AS total_size_mb,
  MAX(obj.created_at) AS last_upload_at,
  jsonb_object_agg(
    (storage.foldername(obj.name))[2],
    COUNT(*)
  ) FILTER (WHERE (storage.foldername(obj.name))[2] IS NOT NULL) AS category_breakdown
FROM storage.objects obj
LEFT JOIN user_profiles up ON (storage.foldername(obj.name))[1]::UUID = up.user_id
WHERE obj.bucket_id = 'lapak-images'
GROUP BY (storage.foldername(obj.name))[1], up.full_name, up.business_name;

COMMENT ON VIEW storage_usage_summary IS 'Summary view of storage usage per user';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ SUPPORTING Domain - Storage (lapak-images) Logic Created';
  RAISE NOTICE '   - Functions: 4 (usage stats, images by category, quota check, admin stats)';
  RAISE NOTICE '   - Views: 1 (usage summary per user)';
  RAISE NOTICE '   - Note: Policies defined separately in policies.sql';
END $$;
