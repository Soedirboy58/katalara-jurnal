// Check actual expenses table schema from Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zhuxonyuksnhplxinikl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpodXhvbnl1a3NuaHBseGluaWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDk1NjEsImV4cCI6MjA3ODAyNTU2MX0.KI9FvFic7VkQimsSETgbhebVHU8VthJhFa2-myWEWk0'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Checking expenses table schema...\n')

// Query with raw SQL to get columns
const { data, error } = await supabase.rpc('exec_sql', {
  query: `
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'expenses'
    ORDER BY ordinal_position;
  `
})

if (error) {
  console.error('❌ Error:', error)
  
  // Try direct query instead
  console.log('\n🔄 Trying direct query...')
  const { data: sample, error: sampleError } = await supabase
    .from('expenses')
    .select('*')
    .limit(1)
  
  if (sampleError) {
    console.error('❌ Sample query error:', sampleError)
  } else {
    console.log('✅ Sample record columns:')
    if (sample && sample.length > 0) {
      console.log(Object.keys(sample[0]))
    } else {
      console.log('No records found. Table might be empty.')
    }
  }
} else {
  console.log('✅ Columns found:', data)
}

// Test insert with minimal data
console.log('\n🧪 Testing minimal insert...')
const testData = {
  owner_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
  expense_date: '2024-11-27',
  category: 'Test',
  amount: 1000
}

console.log('Test payload:', testData)

const { data: insertData, error: insertError } = await supabase
  .from('expenses')
  .insert(testData)
  .select()

if (insertError) {
  console.log('❌ Insert error (expected - just checking column names):', insertError.message)
} else {
  console.log('✅ Insert successful:', insertData)
}
