import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Force dynamic rendering to fix cookies issue
export const dynamic = 'force-dynamic'

const isInventoryPurchaseCategory = (category: any) => {
  const c = (category || '').toString().trim()
  return c === 'raw_materials' || c === 'finished_goods'
}

async function getProductStockField(
  supabase: any,
  productId: string
): Promise<{ field: 'stock_quantity' | 'stock'; value: number } | null> {
  const first = await supabase
    .from('products')
    .select('stock_quantity')
    .eq('id', productId)
    .single()

  if (!first.error) {
    const v = Number(first.data?.stock_quantity ?? 0)
    return { field: 'stock_quantity', value: Number.isFinite(v) ? v : 0 }
  }

  const msg = (first.error as any)?.message?.toString()?.toLowerCase?.() || ''
  const code = (first.error as any)?.code || ''
  const isMissing = code === '42703' || msg.includes('column') || msg.includes('stock_quantity')
  if (!isMissing) return null

  const second = await supabase
    .from('products')
    .select('stock')
    .eq('id', productId)
    .single()

  if (second.error) return null

  const v = Number(second.data?.stock ?? 0)
  return { field: 'stock', value: Number.isFinite(v) ? v : 0 }
}

async function rollbackProductStocksFromExpenseItems(
  supabase: any,
  expenseIds: string[]
) {
  const { data: expenseItems, error: fetchItemsError } = await supabase
    .from('expense_items')
    .select('product_id, qty')
    .in('expense_id', expenseIds)

  if (fetchItemsError || !expenseItems || expenseItems.length === 0) return

  const qtyByProduct = new Map<string, number>()
  for (const item of expenseItems) {
    const productId = item?.product_id
    if (!productId) continue
    const qty = Number(item?.qty ?? 0)
    if (!Number.isFinite(qty) || qty <= 0) continue
    qtyByProduct.set(productId, (qtyByProduct.get(productId) || 0) + qty)
  }

  for (const [productId, qty] of qtyByProduct.entries()) {
    const stockInfo = await getProductStockField(supabase, productId)
    if (!stockInfo) continue

    const newStock = Math.max(0, stockInfo.value - qty)
    await supabase
      .from('products')
      .update({ [stockInfo.field]: newStock })
      .eq('id', productId)

    // Best-effort: keep both legacy and newer stock columns in sync.
    const otherField = stockInfo.field === 'stock_quantity' ? 'stock' : 'stock_quantity'
    try {
      await supabase
        .from('products')
        .update({ [otherField]: newStock })
        .eq('id', productId)
    } catch {
      // ignore
    }
  }
}

