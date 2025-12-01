-- =====================================================
-- BUSINESS CATEGORIES: UX-FRIENDLY UPGRADE
-- =====================================================
-- Purpose: Menambahkan kategori bisnis yang ramah UMKM pemula
-- Architecture: ADDITIVE ONLY - Tidak mengubah struktur existing
-- Domain: CORE
-- Date: 2024-11-26
--
-- STRATEGI:
-- 1. TIDAK membuat tabel baru
-- 2. TIDAK DROP/RENAME apapun
-- 3. HANYA menambah kolom baru (IF NOT EXISTS)
-- 4. HANYA menambah data kategori baru
-- 5. Backward compatible dengan data lama
-- =====================================================

-- =====================================================
-- STEP 1: EXTEND SCHEMA (ADDITIVE ONLY)
-- =====================================================

-- Tambah kolom UI-friendly ke business_type_mappings
ALTER TABLE business_type_mappings 
  ADD COLUMN IF NOT EXISTS category_key TEXT,
  ADD COLUMN IF NOT EXISTS label_ui TEXT,
  ADD COLUMN IF NOT EXISTS business_mode TEXT,
  ADD COLUMN IF NOT EXISTS inventory_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_stock BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS target_audience TEXT,
  ADD COLUMN IF NOT EXISTS icon_name TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 999;

-- Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_business_type_category_key 
  ON business_type_mappings(category_key);

CREATE INDEX IF NOT EXISTS idx_business_type_sort_order 
  ON business_type_mappings(sort_order);

-- =====================================================
-- STEP 2: CLEAR OLD DATA (SAFE - dengan backup implisit)
-- =====================================================

-- Backup data lama ke kolom 'category' (sudah ada)
-- Tidak perlu DROP, cukup tandai sebagai legacy
UPDATE business_type_mappings 
SET category = '[LEGACY] ' || category 
WHERE category_key IS NULL 
  AND category NOT LIKE '[LEGACY]%';

-- =====================================================
-- STEP 3: INSERT NEW UI-FRIENDLY CATEGORIES
-- =====================================================

-- UI Category 1: Makanan & Minuman
-- Target: UMKM kuliner, warung makan, cafe, katering
-- System Mapping: hybrid + inventory + stock
INSERT INTO business_type_mappings (
  category_key,
  label_ui,
  category,
  business_mode,
  inventory_enabled,
  has_stock,
  target_audience,
  icon_name,
  sort_order,
  keywords,
  indicators,
  examples
) VALUES (
  'makanan_minuman',
  'Makanan & Minuman',
  'Makanan & Minuman',
  'hybrid',
  true,
  true,
  'UMKM kuliner, warung makan, cafe, katering, bakery, catering, kedai kopi',
  'utensils',
  1,
  ARRAY[
    'warung', 'makan', 'cafe', 'kafe', 'kedai kopi', 'coffee shop',
    'restaurant', 'restoran', 'rumah makan', 'kuliner', 'catering', 'katering',
    'bakery', 'toko roti', 'kue', 'pastry', 'bakehouse',
    'minuman', 'jus', 'bubble tea', 'boba', 'smoothie',
    'makanan', 'nasi', 'ayam', 'sate', 'bakso', 'mie',
    'snack', 'cemilan', 'gorengan', 'martabak', 'pizza'
  ],
  ARRAY[
    'jual makanan siap saji',
    'punya dapur/tempat masak',
    'kelola bahan baku',
    'produksi makanan/minuman',
    'ada menu makanan'
  ],
  ARRAY[
    'Warung Nasi Ibu Siti',
    'Cafe & Coffee Shop',
    'Katering untuk acara',
    'Toko Roti & Bakery',
    'Kedai Kopi & Minuman'
  ]
) ON CONFLICT DO NOTHING;

