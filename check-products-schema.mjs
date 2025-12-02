import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Read .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=')
  if (key && values.length) env[key.trim()] = values.join('=').trim()
})

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

console.log('🔍 Checking products table schema...\n')

// Try to insert dummy data to see what columns exist
const testInsert = await supabase
  .from('products')
  .insert({
    name: 'TEST_PRODUCT',
    price: 1000,
    cost_price: 500,
    selling_price: 1500,
    user_id: 'test',
    owner_id: 'test'
  })
  .select()

console.log('📋 Insert test result:')
console.log('Error:', testInsert.error?.message || 'No error')
console.log('Details:', testInsert.error?.details || '-')
console.log('Hint:', testInsert.error?.hint || '-')

if (testInsert.error?.message) {
  const msg = testInsert.error.message
  if (msg.includes('cost_price')) {
    console.log('\n❌ Table does NOT have: cost_price column')
  }
  if (msg.includes('selling_price')) {
    console.log('❌ Table does NOT have: selling_price column')
  }
  if (msg.includes('owner_id')) {
    console.log('❌ Table does NOT have: owner_id column')
  }
  if (msg.includes('user_id')) {
    console.log('❌ Table does NOT have: user_id column')
  }
  if (msg.includes('price')) {
    console.log('✅ Table DOES have: price column')
  }
}
