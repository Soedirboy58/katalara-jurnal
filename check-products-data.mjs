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
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

console.log('🔍 Checking products table structure and data...\n')

// Check what columns exist
const { data: products, error } = await supabase
  .from('products')
  .select('*')
  .limit(5)

if (error) {
  console.error('❌ Error:', error.message)
} else {
  console.log('✅ Products found:', products.length)
  console.log('\n📊 Product data:')
  products.forEach(p => {
    console.log(`\n${p.name}:`)
    console.log(`  - cost_price: ${p.cost_price || 'NULL'}`)
    console.log(`  - selling_price: ${p.selling_price || 'NULL'}`)
    console.log(`  - price: ${p.price || 'NULL'}`)
    console.log(`  - unit: ${p.unit}`)
  })
  
  console.log('\n📋 Available columns:')
  console.log(Object.keys(products[0] || {}).join(', '))
}
