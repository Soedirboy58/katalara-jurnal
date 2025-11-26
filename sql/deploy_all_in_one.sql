-- =====================================================
-- 🚀 ALL-IN-ONE DEPLOYMENT SCRIPT
-- =====================================================
-- Target: Fresh Supabase Database
-- URL: https://zhuxonyuksnhplxinikl.supabase.co
-- Date: 2024-11-26
-- 
-- INSTRUCTIONS:
-- 1. Open Supabase SQL Editor
-- 2. Copy this ENTIRE file
-- 3. Paste into SQL Editor
-- 4. Click "Run" (or press Ctrl+Enter)
-- 5. Wait ~30 seconds for completion
-- 
-- This script will create:
-- - CORE domain (2 tables)
-- - INVENTORY domain (2 tables)
-- - FINANCE domain (6 tables)
-- Total: 10 tables + all functions + RLS policies + indexes
-- =====================================================

-- =====================================================
-- PHASE 1: CORE DOMAIN
-- =====================================================

-- business_profiles table
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_type TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_id)
);

-- business_profiles RLS
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business profile"
  ON public.business_profiles FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own business profile"
  ON public.business_profiles FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own business profile"
  ON public.business_profiles FOR UPDATE
  USING (auth.uid() = owner_id);

-- onboarding_steps table
CREATE TABLE IF NOT EXISTS public.onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_id, step_name)
);

-- onboarding_steps RLS
ALTER TABLE public.onboarding_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding steps"
  ON public.onboarding_steps FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own onboarding steps"
  ON public.onboarding_steps FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own onboarding steps"
  ON public.onboarding_steps FOR UPDATE
  USING (auth.uid() = owner_id);

-- =====================================================
-- PHASE 2: INVENTORY DOMAIN
-- =====================================================

-- products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  unit TEXT DEFAULT 'pcs',
  price DECIMAL(15,2) DEFAULT 0,
  stock_quantity DECIMAL(15,2) DEFAULT 0,
  stock_unit TEXT DEFAULT 'pcs',
  buy_price DECIMAL(15,2) DEFAULT 0,
  sell_price DECIMAL(15,2) DEFAULT 0,
  min_stock DECIMAL(15,2) DEFAULT 0,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- products RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own products"
  ON public.products FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own products"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own products"
  ON public.products FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own products"
  ON public.products FOR DELETE
  USING (auth.uid() = owner_id);

-- product_stock_movements table
CREATE TABLE IF NOT EXISTS public.product_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity DECIMAL(15,2) NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  movement_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- product_stock_movements RLS
ALTER TABLE public.product_stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stock movements"
  ON public.product_stock_movements FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own stock movements"
  ON public.product_stock_movements FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- =====================================================
-- PHASE 3: FINANCE DOMAIN
-- =====================================================

-- customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- customers RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own customers"
  ON public.customers FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own customers"
  ON public.customers FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own customers"
  ON public.customers FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own customers"
  ON public.customers FOR DELETE
  USING (auth.uid() = owner_id);

-- suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- suppliers RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own suppliers"
  ON public.suppliers FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own suppliers"
  ON public.suppliers FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own suppliers"
  ON public.suppliers FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own suppliers"
  ON public.suppliers FOR DELETE
  USING (auth.uid() = owner_id);

-- incomes table
CREATE TABLE IF NOT EXISTS public.incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  income_type TEXT NOT NULL CHECK (income_type IN ('operating', 'investing', 'financing')),
  income_category TEXT NOT NULL,
  income_description TEXT,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  income_date DATE DEFAULT CURRENT_DATE,
  invoice_number TEXT,
  reference_number TEXT,
  subtotal DECIMAL(15,2) DEFAULT 0,
  discount_mode TEXT DEFAULT 'nominal' CHECK (discount_mode IN ('nominal', 'percent')),
  discount_value DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  ppn_enabled BOOLEAN DEFAULT false,
  ppn_rate DECIMAL(5,2) DEFAULT 11,
  ppn_amount DECIMAL(15,2) DEFAULT 0,
  pph_enabled BOOLEAN DEFAULT false,
  pph_type TEXT,
  pph_rate DECIMAL(5,2) DEFAULT 0,
  pph_amount DECIMAL(15,2) DEFAULT 0,
  other_fees DECIMAL(15,2) DEFAULT 0,
  grand_total DECIMAL(15,2) DEFAULT 0,
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'transfer', 'tempo')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  paid_amount DECIMAL(15,2) DEFAULT 0,
  remaining_payment DECIMAL(15,2) DEFAULT 0,
  payment_date DATE,
  due_date DATE,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- incomes RLS
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own incomes"
  ON public.incomes FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own incomes"
  ON public.incomes FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own incomes"
  ON public.incomes FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own incomes"
  ON public.incomes FOR DELETE
  USING (auth.uid() = owner_id);

