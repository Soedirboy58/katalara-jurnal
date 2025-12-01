// Test expenses table schema - check with user_id
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zhuxonyuksnhplxinikl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpodXhvbnl1a3NuaHBseGluaWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDk1NjEsImV4cCI6MjA3ODAyNTU2MX0.KI9FvFic7VkQimsSETgbhebVHU8VthJhFa2-myWEWk0'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🧪 Testing expenses with user_id...')
const testData = {
  user_id: '00000000-0000-0000-0000-000000000000',
  expense_date: '2024-11-27',
  expense_type: 'operating',
  expense_category: 'operational',
  grand_total: 1000
}

const { data: insertData, error: insertError } = await supabase
  .from('expenses')
  .insert(testData)
  .select()

if (insertError) {
  console.log('❌ Insert error:', insertError.message)
  
  if (insertError.message.includes('user_id')) {
    console.log('✅ CONFIRMED: user_id column EXISTS (RLS error expected)')
  } else if (insertError.message.includes('owner_id')) {
    console.log('⚠️  Database uses owner_id instead')
  }
} else {
  console.log('✅ Insert successful - uses user_id:', insertData)
}

console.log('\n📋 CONCLUSION:')
if (insertError && insertError.message.includes('row-level security')) {
  console.log('✅ Expenses table uses user_id')
  console.log('⚠️  Code might use owner_id - MISMATCH!')
} else if (insertError && insertError.message.includes('Could not find')) {
  console.log('❌ Expenses table does NOT use user_id')
}
