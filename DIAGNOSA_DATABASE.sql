-- ============================================================================
-- DIAGNOSTIC SQL QUERIES FOR LAPAK ISSUES
-- Copy-paste these queries into Supabase SQL Editor to diagnose problems
-- ============================================================================

-- ============================================================================
-- 1. CHECK IF TABLE EXISTS AND HAS ALL COLUMNS
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'business_storefronts'
ORDER BY ordinal_position;

-- Expected columns to see:
-- ✅ id, user_id, slug, store_name, description
-- ✅ logo_url, cover_image_url, theme_color
-- ✅ qris_image_url, bank_name, bank_account_number, bank_account_holder
-- ✅ banner_image_urls (JSONB) ← from migration 10
-- ✅ banner_autoplay_ms (INTEGER) ← from migration 10
-- ✅ wa_status_templates (JSONB) ← from migration 09
-- ✅ is_active, total_views, total_clicks
-- ✅ created_at, updated_at

-- ============================================================================
-- 2. CHECK CURRENT DATA IN YOUR STOREFRONT
-- ============================================================================

-- Replace 'YOUR_USER_ID' with your actual user ID from auth.users
-- You can get your user ID from: SELECT id FROM auth.users WHERE email = 'your@email.com';

SELECT 
  id,
  user_id,
  slug,
  store_name,
  logo_url,
  qris_image_url,
  banner_image_urls,
  banner_autoplay_ms,
  is_active,
  created_at,
  updated_at
FROM business_storefronts
-- WHERE user_id = 'YOUR_USER_ID' -- Uncomment and replace with your user ID
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- 3. CHECK IF LOGO_URL IS ACTUALLY NULL OR EMPTY STRING
-- ============================================================================

SELECT 
  id,
  slug,
  CASE 
    WHEN logo_url IS NULL THEN '❌ NULL'
    WHEN logo_url = '' THEN '❌ EMPTY STRING'
    WHEN logo_url LIKE 'http%' THEN '✅ VALID URL'
    ELSE '⚠️ INVALID FORMAT'
  END as logo_status,
  logo_url,
  CASE 
    WHEN qris_image_url IS NULL THEN '❌ NULL'
    WHEN qris_image_url = '' THEN '❌ EMPTY STRING'
    WHEN qris_image_url LIKE 'http%' THEN '✅ VALID URL'
    ELSE '⚠️ INVALID FORMAT'
  END as qris_status,
  qris_image_url,
  CASE 
    WHEN banner_image_urls IS NULL THEN '❌ NULL'
    WHEN jsonb_array_length(banner_image_urls) = 0 THEN '❌ EMPTY ARRAY'
    WHEN jsonb_array_length(banner_image_urls) > 0 THEN '✅ HAS ' || jsonb_array_length(banner_image_urls)::text || ' IMAGES'
    ELSE '⚠️ INVALID FORMAT'
  END as banner_status,
  banner_image_urls
FROM business_storefronts
-- WHERE user_id = 'YOUR_USER_ID'
ORDER BY updated_at DESC
LIMIT 3;

-- ============================================================================
-- 4. CHECK STOREFRONT_ORDERS (Why orders keep reappearing?)
-- ============================================================================

SELECT 
  COUNT(*) as total_orders,
  storefront_id,
  MIN(created_at) as oldest_order,
  MAX(created_at) as newest_order
FROM storefront_orders
GROUP BY storefront_id
ORDER BY total_orders DESC;

-- If you see orders here AFTER clicking "Hapus Riwayat Order", then reset is FAILING

-- ============================================================================
-- 5. CHECK RLS POLICIES (Are they blocking updates?)
-- ============================================================================

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
WHERE schemaname = 'public' 
  AND tablename = 'business_storefronts'
ORDER BY policyname;

-- Check if UPDATE policy allows you to update logo_url

-- ============================================================================
-- 6. TEST MANUAL UPDATE (Can you update logo_url directly?)
-- ============================================================================

-- First, get your storefront ID:
-- SELECT id, slug FROM business_storefronts WHERE user_id = 'YOUR_USER_ID';

-- Then try manual update:
-- UPDATE business_storefronts
-- SET 
--   logo_url = 'https://example.com/test-logo.jpg',
--   updated_at = NOW()
-- WHERE id = 'YOUR_STOREFRONT_ID';

-- Check if it persisted:
-- SELECT logo_url FROM business_storefronts WHERE id = 'YOUR_STOREFRONT_ID';

