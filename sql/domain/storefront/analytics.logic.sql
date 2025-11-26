-- ============================================================================
-- DOMAIN: STOREFRONT
-- Entity: storefront_analytics (analytics)
-- File: analytics.logic.sql
-- Purpose: Business logic, functions, views for storefront analytics
-- ============================================================================
-- Pattern: 4-File Entity Structure
-- 1. schema.sql  (Table Definition)
-- 2. logic.sql   ← YOU ARE HERE
-- 3. policies.sql (Row Level Security)
-- 4. index.sql   (Indexes & Constraints)
-- ============================================================================

-- ============================================================================
-- FUNCTION: log_analytics_event
-- ============================================================================
-- Description:
--   Helper function to log analytics events with consistent structure.
--   Simplifies event logging from application code.
--
-- Parameters:
--   p_storefront_id UUID: Target storefront
--   p_event_type TEXT: Event type (page_view, product_view, etc.)
--   p_product_id UUID: Optional product reference (NULL for non-product events)
--   p_session_id TEXT: Optional session identifier
--   p_metadata JSONB: Optional metadata (referrer, device, variant, etc.)
--
-- Returns:
--   UUID: ID of the newly created analytics event
--
-- Usage:
--   -- Log page view:
--   SELECT log_analytics_event(
--     'storefront-uuid',
--     'page_view',
--     NULL,
--     'session-uuid',
--     '{"referrer": "google.com", "device": "mobile"}'::JSONB
--   );
--
--   -- Log product view:
--   SELECT log_analytics_event(
--     'storefront-uuid',
--     'product_view',
--     'product-uuid',
--     'session-uuid',
--     '{"from": "search"}'::JSONB
--   );
--
-- Side Effects:
--   - Creates new row in storefront_analytics
--   - Immutable (cannot UPDATE/DELETE later)
--
-- Security:
--   - SECURITY DEFINER: Runs with creator's permissions
--   - Public can call this function (for tracking)
--   - Validates event_type (only allowed values)
-- ============================================================================

