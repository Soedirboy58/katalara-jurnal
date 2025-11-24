-- Check product tracking status for debugging
-- Query produk untuk cek track_inventory setting

SELECT 
  id,
  name,
  sku,
  stock_quantity,
  track_inventory,
  is_active
FROM products
WHERE name ILIKE '%kapasitor%'
ORDER BY created_at DESC;

-- If track_inventory is false, update it:
-- UPDATE products 
-- SET track_inventory = true 
-- WHERE name ILIKE '%kapasitor%';
