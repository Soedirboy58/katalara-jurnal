-- ============================================================================
-- UNIVERSAL BUSINESS SYSTEM - Support All Business Types
-- ============================================================================
-- Supports: Manufacturing, F&B, Service, Trading, Education, Rental, etc.
-- ============================================================================

-- 1. BUSINESS ITEM CATEGORIES (Super Flexible)
-- ============================================================================
-- Replaces rigid "product" concept with flexible "business_items"

CREATE TYPE item_category AS ENUM (
  'raw_material',      -- Bahan baku (beras, telur, kain)
  'finished_product',  -- Produk jadi (nasi goreng, baju jadi)
  'service',           -- Jasa (konsultasi, training, repair)
  'package',           -- Paket bundling (training + sertifikat)
  'time_slot',         -- Slot waktu (rental meeting room per jam)
  'subscription',      -- Langganan (membership bulanan)
  'digital_product',   -- Produk digital (ebook, software license)
  'trading_goods',     -- Barang dagang (beli-jual tanpa proses)
  'project',           -- Project-based (website development)
  'rental_item'        -- Barang sewa (kamera, mobil)
);

CREATE TYPE business_type AS ENUM (
  'manufacturing',     -- Produksi barang (pabrik, kerajinan)
  'food_beverage',     -- F&B (warung, resto, catering)
  'retail',            -- Ritel (toko kelontong, fashion store)
  'service',           -- Service (salon, bengkel, konsultan)
  'trading',           -- Perdagangan (export/import, calo)
  'education',         -- Edukasi (kursus, training, bimbel)
  'rental',            -- Sewa/rental (properti, alat, kendaraan)
  'digital',           -- Digital business (SaaS, content creator)
  'project_based',     -- Project-based (konstruksi, software dev)
  'mixed'              -- Campuran (multi-bisnis)
);

-- 2. Extend products table menjadi universal "business_items"
-- ============================================================================
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS item_category item_category DEFAULT 'finished_product';

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS business_type business_type DEFAULT 'retail';

-- Flags untuk berbagai bisnis model
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_raw_material BOOLEAN DEFAULT false; -- Bahan baku

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS has_recipe BOOLEAN DEFAULT false; -- Punya resep/formula

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_service BOOLEAN DEFAULT false; -- Item jasa (tidak punya stok fisik)

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_time_based BOOLEAN DEFAULT false; -- Berbasis waktu (per jam/hari)

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_rental BOOLEAN DEFAULT false; -- Item sewa

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_project_based BOOLEAN DEFAULT false; -- Project custom

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS auto_deduct_ingredients BOOLEAN DEFAULT true; -- Auto kurangi bahan

-- Service & Time-based specific fields
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER; -- Durasi service (misal: 60 menit)

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS service_capacity INTEGER; -- Kapasitas per slot (misal: 10 orang)

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(15, 2); -- Rate per jam

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS daily_rate DECIMAL(15, 2); -- Rate per hari

-- Project-based specific fields
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_quotation_based BOOLEAN DEFAULT false; -- Harga custom per project

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS estimated_days INTEGER; -- Estimasi durasi project

-- Rental specific fields
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS rental_deposit DECIMAL(15, 2); -- Deposit sewa

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS max_rental_days INTEGER; -- Max durasi sewa

-- 3. RECIPE/FORMULA SYSTEM (Universal untuk semua produksi)
-- ============================================================================
-- Bisa untuk: Manufacturing, F&B, Service Package, dll

