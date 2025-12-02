import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testInsert() {
  console.log('Testing expenses insert - finding expense_type values...\n')
  
  // Test with different expense_type values
  const types = ['purchase', 'operational', 'general', 'expense', 'other']
  
  for (const type of types) {
    console.log(`Test expense_type: "${type}"`)
    const { data, error } = await supabase
      .from('expenses')
      .insert({ 
        user_id: '00000000-0000-0000-0000-000000000000',
        expense_date: '2024-11-27',
        expense_type: type,
        expense_category: 'operational_expense',
        grand_total: 100000,
        payment_method: 'cash',
        payment_status: 'paid',
        notes: 'Test'
      })
      .select()
    
    if (error) {
      console.log(`  ❌ ${error.message}`)
    } else {
      console.log(`  ✅ SUCCESS with expense_type: "${type}"`)
      console.log(`  Columns:`, Object.keys(data[0]))
      break
    }
  }
}

testInsert()