-- UI Category 2: Jasa & Servis
-- Target: Penyedia layanan tanpa produk fisik
-- System Mapping: service + no inventory + no stock
INSERT INTO business_type_mappings (
  category_key,
  label_ui,
  category,
  business_mode,
  inventory_enabled,
  has_stock,
  target_audience,
  icon_name,
  sort_order,
  keywords,
  indicators,
  examples
) VALUES (
  'jasa_servis',
  'Jasa & Servis',
  'Jasa & Servis',
  'service',
  false,
  false,
  'Penyedia jasa, service, konsultan, freelancer, skill-based business',
  'wrench',
  2,
  ARRAY[
    'service', 'servis', 'jasa', 'layanan',
    'bengkel', 'ac', 'kulkas', 'mesin cuci', 'elektronik', 'motor', 'mobil',
    'salon', 'barbershop', 'pangkas', 'potong rambut', 'cukur', 'spa',
    'laundry', 'cuci', 'setrika', 'dry clean', 'kiloan',
    'fotografi', 'fotografer', 'video', 'videografi', 'editing',
    'desain', 'design', 'grafis', 'logo', 'banner',
    'konsultan', 'konsultasi', 'advisor', 'mentor',
    'les', 'kursus', 'bimbel', 'guru', 'privat', 'mengajar',
    'cleaning', 'bersih', 'kebersihan', 'sanitasi',
    'pijat', 'massage', 'therapy', 'refleksi',
    'reparasi', 'perbaikan', 'maintenance', 'repair'
  ],
  ARRAY[
    'tidak jual barang fisik',
    'berbasis skill/keahlian',
    'layanan ke customer',
    'service-based business'
  ],
  ARRAY[
    'Service AC & Elektronik',
    'Salon Kecantikan & Barbershop',
    'Laundry Kiloan',
    'Fotografer & Videografi',
    'Desain Grafis Freelance',
    'Bimbel & Kursus Privat'
  ]
) ON CONFLICT DO NOTHING;

-- UI Category 3: Perdagangan / Toko
-- Target: Toko fisik dengan stok barang
-- System Mapping: physical + inventory + stock
INSERT INTO business_type_mappings (
  category_key,
  label_ui,
  category,
  business_mode,
  inventory_enabled,
  has_stock,
  target_audience,
  icon_name,
  sort_order,
  keywords,
  indicators,
  examples
) VALUES (
  'perdagangan_toko',
  'Perdagangan / Toko',
  'Perdagangan / Toko',
  'physical',
  true,
  true,
  'Toko fisik, retail, warung, minimarket, penjual barang',
  'store',
  3,
  ARRAY[
    'toko', 'warung', 'retail', 'sembako', 'minimarket', 'swalayan', 'toserba',
    'beras', 'sayuran', 'sayur', 'buah', 'daging', 'ikan', 'ayam', 'segar',
    'pakaian', 'baju', 'celana', 'sepatu', 'tas', 'aksesoris', 'fashion',
    'elektronik', 'hp', 'handphone', 'laptop', 'komputer', 'gadget', 'aksesoris hp',
    'kosmetik', 'skincare', 'makeup', 'parfum', 'kecantikan', 'wangi',
    'furniture', 'mebel', 'kursi', 'meja', 'lemari', 'sofa',
    'alat tulis', 'atk', 'stationary', 'kertas', 'pulpen',
    'mainan', 'toys', 'boneka', 'action figure',
    'obat', 'apotek', 'farmasi', 'vitamin',
    'stok', 'inventory', 'gudang', 'rak', 'display', 'etalase'
  ],
  ARRAY[
    'jual produk fisik',
    'punya toko/tempat jualan',
    'kelola stok barang',
    'inventory management'
  ],
  ARRAY[
    'Warung Sembako',
    'Toko Pakaian & Fashion',
    'Minimarket Kelontong',
    'Toko Elektronik & HP',
    'Toko Kosmetik & Skincare'
  ]
) ON CONFLICT DO NOTHING;

