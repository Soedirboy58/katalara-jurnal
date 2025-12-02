-- =====================================================
-- KATALARA RANGERS ECOSYSTEM SCHEMA
-- Feature: Live Concierge Service & Talent Marketplace
-- Version: 1.0
-- Date: 2025-12-02
-- =====================================================

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
    'product_photography', -- Foto produk
    'data_entry', -- Input data produk massal
    'catalog_design', -- Desain katalog
    'copywriting', -- Deskripsi produk
    'social_media_post', -- Posting IG/FB
    'marketplace_optimization', -- Optimasi toko online
    'full_concierge' -- Paket lengkap (foto + input + edukasi)
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Request Status
DO $$ BEGIN
  CREATE TYPE request_status AS ENUM (
    'pending', -- Menunggu Ranger claim
    'assigned', -- Sudah ada Ranger yang claim
    'in_progress', -- Sedang dikerjakan
    'completed', -- Selesai dikerjakan
    'reviewed', -- UMKM sudah review
    'cancelled' -- Dibatalkan
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Service Requests Table
CREATE TABLE IF NOT EXISTS service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Requester (UMKM)
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Service Details
  service_type service_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  estimated_items INTEGER, -- Jumlah produk yang perlu difoto/input
  
  -- Location (for matching)
  service_location TEXT NOT NULL, -- Alamat UMKM
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  city VARCHAR(100),
  district VARCHAR(100),
  
  -- Pricing
  budget_min DECIMAL(15, 2),
  budget_max DECIMAL(15, 2),
  agreed_price DECIMAL(15, 2), -- Final price setelah negosiasi
  
  -- Timeline
  preferred_date DATE,
  preferred_time VARCHAR(50), -- 'pagi', 'siang', 'sore', 'malam'
  estimated_duration_hours DECIMAL(4, 2), -- Estimasi durasi kerja
  deadline DATE,
  
  -- Assignment
  assigned_ranger_id UUID REFERENCES ranger_profiles(id),
  assigned_at TIMESTAMP WITH TIME ZONE,
  
  -- Status & Workflow
  status request_status DEFAULT 'pending',
  status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Completion
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_notes TEXT,
  
  -- Payment
  payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  payment_method VARCHAR(50),
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. SERVICE SESSIONS (Temporary Access Control)
-- =====================================================

-- Service Session Table (Koneksi temporary saat Ranger bekerja)
CREATE TABLE IF NOT EXISTS service_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship
  service_request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  ranger_id UUID NOT NULL REFERENCES ranger_profiles(id) ON DELETE CASCADE,
  
  -- Access Control
  access_granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_expires_at TIMESTAMP WITH TIME ZONE, -- Auto-expire setelah deadline
  is_active BOOLEAN DEFAULT true,
  
  -- Permissions (What Ranger can do)
  can_create_products BOOLEAN DEFAULT true,
  can_edit_products BOOLEAN DEFAULT true,
  can_upload_images BOOLEAN DEFAULT true,
  can_view_financials BOOLEAN DEFAULT false, -- Biasanya false untuk privacy
  
  -- Activity Tracking
  products_added INTEGER DEFAULT 0,
  images_uploaded INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Session End
  ended_at TIMESTAMP WITH TIME ZONE,
  ended_by UUID REFERENCES auth.users(id),
  end_reason VARCHAR(100), -- 'completed', 'cancelled', 'expired'
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(service_request_id, ranger_id)
);

-- =====================================================
-- 4. PORTFOLIO & REVIEWS
-- =====================================================

