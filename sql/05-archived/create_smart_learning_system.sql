-- ============================================================================
-- SMART RECIPE LEARNING SYSTEM - Batch Purchase with Auto-Learning
-- ============================================================================
-- User belanja batch → Input total + output porsi → Sistem belajar pattern
-- ============================================================================

-- 1. BATCH PURCHASES TABLE (Belanja Sekali Jalan)
-- ============================================================================
CREATE TABLE IF NOT EXISTS batch_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Purchase Information
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_amount DECIMAL(15, 2) NOT NULL,
  vendor_name TEXT, -- Nama pasar/supplier
  notes TEXT, -- Catatan: "Beli beras 5kg, telur 2kg, mie 4 bungkus"
  receipt_photo_url TEXT, -- URL foto nota (optional)
  
  -- Learning Data
  total_portions_produced INTEGER, -- Total porsi dari semua produk
  avg_cost_per_portion DECIMAL(15, 2), -- Rata-rata cost per porsi
  is_learned BOOLEAN DEFAULT false, -- Sudah dipelajari sistem
  confidence_score DECIMAL(5, 2) DEFAULT 0, -- 0-100, confidence pattern
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. BATCH PURCHASE OUTPUTS (Output Produksi dari Belanja Batch)
-- ============================================================================
CREATE TABLE IF NOT EXISTS batch_purchase_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_purchase_id UUID NOT NULL REFERENCES batch_purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Production Planning
  portions_planned INTEGER NOT NULL, -- Berapa porsi yang direncanakan
  cost_per_portion DECIMAL(15, 2) NOT NULL, -- Cost per porsi (calculated)
  portion_percentage DECIMAL(5, 2), -- % dari total belanja
  total_cost DECIMAL(15, 2), -- Total cost untuk produk ini
  
  -- Actual Results (Tracking)
  actual_portions_sold INTEGER DEFAULT 0, -- Aktual terjual
  waste_portions INTEGER DEFAULT 0, -- Sisa tidak terjual
  waste_value DECIMAL(15, 2) DEFAULT 0, -- Nilai waste
  
  -- Adjusted Cost (After actual sales)
  adjusted_cost_per_portion DECIMAL(15, 2), -- Cost setelah adjust dengan waste
  is_adjusted BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. LEARNED PATTERNS (Pattern yang Dipelajari Sistem)
-- ============================================================================
CREATE TABLE IF NOT EXISTS learned_purchase_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Pattern Characteristics
  typical_amount_min DECIMAL(15, 2) NOT NULL, -- Range min (e.g., Rp 450k)
  typical_amount_max DECIMAL(15, 2) NOT NULL, -- Range max (e.g., Rp 550k)
  typical_amount_avg DECIMAL(15, 2) NOT NULL, -- Average (e.g., Rp 500k)
  
  -- Expected Outputs (JSON array)
  expected_outputs JSONB NOT NULL,
  -- Format: [
  --   { "product_id": "uuid", "product_name": "Nasi Goreng", "avg_portions": 68, "std_dev": 5 },
  --   { "product_id": "uuid", "product_name": "Mie Goreng", "avg_portions": 32, "std_dev": 3 }
  -- ]
  
  -- Statistics
  sample_size INTEGER NOT NULL, -- Jumlah data belanja yang dipelajari
  confidence_score DECIMAL(5, 2) NOT NULL, -- 0-100
  last_occurrence DATE, -- Terakhir belanja dengan pattern ini
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. WASTE TRACKING (Track Sisa Produk)
-- ============================================================================
CREATE TABLE IF NOT EXISTS waste_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  batch_output_id UUID REFERENCES batch_purchase_outputs(id) ON DELETE SET NULL,
  
  -- Waste Details
  waste_date DATE NOT NULL DEFAULT CURRENT_DATE,
  portions_wasted INTEGER NOT NULL,
  cost_per_portion DECIMAL(15, 2) NOT NULL,
  total_waste_value DECIMAL(15, 2) NOT NULL,
  
  -- Analysis
  waste_percentage DECIMAL(5, 2), -- % dari total produksi
  waste_reason TEXT, -- "Expired", "Quality issue", "Overproduction"
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. MARKET PRICE HISTORY (Track Perubahan Harga Pasar)
-- ============================================================================
CREATE TABLE IF NOT EXISTS market_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Price Data
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_purchase_amount DECIMAL(15, 2) NOT NULL,
  typical_output_portions INTEGER NOT NULL, -- Total porsi normal
  cost_per_portion DECIMAL(15, 2) NOT NULL,
  
  -- Trend Analysis
  price_change_percentage DECIMAL(5, 2), -- % vs average
  is_above_average BOOLEAN,
  is_below_average BOOLEAN,
  
  notes TEXT, -- "Harga telur naik", "Promo beras"
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. INDEXES untuk Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_batch_purchases_user ON batch_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_purchases_date ON batch_purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_batch_purchases_learned ON batch_purchases(is_learned);

