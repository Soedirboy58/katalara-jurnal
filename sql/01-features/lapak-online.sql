-- ============================================================================
-- LAPAK ONLINE SCHEMA
-- Mini E-commerce Feature for UMKM
-- Created: November 21, 2025
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: business_storefronts
-- Stores configuration for each UMKM's online storefront
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.business_storefronts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Storefront Identity
    slug TEXT UNIQUE NOT NULL,
    store_name TEXT NOT NULL,
    description TEXT,
    
    -- Visual Branding
    logo_url TEXT,
    cover_image_url TEXT,
    theme_color TEXT DEFAULT '#3B82F6', -- Blue default
    
    -- Contact & Social
    whatsapp_number TEXT NOT NULL,
    instagram_handle TEXT,
    location_text TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Analytics
    total_views INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster slug lookup (public queries)
CREATE INDEX IF NOT EXISTS idx_storefronts_slug ON public.business_storefronts(slug);
CREATE INDEX IF NOT EXISTS idx_storefronts_user_id ON public.business_storefronts(user_id);
CREATE INDEX IF NOT EXISTS idx_storefronts_active ON public.business_storefronts(is_active);

-- ============================================================================
-- TABLE: storefront_products
-- Products available in the online storefront
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.storefront_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    storefront_id UUID NOT NULL REFERENCES public.business_storefronts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Product Info
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    
    -- Pricing
    price DECIMAL(15, 2) NOT NULL,
    compare_at_price DECIMAL(15, 2), -- For showing discount
    
    -- Inventory
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    track_inventory BOOLEAN DEFAULT true,
    
    -- Media
    image_url TEXT,
    image_urls TEXT[], -- Multiple images
    
    -- Variants (stored as JSONB for flexibility)
    -- Example: [{"name": "Ukuran", "options": ["S", "M", "L"]}, {"name": "Warna", "options": ["Merah", "Biru"]}]
    variants JSONB,
    
    -- Status
    is_visible BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    -- SEO
    seo_title TEXT,
    seo_description TEXT,
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    cart_add_count INTEGER DEFAULT 0,
    
    -- Sorting
    sort_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for products
CREATE INDEX IF NOT EXISTS idx_products_storefront ON public.storefront_products(storefront_id);
CREATE INDEX IF NOT EXISTS idx_products_user ON public.storefront_products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_visible ON public.storefront_products(is_visible);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.storefront_products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.storefront_products(category);

