-- =====================================================
-- ADD NEW COLUMNS TO USER_PROFILES
-- Tambahan kolom untuk data bisnis yang lebih lengkap
-- =====================================================

-- Tambah kolom alamat lengkap (kecamatan, kabupaten, provinsi)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS kecamatan TEXT,
ADD COLUMN IF NOT EXISTS kabupaten TEXT,
ADD COLUMN IF NOT EXISTS provinsi TEXT;

-- Tambah kolom data bisnis
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS business_start_year INT,
ADD COLUMN IF NOT EXISTS business_type TEXT CHECK (business_type IN ('perorangan', 'cv', 'pt', 'koperasi', 'lainnya')),
ADD COLUMN IF NOT EXISTS number_of_employees TEXT CHECK (number_of_employees IN ('1-5', '6-20', '21-50', '51-100', '100+'));

-- Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;
