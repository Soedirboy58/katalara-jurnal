-- =====================================================
-- SUPABASE STORAGE BUCKETS FOR RANGERS
-- =====================================================

-- 1. Create bucket for Ranger documents (KTM/KTP)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ranger-documents',
  'ranger-documents',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create bucket for Ranger portfolio
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ranger-portfolio',
  'ranger-portfolio',
  true,
  2097152, -- 2MB per file
  ARRAY['image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Ranger Documents Policies
CREATE POLICY "Rangers can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ranger-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Rangers can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'ranger-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Rangers can update own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ranger-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all ranger documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'ranger-documents' 
  AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Ranger Portfolio Policies
CREATE POLICY "Rangers can upload own portfolio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ranger-portfolio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view portfolio (public)"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ranger-portfolio');

CREATE POLICY "Rangers can update own portfolio"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ranger-portfolio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Rangers can delete own portfolio"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'ranger-portfolio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- RLS POLICY FIX: Allow Rangers to insert own profile
-- =====================================================

CREATE POLICY "Rangers can create own profile"
ON ranger_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- END OF STORAGE SETUP
-- =====================================================

COMMENT ON TABLE storage.buckets IS 'Storage buckets configuration';
