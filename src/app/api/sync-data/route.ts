import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type TransactionsUserColumn = 'owner_id' | 'user_id'
type CustomersUserColumn = 'owner_id' | 'user_id'

async function getTransactionsUserColumn(
  supabase: any,
  userId: string
): Promise<TransactionsUserColumn> {
  const isMissingColumn = (err: any, col: string) => {
    const code = (err?.code || err?.error_code || '').toString().toUpperCase()
    if (code === '42703') return true

    const msg = (err?.message || err?.details || '').toString().toLowerCase()
    const c = col.toLowerCase()

    if (code.startsWith('PGRST')) {
      if (msg.includes('schema cache') && msg.includes(c)) return true
      if (msg.includes('could not find') && msg.includes(c) && (msg.includes('column') || msg.includes('field'))) return true
      if (msg.includes('unknown field') && msg.includes(c)) return true
    }

    if (!msg.includes('does not exist')) return false
    return (
      msg.includes(`transactions.${c}`) ||
      msg.includes(`column transactions.${c}`) ||
      msg.includes(`column \"${c}\"`) ||
      msg.includes(`\"${c}\" of relation \"transactions\"`) ||
      msg.includes(` ${c} `)
    )
  }

  const hasColumn = async (col: TransactionsUserColumn) => {
    const { error } = await supabase.from('transactions').select(col).limit(1)
    if (!error) return true
    if (isMissingColumn(error, col)) return false
    return true
  }

  if (await hasColumn('owner_id')) return 'owner_id'
  if (await hasColumn('user_id')) return 'user_id'
  return 'owner_id'
}

