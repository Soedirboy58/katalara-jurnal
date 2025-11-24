-- Reset Onboarding for Testing
-- Run this SQL in Supabase SQL Editor to test onboarding wizard

-- Option 1: Delete specific user's business config (replace with your user email)
-- DELETE FROM business_configurations 
-- WHERE user_id = (SELECT user_id FROM user_profiles WHERE email = 'your-email@example.com');

-- Option 2: Delete all business_configurations (reset semua user untuk testing)
-- WARNING: This will delete ALL business configurations!
-- DELETE FROM business_configurations;

-- Option 3: Set specific user's onboarding to incomplete (safer)
-- UPDATE business_configurations 
-- SET onboarding_completed = false 
-- WHERE user_id = (SELECT user_id FROM user_profiles WHERE email = 'your-email@example.com');

-- Option 4: Check current status
SELECT 
  up.email,
  up.full_name,
  bc.business_category,
  bc.onboarding_completed,
  bc.onboarding_step,
  bc.created_at
FROM user_profiles up
LEFT JOIN business_configurations bc ON up.user_id = bc.user_id
ORDER BY up.created_at DESC;

-- Untuk test: Uncomment salah satu option di atas sesuai kebutuhan
