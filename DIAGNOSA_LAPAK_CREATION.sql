-- DIAGNOSA MASALAH: BUAT LAPAK GAGAL & RESET DATA GAGAL
-- Jalankan query ini di Supabase SQL Editor untuk investigasi

-- ========================================
-- QUERY 1: Cek apakah kolom banner sudah ada
-- ========================================
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'business_storefronts'
  AND column_name IN ('banner_image_urls', 'banner_autoplay_ms', 'wa_status_templates')
ORDER BY column_name;

-- Expected: 
-- banner_image_urls | jsonb | NO | '[]'::jsonb
-- banner_autoplay_ms | integer | NO | 3500
-- wa_status_templates | jsonb | YES | NULL atau '[]'::jsonb


-- ========================================
-- QUERY 2: Cek constraint banner_autoplay_ms
-- ========================================
SELECT 
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'business_storefronts'
  AND con.conname LIKE '%banner%';

-- Expected:
-- business_storefronts_banner_autoplay_ms_check | CHECK ((banner_autoplay_ms >= 1200) AND (banner_autoplay_ms <= 10000))


-- ========================================
-- QUERY 3: Test INSERT lapak baru (SIMULATION)
-- ========================================
-- JANGAN JALANKAN INI JIKA TIDAK YAKIN!
-- Ini hanya untuk test apakah INSERT bisa berhasil
/*
BEGIN;

INSERT INTO business_storefronts (
  user_id,
  slug,
  store_name,
  description,
  whatsapp_number,
  theme_color,
  is_active,
  banner_image_urls,
  banner_autoplay_ms,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- Replace dengan user_id yang valid
  'test-lapak-diagnostic',
  'Test Lapak',
  'Diagnostic test',
  '081234567890',
  '#3B82F6',
  true,
  '[]'::jsonb,          -- Default empty array
  3500,                  -- Default autoplay
  NOW(),
  NOW()
);

-- Jika berhasil, hapus test data:
DELETE FROM business_storefronts 
WHERE slug = 'test-lapak-diagnostic';

ROLLBACK; -- Batalkan semua perubahan
*/


-- ========================================
-- QUERY 4: Cek error dari RLS policy
-- ========================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'business_storefronts'
ORDER BY policyname;

-- Pastikan ada policy untuk INSERT dengan user_id matching


-- ========================================
-- QUERY 5: Cek apakah ada lapak yang existing
-- ========================================
SELECT 
  id,
  user_id,
  slug,
  store_name,
  banner_image_urls,
  banner_autoplay_ms,
  wa_status_templates,
  created_at,
  updated_at
FROM business_storefronts
ORDER BY created_at DESC
LIMIT 5;


-- ========================================
-- QUERY 6: Cek storefront_orders untuk reset
-- ========================================
SELECT 
  COUNT(*) as total_orders,
  storefront_id,
  MIN(created_at) as oldest_order,
  MAX(created_at) as newest_order
FROM storefront_orders
GROUP BY storefront_id
ORDER BY total_orders DESC;

-- Jika COUNT > 0 tapi reset gagal = ada issue RLS atau permission


-- ========================================
-- QUERY 7: Cek storefront_analytics untuk reset
-- ========================================
SELECT 
  COUNT(*) as total_analytics,
  storefront_id,
  event_type,
  MIN(created_at) as oldest_event,
  MAX(created_at) as newest_event
FROM storefront_analytics
GROUP BY storefront_id, event_type
ORDER BY total_analytics DESC
LIMIT 10;


-- ========================================
-- LANGKAH TROUBLESHOOTING:
-- ========================================
-- 1. Jalankan Query 1: Pastikan kolom ada dan NOT NULL dengan default value
--    ❌ Jika kolom tidak ada = Migration 10 belum dijalankan
--    ❌ Jika is_nullable = YES untuk banner_image_urls = Migration salah
--
-- 2. Jalankan Query 2: Pastikan constraint banner_autoplay_ms ada
--    ❌ Jika constraint tidak ada = Migration 10 tidak lengkap
--
-- 3. Jalankan Query 4: Cek RLS policies
--    ❌ Jika tidak ada policy untuk INSERT = RLS blocking
--    ❌ Jika with_check terlalu strict = INSERT gagal verification
--
-- 4. Jalankan Query 5: Lihat existing storefronts
--    Bandingkan structure dengan expected columns
--
-- 5. Jalankan Query 6 & 7: Cek apakah ada orders/analytics
--    Jika ada data, tapi reset gagal = service-role key issue atau RLS
--
-- 6. JIKA RESET GAGAL dengan error "Gagal menghapus storefront_orders":
--    - Cek apakah service-role key valid di .env.local
--    - Cek console.error di Vercel logs untuk detail error
--
-- 7. JIKA BUAT LAPAK GAGAL:
--    a) Cek error detail di browser DevTools Console
--    b) Cek Vercel Function Logs untuk "[Media Sync]" atau error
--    c) Jika error: "column banner_image_urls does not exist"
--       → Jalankan Migration 10 di Supabase
--    d) Jika error: "new row violates check constraint"
--       → banner_autoplay_ms di luar range 1200-10000
--    e) Jika error: "new row violates row-level security"
--       → RLS policy blocking INSERT
