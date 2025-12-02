-- =====================================================
-- CHECK TRIGGERS & NOTIFICATIONS
-- Diagnose why notifications stopped working
-- =====================================================

-- Step 1: Check all triggers on products table
SELECT 
  'TRIGGERS ON PRODUCTS TABLE' as section,
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'products'
ORDER BY trigger_name;

-- Step 2: Check RLS policies on products
SELECT 
  'RLS POLICIES ON PRODUCTS' as section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'products';

-- Step 3: Check if RLS is enabled
SELECT 
  'RLS STATUS' as section,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'products';

-- Step 4: List all functions that might be related to notifications
SELECT 
  'NOTIFICATION FUNCTIONS' as section,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%notify%' 
    OR routine_name LIKE '%trigger%'
    OR routine_name LIKE '%stock%'
    OR routine_name LIKE '%product%')
ORDER BY routine_name;

-- Step 5: Check recent product changes (last 5)
SELECT 
  'RECENT PRODUCTS' as section,
  id,
  name,
  created_at,
  updated_at
FROM products
ORDER BY updated_at DESC
LIMIT 5;

-- Summary
SELECT '
📊 DIAGNOSIS COMPLETE

Check the results above:
1. TRIGGERS - Should show automated triggers
2. RLS POLICIES - Should show access control
3. RLS STATUS - Should be enabled (true)
4. NOTIFICATION FUNCTIONS - Should list trigger functions

Common issues:
- Missing triggers = notifications wont work
- RLS disabled = security risk
- No policies = users cant access data

Next: Share the results so I can identify the issue
' as instructions;
