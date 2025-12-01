-- =====================================================
-- 🔍 CHECK EXISTING SCHEMA
-- =====================================================
-- Run this first to see what columns exist in products table

-- Check if products table exists and see its structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'products'
ORDER BY ordinal_position;

-- Check all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
