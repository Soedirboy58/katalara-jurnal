-- =====================================================
-- CREATE SUPER ADMIN ACCOUNT - SIMPLIFIED
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Cek apakah sudah ada admin
SELECT email FROM auth.users WHERE email = 'admin@katalara.com';

-- Step 2: Hapus dulu jika ada (untuk clean slate)
DELETE FROM user_profiles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@katalara.com'
);
DELETE FROM auth.users WHERE email = 'admin@katalara.com';

-- Step 3: Create or update admin
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Cek apakah user sudah ada
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@katalara.com';
  
  -- Jika belum ada, create user baru
  IF admin_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@katalara.com',
      crypt('admin123', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      NOW(),
      NOW(),
      '',
      ''
    ) RETURNING id INTO admin_user_id;
    
    RAISE NOTICE 'Admin user created with ID: %', admin_user_id;
  ELSE
    -- Update password jika sudah ada
    UPDATE auth.users 
    SET encrypted_password = crypt('admin123', gen_salt('bf')),
        email_confirmed_at = NOW()
    WHERE id = admin_user_id;
    
    RAISE NOTICE 'Admin user already exists with ID: %', admin_user_id;
  END IF;

  -- Insert or update profile
  INSERT INTO user_profiles (
    user_id, full_name, phone, address, business_name,
    business_category_id, role, is_verified, is_approved, is_active
  ) VALUES (
    admin_user_id,
    'Super Admin',
    '081234567890',
    'Jakarta',
    'Katalara HQ',
    1,
    'super_admin',
    true,
    true,
    true
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    role = 'super_admin',
    is_verified = true,
    is_approved = true,
    is_active = true,
    full_name = 'Super Admin';

  RAISE NOTICE 'Admin profile created/updated';
END $$;

-- Step 4: Verify
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at IS NOT NULL as confirmed,
  p.full_name,
  p.role,
  p.is_approved,
  p.is_active
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.user_id
WHERE u.email = 'admin@katalara.com';

-- =====================================================
-- CREDENTIALS
-- Email: admin@katalara.com
-- Password: admin123
-- =====================================================
