-- =====================================================
-- EXPENSE CLASSIFICATION SYSTEM
-- Support untuk 3 tipe transaksi: Operasional, Investasi, Pendanaan
-- Sesuai standar Laporan Arus Kas UMKM
-- =====================================================

-- Add expense classification columns
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS expense_type VARCHAR(20) DEFAULT 'operating',
ADD COLUMN IF NOT EXISTS asset_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_capital_expenditure BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS asset_useful_life_months INTEGER;

-- Add check constraint for expense_type
ALTER TABLE expenses
DROP CONSTRAINT IF EXISTS check_expense_type;

ALTER TABLE expenses
ADD CONSTRAINT check_expense_type 
CHECK (expense_type IN ('operating', 'investing', 'financing'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(expense_type);
CREATE INDEX IF NOT EXISTS idx_expenses_date_type ON expenses(expense_date, expense_type);

-- Add comments for documentation
COMMENT ON COLUMN expenses.expense_type IS 'Type of expense: operating (operational), investing (asset purchase), financing (capital/loan)';
COMMENT ON COLUMN expenses.asset_category IS 'Category for investment assets (e.g., equipment, vehicle, building)';
COMMENT ON COLUMN expenses.is_capital_expenditure IS 'True for asset purchases (CAPEX), false for operational expenses (OPEX)';
COMMENT ON COLUMN expenses.asset_useful_life_months IS 'Estimated useful life in months for depreciation calculation';

-- Migrate existing data to 'operating' type (already default)
UPDATE expenses 
SET expense_type = 'operating' 
WHERE expense_type IS NULL;

-- =====================================================
-- INVESTMENT CATEGORIES (for reference)
-- =====================================================
-- Categories for expense_type = 'investing':
-- - Pembelian Peralatan Kantor (Office equipment: AC, computer, printer)
-- - Pembelian Alat Produksi (Production equipment: machines, oven, mixer)
-- - Renovasi/Perbaikan Bangunan (Building renovation)
-- - Kendaraan Operasional (Operational vehicles)
-- - Peralatan Lainnya (Other equipment)

-- =====================================================
-- FINANCING CATEGORIES (for reference)
-- =====================================================
-- Categories for expense_type = 'financing':
-- - Setoran Modal (Capital injection)
-- - Pinjaman Bank/P2P (Loan receipts)
-- - Pembayaran Pokok Pinjaman (Principal payment)
-- - Pembayaran Bunga Pinjaman (Interest payment)
-- - Prive/Penarikan Pemilik (Owner withdrawal)
