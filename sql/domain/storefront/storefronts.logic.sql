-- ============================================================================
-- DOMAIN: STOREFRONT
-- Entity: business_storefronts (storefronts)
-- File: storefronts.logic.sql
-- Purpose: Business logic, functions, views, triggers for storefronts
-- ============================================================================
-- Pattern: 4-File Entity Structure
-- 1. schema.sql  (Table Definition)
-- 2. logic.sql   ← YOU ARE HERE
-- 3. policies.sql (Row Level Security)
-- 4. index.sql   (Indexes & Constraints)
-- ============================================================================

-- ============================================================================
-- FUNCTION: generate_storefront_slug
-- ============================================================================
-- Description:
--   Generates a unique URL-safe slug from store name.
--   Converts to lowercase, replaces spaces with hyphens, removes special chars.
--   If slug exists, appends counter (e.g., "toko-kue-ani-2").
--
-- Usage:
--   SELECT generate_storefront_slug('Toko Kue Ibu Ani');
--   -- Returns: "toko-kue-ibu-ani"
--
-- Algorithm:
--   1. Convert to lowercase
--   2. Remove special characters (keep alphanumeric + spaces/hyphens)
--   3. Replace spaces with hyphens
--   4. Remove duplicate hyphens
--   5. Trim hyphens from start/end
--   6. Check uniqueness, add counter if needed
--
-- Example:
--   "Toko Kue Ibu Ani" → "toko-kue-ibu-ani"
--   "Toko Kue Ibu Ani" (duplicate) → "toko-kue-ibu-ani-2"
--   "Warung Pak Budi!!!" → "warung-pak-budi"
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_storefront_slug(store_name_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Step 1: Convert to lowercase, remove special chars (keep a-z, 0-9, spaces, hyphens)
    base_slug := lower(regexp_replace(store_name_input, '[^a-zA-Z0-9\s-]', '', 'g'));
    
    -- Step 2: Replace multiple spaces with single hyphen
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    
    -- Step 3: Replace multiple hyphens with single hyphen
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    
    -- Step 4: Trim hyphens from start/end
    base_slug := trim(both '-' from base_slug);
    
    -- Step 5: Handle empty result (fallback to random UUID)
    IF base_slug = '' OR base_slug IS NULL THEN
        base_slug := 'storefront-' || substring(uuid_generate_v4()::TEXT, 1, 8);
    END IF;
    
    final_slug := base_slug;
    
    -- Step 6: Check uniqueness, add counter if slug exists
    WHILE EXISTS (SELECT 1 FROM public.business_storefronts WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$;

COMMENT ON FUNCTION generate_storefront_slug(TEXT) IS 
'Generates unique URL-safe slug from store name. Example: "Toko Kue Ani" → "toko-kue-ani". Adds counter if duplicate.';

-- ============================================================================
-- FUNCTION: increment_storefront_views
-- ============================================================================
-- Description:
--   Increments total_views counter for a storefront.
--   Called when a visitor lands on /lapak/[slug] page.
--
-- Usage:
--   SELECT increment_storefront_views('toko-kue-ani');
--
-- Side Effects:
--   - Updates business_storefronts.total_views += 1
--   - Updates updated_at timestamp
--
-- Returns:
--   New total_views count
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_storefront_views(p_slug TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE public.business_storefronts
    SET total_views = total_views + 1,
        updated_at = NOW()
    WHERE slug = p_slug
    RETURNING total_views INTO new_count;
    
    RETURN new_count;
END;
$$;

COMMENT ON FUNCTION increment_storefront_views(TEXT) IS 
'Increments total_views counter for storefront by slug. Returns new count.';

-- ============================================================================
-- FUNCTION: increment_storefront_clicks
-- ============================================================================
-- Description:
--   Increments total_clicks counter for a storefront.
--   Called when a visitor clicks "Order via WhatsApp" button.
--
-- Usage:
--   SELECT increment_storefront_clicks('toko-kue-ani');
--
-- Side Effects:
--   - Updates business_storefronts.total_clicks += 1
--   - Updates updated_at timestamp
--
-- Returns:
--   New total_clicks count
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_storefront_clicks(p_slug TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE public.business_storefronts
    SET total_clicks = total_clicks + 1,
        updated_at = NOW()
    WHERE slug = p_slug
    RETURNING total_clicks INTO new_count;
    
    RETURN new_count;
END;
$$;

COMMENT ON FUNCTION increment_storefront_clicks(TEXT) IS 
'Increments total_clicks counter for storefront by slug. Returns new count.';

-- ============================================================================
-- FUNCTION: get_storefront_by_slug
-- ============================================================================
-- Description:
--   Retrieves full storefront details by slug (for public /lapak/[slug] page).
--   Returns NULL if storefront not found or not active.
--
-- Usage:
--   SELECT * FROM get_storefront_by_slug('toko-kue-ani');
--
-- Access Control:
--   - Returns only active storefronts (is_active = true)
--   - Public can call this function
--
-- Returns:
--   Full business_storefronts row as JSON
-- ============================================================================

CREATE OR REPLACE FUNCTION get_storefront_by_slug(p_slug TEXT)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    slug TEXT,
    store_name TEXT,
    description TEXT,
    logo_url TEXT,
    cover_image_url TEXT,
    theme_color TEXT,
    whatsapp_number TEXT,
    instagram_handle TEXT,
    location_text TEXT,
    qris_image_url TEXT,
    bank_name TEXT,
    bank_account_number TEXT,
    bank_account_holder TEXT,
    is_active BOOLEAN,
    total_views INTEGER,
    total_clicks INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.user_id,
        s.slug,
        s.store_name,
        s.description,
        s.logo_url,
        s.cover_image_url,
        s.theme_color,
        s.whatsapp_number,
        s.instagram_handle,
        s.location_text,
        s.qris_image_url,
        s.bank_name,
        s.bank_account_number,
        s.bank_account_holder,
        s.is_active,
        s.total_views,
        s.total_clicks,
        s.created_at,
        s.updated_at
    FROM public.business_storefronts s
    WHERE s.slug = p_slug
      AND s.is_active = true;
END;
$$;

COMMENT ON FUNCTION get_storefront_by_slug(TEXT) IS 
'Returns full storefront details by slug (public function, only active storefronts)';

-- ============================================================================
-- FUNCTION: validate_slug_format
-- ============================================================================
-- Description:
--   Validates that a slug follows proper format rules:
--   - Only lowercase letters, numbers, hyphens
--   - No spaces, no special characters
--   - No leading/trailing hyphens
--   - Minimum 3 characters, maximum 50 characters
--
-- Usage:
--   SELECT validate_slug_format('toko-kue-ani');  -- Returns true
--   SELECT validate_slug_format('Toko Kue Ani');  -- Returns false
--   SELECT validate_slug_format('toko_kue');      -- Returns false
--
-- Returns:
--   true if slug is valid, false otherwise
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_slug_format(p_slug TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- Check NULL or empty
    IF p_slug IS NULL OR p_slug = '' THEN
        RETURN false;
    END IF;
    
    -- Check length (3-50 characters)
    IF length(p_slug) < 3 OR length(p_slug) > 50 THEN
        RETURN false;
    END IF;
    
    -- Check format: only lowercase letters, numbers, hyphens
    -- No leading/trailing hyphens
    IF p_slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$' THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$;

COMMENT ON FUNCTION validate_slug_format(TEXT) IS 
'Validates slug format: lowercase alphanumeric + hyphens, 3-50 chars, no leading/trailing hyphens';

-- ============================================================================
-- TRIGGER: update_storefronts_updated_at
-- ============================================================================
-- Description:
--   Automatically updates updated_at timestamp on every UPDATE.
--
-- Trigger Logic:
--   BEFORE UPDATE → Set NEW.updated_at = NOW()
--
-- Applies To:
--   business_storefronts table
-- ============================================================================

-- Function: update_updated_at_column (shared across all tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_updated_at_column() IS 
'Trigger function to auto-update updated_at timestamp on UPDATE';

-- Trigger: Apply to business_storefronts
DROP TRIGGER IF EXISTS update_storefronts_updated_at ON public.business_storefronts;
CREATE TRIGGER update_storefronts_updated_at
    BEFORE UPDATE ON public.business_storefronts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER update_storefronts_updated_at ON public.business_storefronts IS 
'Auto-updates updated_at timestamp on every UPDATE';

-- ============================================================================
-- VIEW: active_storefronts_summary
-- ============================================================================
-- Description:
--   Summary view of all active storefronts with basic info.
--   Used for listing pages, search, admin dashboards.
--
-- Columns:
--   - id, slug, store_name, location_text
--   - total_views, total_clicks
--   - product_count (from storefront_products)
--   - created_at
--
-- Access:
--   - Public can read (all active storefronts)
-- ============================================================================

CREATE OR REPLACE VIEW active_storefronts_summary AS
SELECT 
    s.id,
    s.slug,
    s.store_name,
    s.description,
    s.logo_url,
    s.theme_color,
    s.location_text,
    s.total_views,
    s.total_clicks,
    s.created_at,
    -- Count visible products (if storefront_products exists)
    COALESCE(
        (SELECT COUNT(*) 
         FROM public.storefront_products p 
         WHERE p.storefront_id = s.id AND p.is_visible = true),
        0
    ) AS product_count
FROM public.business_storefronts s
WHERE s.is_active = true
ORDER BY s.created_at DESC;

COMMENT ON VIEW active_storefronts_summary IS 
'Summary of all active storefronts with product counts (public view)';

-- ============================================================================
-- VIEW: my_storefront_analytics
-- ============================================================================
-- Description:
--   Analytics view for storefront owner.
--   Shows detailed metrics for the owner's storefront.
--
-- Columns:
--   - Basic storefront info
--   - Analytics: views, clicks, conversion rate
--   - Product stats: total products, visible products
--   - Recent activity: last updated
--
-- Access:
--   - Owner only (WHERE user_id = auth.uid())
-- ============================================================================

CREATE OR REPLACE VIEW my_storefront_analytics AS
SELECT 
    s.id,
    s.slug,
    s.store_name,
    s.is_active,
    s.total_views,
    s.total_clicks,
    -- Conversion rate: clicks / views (avoid division by zero)
    CASE 
        WHEN s.total_views > 0 THEN ROUND((s.total_clicks::NUMERIC / s.total_views * 100), 2)
        ELSE 0
    END AS conversion_rate_percent,
    -- Product counts
    COALESCE(
        (SELECT COUNT(*) 
         FROM public.storefront_products p 
         WHERE p.storefront_id = s.id),
        0
    ) AS total_products,
    COALESCE(
        (SELECT COUNT(*) 
         FROM public.storefront_products p 
         WHERE p.storefront_id = s.id AND p.is_visible = true),
        0
    ) AS visible_products,
    -- Timestamps
    s.created_at,
    s.updated_at
FROM public.business_storefronts s
WHERE s.user_id = auth.uid();

COMMENT ON VIEW my_storefront_analytics IS 
'Owner analytics view: shows metrics and stats for own storefront';

-- ============================================================================
-- END OF LOGIC
-- ============================================================================
-- Summary:
--   - 6 Functions: slug generation, view/click counters, slug retrieval, validation
--   - 1 Trigger: auto-update updated_at
--   - 2 Views: public summary + owner analytics
--
-- Next Steps:
--   1. Apply RLS policies: storefronts.policies.sql
--   2. Add indexes: storefronts.index.sql
--   3. Test: storefront.debug.sql (section: storefronts logic)
--
-- Testing Commands:
--   -- Test slug generation:
--   SELECT generate_storefront_slug('Toko Kue Ibu Ani');
--
--   -- Test view increment:
--   SELECT increment_storefront_views('toko-kue-ani');
--
--   -- Test slug retrieval:
--   SELECT * FROM get_storefront_by_slug('toko-kue-ani');
--
--   -- Test validation:
--   SELECT validate_slug_format('toko-kue-ani');
--   SELECT validate_slug_format('Invalid Slug!');
-- ============================================================================
