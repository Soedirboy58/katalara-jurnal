-- ============================================
-- CREATE TABLE: incomes
-- Purpose: Store all income/revenue transactions
-- ============================================

-- Create incomes table
CREATE TABLE IF NOT EXISTS public.incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Transaction details
  income_date DATE NOT NULL,
  income_type VARCHAR(20) NOT NULL CHECK (income_type IN ('operating', 'investing', 'financing')),
  category VARCHAR(50) NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  
  -- Descriptions
  description TEXT,
  notes TEXT,
  
  -- Payment info
  payment_method VARCHAR(50) DEFAULT 'Tunai',
  payment_type VARCHAR(20) DEFAULT 'cash', -- 'cash', 'tempo_7', 'tempo_14', 'tempo_30', 'tempo_60', 'tempo_custom'
  payment_status VARCHAR(20) DEFAULT 'Lunas' CHECK (payment_status IN ('Lunas', 'Pending', 'Jatuh Tempo')),
  due_date DATE, -- For tempo/credit transactions
  
  -- Product/Service sales specific (if category = 'product_sales' or 'service_income')
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER CHECK (quantity > 0),
  price_per_unit DECIMAL(15,2) CHECK (price_per_unit > 0),
  service_duration INTEGER, -- Duration in minutes (for services)
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20), -- For WhatsApp sharing
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for performance
-- ============================================

CREATE INDEX idx_incomes_user_id ON public.incomes(user_id);
CREATE INDEX idx_incomes_income_date ON public.incomes(income_date DESC);
CREATE INDEX idx_incomes_income_type ON public.incomes(income_type);
CREATE INDEX idx_incomes_category ON public.incomes(category);
CREATE INDEX idx_incomes_product_id ON public.incomes(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_incomes_user_date ON public.incomes(user_id, income_date DESC);
CREATE INDEX idx_incomes_payment_status ON public.incomes(payment_status) WHERE payment_status != 'Lunas';
CREATE INDEX idx_incomes_due_date ON public.incomes(due_date) WHERE due_date IS NOT NULL;

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_incomes_updated_at
  BEFORE UPDATE ON public.incomes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own incomes
CREATE POLICY "Users can view their own incomes"
  ON public.incomes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own incomes
CREATE POLICY "Users can insert their own incomes"
  ON public.incomes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own incomes
CREATE POLICY "Users can update their own incomes"
  ON public.incomes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own incomes
CREATE POLICY "Users can delete their own incomes"
  ON public.incomes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- COMMENTS for documentation
-- ============================================

COMMENT ON TABLE public.incomes IS 'All income/revenue transactions including product sales, services, investments, and capital injections';
COMMENT ON COLUMN public.incomes.income_type IS 'Type of transaction: operating (business revenue), investing (investment income), financing (capital/loans)';
COMMENT ON COLUMN public.incomes.category IS 'Specific category like product_sales, service_income, interest_income, capital_injection, etc';
COMMENT ON COLUMN public.incomes.product_id IS 'Link to product if category is product_sales';
COMMENT ON COLUMN public.incomes.quantity IS 'Number of units sold (for product_sales)';
COMMENT ON COLUMN public.incomes.price_per_unit IS 'Selling price per unit (for product_sales)';
COMMENT ON COLUMN public.incomes.customer_name IS 'Customer name for product_sales (optional)';

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Example: Product sale
-- INSERT INTO public.incomes (user_id, income_date, income_type, category, amount, product_id, quantity, price_per_unit, customer_name, payment_method, description)
-- VALUES (
--   'YOUR_USER_ID',
--   '2025-11-22',
--   'operating',
--   'product_sales',
--   150000,
--   'PRODUCT_ID',
--   10,
--   15000,
--   'John Doe',
--   'Tunai',
--   'Jual 10 unit produk A'
-- );

-- Example: Service income
-- INSERT INTO public.incomes (user_id, income_date, income_type, category, amount, payment_method, description)
-- VALUES (
--   'YOUR_USER_ID',
--   '2025-11-22',
--   'operating',
--   'service_income',
--   500000,
--   'Transfer Bank',
--   'Jasa konsultasi bisnis'
-- );

-- Example: Capital injection
-- INSERT INTO public.incomes (user_id, income_date, income_type, category, amount, payment_method, description)
-- VALUES (
--   'YOUR_USER_ID',
--   '2025-11-22',
--   'financing',
--   'capital_injection',
--   10000000,
--   'Tunai',
--   'Setor modal dari tabungan pribadi'
-- );

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check table structure
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'incomes'
-- ORDER BY ordinal_position;

-- Check indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'incomes';

-- Check RLS policies
-- SELECT policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'incomes';

-- ============================================
-- END OF MIGRATION
-- ============================================
