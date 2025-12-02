import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Checking if ranger_profiles table exists...\n')

// Try to query the table
const { data, error } = await supabase
  .from('ranger_profiles')
  .select('id')
  .limit(1)

if (error) {
  console.error('❌ Table does NOT exist!')
  console.error('Error:', error.message)
  console.error('\n📋 You need to run the SQL migration first:')
  console.error('1. Open Supabase Dashboard → SQL Editor')
  console.error('2. Copy content from: sql/05_rangers_ecosystem_clean.sql')
  console.error('3. Paste and run in SQL Editor')
  console.error('4. Wait for "Success. No rows returned" message')
} else {
  console.log('✅ Table EXISTS!')
  console.log('Data:', data)
}