-- ============================================================================
-- 7. CHECK IF COLUMNS ARE MISSING (Need migration?)
-- ============================================================================

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'business_storefronts' AND column_name = 'logo_url'
    ) THEN '✅'
    ELSE '❌ MISSING'
  END as logo_url_exists,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'business_storefronts' AND column_name = 'qris_image_url'
    ) THEN '✅'
    ELSE '❌ MISSING'
  END as qris_image_url_exists,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'business_storefronts' AND column_name = 'banner_image_urls'
    ) THEN '✅'
    ELSE '❌ MISSING - RUN MIGRATION 10'
  END as banner_image_urls_exists,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'business_storefronts' AND column_name = 'banner_autoplay_ms'
    ) THEN '✅'
    ELSE '❌ MISSING - RUN MIGRATION 10'
  END as banner_autoplay_ms_exists,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'business_storefronts' AND column_name = 'wa_status_templates'
    ) THEN '✅'
    ELSE '❌ MISSING - RUN MIGRATION 09'
  END as wa_status_templates_exists;

-- ============================================================================
-- 8. CHECK STORAGE BUCKETS
-- ============================================================================

SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name IN ('Logo Bisnis', 'products', 'QRIS DB', 'lapak-images')
ORDER BY name;

-- Expected buckets:
-- ✅ Logo Bisnis (for logo uploads)
-- ✅ products (for product images)
-- ✅ QRIS DB (for QRIS images)
-- ✅ lapak-images (for storefront images)

-- ============================================================================
-- 9. CHECK FILES IN STORAGE (Are images actually uploaded?)
-- ============================================================================

SELECT 
  name as bucket_name,
  COUNT(*) as total_files,
  pg_size_pretty(SUM(COALESCE((metadata->>'size')::bigint, 0))) as total_size
FROM storage.objects
WHERE bucket_id IN (
  SELECT id FROM storage.buckets 
  WHERE name IN ('Logo Bisnis', 'products', 'QRIS DB', 'lapak-images')
)
GROUP BY name;

-- If total_files = 0, then uploads are NOT reaching storage

-- ============================================================================
-- 10. SOLUTION: If banner_image_urls column is MISSING
-- ============================================================================

-- Run this migration SQL:
/*
ALTER TABLE IF EXISTS business_storefronts
ADD COLUMN IF NOT EXISTS banner_image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS banner_autoplay_ms INTEGER NOT NULL DEFAULT 3500;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'business_storefronts_banner_autoplay_ms_check'
  ) THEN
    ALTER TABLE business_storefronts
      ADD CONSTRAINT business_storefronts_banner_autoplay_ms_check
      CHECK (banner_autoplay_ms BETWEEN 1200 AND 10000);
  END IF;
END $$;
*/

-- ============================================================================
-- 11. SOLUTION: If wa_status_templates column is MISSING
-- ============================================================================

-- Run this migration SQL:
/*
ALTER TABLE IF EXISTS business_storefronts
ADD COLUMN IF NOT EXISTS wa_status_templates JSONB NOT NULL DEFAULT '{}'::jsonb;
*/

-- ============================================================================
-- 12. CHECK IF YOUR USER CAN SEE THE TABLE (RLS)
-- ============================================================================

-- Run this as your authenticated user (in Supabase SQL Editor after login):
-- SELECT * FROM business_storefronts WHERE user_id = auth.uid();

-- If you get permission denied, RLS policies are blocking you

-- ============================================================================
-- INTERPRETATION GUIDE
-- ============================================================================

/*
PROBLEM: "Logo tidak persist setelah refresh"

POSSIBLE CAUSES:
1. ❌ logo_url column is NULL or '' after save
   → Upload race condition: save happens before upload completes
   → FIX: Wait for upload to complete before saving (we just deployed this fix)

2. ❌ Column missing in database
   → Migration not applied
   → FIX: Run sql/02-migrations/add_payment_fields.sql

3. ❌ RLS policy blocking UPDATE
   → User can't update their own data
   → FIX: Check RLS policies (Query #5)

4. ❌ Files not uploading to storage
   → Storage bucket missing or permission issue
   → FIX: Check storage buckets (Query #8)

5. ❌ Cache serving stale data
   → Already fixed with cache-busting and NO_STORE headers
   → FIX: Hard refresh (Ctrl+Shift+R)

PROBLEM: "Order history reappears after reset"

POSSIBLE CAUSES:
1. ❌ Reset API not using service-role
   → RLS blocking deletions
   → FIX: Already fixed - using service-role client

2. ❌ Orders in wrong table
   → Using 'orders' table instead of 'storefront_orders'
   → FIX: Check table name in code

3. ❌ Multiple storefronts with different IDs
   → Reset only deletes from one storefront
   → FIX: Check Query #4 - how many storefronts do you have?

4. ❌ Frontend showing cached data
   → API returns fresh data but UI shows stale state
   → FIX: Clear browser cache, check React state management
*/
