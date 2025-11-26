-- ============================================================================
-- DOMAIN: STOREFRONT
-- Entity: storefront_products (products)
-- File: products.logic.sql
-- Purpose: Business logic, functions, views, triggers for storefront products
-- ============================================================================
-- Pattern: 4-File Entity Structure
-- 1. schema.sql  (Table Definition)
-- 2. logic.sql   ← YOU ARE HERE
-- 3. policies.sql (Row Level Security)
-- 4. index.sql   (Indexes & Constraints)
-- ============================================================================

-- ============================================================================
-- FUNCTION: publish_product_to_storefront
-- ============================================================================
-- Description:
--   Publishes a product from Inventory (products table) to Storefront.
--   Creates a new row in storefront_products linked to master product.
--
-- Purpose:
--   - Links storefront product to master product data
--   - Copies essential product info (name, description, images)
--   - Sets storefront-specific display settings (price, visibility, featured)
--   - Maintains separation between Inventory and Storefront domains
--
-- Parameters:
--   p_product_id UUID: ID of the master product to publish
--   p_storefront_id UUID: ID of the target storefront
--   p_display_price DECIMAL: Price to show in storefront (can differ from master)
--   p_is_visible BOOLEAN: Whether product is immediately visible (default: true)
--   p_is_featured BOOLEAN: Whether product is featured (default: false)
--
-- Returns:
--   UUID: ID of the newly created storefront_products row
--
-- Usage:
--   SELECT publish_product_to_storefront(
--     'product-uuid-from-inventory',
--     'storefront-uuid',
--     95000.00,
--     true,
--     false
--   );
--
-- Side Effects:
--   - Creates new row in storefront_products
--   - Sets product_id FK to link to master product
--   - Copies product name, description, category from master
--   - Sets storefront-specific display price
--
-- Error Handling:
--   - Returns NULL if product_id not found
--   - Returns NULL if storefront_id not found
--   - Returns NULL if product already published to this storefront
--
-- Example:
--   -- Publish "Kue Lapis" from Inventory to "Toko Kue Ani" storefront
--   SELECT publish_product_to_storefront(
--     (SELECT id FROM products WHERE name = 'Kue Lapis'),
--     (SELECT id FROM business_storefronts WHERE slug = 'toko-kue-ani'),
--     80000.00,  -- Display price (can be different from master price)
--     true,      -- Visible immediately
--     true       -- Featured on homepage
--   );
-- ============================================================================

