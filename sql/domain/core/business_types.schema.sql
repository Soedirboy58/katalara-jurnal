-- =====================================================
-- DOMAIN: CORE
-- TABLE: business_type_mappings
-- PURPOSE: Reference data for business classification
-- =====================================================

-- =====================================================
-- TABLE: business_type_mappings
-- Public reference data for onboarding wizard classification
-- =====================================================
CREATE TABLE IF NOT EXISTS business_type_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Business Category
  category TEXT NOT NULL UNIQUE, -- 'Produk dengan Stok', 'Produk Tanpa Stok', etc
  
  -- Classification Data
  keywords TEXT[] NOT NULL, -- Keywords for auto-detection
  indicators TEXT[] NOT NULL, -- Business indicators/characteristics
  examples TEXT[] NOT NULL, -- Example businesses in this category
  
  -- Additional Info
  description TEXT, -- Detailed category description
  recommended_features TEXT[], -- Recommended platform features for this category
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BASIC INDEXES (More in business_types.index.sql)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_business_types_category ON business_type_mappings(category);

-- =====================================================
-- SEED DATA: Business Type Mappings
-- 5 main categories with comprehensive keyword sets
-- =====================================================

INSERT INTO business_type_mappings (
  category,
  keywords,
  indicators,
  examples,
  description,
  recommended_features
) VALUES
(
  'Produk dengan Stok',
  ARRAY[
    'toko', 'warung', 'retail', 'sembako', 'minimarket', 'swalayan',
    'beras', 'sayuran', 'buah', 'daging', 'ikan', 'ayam',
    'pakaian', 'baju', 'celana', 'sepatu', 'tas', 'aksesoris',
    'elektronik', 'hp', 'handphone', 'laptop', 'komputer', 'gadget',
    'kosmetik', 'skincare', 'makeup', 'parfum', 'kecantikan',
    'furniture', 'mebel', 'kursi', 'meja', 'lemari',
    'makanan', 'minuman', 'snack', 'kue', 'roti',
    'stok', 'inventory', 'gudang', 'rak', 'display'
  ],
  ARRAY[
    'Jual produk fisik',
    'Punya stok di gudang/toko',
    'Kelola inventory',
    'Toko fisik atau online dengan stok'
  ],
  ARRAY[
    'Warung sembako',
    'Toko pakaian',
    'Minimarket',
    'Toko elektronik',
    'Toko kosmetik'
  ],
  'Bisnis yang menjual produk fisik dengan stok yang dikelola. Memerlukan tracking inventory, stock in/out, dan reorder point.',
  ARRAY[
    'Stock Management',
    'Inventory Tracking',
    'Reorder Alerts',
    'Supplier Management',
    'Product Catalog'
  ]
),
(
  'Produk Tanpa Stok',
  ARRAY[
    'dropship', 'dropshipper', 'reseller', 'pre-order', 'po', 'pre order',
    'print on demand', 'custom', 'pesanan', 'indent',
    'supplier', 'distributor', 'grosir',
    'online', 'daring', 'marketplace',
    'tidak pegang barang', 'tanpa stok', 'tidak punya stok',
    'pesan dulu', 'order dulu'
  ],
  ARRAY[
    'Tidak stok fisik',
    'Pesan dari supplier setelah ada order',
    'Dropship atau pre-order',
    'Tidak perlu gudang'
  ],
  ARRAY[
    'Dropship fashion',
    'Pre-order kue',
    'Print on demand kaos',
    'Reseller skincare'
  ],
  'Bisnis yang menjual produk tanpa menyimpan stok. Order diterima terlebih dahulu, baru barang dipesan dari supplier atau dibuat custom.',
  ARRAY[
    'Order Management',
    'Supplier Tracking',
    'Lead Time Management',
    'Customer Communication',
    'Profit Margin Calculator'
  ]
),
(
  'Jasa/Layanan',
  ARRAY[
    'service', 'servis', 'jasa', 'layanan', 'konsultan', 'konsultasi',
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
    'reparasi', 'perbaikan', 'maintenance'
  ],
  ARRAY[
    'Tidak jual barang',
    'Berbasis skill/keahlian',
    'Layanan jasa',
    'Service time-based'
  ],
  ARRAY[
    'Service AC',
    'Desain grafis',
    'Salon kecantikan',
    'Laundry',
    'Fotografer',
    'Bimbel'
  ],
  'Bisnis berbasis layanan atau jasa yang tidak menjual produk fisik. Fokus pada skill, waktu, dan kualitas service.',
  ARRAY[
    'Service Booking',
    'Time Tracking',
    'Customer Appointments',
    'Service History',
    'Rating & Reviews'
  ]
),
(
  'Trading/Reseller',
  ARRAY[
    'calo', 'broker', 'makelar', 'agen', 'agent',
    'properti', 'property', 'rumah', 'tanah', 'ruko', 'kost',
    'mobil', 'motor', 'kendaraan', 'otomotif',
    'komisi', 'fee', 'margin', 'untung',
    'jual beli', 'trading', 'perdagangan',
    'perantara', 'mediator', 'penghubung'
  ],
  ARRAY[
    'Berbasis komisi',
    'Tidak pegang barang lama',
    'Perantara jual-beli',
    'Broker/agent'
  ],
  ARRAY[
    'Agen properti',
    'Broker mobil',
    'Makelar tanah',
    'Agen asuransi'
  ],
  'Bisnis yang berperan sebagai perantara atau broker dalam transaksi jual-beli. Pendapatan utama dari komisi atau margin.',
  ARRAY[
    'Commission Tracking',
    'Deal Pipeline',
    'Client Management',
    'Transaction History',
    'Commission Calculator'
  ]
),
(
  'Hybrid (Produk + Jasa)',
  ARRAY[
    'bengkel jual sparepart', 'salon jual produk', 'toko service',
    'cafe', 'kafe', 'coffee shop', 'kedai kopi',
    'restaurant', 'restoran', 'rumah makan', 'warung makan',
    'toko komputer service', 'toko hp service',
    'jual dan pasang', 'jual plus service'
  ],
  ARRAY[
    'Jual barang dan layanan',
    'Produk + jasa kombinasi',
    'Dual revenue stream'
  ],
  ARRAY[
    'Bengkel + jual sparepart',
    'Cafe & restaurant',
    'Salon + jual produk kecantikan',
    'Toko komputer + service'
  ],
  'Bisnis yang menggabungkan penjualan produk dan layanan jasa. Memerlukan manajemen inventory untuk produk dan service tracking untuk jasa.',
  ARRAY[
    'Product & Service Management',
    'Dual Inventory System',
    'Service Booking',
    'Combined Invoicing',
    'Customer History (Product + Service)'
  ]
)
ON CONFLICT (category) DO UPDATE SET
  keywords = EXCLUDED.keywords,
  indicators = EXCLUDED.indicators,
  examples = EXCLUDED.examples,
  description = EXCLUDED.description,
  recommended_features = EXCLUDED.recommended_features,
  updated_at = NOW();

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================
COMMENT ON TABLE business_type_mappings IS 'Reference data for business classification in onboarding wizard';
COMMENT ON COLUMN business_type_mappings.category IS 'Business category name (5 main types)';
COMMENT ON COLUMN business_type_mappings.keywords IS 'Keywords for auto-detection from user description';
COMMENT ON COLUMN business_type_mappings.indicators IS 'Business characteristics/indicators for this category';
COMMENT ON COLUMN business_type_mappings.examples IS 'Example businesses in this category';
COMMENT ON COLUMN business_type_mappings.description IS 'Detailed description of the category';
COMMENT ON COLUMN business_type_mappings.recommended_features IS 'Platform features recommended for this category';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ CORE Domain - Business Type Mappings Schema Created';
  RAISE NOTICE '   - Table: business_type_mappings (classification reference)';
  RAISE NOTICE '   - Seeded: 5 business categories with keywords, indicators, examples';
  RAISE NOTICE '   - Features: Auto-classification, onboarding wizard support';
END $$;
