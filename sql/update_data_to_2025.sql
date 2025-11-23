-- =====================================================
-- UPDATE DEMO DATA TO 2025 + ADD BUSINESS CONFIG
-- =====================================================
-- Run this to fix "Pengeluaran Bulan Ini 0%" issue
-- =====================================================

DO $$
DECLARE
  v_user_id UUID := '3fe248a4-bfa3-456d-b9dd-d0b7730337a1'; -- aris.serdadu3g@gmail.com
BEGIN

-- Step 1: Delete old 2024 data
DELETE FROM incomes WHERE user_id = v_user_id AND income_date < '2025-01-01';
DELETE FROM expenses WHERE user_id = v_user_id AND expense_date < '2025-01-01';
RAISE NOTICE 'Deleted old 2024 data';

-- Step 2a: Insert OKTOBER 2025 data (untuk Growth KPI comparison)
INSERT INTO incomes (user_id, income_date, income_type, category, amount, payment_method, payment_status, customer_name, description)
VALUES
  (v_user_id, '2025-10-05', 'operating', 'product_sales', 8500000, 'transfer', 'Lunas', 'PT Maju Bersama', 'Instalasi AC kantor'),
  (v_user_id, '2025-10-08', 'operating', 'service_income', 2200000, 'cash', 'Lunas', 'Hotel Grand Paradise', 'Service AC hotel'),
  (v_user_id, '2025-10-12', 'operating', 'product_sales', 15000000, 'transfer', 'Lunas', 'Mall Central Plaza', 'Penggantian 3 unit AC'),
  (v_user_id, '2025-10-15', 'operating', 'service_income', 1800000, 'transfer', 'Lunas', 'RS Sehat Sentosa', 'Service rutin'),
  (v_user_id, '2025-10-18', 'operating', 'product_sales', 12000000, 'transfer', 'Lunas', 'Gedung Perkantoran Plaza 88', 'Instalasi 2 unit cassette'),
  (v_user_id, '2025-10-22', 'operating', 'service_income', 3500000, 'transfer', 'Lunas', 'Apartemen Green View', 'Maintenance bulanan'),
  (v_user_id, '2025-10-25', 'operating', 'product_sales', 9800000, 'cash', 'Lunas', 'CV Sejahtera Abadi', 'Pembelian AC split');
RAISE NOTICE 'Inserted 7 Oktober 2025 incomes (total ~52.8jt)';

INSERT INTO expenses (owner_id, user_id, expense_date, expense_type, category, amount, description, payment_method, payment_status, notes)
VALUES
  (v_user_id, v_user_id, '2025-10-03', 'operating', 'Pembelian Barang', 28000000, 'Pembelian stok AC bulan Oktober', 'transfer', 'Lunas', 'PT Daikin'),
  (v_user_id, v_user_id, '2025-10-05', 'operating', 'Gaji Karyawan', 14000000, 'Gaji teknisi Oktober', 'transfer', 'Lunas', 'CV Teknisi'),
  (v_user_id, v_user_id, '2025-10-10', 'operating', 'Transportasi', 2200000, 'BBM Oktober', 'cash', 'Lunas', 'Pertamina'),
  (v_user_id, v_user_id, '2025-10-15', 'operating', 'Utilitas', 1300000, 'Listrik + Air', 'transfer', 'Lunas', 'PLN'),
  (v_user_id, v_user_id, '2025-10-20', 'operating', 'Peralatan', 2500000, 'Tools maintenance', 'cash', 'Lunas', 'Toko Teknik');
RAISE NOTICE 'Inserted 5 Oktober 2025 expenses (total ~48jt)';

