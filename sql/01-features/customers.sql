-- ============================================
-- CUSTOMERS TABLE
-- Purpose: Store customer information for sales tracking
-- Use cases: Invoice generation, customer history, follow-up
-- ============================================

-- Drop function first (to avoid deadlock)
DROP FUNCTION IF EXISTS generate_customer_number(UUID);

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can insert their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON public.customers;

-- Drop trigger
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;

-- Drop table with CASCADE
DROP TABLE IF EXISTS public.customers CASCADE;

CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  customer_number VARCHAR(50) UNIQUE, -- Auto-generated: CUST-001, CUST-002, etc
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  
  -- Business Info
  company_name VARCHAR(255),
  tax_id VARCHAR(50), -- NPWP for Indonesia
  
  -- Stats
  total_transactions INTEGER DEFAULT 0,
  total_spent DECIMAL(15,2) DEFAULT 0,
  last_transaction_date TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_customers_owner_id ON public.customers(owner_id);
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_customers_email ON public.customers(email);
CREATE INDEX idx_customers_customer_number ON public.customers(customer_number);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own customers"
  ON public.customers
  FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own customers"
  ON public.customers
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own customers"
  ON public.customers
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own customers"
  ON public.customers
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Generate customer number
CREATE OR REPLACE FUNCTION generate_customer_number(user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  next_number INTEGER;
  new_customer_number VARCHAR(50);
BEGIN
  -- Get the highest customer number for this user
  SELECT COALESCE(MAX(CAST(SUBSTRING(c.customer_number FROM 'CUST-([0-9]+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.customers c
  WHERE c.owner_id = user_id;
  
  -- Format as CUST-001, CUST-002, etc
  new_customer_number := 'CUST-' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN new_customer_number;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE public.customers IS 'Customer database for sales tracking and follow-up';
COMMENT ON COLUMN public.customers.customer_number IS 'Auto-generated unique customer ID (CUST-001, CUST-002, etc)';
COMMENT ON COLUMN public.customers.total_transactions IS 'Count of all transactions for this customer';
COMMENT ON COLUMN public.customers.total_spent IS 'Total amount spent by this customer';

-- ============================================
-- ADD customer_id to incomes table
-- ============================================
ALTER TABLE public.incomes 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_incomes_customer_id ON public.incomes(customer_id);

COMMENT ON COLUMN public.incomes.customer_id IS 'Reference to customers table for tracking customer transactions';

-- ============================================
-- END OF MIGRATION
-- ============================================
