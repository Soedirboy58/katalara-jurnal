-- =====================================================
-- Lapak Storage Buckets + Policies
-- Enables upload for logos/qris/products in lapak-images bucket
-- =====================================================

-- Create bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('lapak-images', 'lapak-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policies for authenticated upload/update/delete to own folder
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can upload lapak images'
  ) THEN
    CREATE POLICY "Users can upload lapak images"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'lapak-images'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can update lapak images'
  ) THEN
    CREATE POLICY "Users can update lapak images"
      ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'lapak-images'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can delete lapak images'
  ) THEN
    CREATE POLICY "Users can delete lapak images"
      ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'lapak-images'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public can read lapak images'
  ) THEN
    CREATE POLICY "Public can read lapak images"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'lapak-images');
  END IF;
END $$;
