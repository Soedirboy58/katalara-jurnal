-- =====================================================
-- CEK PASSWORD DAN UPGRADE USER YANG SUDAH ADA
-- =====================================================

-- Cari user yang aktif dan bisa login
SELECT 
  u.email,
  u.email_confirmed_at,
  u.encrypted_password IS NOT NULL as has_password,
  p.role,
  p.is_active,
  p.full_name
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.user_id
WHERE u.email_confirmed_at IS NOT NULL
ORDER BY u.created_at DESC;

-- =====================================================
-- CARA TERMUDAH: LOGIN PAKAI PASSWORD LAMA ANDA
-- =====================================================
-- 
-- Dari hasil query di atas, pilih salah satu email yang:
-- 1. email_confirmed_at IS NOT NULL (sudah confirmed)
-- 2. has_password = true (ada password)
-- 
-- Misalnya: delta.sc58@gmail.com atau affankurniawan98@gmail.com
-- 
-- LOGIN dengan email itu + PASSWORD YANG ANDA PAKAI WAKTU REGISTER
-- 
-- Setelah berhasil login, jalankan SQL ini untuk upgrade jadi super_admin:

UPDATE user_profiles
SET role = 'super_admin'
WHERE user_id = auth.uid();

-- =====================================================
-- ATAU kalau lupa password semua, gunakan "Lupa password?" 
-- di halaman login untuk reset via email
-- =====================================================
