-- ============================================
-- ADD SERVICE PRODUCTS SUPPORT
-- Purpose: Enable service-based businesses (salon, bengkel, konsultan)
-- ============================================

-- Add product_type column to differentiate physical products vs services
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS product_type VARCHAR(20) DEFAULT 'physical' CHECK (product_type IN ('physical', 'service'));

-- Add duration column for services (in minutes)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS service_duration INTEGER CHECK (service_duration > 0);

-- Add index for product_type
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(product_type);

-- Update comments
COMMENT ON COLUMN public.products.product_type IS 'Type of product: physical (goods with inventory) or service (no inventory tracking)';
COMMENT ON COLUMN public.products.service_duration IS 'Duration of service in minutes (e.g., 30 for haircut, 120 for car service)';

-- ============================================
-- SAMPLE SERVICE PRODUCTS
-- ============================================

-- Example: Salon Services
-- INSERT INTO public.products (owner_id, name, category, product_type, sell_price, service_duration, track_inventory, is_active, description)
-- VALUES
-- ('YOUR_USER_ID', 'Potong Rambut Regular', 'service', 'service', 35000, 30, false, true, 'Potong rambut pria/wanita standar'),
-- ('YOUR_USER_ID', 'Cat Rambut', 'service', 'service', 150000, 90, false, true, 'Pewarnaan rambut dengan produk berkualitas'),
-- ('YOUR_USER_ID', 'Creambath', 'service', 'service', 75000, 60, false, true, 'Perawatan rambut dan kulit kepala');

-- Example: Bengkel Services
-- INSERT INTO public.products (owner_id, name, category, product_type, sell_price, service_duration, track_inventory, is_active, description)
-- VALUES
-- ('YOUR_USER_ID', 'Service Berkala', 'service', 'service', 200000, 120, false, true, 'Tune up + cek komponen'),
-- ('YOUR_USER_ID', 'Ganti Oli + Filter', 'service', 'service', 150000, 30, false, true, 'Ganti oli mesin + filter oli'),
-- ('YOUR_USER_ID', 'Cuci Motor', 'service', 'service', 15000, 20, false, true, 'Cuci motor komplit');

-- Example: Consultant Services
-- INSERT INTO public.products (owner_id, name, category, product_type, sell_price, service_duration, track_inventory, is_active, description)
-- VALUES
-- ('YOUR_USER_ID', 'Konsultasi Bisnis 1 Jam', 'service', 'service', 500000, 60, false, true, 'Konsultasi strategi bisnis'),
-- ('YOUR_USER_ID', 'Pembuatan Business Plan', 'service', 'service', 5000000, 480, false, true, 'Pembuatan rencana bisnis lengkap');

-- ============================================
-- VERIFICATION
-- ============================================

-- Check updated structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'products' 
-- AND column_name IN ('product_type', 'service_duration')
-- ORDER BY ordinal_position;

-- ============================================
-- END OF MIGRATION
-- ============================================
