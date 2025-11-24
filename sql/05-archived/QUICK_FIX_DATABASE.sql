-- =====================================================
-- QUICK FIX: Database Schema + Clean Duplicate Data
-- Jalankan script ini SEKARANG di Supabase SQL Editor
-- =====================================================

-- STEP 1: Tambah kolom yang missing (WAJIB!)
-- Copy paste dan jalankan ini dulu:

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS kecamatan TEXT,
ADD COLUMN IF NOT EXISTS kabupaten TEXT,
ADD COLUMN IF NOT EXISTS provinsi TEXT,
ADD COLUMN IF NOT EXISTS business_start_year INT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS number_of_employees TEXT;

-- STEP 2: Lihat user_id yang duplicate
-- Cek dulu sebelum hapus:

SELECT 
    user_id,
    email,
    full_name,
    created_at,
    COUNT(*) as jumlah
FROM auth.users u
LEFT JOIN user_profiles p ON p.user_id = u.id
GROUP BY user_id, email, full_name, created_at
ORDER BY created_at DESC;

-- STEP 3: Hapus profile lama untuk user Anda (AMAN untuk testing)
-- Ganti 'YOUR_EMAIL@example.com' dengan email Anda yang baru:

DELETE FROM user_profiles 
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email = 'YOUR_EMAIL@example.com'
);

-- STEP 4: Verify hasil
-- Cek apakah profile sudah terhapus:

SELECT 
    u.email,
    p.full_name,
    p.phone,
    p.created_at
FROM auth.users u
LEFT JOIN user_profiles p ON p.user_id = u.id
WHERE u.email = 'YOUR_EMAIL@example.com';

-- Harusnya return 1 row dengan full_name, phone = NULL
-- Artinya profile sudah terhapus, siap diisi ulang

-- =====================================================
-- ALTERNATIVE: Hapus SEMUA profile untuk reset testing
-- HATI-HATI! Ini akan hapus semua data user_profiles
-- =====================================================

-- Uncomment baris di bawah jika mau reset total:
-- TRUNCATE TABLE user_profiles CASCADE;

-- =====================================================
-- VERIFY: Cek struktur tabel sudah benar
-- =====================================================

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- Expected columns (minimal):
-- id, user_id, full_name, phone, address, 
-- kecamatan, kabupaten, provinsi,
-- business_name, business_category_id,
-- business_start_year, business_type, number_of_employees,
-- role, is_approved, created_at, updated_at
