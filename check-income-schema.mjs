// Check actual incomes table schema from Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zhuxonyuksnhplxinikl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpodXhvbnl1a3NuaHBseGluaWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDk1NjEsImV4cCI6MjA3ODAyNTU2MX0.KI9FvFic7VkQimsSETgbhebVHU8VthJhFa2-myWEWk0'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Checking incomes table schema...\n')

// Try direct query to see existing data
console.log('📊 Fetching sample income records...')
const { data: sample, error: sampleError } = await supabase
  .from('incomes')
  .select('*')
  .limit(1)

if (sampleError) {
  console.error('❌ Sample query error:', sampleError.message)
  
  if (sampleError.message.includes('owner_id')) {
    console.log('\n✅ CONFIRMED: Database uses owner_id')
  } else if (sampleError.message.includes('user_id')) {
    console.log('\n✅ CONFIRMED: Database uses user_id')
  }
} else {
  console.log('✅ Sample record retrieved')
  if (sample && sample.length > 0) {
    console.log('📋 Columns:', Object.keys(sample[0]).join(', '))
    
    if (sample[0].hasOwnProperty('owner_id')) {
      console.log('\n✅ CONFIRMED: Database uses owner_id')
    } else if (sample[0].hasOwnProperty('user_id')) {
      console.log('\n✅ CONFIRMED: Database uses user_id')
    }
  } else {
    console.log('⚠️  Table is empty, trying insert test...')
  }
}

// Test insert with minimal data
console.log('\n🧪 Testing minimal insert with owner_id...')
const testData = {
  owner_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
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
  
  if (insertError.message.includes('owner_id')) {
    console.log('✅ CONFIRMED: owner_id column exists')
  } else if (insertError.message.includes('user_id')) {
    console.log('⚠️  Error mentions user_id - database might use user_id instead')
  }
} else {
  console.log('✅ Insert successful (unexpected):', insertData)
}
