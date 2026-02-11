-- =====================================================
-- UNITS & INVOICE TEMPLATES CATALOG
-- Creates catalogs and user preferences for units & invoice templates
-- =====================================================

-- 1) Unit Catalog
CREATE TABLE IF NOT EXISTS unit_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  symbol TEXT,
  unit_type TEXT CHECK (unit_type IN ('jumlah','berat','volume','area','panjang','waktu','layanan','paket','umum')),
  business_types TEXT[] DEFAULT '{}',
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE unit_catalog DISABLE ROW LEVEL SECURITY;

-- 2) Invoice Templates
CREATE TABLE IF NOT EXISTS invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  paper_size TEXT,
  orientation TEXT DEFAULT 'portrait',
  business_types TEXT[] DEFAULT '{}',
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE invoice_templates DISABLE ROW LEVEL SECURITY;

-- 3) User Unit Preferences
CREATE TABLE IF NOT EXISTS business_unit_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES unit_catalog(id) ON DELETE CASCADE,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, unit_id)
);

ALTER TABLE business_unit_preferences DISABLE ROW LEVEL SECURITY;

-- 4) User Invoice Template Preferences
CREATE TABLE IF NOT EXISTS business_invoice_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES invoice_templates(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, template_id)
);

ALTER TABLE business_invoice_preferences DISABLE ROW LEVEL SECURITY;

-- 5) Indexes
CREATE INDEX IF NOT EXISTS idx_unit_catalog_active ON unit_catalog(is_active);
CREATE INDEX IF NOT EXISTS idx_invoice_templates_active ON invoice_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_business_unit_prefs_user ON business_unit_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_business_invoice_prefs_user ON business_invoice_preferences(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_unit_catalog_identity ON unit_catalog(name, symbol, unit_type, business_types);
CREATE UNIQUE INDEX IF NOT EXISTS uq_invoice_templates_identity ON invoice_templates(name, paper_size, business_types);

DO $$
BEGIN
  RAISE NOTICE '✅ Units & Invoice Templates Catalog created successfully';
END $$;
