#!/usr/bin/env node

/**
 * Database Schema Verification Tool
 * Checks if all required tables and columns exist in the live database
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

console.log('🔍 Checking Database Schema...\n')

async function checkTableExists(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(0)

  return { exists: !error, error: error?.message }
}

async function getTableColumns(tableName) {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      ORDER BY ordinal_position;
    `
  })

  if (error) {
    // Fallback: try selecting from table to see if it exists
    const testQuery = await supabase.from(tableName).select('*').limit(1)
    if (testQuery.error) {
      return { columns: [], error: testQuery.error.message }
    }
    
    // Table exists but we can't query information_schema
    return { 
      columns: [], 
      error: 'Cannot query information_schema (no exec_sql function). Table exists but column details unavailable.' 
    }
  }

  return { columns: data || [], error: null }
}

async function checkBusinessStorefronts() {
  console.log('📋 TABLE: business_storefronts')
  console.log('─'.repeat(60))

  const tableCheck = await checkTableExists('business_storefronts')
  if (!tableCheck.exists) {
    console.log('❌ Table does NOT exist!')
    console.log(`   Error: ${tableCheck.error}\n`)
    return
  }

  console.log('✅ Table exists')

  // Check for specific critical columns by trying to select them
  const criticalColumns = [
    'id',
    'user_id',
    'slug',
    'store_name',
    'logo_url',
    'qris_image_url',
    'banner_image_urls',
    'banner_autoplay_ms',
    'wa_status_templates',
    'whatsapp_number',
    'is_active',
  ]

  console.log('\n🔍 Checking critical columns:')
  
  for (const col of criticalColumns) {
    const { error } = await supabase
      .from('business_storefronts')
      .select(col)
      .limit(0)

    if (error) {
      console.log(`❌ ${col.padEnd(25)} - MISSING (${error.message})`)
    } else {
      console.log(`✅ ${col.padEnd(25)} - EXISTS`)
    }
  }

  // Get row count
  const { count } = await supabase
    .from('business_storefronts')
    .select('*', { count: 'exact', head: true })

  console.log(`\n📊 Total rows: ${count || 0}`)

  // Sample data check
  const { data: sample } = await supabase
    .from('business_storefronts')
    .select('id, user_id, slug, logo_url, qris_image_url, banner_image_urls')
    .limit(1)
    .single()

  if (sample) {
    console.log('\n📝 Sample row:')
    console.log(`   ID: ${sample.id}`)
    console.log(`   User ID: ${sample.user_id}`)
    console.log(`   Slug: ${sample.slug}`)
    console.log(`   Logo URL: ${sample.logo_url || '(null)'}`)
    console.log(`   QRIS URL: ${sample.qris_image_url || '(null)'}`)
    console.log(`   Banner URLs: ${JSON.stringify(sample.banner_image_urls) || '(null)'}`)
  }

  console.log('')
}

async function checkStorefrontOrders() {
  console.log('📋 TABLE: storefront_orders')
  console.log('─'.repeat(60))

  const tableCheck = await checkTableExists('storefront_orders')
  if (!tableCheck.exists) {
    console.log('❌ Table does NOT exist!')
    console.log(`   Error: ${tableCheck.error}\n`)
    return
  }

  console.log('✅ Table exists')

  // Get row count
  const { count } = await supabase
    .from('storefront_orders')
    .select('*', { count: 'exact', head: true })

  console.log(`📊 Total rows: ${count || 0}`)

  // Sample data
  const { data: orders } = await supabase
    .from('storefront_orders')
    .select('id, storefront_id, customer_name, status, created_at')
    .order('created_at', { ascending: false })
    .limit(3)

  if (orders && orders.length > 0) {
    console.log('\n📝 Recent orders:')
    orders.forEach((order, i) => {
      console.log(`   ${i + 1}. ${order.customer_name} - ${order.status} (${new Date(order.created_at).toLocaleString()})`)
    })
  } else {
    console.log('\n📝 No orders found')
  }

  console.log('')
}

async function checkStorefrontAnalytics() {
  console.log('📋 TABLE: storefront_analytics')
  console.log('─'.repeat(60))

  const tableCheck = await checkTableExists('storefront_analytics')
  if (!tableCheck.exists) {
    console.log('❌ Table does NOT exist!')
    console.log(`   Error: ${tableCheck.error}\n`)
    return
  }

  console.log('✅ Table exists')

  const { count } = await supabase
    .from('storefront_analytics')
    .select('*', { count: 'exact', head: true })

  console.log(`📊 Total rows: ${count || 0}\n`)
}

async function checkRLSPolicies() {
  console.log('🔒 RLS POLICIES CHECK')
  console.log('─'.repeat(60))

  // Check if RLS is enabled
  const tables = ['business_storefronts', 'storefront_orders', 'storefront_analytics']

  for (const table of tables) {
    const { data: rlsStatus } = await supabase.rpc('exec_sql', {
      query: `
        SELECT relrowsecurity
        FROM pg_class
        WHERE relname = '${table}';
      `
    }).catch(() => ({ data: null }))

    if (rlsStatus && rlsStatus.length > 0) {
      const enabled = rlsStatus[0].relrowsecurity
      console.log(`${enabled ? '✅' : '⚠️ '} ${table.padEnd(30)} - RLS ${enabled ? 'ENABLED' : 'DISABLED'}`)
    } else {
      console.log(`⚠️  ${table.padEnd(30)} - Cannot check RLS status`)
    }
  }

  console.log('')
}

async function main() {
  try {
    await checkBusinessStorefronts()
    await checkStorefrontOrders()
    await checkStorefrontAnalytics()
    await checkRLSPolicies()

    console.log('✅ Schema check complete!\n')
    console.log('💡 Next steps:')
    console.log('   1. If columns are missing, run migration: supabase-migration/sql/10_storefront_banner_carousel.sql')
    console.log('   2. If orders keep reappearing, check RLS policies and service-role usage')
    console.log('   3. If logo_url/banner_image_urls are null, check upload and save flow\n')

  } catch (err) {
    console.error('❌ Fatal error:', err)
    process.exit(1)
  }
}

main()
