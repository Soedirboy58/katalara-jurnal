-- ============================================================================
-- DOMAIN: STOREFRONT
-- Entity: business_storefronts (storefronts)
-- File: storefronts.schema.sql
-- Purpose: Schema definition for UMKM online storefronts (Lapak Online)
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
-- TABLE: business_storefronts
-- ============================================================================
-- Description:
--   Configuration and branding for each UMKM's online storefront (Lapak Online).
--   Each UMKM can create ONE storefront accessible via unique slug.
--   Public can browse active storefronts at /lapak/[slug]
--
-- Key Features:
--   - Unique slug for public URL (e.g., /lapak/toko-kue-ibu-ani)
--   - Visual branding (logo, cover, theme color)
--   - Contact info (WhatsApp, Instagram, location)
--   - Payment options (QRIS, bank account)
--   - Analytics tracking (views, clicks)
--   - Public visibility control (is_active flag)
--
-- Access Pattern:
--   - Public: Can read active storefronts (WHERE is_active = true)
--   - Owner: Full CRUD access to own storefront
--
-- Related Entities:
--   - storefront_products: Products displayed in this storefront
--   - storefront_analytics: Tracking events for this storefront
--   - cart_sessions: Shopping carts for this storefront
--
-- Data Source:
--   Migrated from: sql/01-features/lapak-online.sql
--   Migration additions: sql/02-migrations/add_payment_fields.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.business_storefronts (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Owner (FK to auth.users)
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- ========================================================================
    -- STOREFRONT IDENTITY
    -- ========================================================================
    slug TEXT UNIQUE NOT NULL,
        -- Unique URL identifier (e.g., "toko-kue-ani")
        -- Used in public URL: /lapak/[slug]
        -- Auto-generated from store_name via generate_storefront_slug()
        -- Pattern: lowercase, alphanumeric + hyphens, no spaces
    
    store_name TEXT NOT NULL,
        -- Display name of the storefront (e.g., "Toko Kue Ibu Ani")
        -- Shown in header, meta tags, and storefront page
    
    description TEXT,
        -- Optional description/tagline for the storefront
        -- Shown on storefront page and meta description
    
    -- ========================================================================
    -- VISUAL BRANDING
    -- ========================================================================
    logo_url TEXT,
        -- URL to storefront logo image
        -- Stored in storage bucket: lapak-images
        -- Displayed in header and favicon
    
    cover_image_url TEXT,
        -- URL to storefront cover/banner image
        -- Stored in storage bucket: lapak-images
        -- Displayed at top of storefront page
    
    theme_color TEXT DEFAULT '#3B82F6',
        -- Primary color for storefront branding (hex code)
        -- Default: Blue (#3B82F6)
        -- Used for buttons, links, accents
    
    -- ========================================================================
    -- CONTACT & SOCIAL
    -- ========================================================================
    whatsapp_number TEXT NOT NULL,
        -- WhatsApp number for customer inquiries (e.g., "628123456789")
        -- Used for "Order via WhatsApp" button
        -- Format: Country code + number (no spaces/dashes)
    
    instagram_handle TEXT,
        -- Instagram username (optional)
        -- Displayed as social link on storefront
    
    location_text TEXT,
        -- Free-text location (e.g., "Surabaya, Jawa Timur")
        -- Displayed on storefront page
    
    -- ========================================================================
    -- PAYMENT OPTIONS
    -- ========================================================================
    -- Added via: sql/02-migrations/add_payment_fields.sql
    
    qris_image_url TEXT,
        -- URL to QRIS QR code image for payment
        -- Stored in storage bucket: lapak-images
        -- Shown at checkout for QRIS payment option
    
    bank_name TEXT,
        -- Bank name for transfer payment (e.g., "BCA", "Mandiri")
    
    bank_account_number TEXT,
        -- Bank account number for transfer
    
    bank_account_holder TEXT,
        -- Account holder name for bank transfer
    
    -- ========================================================================
    -- STATUS FLAGS
    -- ========================================================================
    is_active BOOLEAN DEFAULT true,
        -- Controls public visibility of the storefront
        -- true: Storefront is live and accessible at /lapak/[slug]
        -- false: Storefront is hidden from public (owner can still view)
        -- Used in RLS policies to restrict public SELECT
    
    -- ========================================================================
    -- ANALYTICS COUNTERS
    -- ========================================================================
    -- These are aggregate counters for quick display
    -- Detailed events are stored in storefront_analytics table
    
    total_views INTEGER DEFAULT 0,
        -- Total number of page views for this storefront
        -- Incremented via increment_storefront_views() function
    
    total_clicks INTEGER DEFAULT 0,
        -- Total number of WhatsApp button clicks
        -- Incremented via increment_storefront_clicks() function
    
    -- ========================================================================
    -- TIMESTAMPS
    -- ========================================================================
    created_at TIMESTAMPTZ DEFAULT NOW(),
        -- When the storefront was created
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
        -- Last modification timestamp
        -- Auto-updated via update_updated_at_column() trigger
);

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE public.business_storefronts IS 
'Lapak Online configuration for each UMKM. Public-facing storefront accessible at /lapak/[slug]. Owner has full control, public can view active storefronts.';

COMMENT ON COLUMN public.business_storefronts.id IS 
'Primary key UUID';

COMMENT ON COLUMN public.business_storefronts.user_id IS 
'Owner of the storefront (FK to auth.users). One user can have one storefront.';

COMMENT ON COLUMN public.business_storefronts.slug IS 
'Unique URL-safe identifier (e.g., "toko-kue-ani"). Used in /lapak/[slug]. Auto-generated from store_name.';

COMMENT ON COLUMN public.business_storefronts.store_name IS 
'Display name of the storefront shown to public';

COMMENT ON COLUMN public.business_storefronts.description IS 
'Optional tagline or description for the storefront';

COMMENT ON COLUMN public.business_storefronts.logo_url IS 
'URL to storefront logo (stored in lapak-images bucket)';

COMMENT ON COLUMN public.business_storefronts.cover_image_url IS 
'URL to storefront cover/banner image (stored in lapak-images bucket)';

COMMENT ON COLUMN public.business_storefronts.theme_color IS 
'Primary brand color (hex code, default #3B82F6)';

COMMENT ON COLUMN public.business_storefronts.whatsapp_number IS 
'WhatsApp number for orders (format: 628123456789)';

COMMENT ON COLUMN public.business_storefronts.instagram_handle IS 
'Instagram username (optional social link)';

COMMENT ON COLUMN public.business_storefronts.location_text IS 
'Free-text location (e.g., "Surabaya, Jawa Timur")';

COMMENT ON COLUMN public.business_storefronts.qris_image_url IS 
'URL to QRIS QR code image for payment (stored in lapak-images bucket)';

COMMENT ON COLUMN public.business_storefronts.bank_name IS 
'Bank name for transfer payment (e.g., "BCA", "Mandiri")';

COMMENT ON COLUMN public.business_storefronts.bank_account_number IS 
'Bank account number for transfer';

COMMENT ON COLUMN public.business_storefronts.bank_account_holder IS 
'Account holder name matching bank account';

COMMENT ON COLUMN public.business_storefronts.is_active IS 
'Public visibility flag. true = live at /lapak/[slug], false = hidden from public';

COMMENT ON COLUMN public.business_storefronts.total_views IS 
'Total page views counter (aggregate of storefront_analytics events)';

COMMENT ON COLUMN public.business_storefronts.total_clicks IS 
'Total WhatsApp button clicks (aggregate of storefront_analytics events)';

COMMENT ON COLUMN public.business_storefronts.created_at IS 
'Storefront creation timestamp';

COMMENT ON COLUMN public.business_storefronts.updated_at IS 
'Last modification timestamp (auto-updated via trigger)';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
-- Next Steps:
--   1. Deploy this schema: psql -f storefronts.schema.sql
--   2. Apply logic: storefronts.logic.sql
--   3. Apply RLS policies: storefronts.policies.sql
--   4. Add indexes: storefronts.index.sql
--
-- Testing:
--   - Run: storefront.debug.sql (section: business_storefronts health)
--   - Verify: Table created, columns present, constraints valid
--   - Check: auth.users FK works correctly
--
-- Migration Notes:
--   - ADDITIVE ONLY - No DROP operations
--   - 100% BACKWARD COMPATIBLE with existing data
--   - Preserves all existing rows in business_storefronts
--   - Payment fields added via add_payment_fields.sql migration
-- ============================================================================
