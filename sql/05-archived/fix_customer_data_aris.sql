-- =====================================================
-- FIX CUSTOMER DATA - Update existing incomes with customer_name
-- =====================================================

DO $$
DECLARE
  v_user_id UUID := '3fe248a4-bfa3-456d-b9dd-d0b7730337a1'; -- aris.serdadu3g@gmail.com
BEGIN

-- Update incomes yang sudah ada dengan customer_name berdasarkan description
UPDATE incomes SET customer_name = 'PT Maju Bersama' 
WHERE user_id = v_user_id AND description LIKE '%PT Maju Bersama%';

UPDATE incomes SET customer_name = 'Hotel Grand Paradise' 
WHERE user_id = v_user_id AND description LIKE '%Hotel Grand Paradise%';

UPDATE incomes SET customer_name = 'Ibu Siti Rumah Pribadi' 
WHERE user_id = v_user_id AND (description LIKE '%Ibu Siti%' OR description LIKE '%Rumah Pribadi%');

UPDATE incomes SET customer_name = 'Mall Central Plaza' 
WHERE user_id = v_user_id AND description LIKE '%Mall Central Plaza%';

UPDATE incomes SET customer_name = 'Restoran Seafood King' 
WHERE user_id = v_user_id AND description LIKE '%Restoran Seafood King%';

UPDATE incomes SET customer_name = 'RS Sehat Sentosa' 
WHERE user_id = v_user_id AND description LIKE '%RS Sehat Sentosa%';

UPDATE incomes SET customer_name = 'Apartemen Green View' 
WHERE user_id = v_user_id AND description LIKE '%Apartemen Green View%';

UPDATE incomes SET customer_name = 'Gedung Perkantoran Plaza 88' 
WHERE user_id = v_user_id AND (description LIKE '%Plaza 88%' OR description LIKE '%Gedung Perkantoran%');

UPDATE incomes SET customer_name = 'CV Sejahtera Abadi' 
WHERE user_id = v_user_id AND description LIKE '%CV Sejahtera Abadi%';

UPDATE incomes SET customer_name = 'Pabrik Elektronik Nusantara' 
WHERE user_id = v_user_id AND (description LIKE '%Pabrik Elektronik%' OR description LIKE '%Elektronik Nusantara%');

RAISE NOTICE 'Updated customer_name in incomes table';

-- Update customer statistics
UPDATE customers SET 
  total_transactions = (SELECT COUNT(*) FROM incomes WHERE user_id = v_user_id AND customer_name = customers.name),
  total_spent = (SELECT COALESCE(SUM(amount), 0) FROM incomes WHERE user_id = v_user_id AND customer_name = customers.name)
WHERE owner_id = v_user_id;

RAISE NOTICE 'Updated customer statistics';

-- Show results
RAISE NOTICE '===============================================';
RAISE NOTICE 'CUSTOMER DATA FIXED!';
RAISE NOTICE '===============================================';

END $$;

-- Verify results
SELECT 
  c.name as customer,
  c.total_transactions,
  c.total_spent,
  (SELECT COUNT(*) FROM incomes WHERE customer_name = c.name) as actual_transactions
FROM customers c
WHERE c.owner_id = '3fe248a4-bfa3-456d-b9dd-d0b7730337a1'
ORDER BY c.total_spent DESC;