-- Step 2b: Insert NOVEMBER 2025 incomes
INSERT INTO incomes (user_id, income_date, income_type, category, amount, payment_method, payment_status, customer_name, description)
VALUES
  (v_user_id, '2025-11-01', 'operating', 'product_sales', 12400000, 'transfer', 'Lunas', 'PT Maju Bersama', 'Instalasi AC untuk kantor baru'),
  (v_user_id, '2025-11-02', 'operating', 'product_sales', 195000000, 'transfer', 'Lunas', 'Hotel Grand Paradise', 'Instalasi 10 AC Cassette untuk hotel'),
  (v_user_id, '2025-11-03', 'operating', 'product_sales', 6200000, 'cash', 'Lunas', 'Ibu Siti Rumah Pribadi', 'Instalasi AC rumah pribadi'),
  (v_user_id, '2025-11-05', 'operating', 'product_sales', 21000000, 'transfer', 'Lunas', 'Mall Central Plaza', 'Penggantian AC lama dengan yang baru'),
  (v_user_id, '2025-11-07', 'operating', 'product_sales', 18100000, 'transfer', 'Pending', 'Restoran Seafood King', 'DP 50% instalasi AC restoran'),
  (v_user_id, '2025-11-08', 'operating', 'service_income', 3150000, 'transfer', 'Lunas', 'RS Sehat Sentosa', 'Service rutin 15 unit AC rumah sakit'),
  (v_user_id, '2025-11-09', 'operating', 'service_income', 6000000, 'transfer', 'Lunas', 'Apartemen Green View', 'Kontrak maintenance bulanan 30 unit'),
  (v_user_id, '2025-11-10', 'operating', 'service_income', 450000, 'cash', 'Lunas', 'PT Maju Bersama', 'Service AC kantor'),
  (v_user_id, '2025-11-11', 'operating', 'service_income', 4500000, 'transfer', 'Lunas', 'Gedung Perkantoran Plaza 88', 'Service berat dan perbaikan kompresor'),
  (v_user_id, '2025-11-12', 'operating', 'service_income', 1050000, 'transfer', 'Lunas', 'CV Sejahtera Abadi', 'Isi freon dan cuci AC'),
  (v_user_id, '2025-11-13', 'operating', 'service_income', 391000000, 'transfer', 'Pending', 'Pabrik Elektronik Nusantara', 'DP 30% proyek instalasi AC pabrik'),
  (v_user_id, '2025-11-14', 'operating', 'service_income', 12000000, 'transfer', 'Lunas', 'Hotel Grand Paradise', 'Kontrak maintenance tahunan hotel'),
  (v_user_id, '2025-11-15', 'operating', 'service_income', 40000000, 'transfer', 'Lunas', 'Mall Central Plaza', 'Proyek perbaikan sistem HVAC mall'),
  (v_user_id, '2025-11-16', 'operating', 'service_income', 300000, 'cash', 'Lunas', 'Ibu Siti Rumah Pribadi', 'Service AC tahunan'),
  (v_user_id, '2025-11-17', 'operating', 'service_income', 1000000, 'transfer', 'Lunas', 'Restoran Seafood King', 'Service dan isi freon'),
  (v_user_id, '2025-11-18', 'operating', 'product_sales', 9200000, 'transfer', 'Lunas', 'CV Sejahtera Abadi', 'Pembelian AC untuk kantor cabang'),
  (v_user_id, '2025-11-19', 'operating', 'product_sales', 1700000, 'cash', 'Lunas', 'Apartemen Green View', 'Pembelian sparepart AC'),
  (v_user_id, '2025-11-20', 'operating', 'service_income', 3000000, 'transfer', 'Lunas', 'Gedung Perkantoran Plaza 88', 'Service rutin gedung'),
  (v_user_id, '2025-11-21', 'operating', 'service_income', 226000000, 'transfer', 'Pending', 'RS Sehat Sentosa', 'DP 40% renovasi sistem AC RS'),
  (v_user_id, '2025-11-22', 'operating', 'product_sales', 13900000, 'transfer', 'Lunas', 'Pabrik Elektronik Nusantara', 'Pembelian material instalasi');
RAISE NOTICE 'Inserted 20 new 2025 incomes';

