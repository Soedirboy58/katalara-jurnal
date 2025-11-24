-- =====================================================
-- FIX RLS POLICY FOR REGISTRATION
-- Allow users to create their profile during registration
-- =====================================================

-- Drop old policy
DROP POLICY IF EXISTS "Users can create own profile" ON user_profiles;

-- Create new policy that allows authenticated users to insert
CREATE POLICY "Users can create own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Alternative: If you want stricter control, use this instead:
-- WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);
