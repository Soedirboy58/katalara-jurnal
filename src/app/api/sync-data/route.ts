import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // ============================================
    // STEP 1: Extract Customers from Incomes
    // ============================================
    const { data: incomesWithCustomers, error: incomesError } = await supabase
      .from('incomes')
      .select('customer_name, customer_phone, customer_email')
      .eq('user_id', user.id)
      .not('customer_name', 'is', null)

    if (incomesError) {
      console.error('Error fetching incomes:', incomesError)
      return NextResponse.json({ success: false, error: incomesError.message }, { status: 500 })
    }

    // Deduplicate customers by phone or name
    const customerMap = new Map<string, any>()
    incomesWithCustomers?.forEach((income: any) => {
      const key = income.customer_phone || income.customer_name
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          name: income.customer_name,
          phone: income.customer_phone || null,
          email: income.customer_email || null
        })
      }
    })

    // Get existing customers to avoid duplicates
    const { data: existingCustomers } = await supabase
      .from('customers')
      .select('phone, name')
      .eq('user_id', user.id)

    const existingPhones = new Set(existingCustomers?.map(c => c.phone).filter(Boolean))
    const existingNames = new Set(existingCustomers?.map(c => c.name).filter(Boolean))

    // Insert new customers
    let customersInserted = 0
    let customersSkipped = 0
    const customerErrors: string[] = []

    for (const [key, customer] of customerMap.entries()) {
      // Skip if already exists
      if (existingPhones.has(customer.phone) || existingNames.has(customer.name)) {
        customersSkipped++
        continue
      }

      // Get next customer number
      const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const customerNumber = `CUST-${String((count || 0) + 1).padStart(3, '0')}`

      const { error: insertError } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          customer_number: customerNumber,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          total_transactions: 0,
          total_spent: 0
        })

      if (insertError) {
        customerErrors.push(`${customer.name}: ${insertError.message}`)
      } else {
        customersInserted++
      }
    }

    // ============================================
    // STEP 2: Extract Products from Line Items
    // ============================================
    const { data: incomesWithProducts, error: productsError } = await supabase
      .from('incomes')
      .select('line_items, product_name')
      .eq('user_id', user.id)

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return NextResponse.json({ success: false, error: productsError.message }, { status: 500 })
    }

    // Extract products from line_items JSON
    const productMap = new Map<string, any>()
    
    incomesWithProducts?.forEach((income: any) => {
      // Parse line_items if it's a JSON string
      let lineItems: any[] = []
      try {
        if (typeof income.line_items === 'string') {
          lineItems = JSON.parse(income.line_items)
        } else if (Array.isArray(income.line_items)) {
          lineItems = income.line_items
        }
      } catch (e) {
        console.error('Error parsing line_items:', e)
      }

      // Extract from line_items array
      lineItems.forEach((item: any) => {
        if (item.product_name && !productMap.has(item.product_name)) {
          productMap.set(item.product_name, {
            name: item.product_name,
            price: item.price_per_unit || item.price || 0,
            unit: item.unit || 'pcs'
          })
        }
      })

      // Also check single product_name field (for simple transactions)
      if (income.product_name && !productMap.has(income.product_name)) {
        productMap.set(income.product_name, {
          name: income.product_name,
          price: 0,
          unit: 'pcs'
        })
      }
    })

    // Get existing products to avoid duplicates
    const { data: existingProducts } = await supabase
      .from('products')
      .select('name')
      .eq('owner_id', user.id)

    const existingProductNames = new Set(existingProducts?.map(p => p.name).filter(Boolean))

    // Insert new products
    let productsInserted = 0
    let productsSkipped = 0
    const productErrors: string[] = []

    for (const [name, product] of productMap.entries()) {
      // Skip if already exists
      if (existingProductNames.has(name)) {
        productsSkipped++
        continue
      }

      const { error: insertError } = await supabase
        .from('products')
        .insert({
          owner_id: user.id,
          name: product.name,
          sell_price: product.price,
          buy_price: 0, // Will need to be filled manually
          unit: product.unit,
          stock: 0, // Will need to be filled manually
          min_stock: 0,
          product_type: 'physical',
          is_active: true
        })

      if (insertError) {
        productErrors.push(`${name}: ${insertError.message}`)
      } else {
        productsInserted++
      }
    }

    // Return sync report
    return NextResponse.json({
      success: true,
      report: {
        customers: {
          synced: customersInserted,
          skipped: customersSkipped,
          errors: customerErrors
        },
        products: {
          synced: productsInserted,
          skipped: productsSkipped,
          errors: productErrors
        }
      }
    })

  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}
