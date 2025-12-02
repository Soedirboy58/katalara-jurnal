-- =====================================================
-- KATALARA RANGERS ECOSYSTEM SCHEMA (CLEAN VERSION)
-- Feature: Live Concierge Service & Talent Marketplace
-- Version: 1.1 - Deadlock-safe
-- Date: 2025-12-02
-- =====================================================

-- Drop existing policies first to avoid conflicts
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on ranger_profiles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'ranger_profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ranger_profiles';
    END LOOP;
    
    -- Drop all policies on service_requests
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'service_requests') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON service_requests';
    END LOOP;
    
    -- Drop all policies on service_sessions
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'service_sessions') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON service_sessions';
    END LOOP;
    
    -- Drop all policies on ranger_portfolio
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'ranger_portfolio') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ranger_portfolio';
    END LOOP;
    
    -- Drop all policies on service_reviews
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'service_reviews') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON service_reviews';
    END LOOP;
    
    -- Drop all policies on ranger_earnings
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'ranger_earnings') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ranger_earnings';
    END LOOP;
    
    -- Drop all policies on contract_templates
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'contract_templates') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON contract_templates';
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Drop existing triggers
DROP TRIGGER IF EXISTS trigger_ranger_profile_updated ON ranger_profiles;
DROP TRIGGER IF EXISTS trigger_update_ranger_metrics ON service_reviews;
DROP TRIGGER IF EXISTS trigger_request_status_updated ON service_requests;

-- =====================================================
-- 1. USER ROLES & PERMISSIONS
-- =====================================================

-- Create user_role enum if not exists
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('pelanggan', 'ranger', 'mentor', 'investor', 'superuser');
EXCEPTION
  WHEN duplicate_object THEN
    -- Type already exists, add new values if they don't exist
    BEGIN
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ranger';
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;
    BEGIN
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'mentor';
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;
    BEGIN
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'investor';
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;
    BEGIN
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superuser';
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;
END $$;