-- Ranger Portfolio Table (Track record hasil kerja)
CREATE TABLE IF NOT EXISTS ranger_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship
  ranger_id UUID NOT NULL REFERENCES ranger_profiles(id) ON DELETE CASCADE,
  service_request_id UUID REFERENCES service_requests(id),
  
  -- Portfolio Item
  title VARCHAR(255) NOT NULL,
  description TEXT,
  service_type service_type NOT NULL,
  
  -- Media
  images TEXT[], -- Array of image URLs
  before_after_images JSONB, -- {before: [...], after: [...]}
  
  -- Metrics
  items_completed INTEGER, -- Jumlah produk yang difoto/input
  duration_hours DECIMAL(4, 2),
  client_satisfaction INTEGER CHECK (client_satisfaction >= 1 AND client_satisfaction <= 5),
  
  -- Visibility
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false, -- Highlighted in portfolio
  
  -- Metadata
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Reviews Table
CREATE TABLE IF NOT EXISTS service_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship
  service_request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  ranger_id UUID NOT NULL REFERENCES ranger_profiles(id) ON DELETE CASCADE,
  reviewed_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Rating (1-5 stars)
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  speed_rating INTEGER CHECK (speed_rating >= 1 AND speed_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  
  -- Feedback
  review_text TEXT,
  pros TEXT, -- Yang bagus
  cons TEXT, -- Yang perlu diperbaiki
  
  -- Response (Ranger bisa balas review)
  ranger_response TEXT,
  ranger_responded_at TIMESTAMP WITH TIME ZONE,
  
  -- Visibility
  is_public BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(service_request_id)
);

-- =====================================================
-- 5. EARNINGS & TRANSACTIONS
-- =====================================================

-- Ranger Earnings Table
CREATE TABLE IF NOT EXISTS ranger_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship
  ranger_id UUID NOT NULL REFERENCES ranger_profiles(id) ON DELETE CASCADE,
  service_request_id UUID REFERENCES service_requests(id),
  
  -- Transaction
  amount DECIMAL(15, 2) NOT NULL,
  transaction_type VARCHAR(50) CHECK (transaction_type IN ('service_fee', 'bonus', 'referral', 'penalty')),
  description TEXT,
  
  -- Payment Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid', 'cancelled')),
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255), -- Nomor transfer/bukti
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. MARKETPLACE CONTRACTS (Future Feature)
-- =====================================================

-- Contract Templates Table
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template Info
  name VARCHAR(255) NOT NULL,
  service_type service_type NOT NULL,
  description TEXT,
  
  -- Pricing
  base_price DECIMAL(15, 2) NOT NULL,
  price_per_item DECIMAL(15, 2), -- Untuk layanan yang dihitung per-item
  
  -- Terms
  estimated_duration_hours DECIMAL(4, 2),
  deliverables TEXT[], -- Array: ['20 foto produk', '10 deskripsi', 'catalog PDF']
  terms_and_conditions TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. INDEXES FOR PERFORMANCE
-- =====================================================

-- Rangers
CREATE INDEX IF NOT EXISTS idx_rangers_location ON ranger_profiles(city, district);
CREATE INDEX IF NOT EXISTS idx_rangers_skills ON ranger_profiles USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_rangers_verified ON ranger_profiles(is_verified, is_available);
CREATE INDEX IF NOT EXISTS idx_rangers_rating ON ranger_profiles(average_rating DESC);

-- Service Requests
CREATE INDEX IF NOT EXISTS idx_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_location ON service_requests(city, district);
CREATE INDEX IF NOT EXISTS idx_requests_service_type ON service_requests(service_type);
CREATE INDEX IF NOT EXISTS idx_requests_business ON service_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_requests_ranger ON service_requests(assigned_ranger_id);
CREATE INDEX IF NOT EXISTS idx_requests_created ON service_requests(created_at DESC);