-- income_items table
CREATE TABLE IF NOT EXISTS public.income_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  income_id UUID NOT NULL REFERENCES public.incomes(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  qty DECIMAL(15,2) NOT NULL,
  unit TEXT DEFAULT 'pcs',
  price_per_unit DECIMAL(15,2) NOT NULL,
  buy_price DECIMAL(15,2) DEFAULT 0,
  profit_per_unit DECIMAL(15,2) DEFAULT 0,
  subtotal DECIMAL(15,2) DEFAULT 0,
  total_profit DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- income_items RLS
ALTER TABLE public.income_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own income items"
  ON public.income_items FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own income items"
  ON public.income_items FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own income items"
  ON public.income_items FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own income items"
  ON public.income_items FOR DELETE
  USING (auth.uid() = owner_id);

-- expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expense_type TEXT NOT NULL CHECK (expense_type IN ('operating', 'investing', 'financing')),
  expense_category TEXT NOT NULL,
  expense_description TEXT,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT,
  expense_date DATE DEFAULT CURRENT_DATE,
  invoice_number TEXT,
  reference_number TEXT,
  subtotal DECIMAL(15,2) DEFAULT 0,
  discount_mode TEXT DEFAULT 'nominal' CHECK (discount_mode IN ('nominal', 'percent')),
  discount_value DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  ppn_enabled BOOLEAN DEFAULT false,
  ppn_rate DECIMAL(5,2) DEFAULT 11,
  ppn_amount DECIMAL(15,2) DEFAULT 0,
  other_fees DECIMAL(15,2) DEFAULT 0,
  grand_total DECIMAL(15,2) DEFAULT 0,
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'transfer', 'tempo')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  paid_amount DECIMAL(15,2) DEFAULT 0,
  remaining_payment DECIMAL(15,2) DEFAULT 0,
  payment_date DATE,
  due_date DATE,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- expenses RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own expenses"
  ON public.expenses FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own expenses"
  ON public.expenses FOR DELETE
  USING (auth.uid() = owner_id);

-- expense_items table
CREATE TABLE IF NOT EXISTS public.expense_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  qty DECIMAL(15,2) NOT NULL,
  unit TEXT DEFAULT 'pcs',
  price_per_unit DECIMAL(15,2) NOT NULL,
  subtotal DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- expense_items RLS
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expense items"
  ON public.expense_items FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own expense items"
  ON public.expense_items FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own expense items"
  ON public.expense_items FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own expense items"
  ON public.expense_items FOR DELETE
  USING (auth.uid() = owner_id);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_owner_id ON public.products(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- Stock movements indexes
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON public.product_stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_owner_id ON public.product_stock_movements(owner_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON public.product_stock_movements(movement_date);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_owner_id ON public.customers(owner_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON public.customers(is_active);

-- Suppliers indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_owner_id ON public.suppliers(owner_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_phone ON public.suppliers(phone);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON public.suppliers(is_active);

-- Incomes indexes
CREATE INDEX IF NOT EXISTS idx_incomes_owner_id ON public.incomes(owner_id);
CREATE INDEX IF NOT EXISTS idx_incomes_customer_id ON public.incomes(customer_id);
CREATE INDEX IF NOT EXISTS idx_incomes_date ON public.incomes(income_date);
CREATE INDEX IF NOT EXISTS idx_incomes_type ON public.incomes(income_type);
CREATE INDEX IF NOT EXISTS idx_incomes_payment_status ON public.incomes(payment_status);

-- Income items indexes
CREATE INDEX IF NOT EXISTS idx_income_items_income_id ON public.income_items(income_id);
CREATE INDEX IF NOT EXISTS idx_income_items_product_id ON public.income_items(product_id);

-- Expenses indexes
CREATE INDEX IF NOT EXISTS idx_expenses_owner_id ON public.expenses(owner_id);
CREATE INDEX IF NOT EXISTS idx_expenses_supplier_id ON public.expenses(supplier_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON public.expenses(expense_type);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_status ON public.expenses(payment_status);

-- Expense items indexes
CREATE INDEX IF NOT EXISTS idx_expense_items_expense_id ON public.expense_items(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_items_product_id ON public.expense_items(product_id);

-- =====================================================
-- ESSENTIAL FUNCTIONS
-- =====================================================

-- Function: Update product stock
CREATE OR REPLACE FUNCTION update_product_stock(
  p_product_id UUID,
  p_qty_change DECIMAL
)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity + p_qty_change,
      updated_at = now()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_business_profiles_updated_at
  BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incomes_updated_at
  BEFORE UPDATE ON public.incomes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ✅ DEPLOYMENT COMPLETE!
-- =====================================================

-- Verification query
SELECT 
  '✅ DEPLOYMENT SUCCESSFUL!' as status,
  COUNT(*) || ' tables created' as result
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

-- List all tables
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('business_profiles', 'onboarding_steps') THEN '🔵 CORE'
    WHEN table_name IN ('products', 'product_stock_movements') THEN '📦 INVENTORY'
    WHEN table_name IN ('customers', 'suppliers', 'incomes', 'income_items', 'expenses', 'expense_items') THEN '💰 FINANCE'
    ELSE '❓ OTHER'
  END as domain
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY domain, table_name;
