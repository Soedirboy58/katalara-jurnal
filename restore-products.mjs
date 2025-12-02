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

console.log('🔄 Restoring products from backup...\n')

// Get backup data
const { data: backup, error: backupError } = await supabase
  .from('products_backup_current_schema')
  .select('*')
  .eq('is_active', true)

if (backupError) {
  console.error('❌ Error reading backup:', backupError.message)
  process.exit(1)
}

console.log(`✅ Found ${backup.length} products in backup`)

// Insert to products table (using NEW schema: owner_id + price)
for (const product of backup) {
  const { error } = await supabase
    .from('products')
    .insert({
      id: product.id,
      owner_id: product.user_id,  // Map user_id → owner_id
      name: product.name,
      category: product.category,
      unit: product.unit,
      price: product.selling_price || product.cost_price || 0,  // Use selling_price as main price
      is_active: product.is_active,
      created_at: product.created_at,
      updated_at: product.updated_at
    })
  
  if (error) {
    console.error(`❌ Failed to restore ${product.name}:`, error.message)
  } else {
    console.log(`✅ Restored: ${product.name} (price: ${product.selling_price || product.cost_price})`)
  }
}

// Verify
const { data: restored, error: verifyError } = await supabase
  .from('products')
  .select('*')

if (verifyError) {
  console.error('❌ Verification error:', verifyError.message)
} else {
  console.log(`\n🎉 RESTORE COMPLETE! Products table now has ${restored.length} rows`)
  restored.forEach(p => {
    console.log(`   - ${p.name}: price=${p.price}`)
  })
}
