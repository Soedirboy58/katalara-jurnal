-- ============================================================================
-- DOMAIN: STOREFRONT
-- Entity: storefront_products (products)
-- File: products.schema.sql
-- Purpose: Schema definition for products displayed in storefronts
-- ============================================================================
-- Pattern: 4-File Entity Structure
-- 1. schema.sql  ← YOU ARE HERE
-- 2. logic.sql   (Functions, Views, Triggers)
-- 3. policies.sql (Row Level Security)
-- 4. index.sql   (Indexes & Constraints)
-- ============================================================================

-- ============================================================================
-- CRITICAL ARCHITECTURE NOTE
-- ============================================================================
-- storefront_products is NOT the master product data.
-- Master product data lives in: products table (Inventory domain).
--
-- This table is for DISPLAY PURPOSES ONLY:
--   - Links to master products via product_id FK
--   - Adds display-specific fields (price, variants, visibility)
--   - Tracks storefront-specific analytics (views, clicks, cart adds)
--
-- Relationship:
--   products (master) ←──[product_id FK]──→ storefront_products (display)
--
-- Workflow:
--   1. User creates product in Inventory module → products table
--   2. User publishes product to storefront → storefront_products table
--   3. Public views product on /lapak/[slug] → reads from storefront_products
--
-- Function: publish_product_to_storefront(product_id, storefront_id, price)
--   - Copies product data from products → storefront_products
--   - Sets display price, visibility, featured status
--   - Maintains link via product_id FK
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: storefront_products
-- ============================================================================
-- Description:
--   Products displayed in a UMKM's online storefront.
--   Each product is linked to the master products table via product_id.
--   Includes display-specific fields: price, visibility, featured status.
--   Tracks storefront-specific analytics: views, clicks, cart adds.
--
-- Key Features:
--   - Links to master products table (product_id FK) ← CRITICAL
--   - Display price (can differ from master product price)
--   - Variants (size, color) stored as JSONB
--   - Inventory tracking (stock_quantity, low_stock_threshold)
--   - Visibility control (is_visible, is_featured flags)
--   - Multiple images support (image_urls array)
--   - Analytics tracking (view_count, click_count, cart_add_count)
--   - SEO fields (seo_title, seo_description)
--
-- Access Pattern:
--   - Public: Can read visible products in active storefronts
--   - Owner: Full CRUD access to own products
--
-- Related Entities:
--   - business_storefronts: Parent storefront (FK: storefront_id)
--   - products: Master product data (FK: product_id) ← NEW
--   - storefront_analytics: Tracking events for this product
--   - cart_sessions: Products in shopping carts
--
-- Data Source:
--   Migrated from: sql/01-features/lapak-online.sql
--   Migration additions: sql/02-migrations/2025-11-01-product-type.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.storefront_products (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign Keys
    storefront_id UUID NOT NULL REFERENCES public.business_storefronts(id) ON DELETE CASCADE,
        -- Parent storefront (which lapak this product belongs to)
        -- CASCADE: If storefront is deleted, all products are deleted
    
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        -- Owner of the product (must match storefront owner)
        -- Used for RLS policies and ownership checks
    
    -- ========================================================================
    -- CRITICAL: Link to Master Product Data
    -- ========================================================================
    -- NEW COLUMN: product_id (FK to products table in Inventory domain)
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
        -- Link to master product data in Inventory domain
        -- NULL: Product created directly in storefront (legacy behavior)
        -- NOT NULL: Product published from Inventory module (recommended)
        -- ON DELETE SET NULL: If master product deleted, keep storefront product
        --   (rationale: storefront product has display history/analytics)
    
    -- ========================================================================
    -- PRODUCT INFO
    -- ========================================================================
    name TEXT NOT NULL,
        -- Product name displayed in storefront
        -- Can differ from master product name (e.g., translated, shortened)
    
    description TEXT,
        -- Product description shown on product detail page
        -- Can differ from master product description
    
    category TEXT,
        -- Product category (e.g., "Makanan", "Minuman", "Kue")
        -- Used for filtering/grouping in storefront
    
    -- ========================================================================
    -- PRODUCT TYPE (Added via migration)
    -- ========================================================================
    product_type TEXT NOT NULL DEFAULT 'barang',
        -- Type: 'barang' (physical goods) or 'jasa' (services)
        -- Added via: sql/02-migrations/2025-11-01-product-type.sql
        -- CHECK constraint: product_type IN ('barang', 'jasa')
    
    -- ========================================================================
    -- PRICING
    -- ========================================================================
    price DECIMAL(15, 2) NOT NULL,
        -- Display price in storefront (can differ from master product price)
        -- Example: master price = Rp 100,000, storefront price = Rp 95,000 (promo)
    
    compare_at_price DECIMAL(15, 2),
        -- Original price for showing discounts (strikethrough price)
        -- Example: compare_at_price = Rp 100,000, price = Rp 80,000 (20% off)
    
    -- ========================================================================
    -- INVENTORY
    -- ========================================================================
    stock_quantity INTEGER DEFAULT 0,
        -- Current stock available for this product
        -- Updated manually or via stock sync from products table
    
    low_stock_threshold INTEGER DEFAULT 5,
        -- Alert threshold for low stock warning
        -- UI shows "Low stock" badge if stock_quantity <= low_stock_threshold
    
    track_inventory BOOLEAN DEFAULT true,
        -- Whether to track inventory for this product
        -- true: Show stock quantity, prevent overselling
        -- false: Always available (e.g., made-to-order products)
    
    -- ========================================================================
    -- MEDIA
    -- ========================================================================
    image_url TEXT,
        -- Primary product image (single URL)
        -- Used for product listing thumbnails
    
    image_urls TEXT[],
        -- Multiple product images (array of URLs)
        -- Used for product detail page gallery
        -- Example: [url1, url2, url3]
    
    -- ========================================================================
    -- VARIANTS
    -- ========================================================================
    variants JSONB,
        -- Product variants (size, color, etc.) stored as JSON
        -- Example: [
        --   {"name": "Ukuran", "options": ["S", "M", "L"]},
        --   {"name": "Warna", "options": ["Merah", "Biru", "Hijau"]}
        -- ]
        -- Used for variant selection in storefront
    
    -- ========================================================================
    -- STATUS FLAGS
    -- ========================================================================
    is_visible BOOLEAN DEFAULT true,
        -- Controls public visibility of the product
        -- true: Product shown in storefront
        -- false: Product hidden (draft, out of stock, etc.)
        -- Used in RLS policies to restrict public SELECT
    
    is_featured BOOLEAN DEFAULT false,
        -- Whether product is featured on storefront homepage
        -- Featured products shown at top of product listing
    
    -- ========================================================================
    -- SEO
    -- ========================================================================
    seo_title TEXT,
        -- Custom SEO title for product page
        -- Used in <title> tag and meta tags
    
    seo_description TEXT,
        -- Custom SEO description for product page
        -- Used in meta description tag
    
    -- ========================================================================
    -- ANALYTICS COUNTERS
    -- ========================================================================
    -- These are aggregate counters for quick display
    -- Detailed events are stored in storefront_analytics table
    
    view_count INTEGER DEFAULT 0,
        -- Total number of product detail page views
        -- Incremented via increment_product_views() function
    
    click_count INTEGER DEFAULT 0,
        -- Total number of "Buy" button clicks
        -- Incremented via increment_product_clicks() function
    
    cart_add_count INTEGER DEFAULT 0,
        -- Total number of "Add to Cart" actions
        -- Incremented via increment_product_cart_adds() function
    
    -- ========================================================================
    -- SORTING
    -- ========================================================================
    sort_order INTEGER DEFAULT 0,
        -- Manual sort order for product listing
        -- Lower number = higher priority (shown first)
        -- Default: 0 (order by created_at DESC)
    
    -- ========================================================================
    -- TIMESTAMPS
    -- ========================================================================
    created_at TIMESTAMPTZ DEFAULT NOW(),
        -- When the product was created in storefront
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
        -- Last modification timestamp
        -- Auto-updated via update_updated_at_column() trigger
);

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE public.storefront_products IS 
'Products displayed in storefront. Links to master products table via product_id. Public can view visible products in active storefronts.';

