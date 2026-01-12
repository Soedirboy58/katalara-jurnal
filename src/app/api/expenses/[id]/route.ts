import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function getProductStockField(
  supabase: any,
  productId: string
): Promise<{ field: 'stock_quantity' | 'stock'; value: number } | null> {
  // Prefer stock_quantity, fallback to stock
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
  expenseId: string
) {
  const { data: expenseItems, error: itemsError } = await supabase
    .from('expense_items')
    .select('product_id, qty')
    .eq('expense_id', expenseId)

  if (itemsError || !expenseItems || expenseItems.length === 0) return

  // Sum quantities per product to minimize queries
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

// PATCH: Update an expense
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const { id } = await params
  
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
    const body = await request.json()
    const { 
      expense_date, 
      amount, 
      category, 
      expense_type,
      asset_category,
      description,
      notes,
      payment_method, 
      payment_type,
      payment_status,
      due_date
    } = body

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update expense (RLS will ensure user owns it)
    const { data, error } = await supabase
      .from('expenses')
      .update({
        expense_date: expense_date || undefined,
        amount: amount ? parseFloat(amount) : undefined,
        category: category || undefined,
        expense_type: expense_type || undefined,
        asset_category: asset_category !== undefined ? asset_category : undefined,
        description: description !== undefined ? description : undefined,
        notes: notes !== undefined ? notes : undefined,
        payment_method: payment_method || undefined,
        payment_type: payment_type || undefined,
        payment_status: payment_status || undefined,
        due_date: due_date !== undefined ? due_date : undefined
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update expense error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Expense not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })

  } catch (error: any) {
    console.error('PATCH /api/expenses/[id] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE: Delete single expense transaction
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const { id } = await params
  
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
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure expense exists (and user has access via RLS)
    const { data: expense, error: fetchError } = await supabase
      .from('expenses')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Restore stock based on expense_items
    await rollbackProductStocksFromExpenseItems(supabase, id)

    // Delete items first (avoid FK issues)
    await supabase.from('expense_items').delete().eq('expense_id', id)

    // Delete the expense transaction
    const { error: deleteError } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Delete expense error:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Expense deleted successfully (stock restored when applicable)'
    })

  } catch (error: any) {
    console.error('DELETE /api/expenses/[id] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
