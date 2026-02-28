-- ============================================================================
-- DEBUG SCRIPT: Check If Orders Are Really Deleted After Reset
-- Jalankan di Supabase SQL Editor untuk diagnosa masalah order muncul lagi
-- ============================================================================

-- 1. Cek apakah ada orders yang tersisa setelah reset
SELECT 
  COUNT(*) as total_orders_in_db,
  storefront_id,
  MAX(created_at) as newest_order,
  MIN(created_at) as oldest_order
FROM storefront_orders
-- WHERE storefront_id = 'YOUR_STOREFRONT_ID'  -- Uncomment dan ganti dengan storefront ID Anda
GROUP BY storefront_id
ORDER BY total_orders_in_db DESC;

-- Jika masih ada rows SETELAH reset → reset GAGAL!

-- 2. Cek RLS policies untuk storefront_orders
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
WHERE tablename = 'storefront_orders'
ORDER BY cmd, policyname;

-- Cari policy DELETE - apakah ada yang menghalangi?

-- 3. Test manual delete dengan user biasa (bukan service-role)
-- JANGAN JALANKAN - Hanya untuk melihat apakah RLS blocking
/*
DELETE FROM storefront_orders 
WHERE storefront_id IN (
  SELECT id FROM business_storefronts WHERE user_id = auth.uid()
);
*/
-- Jika error = RLS blocking deleteJika success tapi 0 rows affected = tidak ada data atau RLS blocking

-- 4. Cek logo_url di database - apakah benar-benar NULL setelah save?
SELECT 
  id,
  slug,
  store_name,
  logo_url,
  CASE 
    WHEN logo_url IS NULL THEN '❌ NULL'
    WHEN logo_url = '' THEN '❌ EMPTY STRING'
    WHEN logo_url LIKE 'http%' THEN '✅ VALID URL (' || logo_url || ')'
    ELSE '⚠️ INVALID: ' || logo_url
  END as logo_status,
  qris_image_url,
  updated_at
FROM business_storefronts
-- WHERE user_id = 'YOUR_USER_ID'
ORDER BY updated_at DESC
LIMIT 3;

-- 5. Cek service-role key status (dari aplikasi)
-- Jalankan ini di browser console saat di halaman lapak settings:
/*
console.log('SUPABASE_SERVICE_ROLE_KEY:', 
  process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET ✅' : 'MISSING ❌'
);
*/

-- 6. Test DELETE dengan service-role di SQL Editor
-- Jika Anda punya akses service-role, test delete manual:
/*
-- Login dengan service-role di Supabase Dashboard
-- Settings → API → service_role key → Copy
-- Lalu jalankan:

DELETE FROM storefront_orders WHERE id = 'TEST_ORDER_ID';
-- Jika success + rows affected > 0 = service-role bisa delete
-- Jika error atau 0 rows = ada masalah lain
*/

-- ============================================================================
-- INTERPRETASI HASIL
-- ============================================================================

/*
SCENARIO 1: Orders masih ada di database setelah reset
Query #1 returns rows > 0
→ Reset API GAGAL menghapus dari database
→ Kemungkinan: RLS blocking, service-role key salah, atau logic error

SCENARIO 2: RLS policy blocking DELETE
Query #2 shows DELETE policy: USING (false) atau tidak ada DELETE policy
→ User tidak bisa delete even dengan service-role
→ Fix: Tambah/update RLS policy

SCENARIO 3: Manual delete berhasil tapi API gagal
Query #3 berhasil delete, tapi reset API tetap gagal
→ Service-role key tidak terpakai atau salah
→ Fix: Cek environment variable SUPABASE_SERVICE_ROLE_KEY

SCENARIO 4: Logo_url benar di database tapi comparison gagal
Query #4 shows logo_url = valid URL, tapi warning tetap muncul
→ Comparison logic masalah (null vs empty string)
→ Fix: Perbaiki normalizeImageValue()

SCENARIO 5: Logo_url NULL di database setelah save
Query #4 shows logo_url = NULL setelah klik "Perbarui Lapak"
→ Save tidak bekerja atau upload belum complete
→ Fix: Check upload flow dan state management
*/

-- ============================================================================
-- NEXT STEPS BERDASARKAN HASIL
-- ============================================================================

/*
Jika Query #1 masih return rows setelah reset:
1. Cek Vercel logs apakah ada error saat reset
2. Cek console browser apakah toast success benar
3. Jalankan Query #2 untuk cek RLS policies
4. Test manual delete di SQL Editor dengan user_id Anda

Jika logo_url muncul warning:
1. Jalankan Query #4 untuk cek value sebenarnya di database
2. Bandingkan dengan value yang ada di browser (inspect element FormData)
3. Cek console browser apakah ada log [Persistence Check]
4. Screenshot semua informasi dan kirim untuk investigasi
*/
