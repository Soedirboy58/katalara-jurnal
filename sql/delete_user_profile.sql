-- =====================================================
-- HAPUS PROFILE USER TERTENTU
-- Safe deletion untuk user_id: 99f07a34-2ad0-4433-b996-8455ed2a4dce
-- =====================================================

-- Step 1: Cek data sebelum dihapus (PENTING!)
SELECT 
    up.user_id,
    up.full_name,
    au.email,
    up.phone,
    up.business_name,
    up.created_at
FROM user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
WHERE up.user_id = '99f07a34-2ad0-4433-b996-8455ed2a4dce';

-- Step 2: Hapus profile user
DELETE FROM user_profiles 
WHERE user_id = '99f07a34-2ad0-4433-b996-8455ed2a4dce';

-- Step 3: Verify sudah terhapus
SELECT 
    user_id,
    full_name,
    phone
FROM user_profiles
WHERE user_id = '99f07a34-2ad0-4433-b996-8455ed2a4dce';

-- Harusnya return: No rows (artinya sudah terhapus)

-- Step 4: Cek email user masih ada di auth.users (jangan dihapus!)
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users
WHERE id = '99f07a34-2ad0-4433-b996-8455ed2a4dce';

-- Email user tetap ada, hanya profile-nya yang dihapus
-- User bisa isi ulang business info form

-- =====================================================
-- SETELAH HAPUS: Tambah kolom yang missing
-- =====================================================

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS kecamatan TEXT,
ADD COLUMN IF NOT EXISTS kabupaten TEXT,
ADD COLUMN IF NOT EXISTS provinsi TEXT,
ADD COLUMN IF NOT EXISTS business_start_year INT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS number_of_employees TEXT;

-- =====================================================
-- VERIFY: Cek struktur tabel
-- =====================================================

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- =====================================================
-- READY TO TEST
-- =====================================================
-- Setelah jalankan script ini:
-- 1. Profile user sudah terhapus
-- 2. Kolom baru sudah ditambahkan
-- 3. Refresh halaman business-info
-- 4. Isi form lagi
-- 5. Submit → SUKSES! ✅