-- Step 3: Insert NEW 2025 expenses
INSERT INTO expenses (owner_id, user_id, expense_date, expense_type, category, amount, description, payment_method, payment_status, notes)
VALUES
  (v_user_id, v_user_id, '2025-11-01', 'operating', 'Pembelian Barang', 35000000, 'Pembelian stok AC Split Daikin 1 PK (10 unit)', 'transfer', 'Lunas', 'PT Daikin Indonesia'),
  (v_user_id, v_user_id, '2025-11-01', 'operating', 'Pembelian Barang', 27500000, 'Pembelian stok AC Split Daikin 2 PK (5 unit)', 'transfer', 'Lunas', 'PT Daikin Indonesia'),
  (v_user_id, v_user_id, '2025-11-02', 'operating', 'Pembelian Material', 8000000, 'Pembelian pipa tembaga dan kabel', 'transfer', 'Lunas', 'Toko Sparepart AC Jaya'),
  (v_user_id, v_user_id, '2025-11-05', 'operating', 'Pembelian Barang', 7250000, 'Pembelian Freon R32 (15 kg) dan R410A (10 kg)', 'transfer', 'Lunas', 'CV Refrigerant Sejahtera'),
  (v_user_id, v_user_id, '2025-11-10', 'operating', 'Pembelian Barang', 36000000, 'Pembelian AC Cassette 3 PK (3 unit)', 'transfer', 'Lunas', 'PT Daikin Indonesia'),
  (v_user_id, v_user_id, '2025-11-01', 'operating', 'Transportasi', 2500000, 'BBM kendaraan operasional bulan November', 'cash', 'Lunas', 'Pertamina'),
  (v_user_id, v_user_id, '2025-11-03', 'operating', 'Gaji Karyawan', 15000000, 'Gaji teknisi bulan November (3 orang)', 'transfer', 'Lunas', 'CV Teknisi Handal'),
  (v_user_id, v_user_id, '2025-11-05', 'operating', 'Utilitas', 1500000, 'Listrik kantor dan gudang', 'transfer', 'Lunas', 'PLN'),
  (v_user_id, v_user_id, '2025-11-08', 'operating', 'Peralatan', 3500000, 'Pembelian tools dan perlengkapan kerja', 'cash', 'Lunas', 'Toko Perlengkapan Kerja'),
  (v_user_id, v_user_id, '2025-11-12', 'operating', 'Perawatan Kendaraan', 2000000, 'Service kendaraan operasional', 'cash', 'Lunas', 'Bengkel Mobil Jaya'),
  (v_user_id, v_user_id, '2025-11-13', 'operating', 'Subkontraktor', 25000000, 'Biaya subkon instalasi ducting proyek pabrik', 'transfer', 'Lunas', 'Tim Instalasi Pro - Proyek Pabrik Elektronik'),
  (v_user_id, v_user_id, '2025-11-14', 'operating', 'Konstruksi', 5000000, 'Pembuatan platform outdoor unit', 'transfer', 'Lunas', 'CV Kontraktor Bangunan - Proyek Hotel'),
  (v_user_id, v_user_id, '2025-11-15', 'operating', 'ATK', 800000, 'ATK dan perlengkapan kantor', 'cash', 'Lunas', 'Toko Alat Tulis'),
  (v_user_id, v_user_id, '2025-11-18', 'operating', 'Subkontraktor', 8000000, 'Biaya subkon instalasi AC Mall', 'transfer', 'Lunas', 'Tim Instalasi Pro - Proyek Mall'),
  (v_user_id, v_user_id, '2025-11-20', 'operating', 'Komunikasi', 500000, 'Pulsa dan paket internet bulan November', 'transfer', 'Lunas', 'Indosat');
RAISE NOTICE 'Inserted 15 new 2025 expenses';

-- Step 4: Insert/Update business_configurations
-- Columns: daily_expense_limit, daily_revenue_target, enable_expense_notifications, notification_threshold, track_roi, roi_period
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
  'service', -- business_category
  10000000, -- Limit pengeluaran Rp 10jt/hari (untuk alert)
  50000000, -- Target pendapatan Rp 50jt/hari
  true, -- Enable notifications
  80, -- Alert at 80%
  true, -- Track ROI
  'monthly', -- ROI period
  NOW(),
  NOW()
)
ON CONFLICT (user_id) 
DO UPDATE SET
  daily_expense_limit = 10000000,
  daily_revenue_target = 50000000,
  enable_expense_notifications = true,
  notification_threshold = 80,
  track_roi = true,
  roi_period = 'monthly',
  updated_at = NOW();
RAISE NOTICE 'Inserted/Updated business_configurations';

-- Step 5: Update customer statistics
UPDATE customers SET 
  total_transactions = (SELECT COUNT(*) FROM incomes WHERE user_id = v_user_id AND customer_name = customers.name),
  total_spent = (SELECT COALESCE(SUM(amount), 0) FROM incomes WHERE user_id = v_user_id AND customer_name = customers.name)
WHERE owner_id = v_user_id;
RAISE NOTICE 'Updated customer statistics';

-- Step 6: Show results
RAISE NOTICE '===============================================';
RAISE NOTICE 'DATA UPDATED TO 2025!';
RAISE NOTICE '===============================================';

END $$;

-- Verify results
SELECT 
  'Incomes 2025' as table_name,
  COUNT(*) as total_records,
  TO_CHAR(SUM(amount), 'FM999,999,999,999') as total_amount
FROM incomes 
WHERE user_id = '3fe248a4-bfa3-456d-b9dd-d0b7730337a1' 
  AND income_date >= '2025-01-01'

UNION ALL

SELECT 
  'Expenses 2025',
  COUNT(*),
  TO_CHAR(SUM(amount), 'FM999,999,999,999')
FROM expenses 
WHERE user_id = '3fe248a4-bfa3-456d-b9dd-d0b7730337a1' 
  AND expense_date >= '2025-01-01'

UNION ALL

SELECT 
  'Business Config',
  CASE WHEN daily_revenue_target IS NOT NULL THEN 1 ELSE 0 END,
  'Target Harian: ' || TO_CHAR(daily_revenue_target, 'FM999,999,999,999') || ' | Limit Harian: ' || TO_CHAR(daily_expense_limit, 'FM999,999,999,999')
FROM business_configurations
WHERE user_id = '3fe248a4-bfa3-456d-b9dd-d0b7730337a1';
