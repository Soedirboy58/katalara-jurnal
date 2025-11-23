-- ============================================
-- ADD MULTI-ITEMS COLUMNS TO INCOMES TABLE
-- Purpose: Support professional invoicing with line items, taxes, discounts
-- ============================================

ALTER TABLE public.incomes 
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'Lunas',
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS service_duration INTEGER,
ADD COLUMN IF NOT EXISTS line_items JSONB,
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS discount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_ppn DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_pph DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_fees DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS down_payment DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining DECIMAL(15,2);

-- Comments
COMMENT ON COLUMN public.incomes.payment_type IS 'cash or tempo';
COMMENT ON COLUMN public.incomes.payment_status IS 'Lunas, Pending, or Overdue';
COMMENT ON COLUMN public.incomes.due_date IS 'Due date for tempo payments';
COMMENT ON COLUMN public.incomes.service_duration IS 'Service duration in minutes';
COMMENT ON COLUMN public.incomes.line_items IS 'JSON array of invoice line items (product, qty, price, subtotal)';
COMMENT ON COLUMN public.incomes.subtotal IS 'Subtotal before discounts and taxes';
COMMENT ON COLUMN public.incomes.discount IS 'Total discount amount';
COMMENT ON COLUMN public.incomes.tax_ppn IS 'PPN tax amount (11%)';
COMMENT ON COLUMN public.incomes.tax_pph IS 'PPh tax amount (custom)';
COMMENT ON COLUMN public.incomes.other_fees IS 'Other fees (shipping, etc)';
COMMENT ON COLUMN public.incomes.down_payment IS 'Down payment / uang muka';
COMMENT ON COLUMN public.incomes.remaining IS 'Remaining amount to be paid';

-- ============================================
-- END OF MIGRATION
-- ============================================
