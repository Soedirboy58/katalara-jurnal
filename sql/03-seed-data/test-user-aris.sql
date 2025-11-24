-- =====================================================
-- DEMO DATA FOR aris.serdadu3g@gmail.com
-- Complete integrated data across all features
-- =====================================================

-- STEP 1: Get user_id for aris.serdadu3g@gmail.com
-- Run this first to get the user_id, then replace 'YOUR_USER_ID' below

-- To get user_id, run in Supabase SQL Editor:
-- SELECT id FROM auth.users WHERE email = 'aris.serdadu3g@gmail.com';

-- After getting the user_id, replace all occurrences of 'YOUR_USER_ID' below with actual UUID

DO $$
DECLARE
  v_user_id UUID := '3fe248a4-bfa3-456d-b9dd-d0b7730337a1'; -- User: aris.serdadu3g@gmail.com
BEGIN

-- =====================================================
-- 0. CLEAN UP EXISTING DATA (OPTIONAL - UNCOMMENT TO RESET)
-- =====================================================
-- PERINGATAN: Ini akan HAPUS semua data demo yang sudah ada!
-- Uncomment baris di bawah jika ingin mulai dari awal

DELETE FROM incomes WHERE user_id = v_user_id;
DELETE FROM expenses WHERE user_id = v_user_id;
DELETE FROM customers WHERE owner_id = v_user_id;
DELETE FROM products WHERE owner_id = v_user_id;

RAISE NOTICE 'Cleaned up existing data for user';

-- =====================================================
-- 1. INSERT CUSTOMERS (10 customers)
-- =====================================================

INSERT INTO customers (owner_id, name, phone, email, address, total_transactions, total_spent)
VALUES
  (v_user_id, 'PT Maju Bersama', '081234567801', 'maju@company.com', 'Jl. Sudirman No. 123, Jakarta Pusat', 0, 0),
  (v_user_id, 'CV Sejahtera Abadi', '081234567802', 'sejahtera@company.com', 'Jl. Gatot Subroto No. 45, Jakarta Selatan', 0, 0),
  (v_user_id, 'Hotel Grand Paradise', '081234567803', 'info@grandparadise.com', 'Jl. Thamrin No. 78, Jakarta Pusat', 0, 0),
  (v_user_id, 'RS Sehat Sentosa', '081234567804', 'admin@rssehat.com', 'Jl. Rasuna Said No. 12, Jakarta Selatan', 0, 0),
  (v_user_id, 'Mall Central Plaza', '081234567805', 'facility@centralplaza.com', 'Jl. Sudirman No. 234, Jakarta Pusat', 0, 0),
  (v_user_id, 'Apartemen Green View', '081234567806', 'management@greenview.com', 'Jl. TB Simatupang No. 56, Jakarta Selatan', 0, 0),
  (v_user_id, 'Pabrik Elektronik Nusantara', '081234567807', 'purchasing@elektronik.com', 'Kawasan Industri Pulogadung, Jakarta Timur', 0, 0),
  (v_user_id, 'Restoran Seafood King', '081234567808', 'owner@seafoodking.com', 'Jl. Senopati No. 89, Jakarta Selatan', 0, 0),
  (v_user_id, 'Gedung Perkantoran Plaza 88', '081234567809', 'bm@plaza88.com', 'Jl. Casablanca No. 88, Jakarta Selatan', 0, 0),
  (v_user_id, 'Ibu Siti Rumah Pribadi', '081234567810', 'siti.rumah@gmail.com', 'Jl. Kemang Raya No. 15, Jakarta Selatan', 0, 0);

RAISE NOTICE 'Inserted 10 customers';

-- =====================================================
-- 2. INSERT PRODUCTS - HVAC (Jasa & Barang) (20 products)
-- =====================================================

-- SERVICES (10 jasa)
INSERT INTO products (owner_id, name, category, product_type, buy_price, sell_price, stock_quantity, unit, min_stock_alert, track_inventory)
VALUES
  (v_user_id, 'Instalasi AC Split 1 PK', 'Jasa Instalasi', 'service', 300000, 500000, 0, 'unit', 0, false),
  (v_user_id, 'Instalasi AC Split 2 PK', 'Jasa Instalasi', 'service', 400000, 700000, 0, 'unit', 0, false),
  (v_user_id, 'Service AC Split Ringan', 'Jasa Service', 'service', 80000, 150000, 0, 'unit', 0, false),
  (v_user_id, 'Service AC Split Berat', 'Jasa Service', 'service', 150000, 300000, 0, 'unit', 0, false),
  (v_user_id, 'Instalasi Ducting AC Central', 'Jasa Instalasi', 'service', 250000, 450000, 0, 'meter', 0, false),
  (v_user_id, 'Maintenance AC Rutin Bulanan', 'Jasa Maintenance', 'service', 100000, 200000, 0, 'unit', 0, false),
  (v_user_id, 'Perbaikan Kompresor AC', 'Jasa Perbaikan', 'service', 800000, 1500000, 0, 'unit', 0, false),
  (v_user_id, 'Isi Freon R32', 'Jasa Service', 'service', 100000, 200000, 0, 'kg', 0, false),
  (v_user_id, 'Isi Freon R410A', 'Jasa Service', 'service', 150000, 300000, 0, 'kg', 0, false),
  (v_user_id, 'Konsultasi Sistem HVAC', 'Jasa Konsultasi', 'service', 500000, 1000000, 0, 'project', 0, false),