async function getCustomersUserColumn(
  supabase: any,
  userId: string
): Promise<CustomersUserColumn> {
  const isMissingColumn = (err: any, col: string) => {
    const code = (err?.code || err?.error_code || '').toString().toUpperCase()
    if (code === '42703') return true

    const msg = (err?.message || err?.details || '').toString().toLowerCase()
    const c = col.toLowerCase()

    if (code.startsWith('PGRST')) {
      if (msg.includes('schema cache') && msg.includes(c)) return true
      if (msg.includes('could not find') && msg.includes(c) && (msg.includes('column') || msg.includes('field'))) return true
      if (msg.includes('unknown field') && msg.includes(c)) return true
    }

    if (!msg.includes('does not exist')) return false
    return (
      msg.includes(`customers.${c}`) ||
      msg.includes(`column customers.${c}`) ||
      msg.includes(`column \"${c}\"`) ||
      msg.includes(`\"${c}\" of relation \"customers\"`) ||
      msg.includes(` ${c} `)
    )
  }

  const hasColumn = async (col: CustomersUserColumn) => {
    const { error } = await supabase.from('customers').select(col).limit(1)
    if (!error) return true
    if (isMissingColumn(error, col)) return false
    return true
  }

  if (await hasColumn('owner_id')) return 'owner_id'
  if (await hasColumn('user_id')) return 'user_id'
  return 'owner_id'
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const normalizePhone = (v: any) => (v ?? '').toString().replace(/\D/g, '').trim()
    const normalizeName = (v: any) => (v ?? '').toString().trim().toLowerCase()

    const txUserCol = await getTransactionsUserColumn(supabase, user.id)
    const customersUserCol = await getCustomersUserColumn(supabase, user.id)

    // Load existing customers
    const { data: existingCustomers, error: existingCustomersError } = await supabase
      .from('customers')
      .select('id, name, phone')
      .eq(customersUserCol, user.id)

    if (existingCustomersError) {
      return NextResponse.json({ success: false, error: existingCustomersError.message }, { status: 500 })
    }

    const customerByPhone = new Map<string, any>()
    const customerByName = new Map<string, any>()
    for (const c of existingCustomers || []) {
      const p = normalizePhone((c as any).phone)
      const n = normalizeName((c as any).name)
      if (p) customerByPhone.set(p, c)
      if (n) customerByName.set(n, c)
    }

    // Load transactions (source of truth for income/sales)
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('id, customer_id, customer_name, customer_phone, customer_address')
      .eq(txUserCol, user.id)

    if (txError) {
      return NextResponse.json({ success: false, error: txError.message }, { status: 500 })
    }

    let customersInserted = 0
    let customersLinked = 0
    const customerErrors: string[] = []

    for (const t of transactions || []) {
      const customerNameRaw = (t as any).customer_name
      const customerName = (customerNameRaw ?? '').toString().trim()
      if (!customerName || customerName.toLowerCase() === 'umum / walk-in') continue

      const phoneNorm = normalizePhone((t as any).customer_phone)
      const nameNorm = normalizeName(customerName)

      let customer = phoneNorm ? customerByPhone.get(phoneNorm) : undefined
      if (!customer && nameNorm) customer = customerByName.get(nameNorm)

      // Ensure customer exists
      if (!customer) {
        const { data: inserted, error: insertError } = await supabase
          .from('customers')
          .insert({
            [customersUserCol]: user.id,
            name: customerName,
            phone: (t as any).customer_phone || null,
            address: (t as any).customer_address || null,
            is_active: true
          })
          .select('id, name, phone')
          .single()

        if (insertError || !inserted) {
          customerErrors.push(`${customerName}: ${insertError?.message || 'Failed to insert customer'}`)
          continue
        }

        customer = inserted
        customersInserted++

        const p = normalizePhone((inserted as any).phone)
        const n = normalizeName((inserted as any).name)
        if (p) customerByPhone.set(p, inserted)
        if (n) customerByName.set(n, inserted)
      }

      // Backfill customer_id on transactions
      if (!(t as any).customer_id && (customer as any).id) {
        const { error: linkError } = await supabase
          .from('transactions')
          .update({ customer_id: (customer as any).id })
          .eq('id', (t as any).id)
          .eq(txUserCol, user.id)

        if (!linkError) customersLinked++
      }
    }

    // Load existing products
    const { data: existingProducts, error: existingProductsError } = await supabase
      .from('products')
      .select('id, name')
      .eq('user_id', user.id)

    if (existingProductsError) {
      return NextResponse.json({ success: false, error: existingProductsError.message }, { status: 500 })
    }

    const productByName = new Map<string, any>()
    for (const p of existingProducts || []) {
      const n = normalizeName((p as any).name)
      if (n) productByName.set(n, p)
    }

    // Load transaction items for this owner's transactions
    const txIds = (transactions || []).map((t: any) => t.id)
    const productErrors: string[] = []
    let productsInserted = 0
    let productsLinked = 0

    const chunkSize = 100
    for (let i = 0; i < txIds.length; i += chunkSize) {
      const chunk = txIds.slice(i, i + chunkSize)
      const { data: items, error: itemsError } = await supabase
        .from('transaction_items')
        .select('id, transaction_id, product_id, product_name, unit, price')
        .in('transaction_id', chunk)

      if (itemsError) {
        productErrors.push(itemsError.message)
        continue
      }

      for (const it of items || []) {
        if ((it as any).product_id) continue
        const productName = ((it as any).product_name ?? '').toString().trim()
        if (!productName) continue

        const nameNorm = normalizeName(productName)
        let product = nameNorm ? productByName.get(nameNorm) : undefined

        if (!product) {
          const { data: inserted, error: insertError } = await supabase
            .from('products')
            .insert({
              user_id: user.id,
              name: productName,
              unit: (it as any).unit || 'pcs',
              selling_price: Number((it as any).price || 0),
              cost_price: 0,
              min_stock_alert: 0,
              track_inventory: true,
              is_active: true
            })
            .select('id, name')
            .single()

          if (insertError || !inserted) {
            productErrors.push(`${productName}: ${insertError?.message || 'Failed to insert product'}`)
            continue
          }

          product = inserted
          productsInserted++
          const n = normalizeName((inserted as any).name)
          if (n) productByName.set(n, inserted)
        }

        const { error: linkError } = await supabase
          .from('transaction_items')
          .update({ product_id: (product as any).id })
          .eq('id', (it as any).id)

        if (!linkError) productsLinked++
      }
    }

    return NextResponse.json({
      success: true,
      report: {
        customers: {
          inserted: customersInserted,
          linked: customersLinked,
          errors: customerErrors
        },
        products: {
          inserted: productsInserted,
          linked: productsLinked,
          errors: productErrors
        },
        transactions: {
          scanned: (transactions || []).length
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