CREATE INDEX IF NOT EXISTS idx_batch_outputs_batch ON batch_purchase_outputs(batch_purchase_id);
CREATE INDEX IF NOT EXISTS idx_batch_outputs_product ON batch_purchase_outputs(product_id);

CREATE INDEX IF NOT EXISTS idx_learned_patterns_user ON learned_purchase_patterns(user_id);

CREATE INDEX IF NOT EXISTS idx_waste_logs_user ON waste_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_waste_logs_product ON waste_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_waste_logs_date ON waste_logs(waste_date);

CREATE INDEX IF NOT EXISTS idx_market_price_user ON market_price_history(user_id);
CREATE INDEX IF NOT EXISTS idx_market_price_date ON market_price_history(record_date);

-- 7. TRIGGERS untuk Auto-Update
-- ============================================================================

-- Trigger: Auto-calculate total portions and avg cost
CREATE OR REPLACE FUNCTION calculate_batch_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total portions from outputs
  UPDATE batch_purchases
  SET 
    total_portions_produced = (
      SELECT COALESCE(SUM(portions_planned), 0)
      FROM batch_purchase_outputs
      WHERE batch_purchase_id = NEW.batch_purchase_id
    ),
    avg_cost_per_portion = (
      SELECT bp.total_amount / NULLIF(SUM(bpo.portions_planned), 0)
      FROM batch_purchases bp
      LEFT JOIN batch_purchase_outputs bpo ON bpo.batch_purchase_id = bp.id
      WHERE bp.id = NEW.batch_purchase_id
      GROUP BY bp.id, bp.total_amount
    )
  WHERE id = NEW.batch_purchase_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_batch_totals ON batch_purchase_outputs;
CREATE TRIGGER trigger_calculate_batch_totals
  AFTER INSERT OR UPDATE ON batch_purchase_outputs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_batch_totals();

-- Trigger: Auto-update product buy_price with latest cost
CREATE OR REPLACE FUNCTION update_product_buy_price()
RETURNS TRIGGER AS $$
BEGIN
  -- Update product buy_price dengan cost terbaru
  UPDATE products
  SET 
    buy_price = NEW.cost_per_portion,
    updated_at = NOW()
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_buy_price ON batch_purchase_outputs;
CREATE TRIGGER trigger_update_product_buy_price
  AFTER INSERT OR UPDATE ON batch_purchase_outputs
  FOR EACH ROW
  EXECUTE FUNCTION update_product_buy_price();

-- 8. HELPER FUNCTIONS
-- ============================================================================

-- Function: Get suggested next purchase based on patterns
CREATE OR REPLACE FUNCTION get_purchase_suggestion(p_user_id UUID)
RETURNS TABLE(
  suggested_amount DECIMAL,
  expected_products JSONB,
  confidence DECIMAL,
  message TEXT
) AS $$
DECLARE
  pattern RECORD;
BEGIN
  -- Get most confident pattern
  SELECT * INTO pattern
  FROM learned_purchase_patterns
  WHERE user_id = p_user_id
  ORDER BY confidence_score DESC, sample_size DESC
  LIMIT 1;
  
  IF pattern IS NULL THEN
    RETURN QUERY SELECT 
      0::DECIMAL,
      '[]'::JSONB,
      0::DECIMAL,
      'Belum ada data belanja. Input belanja pertama untuk mulai belajar!'::TEXT;
  ELSE
    RETURN QUERY SELECT
      pattern.typical_amount_avg,
      pattern.expected_outputs,
      pattern.confidence_score,
      format('Biasanya Rp %s menghasilkan produksi dari %s data belanja',
        pattern.typical_amount_avg::TEXT,
        pattern.sample_size::TEXT
      )::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate waste percentage