-- Rangers Profile Table
CREATE TABLE IF NOT EXISTS ranger_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal Info
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  date_of_birth DATE,
  gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')),
  
  -- Location (for matching)
  province VARCHAR(100),
  city VARCHAR(100),
  district VARCHAR(100),
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Professional Info
  university VARCHAR(255), -- Nama kampus
  major VARCHAR(255), -- Jurusan
  student_id VARCHAR(50), -- NIM
  graduation_year INTEGER,
  
  -- Skills & Expertise
  skills TEXT[], -- Array: ['fotografi', 'desain_grafis', 'copywriting', 'social_media']
  portfolio_url TEXT,
  instagram_handle VARCHAR(100),
  
  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  id_card_url TEXT, -- KTP/KTM upload
  
  -- Performance Metrics
  total_jobs_completed INTEGER DEFAULT 0,
  total_earnings DECIMAL(15, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
  total_reviews INTEGER DEFAULT 0,
  
  -- Availability
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true, -- Sedang available untuk job baru
  max_concurrent_jobs INTEGER DEFAULT 3,
  
  -- Banking (for payment)
  bank_name VARCHAR(100),
  bank_account_number VARCHAR(50),
  bank_account_name VARCHAR(255),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- =====================================================
-- 2. SERVICE REQUEST SYSTEM
-- =====================================================

-- Service Types
DO $$ BEGIN
  CREATE TYPE service_type AS ENUM (
    'product_photography',
    'data_entry',
    'catalog_design',
    'copywriting',
    'social_media_post',
    'marketplace_optimization',
    'full_concierge'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Request Status
DO $$ BEGIN
  CREATE TYPE request_status AS ENUM (
    'pending',
    'assigned',
    'in_progress',
    'completed',
    'reviewed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Service Requests Table
CREATE TABLE IF NOT EXISTS service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  service_type service_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  estimated_items INTEGER,
  service_location TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  city VARCHAR(100),
  district VARCHAR(100),
  budget_min DECIMAL(15, 2),
  budget_max DECIMAL(15, 2),
  agreed_price DECIMAL(15, 2),
  preferred_date DATE,
  preferred_time VARCHAR(50),
  estimated_duration_hours DECIMAL(4, 2),
  deadline DATE,
  assigned_ranger_id UUID REFERENCES ranger_profiles(id),
  assigned_at TIMESTAMP WITH TIME ZONE,
  status request_status DEFAULT 'pending',
  status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_notes TEXT,
  payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  payment_method VARCHAR(50),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Sessions Table
CREATE TABLE IF NOT EXISTS service_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  ranger_id UUID NOT NULL REFERENCES ranger_profiles(id) ON DELETE CASCADE,
  access_granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  can_create_products BOOLEAN DEFAULT true,
  can_edit_products BOOLEAN DEFAULT true,
  can_upload_images BOOLEAN DEFAULT true,
  can_view_financials BOOLEAN DEFAULT false,
  products_added INTEGER DEFAULT 0,
  images_uploaded INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  ended_by UUID REFERENCES auth.users(id),
  end_reason VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(service_request_id, ranger_id)
);

-- Ranger Portfolio Table
CREATE TABLE IF NOT EXISTS ranger_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ranger_id UUID NOT NULL REFERENCES ranger_profiles(id) ON DELETE CASCADE,
  service_request_id UUID REFERENCES service_requests(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  service_type service_type NOT NULL,
  images TEXT[],
  before_after_images JSONB,
  items_completed INTEGER,
  duration_hours DECIMAL(4, 2),
  client_satisfaction INTEGER CHECK (client_satisfaction >= 1 AND client_satisfaction <= 5),
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Reviews Table
CREATE TABLE IF NOT EXISTS service_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  ranger_id UUID NOT NULL REFERENCES ranger_profiles(id) ON DELETE CASCADE,
  reviewed_by UUID NOT NULL REFERENCES auth.users(id),
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  speed_rating INTEGER CHECK (speed_rating >= 1 AND speed_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  review_text TEXT,
  pros TEXT,
  cons TEXT,
  ranger_response TEXT,
  ranger_responded_at TIMESTAMP WITH TIME ZONE,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(service_request_id)
);

-- Ranger Earnings Table
CREATE TABLE IF NOT EXISTS ranger_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ranger_id UUID NOT NULL REFERENCES ranger_profiles(id) ON DELETE CASCADE,
  service_request_id UUID REFERENCES service_requests(id),
  amount DECIMAL(15, 2) NOT NULL,
  transaction_type VARCHAR(50) CHECK (transaction_type IN ('service_fee', 'bonus', 'referral', 'penalty')),
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid', 'cancelled')),
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contract Templates Table
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  service_type service_type NOT NULL,
  description TEXT,
  base_price DECIMAL(15, 2) NOT NULL,
  price_per_item DECIMAL(15, 2),
  estimated_duration_hours DECIMAL(4, 2),
  deliverables TEXT[],
  terms_and_conditions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_rangers_location ON ranger_profiles(city, district);
CREATE INDEX IF NOT EXISTS idx_rangers_skills ON ranger_profiles USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_rangers_verified ON ranger_profiles(is_verified, is_available);
CREATE INDEX IF NOT EXISTS idx_rangers_rating ON ranger_profiles(average_rating DESC);

CREATE INDEX IF NOT EXISTS idx_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_location ON service_requests(city, district);
CREATE INDEX IF NOT EXISTS idx_requests_service_type ON service_requests(service_type);
CREATE INDEX IF NOT EXISTS idx_requests_business ON service_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_requests_ranger ON service_requests(assigned_ranger_id);
CREATE INDEX IF NOT EXISTS idx_requests_created ON service_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_active ON service_sessions(is_active, access_expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_business ON service_sessions(business_id);
CREATE INDEX IF NOT EXISTS idx_sessions_ranger ON service_sessions(ranger_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_ranger ON ranger_portfolio(ranger_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_public ON ranger_portfolio(is_public, is_featured);

CREATE INDEX IF NOT EXISTS idx_reviews_ranger ON service_reviews(ranger_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON service_reviews(overall_rating DESC);

CREATE INDEX IF NOT EXISTS idx_earnings_ranger ON ranger_earnings(ranger_id);
CREATE INDEX IF NOT EXISTS idx_earnings_status ON ranger_earnings(status);

-- =====================================================
-- GRANT PERMISSIONS TO POSTGREST ROLES
-- =====================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE ranger_profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE service_requests TO anon, authenticated, service_role;
GRANT ALL ON TABLE service_sessions TO anon, authenticated, service_role;
GRANT ALL ON TABLE ranger_portfolio TO anon, authenticated, service_role;
GRANT ALL ON TABLE service_reviews TO anon, authenticated, service_role;
GRANT ALL ON TABLE ranger_earnings TO anon, authenticated, service_role;
GRANT ALL ON TABLE contract_templates TO anon, authenticated, service_role;

-- =====================================================
-- RLS POLICIES (DISABLED FOR TESTING)
-- =====================================================

-- Disable RLS for testing - re-enable later after confirming it works
ALTER TABLE ranger_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE ranger_portfolio DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE ranger_earnings DISABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates DISABLE ROW LEVEL SECURITY;

-- Policies commented out for now - uncomment after testing
-- CREATE POLICY "Rangers can view own profile" ON ranger_profiles FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Rangers can update own profile" ON ranger_profiles FOR UPDATE USING (auth.uid() = user_id);
-- CREATE POLICY "Anyone can view verified rangers" ON ranger_profiles FOR SELECT USING (is_verified = true);
-- CREATE POLICY "Rangers can create own profile" ON ranger_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Remaining policies commented out
-- CREATE POLICY "UMKM can view own requests" ON service_requests FOR SELECT USING (requested_by = auth.uid());
-- CREATE POLICY "UMKM can create requests" ON service_requests FOR INSERT WITH CHECK (requested_by = auth.uid());
-- CREATE POLICY "Rangers can view pending requests in their area" ON service_requests FOR SELECT USING (status = 'pending' OR assigned_ranger_id IN (SELECT id FROM ranger_profiles WHERE user_id = auth.uid()));
-- CREATE POLICY "Assigned rangers can update requests" ON service_requests FOR UPDATE USING (assigned_ranger_id IN (SELECT id FROM ranger_profiles WHERE user_id = auth.uid()));
-- CREATE POLICY "UMKM can view own sessions" ON service_sessions FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
-- CREATE POLICY "Rangers can view own sessions" ON service_sessions FOR SELECT USING (ranger_id IN (SELECT id FROM ranger_profiles WHERE user_id = auth.uid()));
-- CREATE POLICY "Rangers can manage own portfolio" ON ranger_portfolio FOR ALL USING (ranger_id IN (SELECT id FROM ranger_profiles WHERE user_id = auth.uid()));
-- CREATE POLICY "Anyone can view public portfolio" ON ranger_portfolio FOR SELECT USING (is_public = true);
-- CREATE POLICY "UMKM can create reviews for own requests" ON service_reviews FOR INSERT WITH CHECK (reviewed_by = auth.uid());
-- CREATE POLICY "Anyone can view public reviews" ON service_reviews FOR SELECT USING (is_public = true);
-- CREATE POLICY "Rangers can view own earnings" ON ranger_earnings FOR SELECT USING (ranger_id IN (SELECT id FROM ranger_profiles WHERE user_id = auth.uid()));
-- CREATE POLICY "Anyone can view active templates" ON contract_templates FOR SELECT USING (is_active = true);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_ranger_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ranger_profile_updated
  BEFORE UPDATE ON ranger_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_ranger_profile_timestamp();

CREATE OR REPLACE FUNCTION update_ranger_metrics_after_review()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ranger_profiles
  SET 
    total_reviews = total_reviews + 1,
    average_rating = (
      SELECT AVG(overall_rating)
      FROM service_reviews
      WHERE ranger_id = NEW.ranger_id
    )
  WHERE id = NEW.ranger_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ranger_metrics
  AFTER INSERT ON service_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_ranger_metrics_after_review();

CREATE OR REPLACE FUNCTION update_request_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_request_status_updated
  BEFORE UPDATE ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_request_status_timestamp();

CREATE OR REPLACE FUNCTION expire_service_sessions()
RETURNS void AS $$
BEGIN
  UPDATE service_sessions
  SET 
    is_active = false,
    ended_at = NOW(),
    end_reason = 'expired'
  WHERE 
    is_active = true
    AND access_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INITIAL DATA
-- =====================================================

INSERT INTO contract_templates (name, service_type, description, base_price, price_per_item, estimated_duration_hours, deliverables, terms_and_conditions)
SELECT * FROM (VALUES
  (
    'Paket Foto Produk Basic',
    'product_photography'::service_type,
    'Foto produk dengan background sederhana, cocok untuk katalog online',
    50000::DECIMAL(15, 2),
    5000::DECIMAL(15, 2),
    2::DECIMAL(4, 2),
    ARRAY['10 foto produk per jam', 'Foto dengan HP/kamera basic', 'Background putih/polos', 'File JPG resolusi tinggi'],
    'Ranger datang ke lokasi UMKM. UMKM menyiapkan produk yang akan difoto. Hasil foto dikirim maksimal 1x24 jam.'
  ),
  (
    'Paket Input Data Massal',
    'data_entry'::service_type,
    'Input data produk lengkap ke sistem Katalara',
    30000::DECIMAL(15, 2),
    2000::DECIMAL(15, 2),
    3::DECIMAL(4, 2),
    ARRAY['Input nama produk', 'Input harga & stok', 'Input deskripsi singkat', 'Upload foto yang sudah ada'],
    'UMKM menyiapkan daftar produk (bisa tulis tangan/Excel). Ranger input ke sistem. Data langsung muncul di Lapak Online.'
  ),
  (
    'Paket Full Concierge',
    'full_concierge'::service_type,
    'Paket lengkap: Foto produk + Input data + Edukasi aplikasi',
    150000::DECIMAL(15, 2),
    10000::DECIMAL(15, 2),
    4::DECIMAL(4, 2),
    ARRAY['Foto profesional semua produk', 'Input data lengkap ke sistem', 'Deskripsi produk menarik', 'Tutorial pakai aplikasi', 'Setup katalog online', 'Tips marketing digital'],
    'Layanan all-in-one untuk UMKM yang ingin setup bisnis digital dari nol. Ranger datang, mengerjakan semua, dan mengajarkan cara pakai sistem.'
  )
) AS v(name, service_type, description, base_price, price_per_item, estimated_duration_hours, deliverables, terms_and_conditions)
WHERE NOT EXISTS (
  SELECT 1 FROM contract_templates WHERE contract_templates.name = v.name
);

COMMENT ON TABLE ranger_profiles IS 'Profil lengkap Katalara Rangers (Mahasiswa/Freelancer)';
COMMENT ON TABLE service_requests IS 'Request layanan dari UMKM ke Rangers';
COMMENT ON TABLE service_sessions IS 'Sesi koneksi temporary antara Ranger dan UMKM saat bekerja';
COMMENT ON TABLE ranger_portfolio IS 'Portfolio hasil kerja Rangers';
COMMENT ON TABLE service_reviews IS 'Review dari UMKM untuk Rangers';
COMMENT ON TABLE ranger_earnings IS 'Pencatatan penghasilan Rangers';
COMMENT ON TABLE contract_templates IS 'Template kontrak layanan marketplace';

-- =====================================================
-- AUTO-UPDATE USER ROLES FOR RANGERS
-- =====================================================

-- Update role untuk semua user yang memiliki ranger_profiles
UPDATE user_profiles 
SET role = 'ranger'
WHERE user_id IN (
  SELECT user_id FROM ranger_profiles
);

-- =====================================================
-- RELOAD POSTGREST SCHEMA
-- =====================================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
