-- =====================================================
-- Storage Policies for Legacy Buckets (Logo Bisnis + QRIS DB)
-- Enables upload/update/delete for authenticated users
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can upload Logo Bisnis'
  ) THEN
    CREATE POLICY "Users can upload Logo Bisnis"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'Logo Bisnis'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can update Logo Bisnis'
  ) THEN
    CREATE POLICY "Users can update Logo Bisnis"
      ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'Logo Bisnis'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can delete Logo Bisnis'
  ) THEN
    CREATE POLICY "Users can delete Logo Bisnis"
      ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'Logo Bisnis'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public can read Logo Bisnis'
  ) THEN
    CREATE POLICY "Public can read Logo Bisnis"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'Logo Bisnis');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can upload QRIS DB'
  ) THEN
    CREATE POLICY "Users can upload QRIS DB"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'QRIS DB'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can update QRIS DB'
  ) THEN
    CREATE POLICY "Users can update QRIS DB"
      ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'QRIS DB'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can delete QRIS DB'
  ) THEN
    CREATE POLICY "Users can delete QRIS DB"
      ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'QRIS DB'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public can read QRIS DB'
  ) THEN
    CREATE POLICY "Public can read QRIS DB"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'QRIS DB');
  END IF;
END $$;
