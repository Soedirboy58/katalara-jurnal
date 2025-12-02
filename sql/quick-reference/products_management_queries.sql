-- =====================================================
-- PRODUCTS MANAGEMENT - Quick Reference Queries
-- Alternative to Table View for sorting & bulk ops
-- =====================================================

-- 📋 VIEW ALL PRODUCTS (sorted by name)
SELECT 
  name,
  sku,
  category,
  cost_price,
  selling_price,
  unit,
  stock,
  is_active,
  created_at
FROM products
ORDER BY name ASC;

-- 📋 VIEW PRODUCTS (sorted by date, newest first)
SELECT 
  name,
  sku,
  category,
  cost_price,
  selling_price,
  unit,
  stock,
  created_at
FROM products
ORDER BY created_at DESC;

-- 📋 VIEW PRODUCTS (sorted by price, highest first)
SELECT 
  name,
  sku,
  category,
  cost_price,
  selling_price,
  (selling_price - cost_price) as profit,
  stock
FROM products
ORDER BY selling_price DESC;

-- 📋 VIEW PRODUCTS BY CATEGORY
SELECT 
  category,
  COUNT(*) as total_products,
  SUM(stock) as total_stock,
  AVG(selling_price) as avg_price
FROM products
GROUP BY category
ORDER BY total_products DESC;

-- 📋 SEARCH PRODUCTS (by name or SKU)
SELECT 
  name,
  sku,
  category,
  selling_price,
  stock
FROM products
WHERE name ILIKE '%keyword%' 
   OR sku ILIKE '%keyword%'
ORDER BY name;

-- 📋 LOW STOCK ALERT
SELECT 
  name,
  category,
  stock,
  min_stock_alert,
  (min_stock_alert - stock) as shortage
FROM products
WHERE stock <= min_stock_alert
ORDER BY shortage DESC;

-- 📋 INACTIVE PRODUCTS
SELECT 
  name,
  sku,
  category,
  updated_at
FROM products
WHERE is_active = false
ORDER BY updated_at DESC;

-- ✏️ BULK UPDATE - Activate all products
UPDATE products 
SET is_active = true
WHERE is_active = false;

-- ✏️ BULK UPDATE - Add 10% to all prices
UPDATE products 
SET selling_price = selling_price * 1.1
WHERE category = 'category_name';

-- ✏️ BULK UPDATE - Set minimum stock alert
UPDATE products 
SET min_stock_alert = 5
WHERE min_stock_alert = 0;

-- 🗑️ BULK DELETE - Remove inactive products (BE CAREFUL!)
-- DELETE FROM products 
-- WHERE is_active = false;

-- 📊 STATISTICS
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN is_active THEN 1 END) as active_products,
  COUNT(CASE WHEN stock = 0 THEN 1 END) as out_of_stock,
  COUNT(CASE WHEN stock <= min_stock_alert THEN 1 END) as low_stock,
  SUM(stock * cost_price) as total_inventory_value,
  AVG(selling_price) as avg_selling_price
FROM products;

-- 💡 EXPORT TO CSV (run this query, then download results)
SELECT 
  name,
  sku,
  category,
  cost_price,
  selling_price,
  unit,
  stock,
  min_stock_alert,
  is_active
FROM products
ORDER BY category, name;
