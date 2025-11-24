-- =====================================================
-- COMPLETE DEMO DATA 2025 - ALL KPIs FUNCTIONAL
-- =====================================================
-- Fixes ALL dashboard issues:
-- 1. Piutang Jatuh Tempo - added due_date
-- 2. Utang Jatuh Tempo - added due_date  
-- 3. Target Harian - using daily_revenue_target
-- 4. Stok Kritis - adding products with low stock
-- 5. Growth KPI - previous month data included
-- 6. Donut Chart - proper expense categories
-- =====================================================

DO $$
DECLARE
  v_user_id UUID := '3fe248a4-bfa3-456d-b9dd-d0b7730337a1'; -- aris.serdadu3g@gmail.com
BEGIN

-- Step 1: Clean old data
DELETE FROM incomes WHERE user_id = v_user_id;
DELETE FROM expenses WHERE user_id = v_user_id OR owner_id = v_user_id;
DELETE FROM products WHERE user_id = v_user_id OR owner_id = v_user_id;
RAISE NOTICE 'Cleaned old data';

-- =====================================================
-- OKTOBER 2025 - BULAN LALU (untuk Growth KPI)
-- =====================================================
INSERT INTO incomes (user_id, income_date, income_type, category, amount, payment_method, payment_status, customer_name, description)
VALUES
  (v_user_id, '2025-10-05', 'operating', 'product_sales', 8500000, 'transfer', 'Lunas', 'PT Maju Bersama', 'Instalasi AC kantor'),
  (v_user_id, '2025-10-08', 'operating', 'service_income', 2200000, 'cash', 'Lunas', 'Hotel Grand Paradise', 'Service AC hotel'),
  (v_user_id, '2025-10-12', 'operating', 'product_sales', 15000000, 'transfer', 'Lunas', 'Mall Central Plaza', 'Penggantian 3 unit AC'),
  (v_user_id, '2025-10-15', 'operating', 'service_income', 1800000, 'transfer', 'Lunas', 'RS Sehat Sentosa', 'Service rutin'),
  (v_user_id, '2025-10-18', 'operating', 'product_sales', 12000000, 'transfer', 'Lunas', 'Gedung Perkantoran Plaza 88', 'Instalasi 2 unit cassette'),
  (v_user_id, '2025-10-22', 'operating', 'service_income', 3500000, 'transfer', 'Lunas', 'Apartemen Green View', 'Maintenance bulanan'),
  (v_user_id, '2025-10-25', 'operating', 'product_sales', 9800000, 'cash', 'Lunas', 'CV Sejahtera Abadi', 'Pembelian AC split');
RAISE NOTICE 'Inserted Oktober incomes: Rp 52.8jt';

INSERT INTO expenses (owner_id, user_id, expense_date, expense_type, category, amount, description, payment_method, payment_status, notes)
VALUES
  (v_user_id, v_user_id, '2025-10-03', 'operating', 'Pembelian Barang', 28000000, 'Pembelian stok AC Oktober', 'transfer', 'Lunas', 'PT Daikin'),
  (v_user_id, v_user_id, '2025-10-05', 'operating', 'Gaji Karyawan', 14000000, 'Gaji teknisi Oktober', 'transfer', 'Lunas', NULL),
  (v_user_id, v_user_id, '2025-10-10', 'operating', 'Transportasi', 2200000, 'BBM Oktober', 'cash', 'Lunas', NULL),
  (v_user_id, v_user_id, '2025-10-15', 'operating', 'Utilitas', 1300000, 'Listrik + Air Oktober', 'transfer', 'Lunas', NULL),
  (v_user_id, v_user_id, '2025-10-20', 'operating', 'Peralatan', 2500000, 'Tools maintenance', 'cash', 'Lunas', NULL);
RAISE NOTICE 'Inserted Oktober expenses: Rp 48jt';

-- =====================================================
-- NOVEMBER 2025 - BULAN INI
-- =====================================================