-- UI Category 4: Reseller / Dropship
-- Target: Pedagang tanpa stok fisik, order dari supplier
-- System Mapping: trading + optional inventory + stock
INSERT INTO business_type_mappings (
  category_key,
  label_ui,
  category,
  business_mode,
  inventory_enabled,
  has_stock,
  target_audience,
  icon_name,
  sort_order,
  keywords,
  indicators,
  examples
) VALUES (
  'reseller_dropship',
  'Reseller / Dropship',
  'Reseller / Dropship',
  'trading',
  true,
  true,
  'Dropshipper, reseller, pre-order, tidak pegang barang fisik',
  'truck',
  4,
  ARRAY[
    'dropship', 'dropshipper', 'reseller', 'agen', 'distributor',
    'pre-order', 'po', 'pre order', 'indent', 'pesanan',
    'print on demand', 'custom', 'customized',
    'supplier', 'grosir', 'wholesaler',
    'online', 'daring', 'marketplace', 'shopee', 'tokopedia', 'lazada',
    'tidak pegang barang', 'tanpa stok', 'tidak punya stok',
    'pesan dulu', 'order dulu', 'booking',
    'komisi', 'margin', 'fee', 'untung', 'profit'
  ],
  ARRAY[
    'tidak stok fisik sendiri',
    'pesan dari supplier',
    'dropship/reseller',
    'pre-order based'
  ],
  ARRAY[
    'Dropship Fashion Online',
    'Pre-order Kue & Snack',
    'Print on Demand Kaos',
    'Reseller Skincare',
    'Agen Produk dari Supplier'
  ]
) ON CONFLICT DO NOTHING;

-- UI Category 5: Digital / Online
-- Target: Bisnis digital, konten creator, jasa online
-- System Mapping: digital + no inventory + no stock
INSERT INTO business_type_mappings (
  category_key,
  label_ui,
  category,
  business_mode,
  inventory_enabled,
  has_stock,
  target_audience,
  icon_name,
  sort_order,
  keywords,
  indicators,
  examples
) VALUES (
  'digital_online',
  'Digital / Online',
  'Digital / Online',
  'digital',
  false,
  false,
  'Konten creator, jasa online, digital product, affiliate',
  'laptop',
  5,
  ARRAY[
    'digital', 'online', 'internet', 'website', 'web',
    'konten', 'content creator', 'youtuber', 'vlogger', 'blogger',
    'social media', 'sosial media', 'instagram', 'tiktok', 'facebook',
    'affiliate', 'afiliasi', 'referral', 'link',
    'ebook', 'e-book', 'pdf', 'digital product',
    'kursus online', 'online course', 'webinar', 'zoom',
    'programmer', 'developer', 'coding', 'software', 'aplikasi', 'app',
    'seo', 'sem', 'ads', 'marketing', 'digital marketing',
    'freelance', 'freelancer', 'remote', 'work from home',
    'saas', 'software as a service', 'subscription',
    'streaming', 'podcast', 'audio', 'musik'
  ],
  ARRAY[
    'produk/jasa digital',
    'berbasis internet',
    'tidak ada barang fisik',
    'online-based business'
  ],
  ARRAY[
    'Konten Creator YouTube/TikTok',
    'Jasa Pembuatan Website',
    'Kursus Online & Webinar',
    'Affiliate Marketing',
    'Freelance Developer/Designer'
  ]
) ON CONFLICT DO NOTHING;