CREATE TABLE IF NOT EXISTS business_item_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Output item (finished product/service/package)
  output_item_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  output_quantity DECIMAL(10, 2) DEFAULT 1, -- Berapa unit output per batch
  
  -- Input item (raw material/component/resource)
  input_item_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  input_quantity DECIMAL(10, 2) NOT NULL, -- Berapa qty input dibutuhkan
  input_unit TEXT NOT NULL,
  
  -- Costing
  is_fixed_cost BOOLEAN DEFAULT false, -- True jika biaya tetap (tidak scale dengan qty)
  cost_per_unit DECIMAL(15, 2), -- Override cost (optional)
  
  -- Meta
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(output_item_id, input_item_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recipes_output ON business_item_recipes(output_item_id);
CREATE INDEX IF NOT EXISTS idx_recipes_input ON business_item_recipes(input_item_id);
CREATE INDEX IF NOT EXISTS idx_recipes_user ON business_item_recipes(user_id);

-- 4. SERVICE RESOURCES (Untuk bisnis jasa)
-- ============================================================================
-- Track resources yang dipakai untuk deliver service
-- Contoh: Training butuh trainer (labor) + ruangan (facility) + modul (material)

CREATE TYPE resource_type AS ENUM (
  'labor',           -- Tenaga kerja (trainer, teknisi, designer)
  'facility',        -- Fasilitas (ruang meeting, studio, bengkel)
  'equipment',       -- Peralatan (kamera, laptop, mesin)
  'material',        -- Material habis pakai (kertas, tinta, bahan kimia)
  'license',         -- License/subscription (software, platform)
  'overhead'         -- Overhead (listrik, internet, maintenance)
);

CREATE TABLE IF NOT EXISTS service_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Service item yang butuh resource ini
  service_item_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Resource details
  resource_type resource_type NOT NULL,
  resource_name TEXT NOT NULL,
  
  -- Costing
  cost_per_unit DECIMAL(15, 2) NOT NULL,
  unit TEXT NOT NULL, -- "jam", "hari", "session", "orang"
  quantity_needed DECIMAL(10, 2) NOT NULL, -- Qty resource per 1x service
  
  -- Availability (optional)
  is_limited BOOLEAN DEFAULT false, -- True jika resource terbatas
  total_capacity INTEGER, -- Max capacity
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_resources_service ON service_resources(service_item_id);
CREATE INDEX IF NOT EXISTS idx_service_resources_type ON service_resources(resource_type);

-- 5. PROJECT MILESTONES (Untuk project-based business)
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  
  milestone_name TEXT NOT NULL,
  milestone_order INTEGER NOT NULL, -- 1, 2, 3, dst
  
  -- Payment
  payment_percentage DECIMAL(5, 2) NOT NULL, -- % dari total project value
  payment_amount DECIMAL(15, 2) NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  paid_date TIMESTAMP WITH TIME ZONE,
  
  -- Deliverables
  deliverable_description TEXT,
  is_completed BOOLEAN DEFAULT false,
  completed_date TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestones_transaction ON project_milestones(transaction_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user ON project_milestones(user_id);

-- 6. RENTAL TRACKING (Untuk rental business)
-- ============================================================================

CREATE TABLE IF NOT EXISTS rental_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  
  -- Item yang disewa
  rental_item_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  
  -- Period
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_return_date TIMESTAMP WITH TIME ZONE,
  
  -- Pricing
  rate_per_day DECIMAL(15, 2) NOT NULL,
  total_days INTEGER NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  deposit_amount DECIMAL(15, 2),
  deposit_returned BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT CHECK (status IN ('active', 'returned', 'overdue', 'cancelled')) DEFAULT 'active',
  condition_notes TEXT, -- Kondisi saat return
  late_fee DECIMAL(15, 2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rental_sessions_item ON rental_sessions(rental_item_id);
CREATE INDEX IF NOT EXISTS idx_rental_sessions_status ON rental_sessions(status);
CREATE INDEX IF NOT EXISTS idx_rental_sessions_transaction ON rental_sessions(transaction_id);

-- 7. TIME SLOTS BOOKING (Untuk service berbasis waktu)
-- ============================================================================

CREATE TABLE IF NOT EXISTS time_slot_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  
  -- Service item
  service_item_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Booking time
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  
  -- Capacity
  booked_capacity INTEGER NOT NULL DEFAULT 1, -- Jumlah orang/unit yang booking
  
  -- Status
  status TEXT CHECK (status IN ('confirmed', 'completed', 'cancelled', 'no_show')) DEFAULT 'confirmed',
  
  -- Customer info (optional, bisa link ke customers table)
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_service ON time_slot_bookings(service_item_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON time_slot_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON time_slot_bookings(status);

-- 8. RLS POLICIES
-- ============================================================================

-- Recipes
ALTER TABLE business_item_recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own recipes" ON business_item_recipes FOR ALL USING (auth.uid() = user_id);

-- Service Resources
ALTER TABLE service_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own service resources" ON service_resources FOR ALL USING (auth.uid() = user_id);

-- Project Milestones
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own project milestones" ON project_milestones FOR ALL USING (auth.uid() = user_id);

-- Rental Sessions
ALTER TABLE rental_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own rental sessions" ON rental_sessions FOR ALL USING (auth.uid() = user_id);

-- Time Slot Bookings
ALTER TABLE time_slot_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own bookings" ON time_slot_bookings FOR ALL USING (auth.uid() = user_id);

-- 9. HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate total ingredient cost for a recipe
CREATE OR REPLACE FUNCTION get_recipe_total_cost(p_output_item_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_cost DECIMAL := 0;
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN r.cost_per_unit IS NOT NULL THEN r.cost_per_unit * r.input_quantity
      ELSE p.buy_price * r.input_quantity
    END
  ), 0)
  INTO total_cost
  FROM business_item_recipes r
  JOIN products p ON p.id = r.input_item_id
  WHERE r.output_item_id = p_output_item_id;
  
  RETURN total_cost;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate service resource cost
CREATE OR REPLACE FUNCTION get_service_resource_cost(p_service_item_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_cost DECIMAL := 0;
BEGIN
  SELECT COALESCE(SUM(cost_per_unit * quantity_needed), 0)
  INTO total_cost
  FROM service_resources
  WHERE service_item_id = p_service_item_id;
  
  RETURN total_cost;
END;
$$ LANGUAGE plpgsql;

-- 10. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE business_item_recipes IS 'Universal recipe/formula system for any production process';
COMMENT ON TABLE service_resources IS 'Resources required to deliver a service (labor, facility, material, etc)';
COMMENT ON TABLE project_milestones IS 'Track milestone payments for project-based business';
COMMENT ON TABLE rental_sessions IS 'Track rental periods and returns for rental business';
COMMENT ON TABLE time_slot_bookings IS 'Time-based booking system for services';

COMMENT ON COLUMN products.item_category IS 'Type of business item (raw_material, finished_product, service, etc)';
COMMENT ON COLUMN products.business_type IS 'Business model using this item (manufacturing, service, trading, etc)';
COMMENT ON COLUMN products.is_service IS 'True if this is a service item (no physical stock)';
COMMENT ON COLUMN products.is_time_based IS 'True if pricing is based on time (hourly/daily)';
COMMENT ON COLUMN products.is_rental IS 'True if this item is for rental';
COMMENT ON COLUMN products.is_project_based IS 'True if this is sold as custom project';