-- INCOMES: 20 transactions with DUE DATES for Piutang
INSERT INTO incomes (user_id, income_date, income_type, category, amount, payment_method, payment_status, customer_name, description, due_date)
VALUES
  -- LUNAS (no due date needed)
  (v_user_id, '2025-11-01', 'operating', 'product_sales', 12400000, 'transfer', 'Lunas', 'PT Maju Bersama', 'Instalasi AC kantor baru', NULL),
  (v_user_id, '2025-11-02', 'operating', 'product_sales', 195000000, 'transfer', 'Lunas', 'Hotel Grand Paradise', 'Instalasi 10 AC Cassette', NULL),
  (v_user_id, '2025-11-03', 'operating', 'product_sales', 6200000, 'cash', 'Lunas', 'Ibu Siti', 'AC rumah pribadi', NULL),
  (v_user_id, '2025-11-05', 'operating', 'product_sales', 21000000, 'transfer', 'Lunas', 'Mall Central Plaza', 'Penggantian AC', NULL),
  (v_user_id, '2025-11-08', 'operating', 'service_income', 3150000, 'transfer', 'Lunas', 'RS Sehat Sentosa', 'Service 15 unit', NULL),
  (v_user_id, '2025-11-09', 'operating', 'service_income', 6000000, 'transfer', 'Lunas', 'Apartemen Green View', 'Maintenance 30 unit', NULL),
  (v_user_id, '2025-11-10', 'operating', 'service_income', 450000, 'cash', 'Lunas', 'PT Maju Bersama', 'Service AC', NULL),
  (v_user_id, '2025-11-11', 'operating', 'service_income', 4500000, 'transfer', 'Lunas', 'Gedung Plaza 88', 'Perbaikan kompresor', NULL),
  (v_user_id, '2025-11-12', 'operating', 'service_income', 1050000, 'transfer', 'Lunas', 'CV Sejahtera', 'Isi freon', NULL),
  (v_user_id, '2025-11-14', 'operating', 'service_income', 12000000, 'transfer', 'Lunas', 'Hotel Grand Paradise', 'Kontrak tahunan', NULL),
  (v_user_id, '2025-11-15', 'operating', 'service_income', 40000000, 'transfer', 'Lunas', 'Mall Central Plaza', 'Proyek HVAC', NULL),
  (v_user_id, '2025-11-16', 'operating', 'service_income', 300000, 'cash', 'Lunas', 'Ibu Siti', 'Service tahunan', NULL),
  (v_user_id, '2025-11-17', 'operating', 'service_income', 1000000, 'transfer', 'Lunas', 'Restoran Seafood King', 'Service freon', NULL),
  (v_user_id, '2025-11-18', 'operating', 'product_sales', 9200000, 'transfer', 'Lunas', 'CV Sejahtera', 'AC kantor cabang', NULL),
  (v_user_id, '2025-11-19', 'operating', 'product_sales', 1700000, 'cash', 'Lunas', 'Apartemen Green View', 'Sparepart AC', NULL),
  (v_user_id, '2025-11-22', 'operating', 'product_sales', 13900000, 'transfer', 'Lunas', 'Pabrik Elektronik', 'Material instalasi', NULL),
  
  -- PENDING with OVERDUE dates (Piutang Jatuh Tempo) 🚨
  (v_user_id, '2025-11-07', 'operating', 'product_sales', 18100000, 'transfer', 'Pending', 'Restoran Seafood King', 'DP 50% instalasi (BELUM LUNAS)', '2025-11-20'),
  (v_user_id, '2025-11-13', 'operating', 'service_income', 391000000, 'transfer', 'Pending', 'Pabrik Elektronik', 'DP 30% proyek besar (BELUM LUNAS)', '2025-11-22'),
  (v_user_id, '2025-11-20', 'operating', 'service_income', 3000000, 'transfer', 'Pending', 'Gedung Plaza 88', 'Service gedung (BELUM LUNAS)', '2025-11-23'),
  (v_user_id, '2025-11-21', 'operating', 'service_income', 226000000, 'transfer', 'Pending', 'RS Sehat Sentosa', 'DP 40% renovasi AC (BELUM LUNAS)', '2025-11-22');

RAISE NOTICE 'Inserted 20 November incomes - 4 with overdue receivables';

