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

console.log('🔍 Checking ALL product-related tables...\n')

// Check products table
console.log('1️⃣ Checking `products` table:')
const { data: products, error: prodError } = await supabase
  .from('products')
  .select('*')

if (prodError) {
  console.error('   ❌ Error:', prodError.message)
} else {
  console.log(`   ✅ Rows: ${products.length}`)
  if (products.length > 0) {
    console.log('   Columns:', Object.keys(products[0]).join(', '))
    products.forEach(p => console.log(`   - ${p.name}: cost=${p.cost_price}, sell=${p.selling_price}, price=${p.price}`))
  }
}

// Check storefront_products
console.log('\n2️⃣ Checking `storefront_products` table:')
const { data: storeProducts, error: storeError } = await supabase
  .from('storefront_products')
  .select('*')

if (storeError) {
  console.error('   ❌ Error:', storeError.message)
} else {
  console.log(`   ✅ Rows: ${storeProducts.length}`)
  if (storeProducts.length > 0) {
    console.log('   Columns:', Object.keys(storeProducts[0]).join(', '))
    storeProducts.forEach(p => console.log(`   - ${p.name}: cost=${p.cost_price}, sell=${p.selling_price}`))
  }
}

// Check products_backup_current_schema (if exists)
console.log('\n3️⃣ Checking `products_backup_current_schema` table:')
const { data: backup, error: backupError } = await supabase
  .from('products_backup_current_schema')
  .select('*')

if (backupError) {
  console.error('   ❌ Error:', backupError.message)
} else {
  console.log(`   ✅ Rows: ${backup.length}`)
  if (backup.length > 0) {
    console.log('   Columns:', Object.keys(backup[0]).join(', '))
    backup.forEach(p => console.log(`   - ${p.name}: cost=${p.cost_price}, sell=${p.selling_price}, user_id=${p.user_id}`))
  }
}

console.log('\n🔍 Summary:')
console.log(`   products: ${products?.length || 0} rows`)
console.log(`   storefront_products: ${storeProducts?.length || 0} rows`)
console.log(`   products_backup: ${backup?.length || 0} rows`)