COMMENT ON COLUMN public.storefront_products.id IS 
'Primary key UUID';

COMMENT ON COLUMN public.storefront_products.storefront_id IS 
'Parent storefront (FK to business_storefronts). CASCADE DELETE.';

COMMENT ON COLUMN public.storefront_products.user_id IS 
'Owner of the product (FK to auth.users). Used for RLS policies.';

COMMENT ON COLUMN public.storefront_products.product_id IS 
'CRITICAL: Link to master product in products table (Inventory domain). NULL = legacy product, NOT NULL = published from Inventory.';

COMMENT ON COLUMN public.storefront_products.name IS 
'Product name displayed in storefront (can differ from master product name)';

COMMENT ON COLUMN public.storefront_products.description IS 
'Product description shown on product detail page';

COMMENT ON COLUMN public.storefront_products.category IS 
'Product category for filtering (e.g., "Makanan", "Minuman")';

COMMENT ON COLUMN public.storefront_products.product_type IS 
'Product type: "barang" (physical goods) or "jasa" (services)';

COMMENT ON COLUMN public.storefront_products.price IS 
'Display price in storefront (can differ from master product price)';

COMMENT ON COLUMN public.storefront_products.compare_at_price IS 
'Original price for showing discounts (strikethrough)';

COMMENT ON COLUMN public.storefront_products.stock_quantity IS 
'Current stock available (updated manually or synced from products table)';

