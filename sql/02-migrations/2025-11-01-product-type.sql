-- ============================================================================
-- ADD PRODUCT_TYPE COLUMN TO STOREFRONT_PRODUCTS
-- Support for both Barang (Physical Products) and Jasa (Services)
-- ============================================================================

-- Add product_type column
ALTER TABLE public.storefront_products 
ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'barang';

-- Add check constraint for valid product types
ALTER TABLE public.storefront_products
ADD CONSTRAINT check_product_type 
CHECK (product_type IN ('barang', 'jasa'));

-- Create index for filtering by product type
CREATE INDEX IF NOT EXISTS idx_products_type ON public.storefront_products(product_type);

-- Update existing products to have default type
UPDATE public.storefront_products 
SET product_type = 'barang' 
WHERE product_type IS NULL;

-- Make product_type NOT NULL after setting defaults
ALTER TABLE public.storefront_products 
ALTER COLUMN product_type SET NOT NULL;
