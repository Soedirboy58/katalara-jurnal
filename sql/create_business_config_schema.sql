-- =====================================================
-- BUSINESS CONFIGURATION SCHEMA
-- For Onboarding Wizard & Smart Classification
-- =====================================================

-- 1. Business Type Mappings (for keyword classification)
CREATE TABLE IF NOT EXISTS business_type_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  indicators TEXT[] NOT NULL,
  examples TEXT[] NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Disable RLS for business_type_mappings (public reference data)
ALTER TABLE business_type_mappings DISABLE ROW LEVEL SECURITY;

-- 2. Business Configuration (per user)
CREATE TABLE IF NOT EXISTS business_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Business Type
  business_category TEXT NOT NULL, -- 'Produk dengan Stok', 'Produk Tanpa Stok', 'Jasa/Layanan', 'Trading/Reseller', 'Hybrid'
  business_description TEXT, -- Original user input
  classification_method TEXT, -- 'manual', 'keyword', 'ai'
  classification_confidence FLOAT, -- 0.0 to 1.0
  
  -- Targets & Goals
  monthly_revenue_target BIGINT, -- in Rupiah
  profit_margin_target FLOAT, -- percentage (e.g., 25.5)
  break_even_months INTEGER, -- expected months to break even
  
  -- Capital & Finance
  initial_capital BIGINT, -- modal awal
  monthly_operational_cost BIGINT, -- biaya operasional per bulan
  minimum_cash_alert BIGINT, -- alert threshold
  
  -- Preferences
  enable_email_alerts BOOLEAN DEFAULT TRUE,
  enable_stock_alerts BOOLEAN DEFAULT TRUE,
  enable_weekly_summary BOOLEAN DEFAULT TRUE,
  
  -- Onboarding Status
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_completed_at TIMESTAMP,
  onboarding_step INTEGER DEFAULT 0, -- track progress if user exits
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id)
);

-- Disable RLS for business_configurations (same reason as user_profiles)
ALTER TABLE business_configurations DISABLE ROW LEVEL SECURITY;

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_config_user_id ON business_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_business_config_onboarding ON business_configurations(onboarding_completed);

-- =====================================================
-- SEED DATA: Business Type Mappings
-- =====================================================

INSERT INTO business_type_mappings (category, keywords, indicators, examples) VALUES
(
  'Produk dengan Stok',
  ARRAY['toko', 'warung', 'retail', 'sembako', 'minimarket', 'swalayan', 
        'beras', 'sayuran', 'buah', 'daging', 'ikan', 'ayam',
        'pakaian', 'baju', 'celana', 'sepatu', 'tas', 'aksesoris',
        'elektronik', 'hp', 'handphone', 'laptop', 'komputer', 'gadget',
        'kosmetik', 'skincare', 'makeup', 'parfum', 'kecantikan',
        'furniture', 'mebel', 'kursi', 'meja', 'lemari',
        'makanan', 'minuman', 'snack', 'kue', 'roti',
        'stok', 'inventory', 'gudang', 'rak', 'display'],
  ARRAY['jual produk fisik', 'punya stok', 'kelola inventory', 'toko fisik'],
  ARRAY['Warung sembako', 'Toko pakaian', 'Minimarket', 'Toko elektronik', 'Toko kosmetik']
),
(
  'Produk Tanpa Stok',
  ARRAY['dropship', 'dropshipper', 'reseller', 'pre-order', 'po', 'pre order',
        'print on demand', 'custom', 'pesanan', 'indent',
        'supplier', 'distributor', 'grosir',
        'online', 'daring', 'marketplace',
        'tidak pegang barang', 'tanpa stok', 'tidak punya stok',
        'pesan dulu', 'order dulu'],
  ARRAY['tidak stok fisik', 'pesan dari supplier', 'dropship', 'pre-order'],
  ARRAY['Dropship fashion', 'Pre-order kue', 'Print on demand kaos', 'Reseller skincare']
),
(
  'Jasa/Layanan',
  ARRAY['service', 'servis', 'jasa', 'layanan', 'konsultan', 'konsultasi',
        'freelance', 'freelancer', 'lepas',
        'desain', 'design', 'grafis', 'programmer', 'developer', 'web', 'aplikasi',
        'bengkel', 'ac', 'kulkas', 'mesin cuci', 'elektronik',
        'salon', 'barbershop', 'pangkas', 'potong rambut', 'cukur',
        'laundry', 'cuci', 'setrika', 'dry clean',
        'travel', 'tour', 'wisata', 'tiket', 'hotel',
        'fotografi', 'fotografer', 'video', 'videografi', 'editing',
        'les', 'kursus', 'bimbel', 'guru', 'privat', 'mengajar',
        'cleaning', 'bersih', 'kebersihan',
        'pijat', 'massage', 'spa', 'therapy',
        'reparasi', 'perbaikan', 'maintenance'],
  ARRAY['tidak jual barang', 'berbasis skill', 'layanan jasa', 'service'],
  ARRAY['Service AC', 'Desain grafis', 'Salon kecantikan', 'Laundry', 'Fotografer', 'Bimbel']
),
(
  'Trading/Reseller',
  ARRAY['calo', 'broker', 'makelar', 'agen', 'agent',
        'properti', 'property', 'rumah', 'tanah', 'ruko', 'kost',
        'mobil', 'motor', 'kendaraan', 'otomotif',
        'komisi', 'fee', 'margin', 'untung',
        'jual beli', 'trading', 'perdagangan',
        'perantara', 'mediator', 'penghubung'],
  ARRAY['berbasis komisi', 'tidak pegang barang', 'perantara', 'broker'],
  ARRAY['Agen properti', 'Broker mobil', 'Makelar tanah', 'Agen asuransi']
),
(
  'Hybrid (Produk + Jasa)',
  ARRAY['bengkel jual sparepart', 'salon jual produk', 'toko service',
        'cafe', 'kafe', 'coffee shop', 'kedai kopi',
        'restaurant', 'restoran', 'rumah makan', 'warung makan',
        'toko komputer service', 'toko hp service',
        'jual dan pasang', 'jual plus service'],
  ARRAY['jual barang dan layanan', 'produk dan jasa', 'kombinasi'],
  ARRAY['Bengkel + jual sparepart', 'Cafe & restaurant', 'Salon + jual produk kecantikan', 'Toko komputer + service']
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check business_type_mappings
SELECT category, array_length(keywords, 1) as keyword_count, examples[1] as example
FROM business_type_mappings
ORDER BY category;

-- Check business_configurations structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'business_configurations'
ORDER BY ordinal_position;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Business Configuration Schema Created Successfully!';
  RAISE NOTICE '✅ Business Type Mappings Seeded (5 categories)';
  RAISE NOTICE '✅ Ready for Onboarding Wizard Implementation';
END $$;
