-- Debug: Check if image_url column exists and has data

-- 1. Check column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'image_url';

-- 2. Check products with image_url
SELECT id, name, image_url, created_at
FROM products
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check storage policies for lapak-images bucket
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%product%' OR policyname LIKE '%lapak%';
