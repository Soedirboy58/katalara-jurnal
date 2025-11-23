-- ============================================
-- USER SETTINGS: Custom Units/Satuan
-- Purpose: Allow users to configure custom units for their business
-- Use cases: Barang (pcs, kg, liter), Jasa (jam, hari, proyek, orang)
-- ============================================

-- Create settings table for custom units
CREATE TABLE IF NOT EXISTS public.user_unit_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Business type
  has_physical_products BOOLEAN DEFAULT true,
  has_services BOOLEAN DEFAULT false,
  
  -- Enabled units (JSON arrays)
  physical_units TEXT[] DEFAULT ARRAY['pcs', 'unit', 'pasang', 'lusin', 'box'],
  service_units TEXT[] DEFAULT ARRAY['jam', 'hari', 'bulan', 'proyek', 'orang'],
  
  -- Custom units added by user
  custom_physical_units TEXT[] DEFAULT ARRAY[]::TEXT[],
  custom_service_units TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Most used unit (for quick select)
  default_physical_unit VARCHAR(50) DEFAULT 'pcs',
  default_service_unit VARCHAR(50) DEFAULT 'jam',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Create index
CREATE INDEX idx_user_unit_settings_user_id ON public.user_unit_settings(user_id);

-- Enable RLS
ALTER TABLE public.user_unit_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own unit settings"
  ON public.user_unit_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own unit settings"
  ON public.user_unit_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own unit settings"
  ON public.user_unit_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update trigger
CREATE TRIGGER update_user_unit_settings_updated_at
  BEFORE UPDATE ON public.user_unit_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE public.user_unit_settings IS 'User-specific unit/satuan preferences for products and services';
COMMENT ON COLUMN public.user_unit_settings.physical_units IS 'Enabled units for physical products (pcs, kg, liter, etc)';
COMMENT ON COLUMN public.user_unit_settings.service_units IS 'Enabled units for services (jam, hari, proyek, etc)';
COMMENT ON COLUMN public.user_unit_settings.custom_physical_units IS 'Custom units added by user for physical products';
COMMENT ON COLUMN public.user_unit_settings.custom_service_units IS 'Custom units added by user for services';

-- ============================================
-- PREDEFINED UNIT OPTIONS (for UI reference)
-- ============================================

-- Physical Product Units:
-- Common: pcs, unit, pasang, lusin, box, karton
-- Weight: gram, kg, ton, ons
-- Volume: ml, liter, galon
-- Length: cm, meter, yard
-- Area: m2, are, hektar

-- Service Units:
-- Time: jam, hari, minggu, bulan, tahun
-- Quantity: orang, tim, grup
-- Project: proyek, paket, bundle, sesi, kali, kunjungan

-- ============================================
-- END OF MIGRATION
-- ============================================