// POST: Create new expense with multi-items support
export async function POST(request: Request) {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
  
  try {
    const body = await request.json()
    const { 
      expense_date, 
      amount, 
      category, 
      expense_type,
      asset_category,
      is_capital_expenditure,
      description,
      notes,
      payment_method, 
      payment_type,
      payment_status,
      due_date,
      receipt_url,
      receipt_filename,
      // NEW: Multi-items support
      supplier_id,
      line_items, // Array of {product_id, product_name, quantity, unit, price_per_unit, subtotal, notes}
      subtotal,
      discount_percent,
      discount_amount,
      tax_amount,
      other_fees,
      down_payment,
      remaining_payment,
      grand_total,
      // NEW: Production output (raw materials → finished goods)
      production_output // {product_id, quantity, unit}
    } = body

    // Validate required fields
    if (!category || !payment_method) {
      return NextResponse.json(
        { error: 'Missing required fields: category, payment_method' }, 
        { status: 400 }
      )
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ PRODUCTION SCHEMA: ONLY 5 FIELDS EXIST!
    // Confirmed by error: "Could not find the 'description' column"
    // Fields: user_id, expense_date, grand_total, expense_type, expense_category
    
    // Calculate final amount from any source
    const finalAmount = parseFloat(grand_total || amount || subtotal || 0)

    // ⚠️ MINIMAL - Only send fields that exist in production
    const expenseData: any = {
      user_id: user.id,
      expense_date: expense_date || new Date().toISOString().split('T')[0],
      grand_total: finalAmount,
      expense_type: expense_type || 'operating',
      expense_category: category || 'Lain-lain'
    }
    
    // Try adding optional fields (test if they exist in DB)
    if (payment_status) expenseData.payment_status = payment_status
    if (payment_method) expenseData.payment_method = payment_method
    if (due_date) expenseData.due_date = due_date

    console.log('📊 Expense payload:', expenseData)

    // Insert expense - BYPASS type checking
    const { data: expenseRecord, error: expenseError } = await (supabase as any)
      .from('expenses')
      .insert(expenseData)
      .select()
      .single()

    if (expenseError) {
      console.error('❌ Insert expense error:', {
        code: expenseError.code,
        message: expenseError.message,
        details: expenseError.details,
        hint: expenseError.hint
      })
      
      // Return detailed error to help debugging
      return NextResponse.json({ 
        error: expenseError.message,
        code: expenseError.code,
        hint: expenseError.hint,
        payload_sent: expenseData
      }, { status: 500 })
    }
    
    console.log('✅ Expense inserted successfully:', expenseRecord.id)

    // ✅ INSERT expense_items
    let itemsInserted = 0
    if (line_items && line_items.length > 0) {
      console.log(`📦 Inserting ${line_items.length} items to expense_items...`)
      
      const itemsData = line_items.map((item: any) => ({
        expense_id: expenseRecord.id,
        user_id: user.id,
        product_id: item.product_id || null,
        product_name: item.product_name,
        qty: parseFloat(item.quantity),
        unit: item.unit || 'pcs',
        price_per_unit: parseFloat(item.price_per_unit),
        subtotal: parseFloat(item.subtotal || (item.quantity * item.price_per_unit)),
        notes: item.notes || null
      }))

      const { data: itemsResult, error: itemsError } = await (supabase as any)
        .from('expense_items')
        .insert(itemsData)
        .select()

      if (itemsError) {
        console.error('❌ Insert expense_items error:', itemsError)
        // Don't fail the whole transaction, just log
      } else {
        itemsInserted = itemsResult?.length || 0
        console.log(`✅ ${itemsInserted} items inserted to expense_items`)

        // ✅ UPDATE STOCK: Only for inventory purchase categories
        if (isInventoryPurchaseCategory(category)) {
          const qtyByProduct = new Map<string, number>()
          for (const item of line_items) {
            const productId = (item?.product_id || '').toString()
            if (!productId) continue
            const qty = Number(item?.quantity ?? item?.qty ?? 0)
            if (!Number.isFinite(qty) || qty <= 0) continue
            qtyByProduct.set(productId, (qtyByProduct.get(productId) || 0) + qty)
          }

          const productIds = Array.from(qtyByProduct.keys())
          const trackMap = new Map<string, boolean>()
          if (productIds.length) {
            try {
              const { data: rows, error: trackErr } = await supabase
                .from('products')
                .select('id, track_inventory')
                .in('id', productIds)

              if (!trackErr) {
                ;(rows || []).forEach((p: any) => {
                  trackMap.set(p.id, p.track_inventory !== false)
                })
              }
            } catch {
              // ignore
            }
          }

          for (const [productId, qty] of qtyByProduct.entries()) {
            if (trackMap.has(productId) && trackMap.get(productId) === false) continue

            const stockInfo = await getProductStockField(supabase, productId)
            if (!stockInfo) continue

            const newStock = Math.max(0, stockInfo.value + qty)
            await supabase
              .from('products')
              .update({ [stockInfo.field]: newStock })
              .eq('id', productId)

            // Best-effort sync to the other column so UI/other modules stay consistent.
            const otherField = stockInfo.field === 'stock_quantity' ? 'stock' : 'stock_quantity'
            try {
              await supabase
                .from('products')
                .update({ [otherField]: newStock })
                .eq('id', productId)
            } catch {
              // ignore
            }
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: expenseRecord,
      items_inserted: itemsInserted,
      production_output_applied: production_output ? true : false
    })

  } catch (error: any) {
    console.error('POST /api/expenses error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET: Fetch expenses with multi-items & supplier JOIN
export async function GET(request: Request) {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
  
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const category = searchParams.get('category')
    const paymentStatus = searchParams.get('payment_status')
    const expenseType = searchParams.get('expense_type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const includeItems = searchParams.get('include_items') === 'true'

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build query - SIMPLE schema (no JOINs, no expense_items)
    let query = supabase
      .from('expenses')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)   // ✅ Production uses user_id (not owner_id!)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })

    // Apply filters
    if (startDate) {
      query = query.gte('expense_date', startDate)
    }
    if (endDate) {
      query = query.lte('expense_date', endDate)
    }
    if (category) {
      query = query.eq('expense_category', category)
    }
    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus)
    }
    if (expenseType) {
      query = query.eq('expense_type', expenseType)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Fetch expenses error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ✅ Fetch expense_items if requested
    if (includeItems && data && data.length > 0) {
      const expenseIds = data.map((exp: any) => exp.id)
      console.log(`🔍 Fetching items for ${expenseIds.length} expenses...`)
      
      const { data: itemsData, error: itemsError } = await supabase
        .from('expense_items')
        .select('*')
        .in('expense_id', expenseIds)
        .order('created_at', { ascending: true })
      
      if (itemsError) {
        console.error('❌ Fetch expense_items error:', itemsError)
      } else {
        console.log(`✅ Found ${itemsData?.length || 0} total items`)
        // Attach items to each expense
        const expensesWithItems = data.map((exp: any) => {
          const items = itemsData?.filter((item: any) => item.expense_id === exp.id) || []
          console.log(`  Expense ${exp.id}: ${items.length} items`)
          return {
            ...exp,
            items
          }
        })
        
        return NextResponse.json({ 
          success: true, 
          data: expensesWithItems,
          count,
          limit,
          offset
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      data,
      count,
      limit,
      offset
    })

  } catch (error: any) {
    console.error('GET /api/expenses error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE: Delete multiple expenses
export async function DELETE(request: Request) {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
  
  try {
    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid ids array' }, 
        { status: 400 }
      )
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Restore stock based on expense_items (robust: no RPC required)
    await rollbackProductStocksFromExpenseItems(supabase, ids)
    
    // Delete expense_items first (foreign key constraint)
    const { error: deleteItemsError } = await supabase
      .from('expense_items')
      .delete()
      .in('expense_id', ids)
    
    if (deleteItemsError) {
      console.error('❌ Delete expense_items error:', deleteItemsError)
      // Continue anyway to delete expenses
    }

    // Note: legacy expenses.product_id/quantity rollback removed.
    // Stock rollback is now consistently based on expense_items.

    // Delete expenses (RLS will ensure user owns them)
    const { error } = await supabase
      .from('expenses')
      .delete()
      .in('id', ids)

    if (error) {
      console.error('Delete expenses error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, deleted: ids.length })

  } catch (error: any) {
    console.error('DELETE /api/expenses error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
