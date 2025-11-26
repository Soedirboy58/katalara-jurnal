-- ============================================================================
-- DOMAIN: STOREFRONT
-- Entity: cart_sessions (carts)
-- File: carts.logic.sql
-- Purpose: Business logic, functions, views, triggers for shopping carts
-- ============================================================================
-- Pattern: 4-File Entity Structure
-- 1. schema.sql  (Table Definition)
-- 2. logic.sql   ← YOU ARE HERE
-- 3. policies.sql (Row Level Security)
-- 4. index.sql   (Indexes & Constraints)
-- ============================================================================

-- ============================================================================
-- FUNCTION: get_or_create_cart
-- ============================================================================
-- Description:
--   Retrieves existing cart or creates new one for a session.
--   Used at cart initialization (first item add).
--
-- Parameters:
--   p_storefront_id UUID: Target storefront
--   p_session_id TEXT: Session identifier (from browser)
--
-- Returns:
--   UUID: Cart ID (existing or newly created)
--
-- Usage:
--   SELECT get_or_create_cart('storefront-uuid', 'session-uuid');
--
-- Logic:
--   1. Check if active cart exists for this session + storefront
--   2. If exists: return cart ID
--   3. If not exists: create new cart with empty cart_items
--
-- Side Effects:
--   - May create new cart_sessions row
--   - Sets expires_at to NOW() + 7 days
-- ============================================================================

