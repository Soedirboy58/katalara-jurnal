-- ============================================================================
-- DOMAIN: STOREFRONT
-- Entity: storefront_analytics (analytics)
-- File: analytics.schema.sql
-- Purpose: Schema definition for storefront event tracking
-- ============================================================================
-- Pattern: 4-File Entity Structure
-- 1. schema.sql  ← YOU ARE HERE
-- 2. logic.sql   (Functions, Views, Triggers)
-- 3. policies.sql (Row Level Security)
-- 4. index.sql   (Indexes & Constraints)
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: storefront_analytics
-- ============================================================================
-- Description:
--   Event tracking for storefront activities.
--   Records all visitor interactions: page views, product views, clicks, cart adds.
--   Used for analytics dashboards and insights.
--
-- Key Features:
--   - Event-based tracking (immutable append-only log)
--   - Flexible metadata storage (JSONB)
--   - Session tracking (via session_id)
--   - Product-level tracking (optional product_id)
--   - No UPDATE/DELETE (audit trail integrity)
--
-- Event Types:
--   - 'page_view': Visitor landed on /lapak/[slug]
--   - 'product_view': Visitor viewed product detail page
--   - 'product_click': Visitor clicked "Buy" button
--   - 'cart_add': Visitor added product to cart
--   - 'checkout_start': Visitor started checkout flow
--   - 'whatsapp_click': Visitor clicked WhatsApp button
--
-- Access Pattern:
--   - Public: Can INSERT events (for tracking)
--   - Owner: Can SELECT events for own storefront (analytics)
--   - No one: Can UPDATE/DELETE (immutable log)
--
-- Related Entities:
--   - business_storefronts: Parent storefront (FK: storefront_id)
--   - storefront_products: Optional product reference (FK: product_id)
--
-- Data Source:
--   Migrated from: sql/01-features/lapak-online.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.storefront_analytics (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign Keys
    storefront_id UUID NOT NULL REFERENCES public.business_storefronts(id) ON DELETE CASCADE,
        -- Parent storefront (which lapak this event belongs to)
        -- CASCADE: If storefront is deleted, all analytics are deleted
    
    product_id UUID REFERENCES public.storefront_products(id) ON DELETE SET NULL,
        -- Optional product reference (for product-specific events)
        -- NULL: Event is not product-specific (e.g., page_view, whatsapp_click)
        -- NOT NULL: Event is product-specific (e.g., product_view, cart_add)
        -- ON DELETE SET NULL: If product deleted, keep analytics (set product_id = NULL)
    
    -- ========================================================================
    -- EVENT DETAILS
    -- ========================================================================
    event_type TEXT NOT NULL,
        -- Type of event being tracked
        -- Supported values:
        --   'page_view': Storefront page view
        --   'product_view': Product detail page view
        --   'product_click': "Buy" button click
        --   'cart_add': Add to cart action
        --   'checkout_start': Checkout flow initiated
        --   'whatsapp_click': WhatsApp button click
        -- CHECK constraint: event_type IN (...)
    
    -- ========================================================================
    -- SESSION INFO
    -- ========================================================================
    session_id TEXT,
        -- Optional session identifier for tracking unique visitors
        -- Format: UUID or browser fingerprint
        -- Used for unique visitor counts and session-based analytics
        -- NULL: Anonymous event (no session tracking)
    
    -- ========================================================================
    -- METADATA
    -- ========================================================================
    metadata JSONB,
        -- Flexible JSON field for additional event data
        -- Examples:
        --   - page_view: {"referrer": "google.com", "device": "mobile"}
        --   - product_view: {"variant": "Ukuran L", "from": "search"}
        --   - cart_add: {"quantity": 2, "variant": "Merah"}
        --   - whatsapp_click: {"product_id": "uuid", "from_page": "product_detail"}
        -- No fixed schema, app-level validation
    
    -- ========================================================================
    -- TIMESTAMP
    -- ========================================================================
    created_at TIMESTAMPTZ DEFAULT NOW()
        -- When the event occurred
        -- Immutable (no updated_at - events are append-only)
);

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE public.storefront_analytics IS 
'Event tracking for storefront activities. Append-only log (no UPDATE/DELETE). Public can INSERT, owner can SELECT.';

COMMENT ON COLUMN public.storefront_analytics.id IS 
'Primary key UUID';

COMMENT ON COLUMN public.storefront_analytics.storefront_id IS 
'Parent storefront (FK to business_storefronts). CASCADE DELETE.';

COMMENT ON COLUMN public.storefront_analytics.product_id IS 
'Optional product reference (FK to storefront_products). NULL = not product-specific. ON DELETE SET NULL.';

COMMENT ON COLUMN public.storefront_analytics.event_type IS 
'Event type: page_view, product_view, product_click, cart_add, checkout_start, whatsapp_click';

COMMENT ON COLUMN public.storefront_analytics.session_id IS 
'Optional session identifier for unique visitor tracking';

COMMENT ON COLUMN public.storefront_analytics.metadata IS 
'Flexible JSONB field for additional event data (referrer, device, variant, etc.)';

COMMENT ON COLUMN public.storefront_analytics.created_at IS 
'Event timestamp (immutable, no updated_at)';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
-- Next Steps:
--   1. Deploy this schema: psql -f analytics.schema.sql
--   2. Apply logic: analytics.logic.sql
--   3. Apply RLS policies: analytics.policies.sql
--   4. Add indexes: analytics.index.sql
--
-- Testing:
--   - Run: storefront.debug.sql (section: storefront_analytics health)
--   - Verify: Table created, columns present, constraints valid
--   - Check: FKs work correctly (storefront_id, product_id)
--
-- Migration Notes:
--   - ADDITIVE ONLY - No DROP operations
--   - 100% BACKWARD COMPATIBLE with existing data
--   - Preserves all existing rows in storefront_analytics
--   - Immutable log: No UPDATE/DELETE policies
--   - Consider partitioning by created_at if table grows large (>1M rows)
-- ============================================================================