CREATE OR REPLACE FUNCTION log_analytics_event(
    p_storefront_id UUID,
    p_event_type TEXT,
    p_product_id UUID DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id UUID;
BEGIN
    -- Validate event_type (only allow predefined types)
    IF p_event_type NOT IN ('page_view', 'product_view', 'product_click', 'cart_add', 'checkout_start', 'whatsapp_click') THEN
        RAISE EXCEPTION 'Invalid event_type: %. Must be one of: page_view, product_view, product_click, cart_add, checkout_start, whatsapp_click', p_event_type;
    END IF;
    
    -- Insert analytics event
    INSERT INTO public.storefront_analytics (
        storefront_id,
        event_type,
        product_id,
        session_id,
        metadata
    ) VALUES (
        p_storefront_id,
        p_event_type,
        p_product_id,
        p_session_id,
        p_metadata
    )
    RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$;

COMMENT ON FUNCTION log_analytics_event(UUID, TEXT, UUID, TEXT, JSONB) IS 
'Helper function to log analytics events. Public can call (for tracking). Validates event_type.';

-- ============================================================================
-- FUNCTION: get_storefront_event_counts
-- ============================================================================
-- Description:
--   Returns event counts grouped by event_type for a storefront.
--   Used for analytics dashboards.
--
-- Parameters:
--   p_storefront_id UUID: Target storefront
--   p_start_date TIMESTAMPTZ: Optional start date filter (default: all time)
--   p_end_date TIMESTAMPTZ: Optional end date filter (default: now)
--
-- Returns:
--   TABLE: event_type, event_count
--
-- Usage:
--   -- Get all-time event counts:
--   SELECT * FROM get_storefront_event_counts('storefront-uuid');
--
--   -- Get event counts for last 30 days:
--   SELECT * FROM get_storefront_event_counts(
--     'storefront-uuid',
--     NOW() - INTERVAL '30 days',
--     NOW()
--   );
--
-- Example Output:
--   event_type      | event_count
--   ----------------+------------
--   page_view       | 1250
--   product_view    | 450
--   cart_add        | 85
--   whatsapp_click  | 120
-- ============================================================================

CREATE OR REPLACE FUNCTION get_storefront_event_counts(
    p_storefront_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT '1970-01-01'::TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    event_type TEXT,
    event_count BIGINT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.event_type,
        COUNT(*) AS event_count
    FROM public.storefront_analytics a
    WHERE a.storefront_id = p_storefront_id
      AND a.created_at >= p_start_date
      AND a.created_at <= p_end_date
    GROUP BY a.event_type
    ORDER BY event_count DESC;
END;
$$;

COMMENT ON FUNCTION get_storefront_event_counts(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS 
'Returns event counts grouped by event_type for a storefront (with optional date range)';

-- ============================================================================
-- FUNCTION: get_product_event_counts
-- ============================================================================
-- Description:
--   Returns event counts for a specific product.
--   Used for product analytics.
--
-- Parameters:
--   p_product_id UUID: Target product
--   p_start_date TIMESTAMPTZ: Optional start date filter
--   p_end_date TIMESTAMPTZ: Optional end date filter
--
-- Returns:
--   TABLE: event_type, event_count
--
-- Usage:
--   SELECT * FROM get_product_event_counts('product-uuid');
-- ============================================================================

CREATE OR REPLACE FUNCTION get_product_event_counts(
    p_product_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT '1970-01-01'::TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    event_type TEXT,
    event_count BIGINT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.event_type,
        COUNT(*) AS event_count
    FROM public.storefront_analytics a
    WHERE a.product_id = p_product_id
      AND a.created_at >= p_start_date
      AND a.created_at <= p_end_date
    GROUP BY a.event_type
    ORDER BY event_count DESC;
END;
$$;

COMMENT ON FUNCTION get_product_event_counts(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS 
'Returns event counts for a specific product (with optional date range)';

-- ============================================================================
-- FUNCTION: get_unique_visitors
-- ============================================================================
-- Description:
--   Returns count of unique visitors (distinct session_id) for a storefront.
--   Used for unique visitor metrics.
--
-- Parameters:
--   p_storefront_id UUID: Target storefront
--   p_start_date TIMESTAMPTZ: Optional start date filter
--   p_end_date TIMESTAMPTZ: Optional end date filter
--
-- Returns:
--   INTEGER: Count of unique session_id values
--
-- Usage:
--   -- Get unique visitors for last 7 days:
--   SELECT get_unique_visitors(
--     'storefront-uuid',
--     NOW() - INTERVAL '7 days',
--     NOW()
--   );
--
-- Note:
--   - Only counts events with non-NULL session_id
--   - Session tracking depends on app-level implementation
-- ============================================================================

CREATE OR REPLACE FUNCTION get_unique_visitors(
    p_storefront_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT '1970-01-01'::TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(DISTINCT session_id) INTO v_count
    FROM public.storefront_analytics
    WHERE storefront_id = p_storefront_id
      AND session_id IS NOT NULL
      AND created_at >= p_start_date
      AND created_at <= p_end_date;
    
    RETURN COALESCE(v_count, 0);
END;
$$;

COMMENT ON FUNCTION get_unique_visitors(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS 
'Returns count of unique visitors (distinct session_id) for a storefront';

-- ============================================================================
-- FUNCTION: get_conversion_funnel
-- ============================================================================
-- Description:
--   Returns conversion funnel metrics for a storefront.
--   Shows drop-off at each stage: page_view → product_view → cart_add → checkout_start
--
-- Parameters:
--   p_storefront_id UUID: Target storefront
--   p_start_date TIMESTAMPTZ: Optional start date filter
--   p_end_date TIMESTAMPTZ: Optional end date filter
--
-- Returns:
--   TABLE: stage, event_count, conversion_rate
--
-- Usage:
--   SELECT * FROM get_conversion_funnel('storefront-uuid');
--
-- Example Output:
--   stage          | event_count | conversion_rate
--   ---------------+-------------+----------------
--   page_view      | 1000        | 100.00
--   product_view   | 400         | 40.00
--   cart_add       | 80          | 8.00
--   checkout_start | 20          | 2.00
-- ============================================================================

CREATE OR REPLACE FUNCTION get_conversion_funnel(
    p_storefront_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT '1970-01-01'::TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    stage TEXT,
    event_count BIGINT,
    conversion_rate NUMERIC
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_page_views BIGINT;
BEGIN
    -- Get base count (page_view)
    SELECT COUNT(*) INTO v_page_views
    FROM public.storefront_analytics
    WHERE storefront_id = p_storefront_id
      AND event_type = 'page_view'
      AND created_at >= p_start_date
      AND created_at <= p_end_date;
    
    -- Return funnel stages
    RETURN QUERY
    SELECT 
        a.event_type AS stage,
        COUNT(*) AS event_count,
        CASE 
            WHEN v_page_views > 0 THEN ROUND((COUNT(*)::NUMERIC / v_page_views * 100), 2)
            ELSE 0
        END AS conversion_rate
    FROM public.storefront_analytics a
    WHERE a.storefront_id = p_storefront_id
      AND a.event_type IN ('page_view', 'product_view', 'cart_add', 'checkout_start')
      AND a.created_at >= p_start_date
      AND a.created_at <= p_end_date
    GROUP BY a.event_type
    ORDER BY 
        CASE a.event_type
            WHEN 'page_view' THEN 1
            WHEN 'product_view' THEN 2
            WHEN 'cart_add' THEN 3
            WHEN 'checkout_start' THEN 4
            ELSE 5
        END;
END;
$$;

COMMENT ON FUNCTION get_conversion_funnel(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS 
'Returns conversion funnel metrics (page_view → product_view → cart_add → checkout_start)';

-- ============================================================================
-- VIEW: analytics_daily_summary
-- ============================================================================
-- Description:
--   Daily aggregated analytics for owner's storefront.
--   Shows event counts per day for the last 30 days.
--
-- Columns:
--   - date (day)
--   - event_type
--   - event_count
--
-- Access:
--   - Owner only (WHERE storefront.user_id = auth.uid())
-- ============================================================================

CREATE OR REPLACE VIEW analytics_daily_summary AS
SELECT 
    DATE(a.created_at) AS date,
    a.event_type,
    COUNT(*) AS event_count,
    s.id AS storefront_id,
    s.user_id
FROM public.storefront_analytics a
JOIN public.business_storefronts s ON a.storefront_id = s.id
WHERE a.created_at >= NOW() - INTERVAL '30 days'
  AND s.user_id = auth.uid()
GROUP BY DATE(a.created_at), a.event_type, s.id, s.user_id
ORDER BY date DESC, event_type;

COMMENT ON VIEW analytics_daily_summary IS 
'Daily aggregated analytics for last 30 days (owner only)';

-- ============================================================================
-- VIEW: top_products_by_views
-- ============================================================================
-- Description:
--   Top products by view count for owner's storefront.
--   Used for analytics dashboards.
--
-- Columns:
--   - product_id, product_name, view_count
--
-- Access:
--   - Owner only (WHERE storefront.user_id = auth.uid())
-- ============================================================================

CREATE OR REPLACE VIEW top_products_by_views AS
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    COUNT(*) AS view_count,
    s.id AS storefront_id,
    s.user_id
FROM public.storefront_analytics a
JOIN public.storefront_products p ON a.product_id = p.id
JOIN public.business_storefronts s ON a.storefront_id = s.id
WHERE a.event_type = 'product_view'
  AND a.created_at >= NOW() - INTERVAL '30 days'
  AND s.user_id = auth.uid()
GROUP BY p.id, p.name, s.id, s.user_id
ORDER BY view_count DESC
LIMIT 10;

COMMENT ON VIEW top_products_by_views IS 
'Top 10 products by view count for last 30 days (owner only)';

-- ============================================================================
-- END OF LOGIC
-- ============================================================================
-- Summary:
--   - 6 Functions: log event, event counts, unique visitors, conversion funnel
--   - 2 Views: daily summary + top products
--   - No triggers (append-only table, no UPDATE)
--
-- Next Steps:
--   1. Apply RLS policies: analytics.policies.sql
--   2. Add indexes: analytics.index.sql
--   3. Test: storefront.debug.sql (section: analytics logic)
--
-- Testing Commands:
--   -- Test log event:
--   SELECT log_analytics_event(
--     (SELECT id FROM business_storefronts LIMIT 1),
--     'page_view',
--     NULL,
--     'test-session-id',
--     '{"referrer": "google.com"}'::JSONB
--   );
--
--   -- Test event counts:
--   SELECT * FROM get_storefront_event_counts(
--     (SELECT id FROM business_storefronts LIMIT 1)
--   );
--
--   -- Test unique visitors:
--   SELECT get_unique_visitors(
--     (SELECT id FROM business_storefronts LIMIT 1),
--     NOW() - INTERVAL '7 days',
--     NOW()
--   );
--
--   -- Test conversion funnel:
--   SELECT * FROM get_conversion_funnel(
--     (SELECT id FROM business_storefronts LIMIT 1)
--   );
-- ============================================================================