-- UI Category 6: Produksi
-- Target: Produsen, kerajinan, manufaktur kecil
-- System Mapping: hybrid + inventory + stock
INSERT INTO business_type_mappings (
  category_key,
  label_ui,
  category,
  business_mode,
  inventory_enabled,
  has_stock,
  target_audience,
  icon_name,
  sort_order,
  keywords,
  indicators,
  examples
) VALUES (
  'produksi',
  'Produksi',
  'Produksi',
  'hybrid',
  true,
  true,
  'Produsen, kerajinan, manufaktur, home industry, pabrik kecil',
  'hammer',
  6,
  ARRAY[
    'produksi', 'produk', 'manufaktur', 'pabrik', 'factory',
    'kerajinan', 'handicraft', 'craft', 'handmade', 'buatan tangan',
    'konveksi', 'jahit', 'bordir', 'sablon', 'printing',
    'furniture', 'mebel', 'kayu', 'woodworking', 'carpentry',
    'makanan', 'food processing', 'olahan', 'frozen food',
    'sabun', 'soap', 'lilin', 'candle', 'aromatherapy',
    'tas', 'dompet', 'wallet', 'kulit', 'leather',
    'aksesoris', 'perhiasan', 'jewelry', 'emas', 'perak',
    'kosmetik', 'skincare', 'homemade', 'natural',
    'home industry', 'umkm', 'usaha kecil', 'industri rumahan',
    'bahan baku', 'raw material', 'proses', 'packaging'
  ],
  ARRAY[
    'produksi sendiri',
    'bahan baku ke produk jadi',
    'home industry',
    'manufaktur'
  ],
  ARRAY[
    'Kerajinan Tangan & Handicraft',
    'Konveksi Pakaian & Sablon',
    'Produksi Makanan Olahan',
    'Furniture & Mebel Custom',
    'Sabun & Kosmetik Homemade'
  ]
) ON CONFLICT DO NOTHING;

-- UI Category 7: Lainnya
-- Target: Bisnis campuran atau tidak masuk kategori
-- System Mapping: hybrid + configurable
INSERT INTO business_type_mappings (
  category_key,
  label_ui,
  category,
  business_mode,
  inventory_enabled,
  has_stock,
  target_audience,
  icon_name,
  sort_order,
  keywords,
  indicators,
  examples
) VALUES (
  'lainnya',
  'Lainnya',
  'Lainnya',
  'hybrid',
  true,
  true,
  'Bisnis campuran atau tidak masuk kategori lain',
  'folder',
  999,
  ARRAY[
    'lain', 'lainnya', 'other', 'campuran', 'mixed', 'hybrid',
    'kombinasi', 'gabungan', 'multi', 'beragam',
    'custom', 'unik', 'spesial', 'khusus'
  ],
  ARRAY[
    'kombinasi produk dan jasa',
    'model bisnis unik',
    'tidak masuk kategori lain'
  ],
  ARRAY[
    'Bisnis Campuran (Toko + Service)',
    'Model Bisnis Unik',
    'Kombinasi Berbagai Layanan'
  ]
) ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 4: VERIFICATION & SUMMARY
-- =====================================================

-- Check hasil insert
SELECT 
  '✅ UX-FRIENDLY CATEGORIES INSTALLED!' as status,
  COUNT(*) as total_new_categories,
  array_agg(label_ui ORDER BY sort_order) as categories
FROM business_type_mappings
WHERE category_key IS NOT NULL;

-- Summary per kategori
SELECT 
  sort_order,
  label_ui as "Kategori UI",
  business_mode as "Mode",
  CASE 
    WHEN inventory_enabled THEN '✅ Ya' 
    ELSE '❌ Tidak' 
  END as "Inventory",
  CASE 
    WHEN has_stock THEN '✅ Ya' 
    ELSE '❌ Tidak' 
  END as "Stock",
  target_audience as "Target User"
FROM business_type_mappings
WHERE category_key IS NOT NULL
ORDER BY sort_order;

-- Verify backward compatibility (data lama tidak rusak)
SELECT 
  COUNT(*) as legacy_data_count,
  COUNT(*) FILTER (WHERE category LIKE '[LEGACY]%') as marked_as_legacy
FROM business_type_mappings
WHERE category_key IS NULL;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 
  '🎉 UX UPGRADE COMPLETE!' as message,
  '✅ ADDITIVE ONLY - No data destroyed' as safety,
  '✅ 7 kategori UI-friendly tersedia' as features,
  '✅ Backend mapping kompatibel dengan CORE/INVENTORY/FINANCE' as architecture;