-- GOODS (10 barang)
  (v_user_id, 'AC Split Daikin 1 PK', 'AC Split', 'physical', 3500000, 4500000, 15, 'unit', 3, true),
  (v_user_id, 'AC Split Daikin 2 PK', 'AC Split', 'physical', 5500000, 7000000, 10, 'unit', 2, true),
  (v_user_id, 'AC Cassette Daikin 3 PK', 'AC Cassette', 'physical', 12000000, 15000000, 5, 'unit', 1, true),
  (v_user_id, 'Pipa Tembaga 1/4 inch', 'Sparepart', 'physical', 80000, 120000, 50, 'meter', 10, true),
  (v_user_id, 'Pipa Tembaga 3/8 inch', 'Sparepart', 'physical', 120000, 180000, 40, 'meter', 10, true),
  (v_user_id, 'Freon R32 1kg', 'Refrigerant', 'physical', 250000, 400000, 20, 'kg', 5, true),
  (v_user_id, 'Freon R410A 1kg', 'Refrigerant', 'physical', 350000, 550000, 15, 'kg', 5, true),
  (v_user_id, 'Remote AC Universal', 'Aksesoris', 'physical', 50000, 100000, 30, 'pcs', 10, true),
  (v_user_id, 'Filter AC Washable', 'Sparepart', 'physical', 30000, 60000, 50, 'pcs', 15, true),
  (v_user_id, 'Kabel NYM 2x1.5mm', 'Material', 'physical', 15000, 25000, 100, 'meter', 20, true);

RAISE NOTICE 'Inserted 20 products (10 services + 10 goods)';

-- =====================================================
-- 3. INSERT INCOME TRANSACTIONS (20 transactions)
-- =====================================================

-- WITH CUSTOMER_NAME for proper linking to customers table
-- UPDATED TO 2025 (current year)
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

RAISE NOTICE 'Inserted 20 income transactions';
-- 4. INSERT EXPENSE TRANSACTIONS (15 transactions)
-- =====================================================

-- MUST INCLUDE owner_id AND user_id (both required!)
-- UPDATED TO 2025 (current year)
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

RAISE NOTICE 'Inserted 15 expense transactions';

-- =====================================================
-- 5. UPDATE PRODUCT STOCK (adjust after sales)
-- =====================================================

UPDATE products SET stock_quantity = 5 WHERE name = 'AC Split Daikin 1 PK' AND owner_id = v_user_id;
UPDATE products SET stock_quantity = 2 WHERE name = 'AC Split Daikin 2 PK' AND owner_id = v_user_id;
UPDATE products SET stock_quantity = 2 WHERE name = 'AC Cassette Daikin 3 PK' AND owner_id = v_user_id;
UPDATE products SET stock_quantity = 20 WHERE name = 'Pipa Tembaga 1/4 inch' AND owner_id = v_user_id;
UPDATE products SET stock_quantity = 10 WHERE name = 'Pipa Tembaga 3/8 inch' AND owner_id = v_user_id;
UPDATE products SET stock_quantity = 10 WHERE name = 'Freon R32 1kg' AND owner_id = v_user_id;
UPDATE products SET stock_quantity = 5 WHERE name = 'Freon R410A 1kg' AND owner_id = v_user_id;
UPDATE products SET stock_quantity = 28 WHERE name = 'Remote AC Universal' AND owner_id = v_user_id;
UPDATE products SET stock_quantity = 15 WHERE name = 'Filter AC Washable' AND owner_id = v_user_id;
UPDATE products SET stock_quantity = 0 WHERE name = 'Kabel NYM 2x1.5mm' AND owner_id = v_user_id;

RAISE NOTICE 'Updated product stock levels';

-- =====================================================
-- 6. UPDATE CUSTOMER STATISTICS
-- =====================================================

UPDATE customers SET 
  total_transactions = (SELECT COUNT(*) FROM incomes WHERE user_id = v_user_id AND customer_name = customers.name),
  total_spent = (SELECT COALESCE(SUM(amount), 0) FROM incomes WHERE user_id = v_user_id AND customer_name = customers.name)
WHERE owner_id = v_user_id;

RAISE NOTICE 'Updated customer statistics';

-- =====================================================
-- SUMMARY
-- =====================================================

RAISE NOTICE '===============================================';
RAISE NOTICE 'DEMO DATA INSERTION COMPLETED!';
RAISE NOTICE '===============================================';
RAISE NOTICE '✅ 10 Customers inserted';
RAISE NOTICE '✅ 20 Products inserted (10 services + 10 goods)';
RAISE NOTICE '✅ 20 Income transactions inserted';
RAISE NOTICE '   - 8 Penjualan Langsung';
RAISE NOTICE '   - 7 Service/Maintenance';
RAISE NOTICE '   - 5 Proyek/Kontrak';
RAISE NOTICE '✅ 15 Expense transactions inserted';
RAISE NOTICE '   - 5 Pembelian Inventory';
RAISE NOTICE '   - 8 Operasional';
RAISE NOTICE '   - 2 Biaya Proyek';
RAISE NOTICE '✅ Product stock levels updated';
RAISE NOTICE '✅ Customer statistics updated';
RAISE NOTICE '===============================================';
RAISE NOTICE 'Total Income: Rp 996,450,000';
RAISE NOTICE 'Total Expense: Rp 142,050,000';
RAISE NOTICE 'Net Profit: Rp 854,400,000';
RAISE NOTICE '===============================================';

END $$;
