-- =====================================================
-- DOMAIN: FINANCE
-- TABLE: suppliers
-- PURPOSE: Master data supplier/vendor untuk expense tracking
-- =====================================================

-- =====================================================
-- TABLE: suppliers
-- Menyimpan data vendor/pemasok barang & jasa
-- =====================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  name TEXT NOT NULL,
  code TEXT, -- Kode supplier internal (opsional)
  category TEXT, -- Kategori: 'raw_materials', 'services', 'utilities', dll
  
  -- Contact Information
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  
  -- Location (Optional - for analytics)
  province TEXT,
  city TEXT,
  postal_code TEXT,
  
  -- Business Details
  tax_id TEXT, -- NPWP supplier
  business_type TEXT, -- 'individual', 'company', 'cooperative'
  
  -- Payment Terms
  default_payment_term_days INT DEFAULT 0, -- Default: 0, 7, 14, 30, 60 hari
  credit_limit NUMERIC(15,2) DEFAULT 0, -- Limit hutang maksimal
  
  -- Financial Tracking
  total_purchases NUMERIC(15,2) DEFAULT 0, -- Total pembelian keseluruhan
  outstanding_balance NUMERIC(15,2) DEFAULT 0, -- Sisa hutang yang belum dibayar
  last_purchase_date DATE, -- Tanggal pembelian terakhir
  
  -- Rating & Notes
  rating INT CHECK (rating >= 1 AND rating <= 5), -- Rating 1-5 bintang
  notes TEXT, -- Catatan internal tentang supplier
  tags TEXT[], -- Flexible tags: ['trusted', 'fast-delivery', etc]
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================
COMMENT ON TABLE suppliers IS 'Master supplier/vendor data for expense tracking and payables management';
COMMENT ON COLUMN suppliers.code IS 'Internal supplier code for easy reference (e.g., SUP001, VND-Jakarta-01)';
COMMENT ON COLUMN suppliers.default_payment_term_days IS 'Default credit terms: 0=cash, 7=weekly, 30=monthly, 60=2months';
COMMENT ON COLUMN suppliers.credit_limit IS 'Maximum outstanding balance allowed for this supplier';
COMMENT ON COLUMN suppliers.outstanding_balance IS 'Current unpaid balance - updated via trigger from expenses';
COMMENT ON COLUMN suppliers.total_purchases IS 'Lifetime total purchases - updated via trigger from expenses';
COMMENT ON COLUMN suppliers.is_active IS 'FALSE = supplier archived/inactive, won''t show in dropdowns';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Finance Domain - Suppliers Schema Created';
  RAISE NOTICE '   - Table: suppliers (master vendor data)';
  RAISE NOTICE '   - Features: Contact info, payment terms, credit limit, financial tracking';
END $$;