CREATE OR REPLACE FUNCTION calculate_waste_stats(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  product_id UUID,
  product_name TEXT,
  total_produced INTEGER,
  total_sold INTEGER,
  total_waste INTEGER,
  waste_percentage DECIMAL,
  waste_value DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bpo.product_id,
    p.name AS product_name,
    SUM(bpo.portions_planned)::INTEGER AS total_produced,
    SUM(bpo.actual_portions_sold)::INTEGER AS total_sold,
    SUM(bpo.waste_portions)::INTEGER AS total_waste,
    (SUM(bpo.waste_portions)::DECIMAL / NULLIF(SUM(bpo.portions_planned), 0) * 100)::DECIMAL(5,2) AS waste_percentage,
    SUM(bpo.waste_value)::DECIMAL AS waste_value
  FROM batch_purchase_outputs bpo
  JOIN batch_purchases bp ON bp.id = bpo.batch_purchase_id
  JOIN products p ON p.id = bpo.product_id
  WHERE bp.user_id = p_user_id
    AND bp.purchase_date BETWEEN p_start_date AND p_end_date
  GROUP BY bpo.product_id, p.name
  ORDER BY waste_percentage DESC;
END;
$$ LANGUAGE plpgsql;

-- 9. RLS POLICIES
-- ============================================================================

ALTER TABLE batch_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_purchase_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE learned_purchase_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_price_history ENABLE ROW LEVEL SECURITY;

-- Batch Purchases
DROP POLICY IF EXISTS "Users manage own batch purchases" ON batch_purchases;
CREATE POLICY "Users manage own batch purchases" ON batch_purchases
  FOR ALL USING (auth.uid() = user_id);

-- Batch Outputs
DROP POLICY IF EXISTS "Users manage own batch outputs" ON batch_purchase_outputs;
CREATE POLICY "Users manage own batch outputs" ON batch_purchase_outputs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM batch_purchases 
      WHERE id = batch_purchase_outputs.batch_purchase_id 
      AND user_id = auth.uid()
    )
  );

-- Learned Patterns
DROP POLICY IF EXISTS "Users view own patterns" ON learned_purchase_patterns;
CREATE POLICY "Users view own patterns" ON learned_purchase_patterns
  FOR ALL USING (auth.uid() = user_id);

-- Waste Logs
DROP POLICY IF EXISTS "Users manage own waste logs" ON waste_logs;
CREATE POLICY "Users manage own waste logs" ON waste_logs
  FOR ALL USING (auth.uid() = user_id);

-- Market Price History
DROP POLICY IF EXISTS "Users manage own price history" ON market_price_history;
CREATE POLICY "Users manage own price history" ON market_price_history
  FOR ALL USING (auth.uid() = user_id);

-- 10. COMMENTS
-- ============================================================================

COMMENT ON TABLE batch_purchases IS 'User belanja batch bahan baku sekali jalan';
COMMENT ON TABLE batch_purchase_outputs IS 'Output produksi yang dihasilkan dari batch purchase';
COMMENT ON TABLE learned_purchase_patterns IS 'Pattern belanja yang dipelajari sistem (ML)';
COMMENT ON TABLE waste_logs IS 'Log sisa produk yang tidak terjual (waste tracking)';
COMMENT ON TABLE market_price_history IS 'History perubahan harga pasar untuk trend analysis';

COMMENT ON COLUMN batch_purchases.confidence_score IS 'Confidence level pattern (0-100), naik setiap belanja';
COMMENT ON COLUMN batch_purchase_outputs.adjusted_cost_per_portion IS 'Cost adjusted setelah actual sales (include waste)';
COMMENT ON COLUMN learned_purchase_patterns.expected_outputs IS 'JSON array expected products dengan avg portions';
