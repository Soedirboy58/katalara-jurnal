-- =====================================================
-- QUICK FIX: CEK DAN PERBAIKI DATABASE
-- Jalankan ini terlebih dahulu sebelum create admin
-- =====================================================

-- 1. Cek apakah tabel sudah ada
SELECT 
  table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('business_categories', 'user_profiles')
ORDER BY table_name;

-- 2. Jika belum ada, create tables
CREATE TABLE IF NOT EXISTS business_categories (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  business_name TEXT,
  business_category_id INT REFERENCES business_categories(id),
  is_verified BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  role TEXT DEFAULT 'user' CHECK (role IN ('super_admin', 'user')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Seed business categories
INSERT INTO business_categories (code, name) VALUES
  ('fnb','Makanan & Minuman'),
  ('fashion','Fashion & Apparel'),
  ('agrikultur','Agrikultur'),
  ('jasa','Jasa'),
  ('kerajinan','Kerajinan'),
  ('kosmetik','Kosmetik & Kecantikan'),
  ('otomotif','Otomotif'),
  ('ritel','Ritel'),
  ('teknologi','Produk Digital'),
  ('pendidikan','Pendidikan')
ON CONFLICT (code) DO NOTHING;

-- 4. Enable RLS
ALTER TABLE business_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
DROP POLICY IF EXISTS "Anyone can view categories" ON business_categories;
CREATE POLICY "Anyone can view categories"
  ON business_categories FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own profile" ON user_profiles;
CREATE POLICY "Users can create own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. Verify
SELECT 
  'business_categories' as table_name,
  COUNT(*) as row_count
FROM business_categories
UNION ALL
SELECT 
  'user_profiles' as table_name,
  COUNT(*) as row_count
FROM user_profiles;

-- =====================================================
-- SETELAH INI BERHASIL, JALANKAN create_super_admin.sql
-- =====================================================