-- ============================================================================
-- TABLE: storefront_analytics
-- Track detailed analytics events
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.storefront_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    storefront_id UUID NOT NULL REFERENCES public.business_storefronts(id) ON DELETE CASCADE,
    
    -- Event Details
    event_type TEXT NOT NULL, -- 'page_view', 'product_view', 'product_click', 'cart_add', 'checkout_start', 'whatsapp_click'
    product_id UUID REFERENCES public.storefront_products(id) ON DELETE SET NULL,
    
    -- Session Info (optional, for tracking unique visitors)
    session_id TEXT,
    
    -- Metadata
    metadata JSONB, -- Flexible field for additional event data
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_analytics_storefront ON public.storefront_analytics(storefront_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.storefront_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.storefront_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_product ON public.storefront_analytics(product_id);

-- ============================================================================
-- TABLE: cart_sessions (Optional - for persistent carts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cart_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    storefront_id UUID NOT NULL REFERENCES public.business_storefronts(id) ON DELETE CASCADE,
    
    -- Cart Data
    session_id TEXT NOT NULL,
    cart_items JSONB NOT NULL, -- Array of {product_id, quantity, variant}
    
    -- Contact Info (collected at checkout)
    customer_name TEXT,
    customer_phone TEXT,
    customer_address TEXT,
    
    -- Status
    status TEXT DEFAULT 'active', -- 'active', 'checked_out', 'abandoned'
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Indexes for cart sessions
CREATE INDEX IF NOT EXISTS idx_cart_session_id ON public.cart_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_storefront ON public.cart_sessions(storefront_id);
CREATE INDEX IF NOT EXISTS idx_cart_status ON public.cart_sessions(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.business_storefronts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storefront_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storefront_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES: business_storefronts
-- ============================================================================

-- Allow public to read active storefronts (for /lapak/[slug] page)
CREATE POLICY "Public can view active storefronts"
    ON public.business_storefronts
    FOR SELECT
    USING (is_active = true);

-- Users can view their own storefronts (even if inactive)
CREATE POLICY "Users can view own storefronts"
    ON public.business_storefronts
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own storefront
CREATE POLICY "Users can create own storefront"
    ON public.business_storefronts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own storefront
CREATE POLICY "Users can update own storefront"
    ON public.business_storefronts
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own storefront
CREATE POLICY "Users can delete own storefront"
    ON public.business_storefronts
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- POLICIES: storefront_products
-- ============================================================================

-- Allow public to read visible products (for /lapak/[slug] page)
CREATE POLICY "Public can view visible products"
    ON public.storefront_products
    FOR SELECT
    USING (
        is_visible = true 
        AND EXISTS (
            SELECT 1 FROM public.business_storefronts 
            WHERE id = storefront_products.storefront_id 
            AND is_active = true
        )
    );

-- Users can view their own products (even if not visible)
CREATE POLICY "Users can view own products"
    ON public.storefront_products
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own products
CREATE POLICY "Users can create own products"
    ON public.storefront_products
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own products
CREATE POLICY "Users can update own products"
    ON public.storefront_products
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own products
CREATE POLICY "Users can delete own products"
    ON public.storefront_products
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- POLICIES: storefront_analytics
-- ============================================================================

-- Allow public to insert analytics events (tracking)
CREATE POLICY "Public can insert analytics"
    ON public.storefront_analytics
    FOR INSERT
    WITH CHECK (true);

-- Users can view analytics for their own storefronts
CREATE POLICY "Users can view own analytics"
    ON public.storefront_analytics
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.business_storefronts 
            WHERE id = storefront_analytics.storefront_id 
            AND user_id = auth.uid()
        )
    );

-- ============================================================================
-- POLICIES: cart_sessions
-- ============================================================================

-- Allow public to insert and update cart sessions (anonymous users)
CREATE POLICY "Public can manage carts"
    ON public.cart_sessions
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to generate unique slug from store name
CREATE OR REPLACE FUNCTION generate_storefront_slug(store_name_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convert to lowercase, replace spaces with hyphens, remove special chars
    base_slug := lower(regexp_replace(store_name_input, '[^a-zA-Z0-9\s-]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    final_slug := base_slug;
    
    -- Check if slug exists, add counter if needed
    WHILE EXISTS (SELECT 1 FROM public.business_storefronts WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_storefronts_updated_at
    BEFORE UPDATE ON public.business_storefronts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.storefront_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_updated_at
    BEFORE UPDATE ON public.cart_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STORAGE BUCKET (for product images and store logos)
-- ============================================================================

-- Create storage bucket for lapak images (run this in Supabase Dashboard > Storage)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('lapak-images', 'lapak-images', true);

-- Storage policies would be:
-- Allow public to read images
-- Allow authenticated users to upload images for their own storefronts

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Insert sample storefront (uncomment to use)
-- INSERT INTO public.business_storefronts (user_id, slug, store_name, description, whatsapp_number, theme_color)
-- VALUES (
--     auth.uid(),
--     'toko-kue-ibu-ani',
--     'Toko Kue Ibu Ani',
--     'Kue kering dan basah enak dari rumah. Pesanan custom tersedia!',
--     '628123456789',
--     '#F59E0B'
-- );

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. Run this migration in Supabase SQL Editor
-- 2. Create storage bucket 'lapak-images' in Supabase Dashboard
-- 3. Set up storage policies for authenticated uploads
-- 4. Use generate_storefront_slug() function when creating new storefronts
-- 5. Analytics table can grow large - consider partitioning by created_at
-- 6. Cart sessions auto-expire after 7 days (expires_at field)
-- 7. Public can view active storefronts and visible products (for SEO)
-- 8. Users manage their own storefronts and products (RLS protected)

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