-- Service Sessions
CREATE INDEX IF NOT EXISTS idx_sessions_active ON service_sessions(is_active, access_expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_business ON service_sessions(business_id);
CREATE INDEX IF NOT EXISTS idx_sessions_ranger ON service_sessions(ranger_id);

-- Portfolio
CREATE INDEX IF NOT EXISTS idx_portfolio_ranger ON ranger_portfolio(ranger_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_public ON ranger_portfolio(is_public, is_featured);

-- Reviews
CREATE INDEX IF NOT EXISTS idx_reviews_ranger ON service_reviews(ranger_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON service_reviews(overall_rating DESC);

-- Earnings
CREATE INDEX IF NOT EXISTS idx_earnings_ranger ON ranger_earnings(ranger_id);
CREATE INDEX IF NOT EXISTS idx_earnings_status ON ranger_earnings(status);

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE ranger_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranger_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranger_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

-- Ranger Profiles Policies
DO $$ BEGIN
  CREATE POLICY "Rangers can view own profile"
    ON ranger_profiles FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Rangers can update own profile"
    ON ranger_profiles FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can view verified rangers"
    ON ranger_profiles FOR SELECT
    USING (is_verified = true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Rangers can create own profile"
    ON ranger_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Service Requests Policies
DO $$ BEGIN
  CREATE POLICY "UMKM can view own requests"
    ON service_requests FOR SELECT
    USING (requested_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "UMKM can create requests"
    ON service_requests FOR INSERT
    WITH CHECK (requested_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Rangers can view pending requests in their area"
    ON service_requests FOR SELECT
    USING (status = 'pending' OR assigned_ranger_id IN (
      SELECT id FROM ranger_profiles WHERE user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Assigned rangers can update requests"
    ON service_requests FOR UPDATE
    USING (assigned_ranger_id IN (
      SELECT id FROM ranger_profiles WHERE user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Service Sessions Policies
DO $$ BEGIN
  CREATE POLICY "UMKM can view own sessions"
    ON service_sessions FOR SELECT
    USING (business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Rangers can view own sessions"
    ON service_sessions FOR SELECT
    USING (ranger_id IN (
      SELECT id FROM ranger_profiles WHERE user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Portfolio Policies
DO $$ BEGIN
  CREATE POLICY "Rangers can manage own portfolio"
    ON ranger_portfolio FOR ALL
    USING (ranger_id IN (
      SELECT id FROM ranger_profiles WHERE user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can view public portfolio"
    ON ranger_portfolio FOR SELECT
    USING (is_public = true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Reviews Policies
DO $$ BEGIN
  CREATE POLICY "UMKM can create reviews for own requests"
    ON service_reviews FOR INSERT
    WITH CHECK (reviewed_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can view public reviews"
    ON service_reviews FOR SELECT
    USING (is_public = true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Earnings Policies
DO $$ BEGIN
  CREATE POLICY "Rangers can view own earnings"
    ON ranger_earnings FOR SELECT
    USING (ranger_id IN (
      SELECT id FROM ranger_profiles WHERE user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Contract Templates Policies
DO $$ BEGIN
  CREATE POLICY "Anyone can view active templates"
    ON contract_templates FOR SELECT
    USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =====================================================
-- 9. FUNCTIONS & TRIGGERS
-- =====================================================

-- Update ranger_profiles.updated_at
CREATE OR REPLACE FUNCTION update_ranger_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trigger_ranger_profile_updated
    BEFORE UPDATE ON ranger_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_ranger_profile_timestamp();
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Update ranger metrics after review
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

DO $$ BEGIN
  CREATE TRIGGER trigger_update_ranger_metrics
    AFTER INSERT ON service_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_ranger_metrics_after_review();
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Update request status timestamp
CREATE OR REPLACE FUNCTION update_request_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trigger_request_status_updated
    BEFORE UPDATE ON service_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_request_status_timestamp();
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Auto-expire service sessions
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
-- 10. INITIAL DATA (Example Templates)
-- =====================================================

-- Insert default contract templates (skip if already exists)
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

-- =====================================================
-- END OF SCHEMA
-- =====================================================

COMMENT ON TABLE ranger_profiles IS 'Profil lengkap Katalara Rangers (Mahasiswa/Freelancer)';
COMMENT ON TABLE service_requests IS 'Request layanan dari UMKM ke Rangers';
COMMENT ON TABLE service_sessions IS 'Sesi koneksi temporary antara Ranger dan UMKM saat bekerja';
COMMENT ON TABLE ranger_portfolio IS 'Portfolio hasil kerja Rangers';
COMMENT ON TABLE service_reviews IS 'Review dari UMKM untuk Rangers';
COMMENT ON TABLE ranger_earnings IS 'Pencatatan penghasilan Rangers';
COMMENT ON TABLE contract_templates IS 'Template kontrak layanan marketplace';
