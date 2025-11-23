-- =====================================================
-- QUICK FIX: Add missing columns to expenses table
-- =====================================================
-- Run this in Supabase SQL Editor immediately
-- Date: 2025-11-23
-- =====================================================

-- Add all missing columns for new expense input system
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS grand_total NUMERIC(15,2) DEFAULT 0;

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS po_number VARCHAR(50);

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS subtotal NUMERIC(15,2) DEFAULT 0;

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) DEFAULT 0;

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(15,2) DEFAULT 0;

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS other_fees NUMERIC(15,2) DEFAULT 0;

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(15,2) DEFAULT 0;

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS down_payment NUMERIC(15,2) DEFAULT 0;

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS remaining NUMERIC(15,2) DEFAULT 0;

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS remaining_payment NUMERIC(15,2) DEFAULT 0;

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'cash';

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS is_multi_items BOOLEAN DEFAULT FALSE;

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS supplier_id UUID;

-- Update existing expenses to set grand_total = amount (for backward compatibility)
UPDATE expenses 
SET grand_total = COALESCE(amount, 0)
WHERE grand_total = 0 OR grand_total IS NULL;

-- Verify columns added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'expenses' 
  AND column_name IN ('amount', 'po_number', 'subtotal', 'grand_total', 'discount_amount', 'other_fees', 'down_payment', 'remaining', 'remaining_payment', 'payment_type', 'is_multi_items', 'tax_amount')
ORDER BY ordinal_position;

-- Show sample data
SELECT 
  id,
  expense_date,
  category,
  po_number,
  amount,
  subtotal,
  discount_amount,
  other_fees,
  grand_total,
  payment_type,
  created_at
FROM expenses
ORDER BY created_at DESC
LIMIT 5;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ All missing columns added successfully!';
  RAISE NOTICE '  - grand_total';
  RAISE NOTICE '  - po_number';
  RAISE NOTICE '  - subtotal';
  RAISE NOTICE '  - discount_amount';
  RAISE NOTICE '  - tax_amount';
  RAISE NOTICE '  - other_fees';
  RAISE NOTICE '  - down_payment';
  RAISE NOTICE '  - remaining';
  RAISE NOTICE '  - remaining_payment';
  RAISE NOTICE '  - payment_type';
  RAISE NOTICE '  - is_multi_items';
  RAISE NOTICE '  - supplier_id';
  RAISE NOTICE '✅ Existing expenses migrated';
  RAISE NOTICE '✅ You can now save expenses from the app';
END $$;
