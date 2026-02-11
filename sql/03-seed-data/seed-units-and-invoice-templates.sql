-- =====================================================
-- SEED: Units & Invoice Templates (Default per business type)
-- =====================================================

-- Units: Dagang
INSERT INTO unit_catalog (name, symbol, unit_type, business_types, is_default)
VALUES
  ('Pcs', 'pcs', 'jumlah', ARRAY['dagang'], TRUE),
  ('Box', 'box', 'jumlah', ARRAY['dagang'], FALSE),
  ('Pack', 'pack', 'jumlah', ARRAY['dagang'], FALSE),
  ('Lusin', 'lusin', 'jumlah', ARRAY['dagang'], FALSE),
  ('Set', 'set', 'jumlah', ARRAY['dagang'], FALSE)
ON CONFLICT DO NOTHING;

-- Units: Produksi
INSERT INTO unit_catalog (name, symbol, unit_type, business_types, is_default)
VALUES
  ('Kilogram', 'kg', 'berat', ARRAY['produksi'], TRUE),
  ('Gram', 'g', 'berat', ARRAY['produksi'], FALSE),
  ('Liter', 'L', 'volume', ARRAY['produksi'], FALSE),
  ('Meter', 'm', 'panjang', ARRAY['produksi'], FALSE)
ON CONFLICT DO NOTHING;

-- Units: Jasa
INSERT INTO unit_catalog (name, symbol, unit_type, business_types, is_default)
VALUES
  ('Lumpsum', 'ls', 'layanan', ARRAY['jasa'], TRUE),
  ('Jam', 'jam', 'waktu', ARRAY['jasa'], FALSE),
  ('Sesi', 'sesi', 'layanan', ARRAY['jasa'], FALSE),
  ('Proyek', 'proyek', 'layanan', ARRAY['jasa'], FALSE)
ON CONFLICT DO NOTHING;

-- Shared units
INSERT INTO unit_catalog (name, symbol, unit_type, business_types, is_default)
VALUES
  ('Unit', 'unit', 'umum', ARRAY[]::TEXT[], FALSE),
  ('Paket', 'paket', 'paket', ARRAY[]::TEXT[], FALSE)
ON CONFLICT DO NOTHING;

-- Invoice Templates: Dagang
INSERT INTO invoice_templates (name, paper_size, orientation, business_types, is_default)
VALUES
  ('Struk Thermal 58mm', 'thermal58', 'portrait', ARRAY['dagang'], TRUE),
  ('Struk Thermal 80mm', 'thermal80', 'portrait', ARRAY['dagang'], FALSE),
  ('Invoice A6', 'A6', 'portrait', ARRAY['dagang'], FALSE)
ON CONFLICT DO NOTHING;

-- Invoice Templates: Produksi
INSERT INTO invoice_templates (name, paper_size, orientation, business_types, is_default)
VALUES
  ('Invoice A4', 'A4', 'portrait', ARRAY['produksi'], TRUE),
  ('Invoice A5', 'A5', 'portrait', ARRAY['produksi'], FALSE)
ON CONFLICT DO NOTHING;

-- Invoice Templates: Jasa
INSERT INTO invoice_templates (name, paper_size, orientation, business_types, is_default)
VALUES
  ('Invoice A4', 'A4', 'portrait', ARRAY['jasa'], TRUE),
  ('Invoice A5', 'A5', 'portrait', ARRAY['jasa'], FALSE)
ON CONFLICT DO NOTHING;

DO $$
BEGIN
  RAISE NOTICE '✅ Seeded unit_catalog and invoice_templates defaults';
END $$;
