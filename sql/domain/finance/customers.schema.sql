-- =====================================================
-- DOMAIN: FINANCE
-- TABLE: customers
-- PURPOSE: Master data pelanggan untuk income tracking
-- =====================================================

-- =====================================================
-- TABLE: customers
-- Menyimpan data pelanggan/buyer untuk sales tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  name TEXT NOT NULL,
  code TEXT, -- Kode customer internal (opsional, e.g. CUST001)
  customer_type TEXT, -- 'individual', 'company', 'reseller', 'retail'
  
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
  tax_id TEXT, -- NPWP customer (untuk B2B)
  company_name TEXT, -- Nama perusahaan (jika berbeda dari name)
  
  -- Payment Terms
  default_payment_term_days INT DEFAULT 0, -- Default: 0=cash, 7, 14, 30, 60 hari
  credit_limit NUMERIC(15,2) DEFAULT 0, -- Limit piutang maksimal
  
  -- Financial Tracking
  total_purchases NUMERIC(15,2) DEFAULT 0, -- Total pembelian keseluruhan
  outstanding_balance NUMERIC(15,2) DEFAULT 0, -- Sisa piutang yang belum dibayar
  last_purchase_date DATE, -- Tanggal pembelian terakhir
  
  -- Customer Lifetime Value (CLV)
  lifetime_value NUMERIC(15,2) DEFAULT 0, -- Total profit dari customer ini
  average_order_value NUMERIC(15,2) DEFAULT 0, -- Rata-rata nilai transaksi
  purchase_frequency INT DEFAULT 0, -- Jumlah transaksi
  
  -- Loyalty & Segmentation
  tier TEXT, -- 'bronze', 'silver', 'gold', 'platinum'
  loyalty_points INT DEFAULT 0, -- Point reward
  tags TEXT[], -- Flexible tags: ['vip', 'wholesaler', etc]
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Notes & Preferences
  notes TEXT, -- Catatan internal
  preferred_payment_method TEXT, -- 'cash', 'transfer', 'tempo'
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================
COMMENT ON TABLE customers IS 'Master customer data for income tracking and receivables management';
COMMENT ON COLUMN customers.code IS 'Internal customer code for easy reference (e.g., CUST001, VIP-Jakarta-01)';
COMMENT ON COLUMN customers.customer_type IS 'Segmentation: individual, company, reseller, retail';
COMMENT ON COLUMN customers.default_payment_term_days IS 'Default credit terms: 0=cash, 7=weekly, 30=monthly';
COMMENT ON COLUMN customers.credit_limit IS 'Maximum outstanding balance allowed for this customer';
COMMENT ON COLUMN customers.outstanding_balance IS 'Current unpaid receivables - updated via trigger from incomes';
COMMENT ON COLUMN customers.total_purchases IS 'Lifetime total purchases - updated via trigger from incomes';
COMMENT ON COLUMN customers.lifetime_value IS 'Total profit generated from this customer';
COMMENT ON COLUMN customers.tier IS 'Loyalty tier based on total_purchases or lifetime_value';
COMMENT ON COLUMN customers.is_active IS 'FALSE = customer archived/inactive, won''t show in dropdowns';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Finance Domain - Customers Schema Created';
  RAISE NOTICE '   - Table: customers (master customer data)';
  RAISE NOTICE '   - Features: Contact info, payment terms, CLV tracking, loyalty tiers';
END $$;