-- EXPENSES: 15 transactions with DUE DATES for Utang
INSERT INTO expenses (owner_id, user_id, expense_date, expense_type, category, amount, description, payment_method, payment_status, notes, due_date)
VALUES
  -- LUNAS (no due date)
  (v_user_id, v_user_id, '2025-11-01', 'operating', 'Pembelian Barang', 35000000, 'Stok AC Split 1 PK (10 unit)', 'transfer', 'Lunas', 'PT Daikin', NULL),
  (v_user_id, v_user_id, '2025-11-01', 'operating', 'Pembelian Barang', 27500000, 'Stok AC Split 2 PK (5 unit)', 'transfer', 'Lunas', 'PT Daikin', NULL),
  (v_user_id, v_user_id, '2025-11-02', 'operating', 'Pembelian Material', 8000000, 'Pipa tembaga & kabel', 'transfer', 'Lunas', 'Toko Sparepart', NULL),
  (v_user_id, v_user_id, '2025-11-01', 'operating', 'Transportasi', 2500000, 'BBM November', 'cash', 'Lunas', NULL, NULL),
  (v_user_id, v_user_id, '2025-11-03', 'operating', 'Gaji Karyawan', 15000000, 'Gaji teknisi (3 orang)', 'transfer', 'Lunas', NULL, NULL),
  (v_user_id, v_user_id, '2025-11-05', 'operating', 'Utilitas', 1500000, 'Listrik kantor', 'transfer', 'Lunas', NULL, NULL),
  (v_user_id, v_user_id, '2025-11-08', 'operating', 'Peralatan', 3500000, 'Tools & perlengkapan', 'cash', 'Lunas', NULL, NULL),
  (v_user_id, v_user_id, '2025-11-12', 'operating', 'Perawatan Kendaraan', 2000000, 'Service mobil operasional', 'cash', 'Lunas', NULL, NULL),
  (v_user_id, v_user_id, '2025-11-13', 'operating', 'Subkontraktor', 25000000, 'Subkon ducting pabrik', 'transfer', 'Lunas', 'Tim Instalasi Pro', NULL),
  (v_user_id, v_user_id, '2025-11-14', 'operating', 'Konstruksi', 5000000, 'Platform outdoor unit', 'transfer', 'Lunas', 'CV Kontraktor', NULL),
  (v_user_id, v_user_id, '2025-11-15', 'operating', 'ATK', 800000, 'ATK kantor', 'cash', 'Lunas', NULL, NULL),
  (v_user_id, v_user_id, '2025-11-20', 'operating', 'Komunikasi', 500000, 'Pulsa & internet', 'transfer', 'Lunas', NULL, NULL),
  
  -- PENDING with OVERDUE dates (Utang Jatuh Tempo) 🚨
  (v_user_id, v_user_id, '2025-11-05', 'operating', 'Pembelian Barang', 7250000, 'Freon R32 & R410A (BELUM BAYAR)', 'transfer', 'Pending', 'CV Refrigerant', '2025-11-20'),
  (v_user_id, v_user_id, '2025-11-10', 'operating', 'Pembelian Barang', 36000000, 'AC Cassette 3 PK (BELUM BAYAR)', 'transfer', 'Pending', 'PT Daikin', '2025-11-22'),
  (v_user_id, v_user_id, '2025-11-18', 'operating', 'Subkontraktor', 8000000, 'Subkon instalasi Mall (BELUM BAYAR)', 'transfer', 'Pending', 'Tim Instalasi Pro', '2025-11-23');

RAISE NOTICE 'Inserted 15 November expenses - 3 with overdue payables';

-- =====================================================
-- PRODUCTS - untuk Stok Kritis
-- =====================================================
INSERT INTO products (
  user_id, owner_id, name, category, type, 
  price, cost, stock_quantity, min_stock_alert, 
  track_inventory, is_active, unit
)
VALUES
  -- STOK KRITIS (stock <= min_stock_alert) 🚨
  (v_user_id, v_user_id, 'AC Split Daikin 1 PK', 'Produk', 'product', 5500000, 3500000, 2, 5, true, true, 'unit'),
  (v_user_id, v_user_id, 'AC Split Daikin 2 PK', 'Produk', 'product', 7500000, 5500000, 1, 3, true, true, 'unit'),
  (v_user_id, v_user_id, 'Freon R32 (1 kg)', 'Produk', 'product', 450000, 350000, 3, 10, true, true, 'kg'),
  (v_user_id, v_user_id, 'Pipa Tembaga 1/4"', 'Produk', 'product', 85000, 65000, 5, 20, true, true, 'meter'),
  
  -- STOK AMAN
  (v_user_id, v_user_id, 'AC Cassette 3 PK', 'Produk', 'product', 18000000, 12000000, 8, 2, true, true, 'unit'),
  (v_user_id, v_user_id, 'Freon R410A (1 kg)', 'Produk', 'product', 650000, 500000, 15, 10, true, true, 'kg'),
  (v_user_id, v_user_id, 'Bracket AC Outdoor', 'Produk', 'product', 250000, 150000, 25, 10, true, true, 'unit'),
  
  -- SERVICES (no stock tracking)
  (v_user_id, v_user_id, 'Service AC Rutin', 'Jasa', 'service', 300000, 50000, 0, 0, false, true, 'paket'),
  (v_user_id, v_user_id, 'Instalasi AC Split', 'Jasa', 'service', 1500000, 300000, 0, 0, false, true, 'paket'),
  (v_user_id, v_user_id, 'Isi Freon + Cuci AC', 'Jasa', 'service', 750000, 200000, 0, 0, false, true, 'paket');

