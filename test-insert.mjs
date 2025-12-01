// Test minimal insert to expenses table
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zhuxonyuksnhplxinikl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpodXhvbnl1a3NuaHBseGluaWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDk1NjEsImV4cCI6MjA3ODAyNTU2MX0.KI9FvFic7VkQimsSETgbhebVHU8VthJhFa2-myWEWk0'

const supabase = createClient(supabaseUrl, supabaseKey)

// First, get user to use real user_id
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  console.log('❌ Not authenticated')
  process.exit(1)
}

console.log('✅ User:', user.id)

// Test 1: Absolute minimal (3 fields only)
console.log('\n🧪 Test 1: MINIMAL (user_id + expense_date + grand_total)')
const test1 = {
  user_id: user.id,
  expense_date: '2025-11-27',
  grand_total: 50000
}
console.log('Payload:', test1)

const { data: r1, error: e1 } = await supabase
  .from('expenses')
  .insert(test1)
  .select()

if (e1) {
  console.log('❌ Error:', e1.message)
} else {
  console.log('✅ SUCCESS! Inserted:', r1)
}

// Test 2: Add description
console.log('\n🧪 Test 2: With description')
const test2 = {
  user_id: user.id,
  expense_date: '2025-11-27',
  grand_total: 75000,
  description: 'Test dengan deskripsi'
}
const { error: e2 } = await supabase
  .from('expenses')
  .insert(test2)

if (e2) {
  console.log('❌ Error:', e2.message)
} else {
  console.log('✅ SUCCESS with description!')
}

// Test 3: Add notes
console.log('\n🧪 Test 3: With notes')
const test3 = {
  user_id: user.id,
  expense_date: '2025-11-27',
  grand_total: 100000,
  notes: 'Test dengan notes'
}
const { error: e3 } = await supabase
  .from('expenses')
  .insert(test3)

if (e3) {
  console.log('❌ Error:', e3.message)
} else {
  console.log('✅ SUCCESS with notes!')
}
