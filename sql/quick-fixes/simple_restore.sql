-- =====================================================
-- SIMPLE RESTORE - Insert data to products table
-- Run this in Supabase SQL Editor
-- =====================================================

-- Check current state
SELECT 'Before restore:' as status, COUNT(*) as products_count FROM products;
SELECT 'Backup available:' as status, COUNT(*) as backup_count FROM products_backup_current_schema;

-- Disable RLS temporarily
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Insert data from backup
INSERT INTO products (id, owner_id, name, category, unit, price, is_active, created_at, updated_at)
VALUES
  (
    (SELECT id FROM products_backup_current_schema WHERE name = 'Kapasitor 20 uf'),
    (SELECT user_id FROM products_backup_current_schema WHERE name = 'Kapasitor 20 uf'),
    'Kapasitor 20 uf',
    (SELECT category FROM products_backup_current_schema WHERE name = 'Kapasitor 20 uf'),
    (SELECT unit FROM products_backup_current_schema WHERE name = 'Kapasitor 20 uf'),
    75000,  -- selling_price (harga jual)
    true,
    NOW(),
    NOW()
  ),
  (
    (SELECT id FROM products_backup_current_schema WHERE name = 'termi'),
    (SELECT user_id FROM products_backup_current_schema WHERE name = 'termi'),
    'termi',
    (SELECT category FROM products_backup_current_schema WHERE name = 'termi'),
    (SELECT unit FROM products_backup_current_schema WHERE name = 'termi'),
    50000,  -- selling_price (harga jual)
    true,
    NOW(),
    NOW()
  );

-- Re-enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT 'After restore:' as status, COUNT(*) as products_count FROM products;
SELECT name, price, unit FROM products ORDER BY name;