RAISE NOTICE 'Inserted 10 products - 4 with critical stock';

-- =====================================================
-- BUSINESS CONFIGURATION
-- =====================================================
INSERT INTO business_configurations (
  user_id, 
  business_category,
  daily_expense_limit,
  daily_revenue_target,
  enable_expense_notifications,
  notification_threshold,
  track_roi,
  roi_period,
  created_at,
  updated_at
)
VALUES (
  v_user_id,
  'service',
  5000000,  -- Alert kalau pengeluaran harian > Rp 5jt
  25000000, -- Target pendapatan Rp 25jt/hari (750jt/bulan)
  true,
  80, -- Alert di 80%
  true,
  'monthly',
  NOW(),
  NOW()
)
ON CONFLICT (user_id) 
DO UPDATE SET
  daily_expense_limit = 5000000,
  daily_revenue_target = 25000000,
  enable_expense_notifications = true,
  notification_threshold = 80,
  track_roi = true,
  roi_period = 'monthly',
  updated_at = NOW();

RAISE NOTICE 'Business config: Target Rp 25jt/hari, Limit Rp 5jt/hari';

-- =====================================================
-- SUMMARY
-- =====================================================
RAISE NOTICE '===============================================';
RAISE NOTICE 'COMPLETE DEMO DATA INSTALLED!';
RAISE NOTICE '===============================================';
RAISE NOTICE 'Oktober: 7 incomes + 5 expenses (Growth KPI)';
RAISE NOTICE 'November: 20 incomes (4 overdue) + 15 expenses (3 overdue)';
RAISE NOTICE 'Products: 10 items (4 critical stock)';
RAISE NOTICE 'KPI yang akan muncul:';
RAISE NOTICE '  1. Piutang Jatuh Tempo: 4 tagihan (Rp 638jt)';
RAISE NOTICE '  2. Utang Jatuh Tempo: 3 tagihan (Rp 51.25jt)';
RAISE NOTICE '  3. Target Harian: vs Rp 25jt';
RAISE NOTICE '  4. Pengeluaran Bulan Ini: Nov vs Okt';
RAISE NOTICE '  5. Stok Kritis: 4 produk perlu restock';
RAISE NOTICE '  6. Posisi Kas: Aktual';
RAISE NOTICE '  7. ROI: Keuntungan/rugi bulan ini';
RAISE NOTICE '===============================================';

END $$;

-- Verification queries
SELECT 
  'OKTOBER Incomes' as label,
  COUNT(*) as count,
  'Rp ' || TO_CHAR(SUM(amount), 'FM999,999,999') as total
FROM incomes 
WHERE user_id = '3fe248a4-bfa3-456d-b9dd-d0b7730337a1' 
  AND income_date >= '2025-10-01' AND income_date < '2025-11-01'

UNION ALL

SELECT 
  'NOVEMBER Incomes',
  COUNT(*),
  'Rp ' || TO_CHAR(SUM(amount), 'FM999,999,999')
FROM incomes 
WHERE user_id = '3fe248a4-bfa3-456d-b9dd-d0b7730337a1' 
  AND income_date >= '2025-11-01'

UNION ALL

SELECT 
  'Piutang JATUH TEMPO',
  COUNT(*),
  'Rp ' || TO_CHAR(SUM(amount), 'FM999,999,999')
FROM incomes 
WHERE user_id = '3fe248a4-bfa3-456d-b9dd-d0b7730337a1' 
  AND payment_status = 'Pending'
  AND due_date < CURRENT_DATE

UNION ALL

SELECT 
  'Utang JATUH TEMPO',
  COUNT(*),
  'Rp ' || TO_CHAR(SUM(amount), 'FM999,999,999')
FROM expenses 
WHERE user_id = '3fe248a4-bfa3-456d-b9dd-d0b7730337a1' 
  AND payment_status = 'Pending'
  AND due_date < CURRENT_DATE

UNION ALL

SELECT 
  'Stok KRITIS',
  COUNT(*),
  STRING_AGG(name, ', ')
FROM products 
WHERE user_id = '3fe248a4-bfa3-456d-b9dd-d0b7730337a1' 
  AND track_inventory = true
  AND stock_quantity <= min_stock_alert

UNION ALL

SELECT 
  'Business Config',
  1,
  'Target: Rp ' || TO_CHAR(daily_revenue_target, 'FM999,999,999') || ' | Limit: Rp ' || TO_CHAR(daily_expense_limit, 'FM999,999,999')
FROM business_configurations
WHERE user_id = '3fe248a4-bfa3-456d-b9dd-d0b7730337a1';