CREATE OR REPLACE FUNCTION publish_product_to_storefront(
    p_product_id UUID,
    p_storefront_id UUID,
    p_display_price DECIMAL DEFAULT NULL,
    p_is_visible BOOLEAN DEFAULT true,
    p_is_featured BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_storefront_product_id UUID;
    v_user_id UUID;
    v_product_name TEXT;
    v_product_description TEXT;
    v_product_category TEXT;
    v_product_image_url TEXT;
    v_product_price DECIMAL;
    v_final_price DECIMAL;
BEGIN
    -- Step 1: Get storefront owner user_id
    SELECT user_id INTO v_user_id
    FROM public.business_storefronts
    WHERE id = p_storefront_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Storefront not found: %', p_storefront_id;
    END IF;
    
    -- Step 2: Check if product already published to this storefront
    SELECT id INTO v_storefront_product_id
    FROM public.storefront_products
    WHERE product_id = p_product_id
      AND storefront_id = p_storefront_id;
    
    IF v_storefront_product_id IS NOT NULL THEN
        RAISE EXCEPTION 'Product already published to this storefront';
    END IF;
    
    -- Step 3: Get product data from master products table
    -- Note: Adjust column names based on actual products table schema
    SELECT 
        name,
        description,
        category,
        image_url,
        selling_price  -- Assuming master products table has selling_price
    INTO 
        v_product_name,
        v_product_description,
        v_product_category,
        v_product_image_url,
        v_product_price
    FROM public.products
    WHERE id = p_product_id;
    
    IF v_product_name IS NULL THEN
        RAISE EXCEPTION 'Product not found: %', p_product_id;
    END IF;
    
    -- Step 4: Determine final display price
    -- Use p_display_price if provided, otherwise use master product price
    v_final_price := COALESCE(p_display_price, v_product_price);
    
    IF v_final_price IS NULL OR v_final_price <= 0 THEN
        RAISE EXCEPTION 'Invalid display price: %', v_final_price;
    END IF;
    
    -- Step 5: Create storefront_products row
    INSERT INTO public.storefront_products (
        storefront_id,
        user_id,
        product_id,  -- CRITICAL: Link to master product
        name,
        description,
        category,
        price,
        image_url,
        is_visible,
        is_featured,
        stock_quantity,
        track_inventory,
        product_type
    ) VALUES (
        p_storefront_id,
        v_user_id,
        p_product_id,  -- Link to master product
        v_product_name,
        v_product_description,
        v_product_category,
        v_final_price,
        v_product_image_url,
        p_is_visible,
        p_is_featured,
        0,  -- Initial stock (to be synced later)
        true,  -- Track inventory by default
        'barang'  -- Default product type (can be updated later)
    )
    RETURNING id INTO v_storefront_product_id;
    
    RETURN v_storefront_product_id;
END;
$$;

COMMENT ON FUNCTION publish_product_to_storefront(UUID, UUID, DECIMAL, BOOLEAN, BOOLEAN) IS 
'Publishes product from Inventory to Storefront. Creates storefront_products row linked to master product via product_id FK.';

-- ============================================================================
-- FUNCTION: sync_product_from_master
-- ============================================================================
-- Description:
--   Syncs storefront product data from master products table.
--   Updates name, description, category, image_url from master product.
--   Does NOT update price (price is storefront-specific).
--
-- Parameters:
--   p_storefront_product_id UUID: ID of the storefront_products row to sync
--
-- Returns:
--   BOOLEAN: true if sync successful, false if product not linked to master
--
-- Usage:
--   SELECT sync_product_from_master('storefront-product-uuid');
--
-- Side Effects:
--   - Updates name, description, category, image_url in storefront_products
--   - Updates updated_at timestamp
--   - Does NOT update price (manual override preserved)
--
-- Use Cases:
--   - Master product name changed → sync to storefront
--   - Master product image updated → sync to storefront
--   - Bulk sync via cron job: UPDATE storefront_products
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_product_from_master(p_storefront_product_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_product_id UUID;
    v_updated BOOLEAN;
BEGIN
    -- Step 1: Get product_id from storefront_products
    SELECT product_id INTO v_product_id
    FROM public.storefront_products
    WHERE id = p_storefront_product_id;
    
    -- Step 2: Check if product is linked to master (product_id NOT NULL)
    IF v_product_id IS NULL THEN
        RETURN false;  -- Not linked to master, cannot sync
    END IF;
    
    -- Step 3: Update storefront product from master product
    UPDATE public.storefront_products sp
    SET 
        name = p.name,
        description = p.description,
        category = p.category,
        image_url = p.image_url,
        updated_at = NOW()
    FROM public.products p
    WHERE sp.id = p_storefront_product_id
      AND p.id = v_product_id;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    
    RETURN v_updated > 0;
END;
$$;

COMMENT ON FUNCTION sync_product_from_master(UUID) IS 
'Syncs storefront product data from master products table. Updates name, description, category, image (NOT price).';

-- ============================================================================
-- FUNCTION: increment_product_views
-- ============================================================================
-- Description:
--   Increments view_count for a product.
--   Called when a visitor views product detail page.
--
-- Usage:
--   SELECT increment_product_views('product-uuid');
--
-- Returns:
--   New view_count value
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_product_views(p_product_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE public.storefront_products
    SET view_count = view_count + 1,
        updated_at = NOW()
    WHERE id = p_product_id
    RETURNING view_count INTO new_count;
    
    RETURN new_count;
END;
$$;

COMMENT ON FUNCTION increment_product_views(UUID) IS 
'Increments view_count for product. Returns new count.';

-- ============================================================================
-- FUNCTION: increment_product_clicks
-- ============================================================================
-- Description:
--   Increments click_count for a product.
--   Called when a visitor clicks "Buy" button.
--
-- Usage:
--   SELECT increment_product_clicks('product-uuid');
--
-- Returns:
--   New click_count value
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_product_clicks(p_product_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE public.storefront_products
    SET click_count = click_count + 1,
        updated_at = NOW()
    WHERE id = p_product_id
    RETURNING click_count INTO new_count;
    
    RETURN new_count;
END;
$$;

COMMENT ON FUNCTION increment_product_clicks(UUID) IS 
'Increments click_count for product. Returns new count.';

-- ============================================================================
-- FUNCTION: increment_product_cart_adds
-- ============================================================================
-- Description:
--   Increments cart_add_count for a product.
--   Called when a visitor adds product to cart.
--
-- Usage:
--   SELECT increment_product_cart_adds('product-uuid');
--
-- Returns:
--   New cart_add_count value
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_product_cart_adds(p_product_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE public.storefront_products
    SET cart_add_count = cart_add_count + 1,
        updated_at = NOW()
    WHERE id = p_product_id
    RETURNING cart_add_count INTO new_count;
    
    RETURN new_count;
END;
$$;

COMMENT ON FUNCTION increment_product_cart_adds(UUID) IS 
'Increments cart_add_count for product. Returns new count.';

-- ============================================================================
-- FUNCTION: check_stock_availability
-- ============================================================================
-- Description:
--   Checks if a product has enough stock for requested quantity.
--   Respects track_inventory flag.
--
-- Parameters:
--   p_product_id UUID: Product to check
--   p_quantity INTEGER: Requested quantity
--
-- Returns:
--   BOOLEAN: true if stock available, false if insufficient
--
-- Logic:
--   - If track_inventory = false: Always return true
--   - If track_inventory = true: Check stock_quantity >= p_quantity
-- ============================================================================

CREATE OR REPLACE FUNCTION check_stock_availability(
    p_product_id UUID,
    p_quantity INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_track_inventory BOOLEAN;
    v_stock_quantity INTEGER;
BEGIN
    SELECT track_inventory, stock_quantity
    INTO v_track_inventory, v_stock_quantity
    FROM public.storefront_products
    WHERE id = p_product_id;
    
    IF NOT FOUND THEN
        RETURN false;  -- Product not found
    END IF;
    
    -- If not tracking inventory, always available
    IF NOT v_track_inventory THEN
        RETURN true;
    END IF;
    
    -- Check if stock sufficient
    RETURN v_stock_quantity >= p_quantity;
END;
$$;

COMMENT ON FUNCTION check_stock_availability(UUID, INTEGER) IS 
'Checks if product has enough stock for requested quantity. Respects track_inventory flag.';

-- ============================================================================
-- TRIGGER: update_products_updated_at
-- ============================================================================
-- Description:
--   Automatically updates updated_at timestamp on every UPDATE.
-- ============================================================================

DROP TRIGGER IF EXISTS update_products_updated_at ON public.storefront_products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.storefront_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER update_products_updated_at ON public.storefront_products IS 
'Auto-updates updated_at timestamp on every UPDATE';

-- ============================================================================
-- VIEW: visible_products_with_storefront
-- ============================================================================
-- Description:
--   Lists all visible products with their storefront info.
--   Used for public product listing, search, SEO.
--
-- Columns:
--   - Product info (id, name, description, price, image_url)
--   - Storefront info (slug, store_name, whatsapp_number)
--   - Analytics (view_count, click_count, cart_add_count)
--
-- Access:
--   - Public (only visible products in active storefronts)
-- ============================================================================

CREATE OR REPLACE VIEW visible_products_with_storefront AS
SELECT 
    p.id AS product_id,
    p.name,
    p.description,
    p.category,
    p.product_type,
    p.price,
    p.compare_at_price,
    p.image_url,
    p.is_featured,
    p.view_count,
    p.click_count,
    p.cart_add_count,
    p.created_at,
    -- Storefront info
    s.id AS storefront_id,
    s.slug AS storefront_slug,
    s.store_name,
    s.logo_url AS storefront_logo,
    s.whatsapp_number
FROM public.storefront_products p
JOIN public.business_storefronts s ON p.storefront_id = s.id
WHERE p.is_visible = true
  AND s.is_active = true
ORDER BY p.is_featured DESC, p.sort_order ASC, p.created_at DESC;

COMMENT ON VIEW visible_products_with_storefront IS 
'Public view of all visible products with storefront info (for listing, search, SEO)';

-- ============================================================================
-- VIEW: my_products_analytics
-- ============================================================================
-- Description:
--   Analytics view for product owner.
--   Shows detailed metrics for the owner's products.
--
-- Columns:
--   - Product info (id, name, price, stock)
--   - Analytics (views, clicks, cart adds, conversion rates)
--   - Status (is_visible, is_featured, low_stock)
--
-- Access:
--   - Owner only (WHERE user_id = auth.uid())
-- ============================================================================

CREATE OR REPLACE VIEW my_products_analytics AS
SELECT 
    p.id,
    p.name,
    p.category,
    p.product_type,
    p.price,
    p.stock_quantity,
    p.is_visible,
    p.is_featured,
    p.view_count,
    p.click_count,
    p.cart_add_count,
    -- Conversion rates
    CASE 
        WHEN p.view_count > 0 THEN ROUND((p.click_count::NUMERIC / p.view_count * 100), 2)
        ELSE 0
    END AS click_through_rate_percent,
    CASE 
        WHEN p.click_count > 0 THEN ROUND((p.cart_add_count::NUMERIC / p.click_count * 100), 2)
        ELSE 0
    END AS add_to_cart_rate_percent,
    -- Low stock alert
    (p.track_inventory AND p.stock_quantity <= p.low_stock_threshold) AS is_low_stock,
    -- Timestamps
    p.created_at,
    p.updated_at
FROM public.storefront_products p
WHERE p.user_id = auth.uid()
ORDER BY p.sort_order ASC, p.created_at DESC;

COMMENT ON VIEW my_products_analytics IS 
'Owner analytics view: shows metrics and conversion rates for own products';

-- ============================================================================
-- END OF LOGIC
-- ============================================================================
-- Summary:
--   - 7 Functions: publish, sync, view/click/cart counters, stock check
--   - 1 Trigger: auto-update updated_at
--   - 2 Views: public products + owner analytics
--
-- Next Steps:
--   1. Apply RLS policies: products.policies.sql
--   2. Add indexes: products.index.sql
--   3. Test: storefront.debug.sql (section: products logic)
--
-- Testing Commands:
--   -- Test publish function:
--   SELECT publish_product_to_storefront(
--     (SELECT id FROM products LIMIT 1),
--     (SELECT id FROM business_storefronts LIMIT 1),
--     50000.00,
--     true,
--     false
--   );
--
--   -- Test sync function:
--   SELECT sync_product_from_master('storefront-product-uuid');
--
--   -- Test stock check:
--   SELECT check_stock_availability('product-uuid', 5);
--
--   -- Test view increment:
--   SELECT increment_product_views('product-uuid');
-- ============================================================================
