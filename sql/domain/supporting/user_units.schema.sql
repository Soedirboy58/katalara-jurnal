-- =====================================================
-- DOMAIN: SUPPORTING
-- TABLE: user_unit_settings
-- SCHEMA DEFINITION
-- =====================================================

-- =====================================================
-- TABLE: user_unit_settings
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_unit_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Business type flags
  has_physical_products BOOLEAN DEFAULT true,
  has_services BOOLEAN DEFAULT false,
  
  -- Enabled units (arrays)
  physical_units TEXT[] DEFAULT ARRAY['pcs', 'unit', 'pasang', 'lusin', 'box'],
  service_units TEXT[] DEFAULT ARRAY['jam', 'hari', 'bulan', 'proyek', 'orang'],
  
  -- Custom units added by user
  custom_physical_units TEXT[] DEFAULT ARRAY[]::TEXT[],
  custom_service_units TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Default units (most frequently used)
  default_physical_unit VARCHAR(50) DEFAULT 'pcs',
  default_service_unit VARCHAR(50) DEFAULT 'jam',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id)
);

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.user_unit_settings IS 'User-specific unit/satuan preferences for products and services';
COMMENT ON COLUMN public.user_unit_settings.user_id IS 'Foreign key to auth.users, one config per user';
COMMENT ON COLUMN public.user_unit_settings.has_physical_products IS 'Whether user sells physical products requiring weight/volume/quantity units';
COMMENT ON COLUMN public.user_unit_settings.has_services IS 'Whether user provides services requiring time/people units';
COMMENT ON COLUMN public.user_unit_settings.physical_units IS 'Enabled units for physical products (pcs, kg, liter, meter, etc)';
COMMENT ON COLUMN public.user_unit_settings.service_units IS 'Enabled units for services (jam, hari, proyek, orang, etc)';
COMMENT ON COLUMN public.user_unit_settings.custom_physical_units IS 'Custom units added by user for physical products (e.g., "karung", "ikat")';
COMMENT ON COLUMN public.user_unit_settings.custom_service_units IS 'Custom units added by user for services (e.g., "sesi", "kunjungan")';
COMMENT ON COLUMN public.user_unit_settings.default_physical_unit IS 'Default unit for quick selection in product forms';
COMMENT ON COLUMN public.user_unit_settings.default_service_unit IS 'Default unit for quick selection in service forms';

-- =====================================================
-- REFERENCE: PREDEFINED UNIT OPTIONS
-- =====================================================

-- Physical Product Units:
--   Common: pcs, unit, pasang, lusin, box, karton, sak
--   Weight: gram, kg, ton, ons, kwintal
--   Volume: ml, liter, galon, m3
--   Length: cm, meter, yard, inch
--   Area: m2, are, hektar

-- Service Units:
--   Time: jam, hari, minggu, bulan, tahun
--   Quantity: orang, tim, grup, kelas
--   Project: proyek, paket, bundle, sesi, kali, kunjungan

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ SUPPORTING Domain - User Unit Settings Schema Created';
  RAISE NOTICE '   - Table: user_unit_settings';
  RAISE NOTICE '   - Purpose: Per-user unit preferences (physical + service)';
  RAISE NOTICE '   - Features: Custom units, default selection, business type flags';
END $$;