COMMENT ON COLUMN public.storefront_products.low_stock_threshold IS 
'Alert threshold for low stock warning (default: 5)';

COMMENT ON COLUMN public.storefront_products.track_inventory IS 
'Whether to track inventory (true) or allow unlimited (false)';

COMMENT ON COLUMN public.storefront_products.image_url IS 
'Primary product image (single URL, used for thumbnails)';

COMMENT ON COLUMN public.storefront_products.image_urls IS 
'Multiple product images (array of URLs, used for gallery)';

COMMENT ON COLUMN public.storefront_products.variants IS 
'Product variants (size, color) stored as JSONB';

COMMENT ON COLUMN public.storefront_products.is_visible IS 
'Public visibility flag. true = shown in storefront, false = hidden';

COMMENT ON COLUMN public.storefront_products.is_featured IS 
'Featured flag. true = shown at top of product listing';

COMMENT ON COLUMN public.storefront_products.seo_title IS 
'Custom SEO title for product page (meta tag)';

COMMENT ON COLUMN public.storefront_products.seo_description IS 
'Custom SEO description for product page (meta tag)';

COMMENT ON COLUMN public.storefront_products.view_count IS 
'Total product detail page views (aggregate counter)';

COMMENT ON COLUMN public.storefront_products.click_count IS 
'Total "Buy" button clicks (aggregate counter)';

COMMENT ON COLUMN public.storefront_products.cart_add_count IS 
'Total "Add to Cart" actions (aggregate counter)';

COMMENT ON COLUMN public.storefront_products.sort_order IS 
'Manual sort order (lower = higher priority)';

COMMENT ON COLUMN public.storefront_products.created_at IS 
'Product creation timestamp';

COMMENT ON COLUMN public.storefront_products.updated_at IS 
'Last modification timestamp (auto-updated via trigger)';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
-- Next Steps:
--   1. Deploy this schema: psql -f products.schema.sql
--   2. Apply logic: products.logic.sql (includes publish_product_to_storefront)
--   3. Apply RLS policies: products.policies.sql
--   4. Add indexes: products.index.sql
--
-- Testing:
--   - Run: storefront.debug.sql (section: storefront_products health)
--   - Verify: product_id FK to products table works
--   - Test: publish_product_to_storefront() function
--
-- Migration Notes:
--   - ADDITIVE ONLY - No DROP operations
--   - 100% BACKWARD COMPATIBLE with existing data
--   - Preserves all existing rows in storefront_products
--   - product_id is NULL for existing products (legacy behavior)
--   - New products should use publish_product_to_storefront() to link
--   - product_type added via 2025-11-01-product-type.sql migration
-- ============================================================================
