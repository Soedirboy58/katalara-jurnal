// Query actual expenses structure from database
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zhuxonyuksnhplxinikl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpodXhvbnl1a3NuaHBseGluaWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDk1NjEsImV4cCI6MjA3ODAyNTU2MX0.KI9FvFic7VkQimsSETgbhebVHU8VthJhFa2-myWEWk0'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Querying existing expenses to see actual columns...\n')

const { data, error } = await supabase
  .from('expenses')
  .select('*')
  .limit(3)

if (error) {
  console.error('❌ Error:', error)
} else {
  console.log(`✅ Found ${data?.length || 0} expenses`)
  
  if (data && data.length > 0) {
    console.log('\n📋 Column names in database:')
    console.log(Object.keys(data[0]))
    
    console.log('\n📊 Sample record:')
    console.log(JSON.stringify(data[0], null, 2))
  } else {
    console.log('⚠️ No records found. Table is empty.')
  }
}
