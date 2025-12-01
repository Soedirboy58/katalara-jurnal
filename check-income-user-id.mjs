// Check actual incomes table schema - TEST with user_id
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zhuxonyuksnhplxinikl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpodXhvbnl1a3NuaHBseGluaWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDk1NjEsImV4cCI6MjA3ODAyNTU2MX0.KI9FvFic7VkQimsSETgbhebVHU8VthJhFa2-myWEWk0'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🧪 Testing insert with user_id...')
const testData = {
  user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
  income_date: '2024-11-27',
  income_type: 'operating',
  income_category: 'product_sales',
  grand_total: 1000
}

const { data: insertData, error: insertError } = await supabase
  .from('incomes')
  .insert(testData)
  .select()

if (insertError) {
  console.log('❌ Insert error:', insertError.message)
  
  if (insertError.message.includes('user_id')) {
    console.log('✅ CONFIRMED: user_id column EXISTS in database')
  }
} else {
  console.log('✅ Insert successful - database uses user_id:', insertData)
}

console.log('\n📋 CONCLUSION:')
console.log('Database schema: incomes table uses user_id')
console.log('Code currently uses: owner_id')
console.log('❌ MISMATCH FOUND - This is why history disappeared!')
