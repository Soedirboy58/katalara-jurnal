-- =====================================================
-- FIX: Business Category Access for Onboarding
-- =====================================================
-- Purpose: Ensure business_type_mappings is accessible
-- Date: 2024-11-26
-- Context: business-info onboarding page needs to read categories
-- =====================================================

-- 1. Verify business_type_mappings table exists and has data
SELECT 
  '✅ Checking business_type_mappings table...' as status;

SELECT 
  COUNT(*) as total_categories,
  array_agg(DISTINCT category) as available_categories
FROM business_type_mappings;

-- 2. Disable RLS for business_type_mappings (reference data should be public)
ALTER TABLE business_type_mappings DISABLE ROW LEVEL SECURITY;

-- 3. Verify the table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'business_type_mappings'
ORDER BY ordinal_position;

-- 4. If table has no data, insert seed data
INSERT INTO business_type_mappings (category, keywords, indicators, examples)
SELECT * FROM (
  VALUES
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
    )
) AS seed(category, keywords, indicators, examples)
WHERE NOT EXISTS (SELECT 1 FROM business_type_mappings LIMIT 1);

-- 5. Final verification
SELECT 
  '✅ SETUP COMPLETE!' as status,
  COUNT(*) as total_categories,
  string_agg(category, ', ' ORDER BY category) as categories
FROM business_type_mappings;

-- 6. Test query (same as frontend will use)
SELECT id, category
FROM business_type_mappings
ORDER BY category;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 
  '✅ Business categories are now accessible!' as message,
  'Frontend can now load categories from business_type_mappings table' as info;
