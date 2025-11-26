-- =====================================================
-- DOMAIN: INVENTORY
-- TABLE: product_stock_movements
-- PURPOSE: Histori pergerakan stok produk (in/out/adjust)
-- =====================================================

-- =====================================================
-- TABLE: product_stock_movements
-- Mencatat setiap perubahan stok produk
-- =====================================================
CREATE TABLE IF NOT EXISTS product_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Movement Details
  quantity INTEGER NOT NULL, -- Positif/negatif tergantung movement_type
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjust')),
  
  -- Reference (optional - link ke transaksi lain)
  reference_type TEXT, -- 'income', 'expense', 'manual', 'adjustment', 'return'
  reference_id UUID, -- ID dari income/expense yang terkait
  
  -- Notes
  note TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================
COMMENT ON TABLE product_stock_movements IS 'Histori pergerakan stok produk - append-only log (tidak boleh di-edit/hapus)';
COMMENT ON COLUMN product_stock_movements.quantity IS 'Jumlah pergerakan - selalu positif, arah ditentukan oleh movement_type';
COMMENT ON COLUMN product_stock_movements.movement_type IS 'in = stok masuk | out = stok keluar | adjust = penyesuaian manual';
COMMENT ON COLUMN product_stock_movements.reference_type IS 'Jenis transaksi: income (penjualan), expense (pembelian), manual, adjustment, return';
COMMENT ON COLUMN product_stock_movements.reference_id IS 'ID dari income/expense yang terkait (jika ada)';
COMMENT ON COLUMN product_stock_movements.note IS 'Catatan optional: alasan adjustment, supplier, customer, dll';

-- =====================================================
-- BASIC INDEXES (Performance essentials)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON product_stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON product_stock_movements(created_at DESC);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Inventory Domain - Product Stock Movements Schema Created';
  RAISE NOTICE '   - Table: product_stock_movements (append-only log)';
  RAISE NOTICE '   - Features: in/out/adjust tracking, reference linking, notes';
END $$;