CREATE OR REPLACE FUNCTION get_or_create_cart(
    p_storefront_id UUID,
    p_session_id TEXT
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_cart_id UUID;
BEGIN
    -- Try to find existing active cart
    SELECT id INTO v_cart_id
    FROM public.cart_sessions
    WHERE storefront_id = p_storefront_id
      AND session_id = p_session_id
      AND status = 'active'
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If cart exists, return it
    IF v_cart_id IS NOT NULL THEN
        RETURN v_cart_id;
    END IF;
    
    -- Otherwise, create new cart
    INSERT INTO public.cart_sessions (
        storefront_id,
        session_id,
        cart_items,
        status,
        expires_at
    ) VALUES (
        p_storefront_id,
        p_session_id,
        '[]'::JSONB,  -- Empty cart initially
        'active',
        NOW() + INTERVAL '7 days'
    )
    RETURNING id INTO v_cart_id;
    
    RETURN v_cart_id;
END;
$$;

COMMENT ON FUNCTION get_or_create_cart(UUID, TEXT) IS 
'Retrieves existing active cart or creates new one for session + storefront';

-- ============================================================================
-- FUNCTION: add_item_to_cart
-- ============================================================================
-- Description:
--   Adds a product to cart or updates quantity if already exists.
--
-- Parameters:
--   p_cart_id UUID: Cart to modify
--   p_product_id UUID: Product to add
--   p_quantity INTEGER: Quantity to add (default: 1)
--   p_variant TEXT: Optional variant selection (e.g., "Ukuran L, Warna Merah")
--   p_price DECIMAL: Product price
--   p_name TEXT: Product name (for display)
--   p_image_url TEXT: Product image (for display)
--
-- Returns:
--   JSONB: Updated cart_items array
--
-- Usage:
--   SELECT add_item_to_cart(
--     'cart-uuid',
--     'product-uuid',
--     2,
--     'Ukuran L',
--     50000,
--     'Kue Lapis',
--     'https://...'
--   );
--
-- Logic:
--   1. Get current cart_items
--   2. Check if product + variant already in cart
--   3. If exists: Update quantity (increment)
--   4. If not exists: Add new item to array
--   5. Update cart_items and updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION add_item_to_cart(
    p_cart_id UUID,
    p_product_id UUID,
    p_quantity INTEGER DEFAULT 1,
    p_variant TEXT DEFAULT NULL,
    p_price DECIMAL DEFAULT NULL,
    p_name TEXT DEFAULT NULL,
    p_image_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_cart_items JSONB;
    v_item_exists BOOLEAN := false;
    v_new_items JSONB := '[]'::JSONB;
    v_item JSONB;
BEGIN
    -- Get current cart items
    SELECT cart_items INTO v_cart_items
    FROM public.cart_sessions
    WHERE id = p_cart_id;
    
    IF v_cart_items IS NULL THEN
        RAISE EXCEPTION 'Cart not found: %', p_cart_id;
    END IF;
    
    -- Loop through existing items
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_cart_items)
    LOOP
        -- Check if product + variant match
        IF (v_item->>'product_id')::UUID = p_product_id 
           AND (v_item->>'variant') IS NOT DISTINCT FROM p_variant THEN
            -- Update quantity
            v_item := jsonb_set(
                v_item, 
                '{quantity}', 
                to_jsonb((v_item->>'quantity')::INTEGER + p_quantity)
            );
            v_item_exists := true;
        END IF;
        
        -- Add item to new array
        v_new_items := v_new_items || v_item;
    END LOOP;
    
    -- If item doesn't exist, add new item
    IF NOT v_item_exists THEN
        v_new_items := v_new_items || jsonb_build_object(
            'product_id', p_product_id,
            'quantity', p_quantity,
            'variant', p_variant,
            'price', p_price,
            'name', p_name,
            'image_url', p_image_url
        );
    END IF;
    
    -- Update cart
    UPDATE public.cart_sessions
    SET cart_items = v_new_items,
        updated_at = NOW()
    WHERE id = p_cart_id;
    
    RETURN v_new_items;
END;
$$;

COMMENT ON FUNCTION add_item_to_cart(UUID, UUID, INTEGER, TEXT, DECIMAL, TEXT, TEXT) IS 
'Adds product to cart or updates quantity if already exists';

-- ============================================================================
-- FUNCTION: remove_item_from_cart
-- ============================================================================
-- Description:
--   Removes a product from cart.
--
-- Parameters:
--   p_cart_id UUID: Cart to modify
--   p_product_id UUID: Product to remove
--   p_variant TEXT: Optional variant to remove (must match exactly)
--
-- Returns:
--   JSONB: Updated cart_items array
-- ============================================================================

CREATE OR REPLACE FUNCTION remove_item_from_cart(
    p_cart_id UUID,
    p_product_id UUID,
    p_variant TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_cart_items JSONB;
    v_new_items JSONB := '[]'::JSONB;
    v_item JSONB;
BEGIN
    -- Get current cart items
    SELECT cart_items INTO v_cart_items
    FROM public.cart_sessions
    WHERE id = p_cart_id;
    
    IF v_cart_items IS NULL THEN
        RAISE EXCEPTION 'Cart not found: %', p_cart_id;
    END IF;
    
    -- Loop through items, exclude matching product + variant
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_cart_items)
    LOOP
        -- Keep item if NOT matching
        IF NOT ((v_item->>'product_id')::UUID = p_product_id 
                AND (v_item->>'variant') IS NOT DISTINCT FROM p_variant) THEN
            v_new_items := v_new_items || v_item;
        END IF;
    END LOOP;
    
    -- Update cart
    UPDATE public.cart_sessions
    SET cart_items = v_new_items,
        updated_at = NOW()
    WHERE id = p_cart_id;
    
    RETURN v_new_items;
END;
$$;

COMMENT ON FUNCTION remove_item_from_cart(UUID, UUID, TEXT) IS 
'Removes product from cart (matching product_id + variant)';

-- ============================================================================
-- FUNCTION: update_cart_status
-- ============================================================================
-- Description:
--   Updates cart status (e.g., mark as checked_out or abandoned).
--
-- Parameters:
--   p_cart_id UUID: Cart to update
--   p_status TEXT: New status ('active', 'checked_out', 'abandoned')
--
-- Returns:
--   BOOLEAN: true if updated, false if cart not found
-- ============================================================================

CREATE OR REPLACE FUNCTION update_cart_status(
    p_cart_id UUID,
    p_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_updated BOOLEAN;
BEGIN
    -- Validate status
    IF p_status NOT IN ('active', 'checked_out', 'abandoned') THEN
        RAISE EXCEPTION 'Invalid status: %. Must be: active, checked_out, abandoned', p_status;
    END IF;
    
    -- Update status
    UPDATE public.cart_sessions
    SET status = p_status,
        updated_at = NOW()
    WHERE id = p_cart_id;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    
    RETURN v_updated > 0;
END;
$$;

COMMENT ON FUNCTION update_cart_status(UUID, TEXT) IS 
'Updates cart status (active, checked_out, abandoned)';

-- ============================================================================
-- FUNCTION: cleanup_expired_carts
-- ============================================================================
-- Description:
--   Deletes expired carts (expires_at < NOW()).
--   Should be run periodically via cron job.
--
-- Returns:
--   INTEGER: Number of carts deleted
--
-- Usage:
--   SELECT cleanup_expired_carts();  -- Run daily via cron
--
-- Strategy:
--   - Deletes carts where expires_at < NOW()
--   - OR status = 'abandoned' AND updated_at < NOW() - INTERVAL '30 days'
--
-- Side Effects:
--   - Permanently deletes cart_sessions rows
--   - Frees up database space
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_carts()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM public.cart_sessions
    WHERE expires_at < NOW()
       OR (status = 'abandoned' AND updated_at < NOW() - INTERVAL '30 days');
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_expired_carts() IS 
'Deletes expired carts (expires_at < NOW() or abandoned > 30 days). Run via cron job.';

-- ============================================================================
-- FUNCTION: get_cart_total
-- ============================================================================
-- Description:
--   Calculates total price for all items in cart.
--
-- Parameters:
--   p_cart_id UUID: Cart to calculate total
--
-- Returns:
--   DECIMAL: Total price (sum of price * quantity for all items)
--
-- Usage:
--   SELECT get_cart_total('cart-uuid');
--
-- Logic:
--   - Iterate through cart_items
--   - Sum: price * quantity for each item
-- ============================================================================

CREATE OR REPLACE FUNCTION get_cart_total(p_cart_id UUID)
RETURNS DECIMAL
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_cart_items JSONB;
    v_item JSONB;
    v_total DECIMAL := 0;
BEGIN
    -- Get cart items
    SELECT cart_items INTO v_cart_items
    FROM public.cart_sessions
    WHERE id = p_cart_id;
    
    IF v_cart_items IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Calculate total
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_cart_items)
    LOOP
        v_total := v_total + (
            (v_item->>'price')::DECIMAL * (v_item->>'quantity')::INTEGER
        );
    END LOOP;
    
    RETURN v_total;
END;
$$;

COMMENT ON FUNCTION get_cart_total(UUID) IS 
'Calculates total price for all items in cart';

-- ============================================================================
-- TRIGGER: update_cart_updated_at
-- ============================================================================
-- Description:
--   Automatically updates updated_at timestamp on every UPDATE.
-- ============================================================================

DROP TRIGGER IF EXISTS update_cart_updated_at ON public.cart_sessions;
CREATE TRIGGER update_cart_updated_at
    BEFORE UPDATE ON public.cart_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER update_cart_updated_at ON public.cart_sessions IS 
'Auto-updates updated_at timestamp on every UPDATE';

-- ============================================================================
-- VIEW: active_carts_summary
-- ============================================================================
-- Description:
--   Summary of active carts for owner's storefront.
--   Used for analytics and monitoring.
--
-- Columns:
--   - cart_id, session_id, item_count, total_price, created_at, expires_at
--
-- Access:
--   - Owner only (WHERE storefront.user_id = auth.uid())
-- ============================================================================

CREATE OR REPLACE VIEW active_carts_summary AS
SELECT 
    c.id AS cart_id,
    c.session_id,
    c.storefront_id,
    s.store_name,
    jsonb_array_length(c.cart_items) AS item_count,
    c.status,
    c.created_at,
    c.updated_at,
    c.expires_at,
    -- Calculate total (sum of price * quantity)
    (
        SELECT COALESCE(SUM((item->>'price')::DECIMAL * (item->>'quantity')::INTEGER), 0)
        FROM jsonb_array_elements(c.cart_items) AS item
    ) AS total_price
FROM public.cart_sessions c
JOIN public.business_storefronts s ON c.storefront_id = s.id
WHERE c.status = 'active'
  AND c.expires_at > NOW()
  AND s.user_id = auth.uid()
ORDER BY c.updated_at DESC;

COMMENT ON VIEW active_carts_summary IS 
'Summary of active carts for owner storefronts (item count, total price, expiry)';

-- ============================================================================
-- VIEW: cart_status_distribution
-- ============================================================================
-- Description:
--   Distribution of carts by status for owner's storefront.
--
-- Columns:
--   - status, cart_count
--
-- Access:
--   - Owner only (WHERE storefront.user_id = auth.uid())
-- ============================================================================

CREATE OR REPLACE VIEW cart_status_distribution AS
SELECT 
    c.status,
    COUNT(*) AS cart_count,
    s.id AS storefront_id,
    s.user_id
FROM public.cart_sessions c
JOIN public.business_storefronts s ON c.storefront_id = s.id
WHERE s.user_id = auth.uid()
GROUP BY c.status, s.id, s.user_id
ORDER BY cart_count DESC;

COMMENT ON VIEW cart_status_distribution IS 
'Distribution of carts by status (active, checked_out, abandoned) for owner storefronts';

-- ============================================================================
-- END OF LOGIC
-- ============================================================================
-- Summary:
--   - 7 Functions: get/create cart, add/remove items, update status, cleanup, total
--   - 1 Trigger: auto-update updated_at
--   - 2 Views: active carts + status distribution
--
-- Next Steps:
--   1. Apply RLS policies: carts.policies.sql
--   2. Add indexes: carts.index.sql
--   3. Test: storefront.debug.sql (section: carts logic)
--   4. Setup cron job: SELECT cleanup_expired_carts() daily
--
-- Testing Commands:
--   -- Test get or create cart:
--   SELECT get_or_create_cart('storefront-uuid', 'test-session-id');
--
--   -- Test add item:
--   SELECT add_item_to_cart(
--     'cart-uuid',
--     'product-uuid',
--     2,
--     'Ukuran L',
--     50000,
--     'Kue Lapis',
--     'https://...'
--   );
--
--   -- Test remove item:
--   SELECT remove_item_from_cart('cart-uuid', 'product-uuid', 'Ukuran L');
--
--   -- Test cart total:
--   SELECT get_cart_total('cart-uuid');
--
--   -- Test cleanup:
--   SELECT cleanup_expired_carts();
-- ============================================================================
