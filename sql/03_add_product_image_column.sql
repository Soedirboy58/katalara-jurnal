-- Add image_url column to products table for product images

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment
COMMENT ON COLUMN products.image_url IS 'URL to product image stored in Supabase Storage or external CDN';
