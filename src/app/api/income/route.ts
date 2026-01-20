import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const toNumber = (v: any): number => {
  const n = typeof v === 'number' ? v : Number((v ?? '').toString().replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

async function updateProductStockBestEffort(supabase: any, productId: string, nextStock: number) {
  const both = await supabase.from('products').update({ stock: nextStock, stock_quantity: nextStock }).eq('id', productId)
  if (!both.error) return

  const msg = (both.error as any)?.message?.toString()?.toLowerCase?.() || ''
  const code = ((both.error as any)?.code || '').toString()
  const isMissingColumn = code === '42703' || msg.includes('column') || msg.includes('stock_quantity') || msg.includes('stock')
  if (!isMissingColumn) return

  try {
    await supabase.from('products').update({ stock_quantity: nextStock }).eq('id', productId)
  } catch {
    // ignore
  }
  try {
    await supabase.from('products').update({ stock: nextStock }).eq('id', productId)
  } catch {
    // ignore
  }
}

async function adjustStockBestEffort(supabase: any, productId: string, quantityChange: number, notes?: string) {
  const qty = Number(quantityChange)
  if (!productId || !Number.isFinite(qty) || qty === 0) return

  try {
    const { data, error } = await supabase.rpc('adjust_stock', {
      p_product_id: productId,
      p_quantity_change: qty,
      p_notes: notes || null
    })

    if (!error) {
      if (data && typeof data === 'object' && (data as any).new_stock !== undefined) {
        const next = Number((data as any).new_stock)
        if (Number.isFinite(next)) await updateProductStockBestEffort(supabase, productId, next)
      }
      return
    }

    const msg = (error as any)?.message?.toString()?.toLowerCase?.() || ''
    const code = ((error as any)?.code || '').toString()
    const isMissingRpc = msg.includes('adjust_stock') && (msg.includes('does not exist') || msg.includes('not found') || msg.includes('function'))
    if (!isMissingRpc && code && code !== '42883') return
  } catch {
    // ignore and fall through to direct update
  }

  try {
    const stockRow = await supabase
      .from('products')
      .select('stock_quantity, stock, current_stock')
      .eq('id', productId)
      .single()

    const currentStockRaw =
      (stockRow.data as any)?.stock_quantity ??
      (stockRow.data as any)?.stock ??
      (stockRow.data as any)?.current_stock ??
      0

    const nextStock = Math.max(0, (toNumber(currentStockRaw) || 0) + qty)
    await updateProductStockBestEffort(supabase, productId, nextStock)
  } catch {
    // ignore
  }
}

// GET - Fetch incomes with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const incomeType = searchParams.get('income_type')
    const category = searchParams.get('category')
    const paymentStatus = searchParams.get('payment_status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('incomes')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('income_date', { ascending: false })
      .order('created_at', { ascending: false })

    // Apply filters
    if (startDate) {
      query = query.gte('income_date', startDate)
    }
    if (endDate) {
      query = query.lte('income_date', endDate)
    }
    if (incomeType) {
      query = query.eq('income_type', incomeType)
    }
    if (category) {
      query = query.eq('category', category)
    }
    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching incomes:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      count: count || 0
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - Create new income
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate required fields
    if (!body.income_date || !body.income_type || !body.category || !body.amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Prepare income data
    const incomeData = {
      user_id: user.id,
      income_date: body.income_date,
      income_type: body.income_type,
      category: body.category,
      amount: body.amount,
      description: body.description || null,
      notes: body.notes || null,
      payment_method: body.payment_method || 'Tunai',
      // Payment tracking fields
      payment_type: body.payment_type || 'cash',
      payment_status: body.payment_status || 'Lunas',
      due_date: body.due_date || null,
      customer_id: body.customer_id || null, // FIXED: customer reference
      // Product sales specific
      product_id: body.product_id || null,
      quantity: body.quantity || null,
      price_per_unit: body.price_per_unit || null,
      // Multi-items data (if applicable)
      line_items: body.line_items || null,
      subtotal: body.subtotal || null,
      discount: body.discount || null,
      tax_ppn: body.tax_ppn || null,
      tax_pph: body.tax_pph || null,
      other_fees: body.other_fees || null,
      down_payment: body.down_payment || null,
      remaining: body.remaining || null
    }

    // Insert income
    const { data, error } = await supabase
      .from('incomes')
      .insert(incomeData)
      .select()
      .single()

    if (error) {
      console.error('Error creating income:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // If product sales, update product stock (reduce)
    {
      // Parse line_items if it's a JSON string
      let lineItemsArray: any = body.line_items
      if (typeof lineItemsArray === 'string') {
        try {
          lineItemsArray = JSON.parse(lineItemsArray)
        } catch {
          lineItemsArray = []
        }
      }

      const items: Array<any> = Array.isArray(lineItemsArray) ? lineItemsArray : []

      // Prefer multi-item sales payload (compat mode from useIncomes fallback)
      if (items.length > 0) {
        for (const it of items) {
          const productId = (it?.product_id || '').toString() || null
          const qty = toNumber(it?.qty ?? it?.quantity ?? 0)
          if (!productId || qty <= 0) continue
          // Sales reduce stock
          await adjustStockBestEffort(supabase, productId, -qty, `Sale (legacy incomes) ${data.id}`)
        }
      } else {
        // Legacy single-item payload
        const productId = (body.product_id || '').toString() || null
        const qty = toNumber(body.quantity ?? body.qty ?? 0)
        if (productId && qty > 0) {
          await adjustStockBestEffort(supabase, productId, -qty, `Sale (legacy incomes) ${data.id}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Pendapatan berhasil dicatat'
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update existing income
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      )
    }

    // Prepare update data (exclude user_id from updates)
    const incomeData = {
      income_date: updateData.income_date,
      income_type: updateData.income_type,
      category: updateData.category,
      amount: updateData.amount,
      description: updateData.description || null,
      notes: updateData.notes || null,
      payment_method: updateData.payment_method || 'Tunai',
      payment_type: updateData.payment_type || 'cash',
      payment_status: updateData.payment_status || 'Lunas',
      due_date: updateData.due_date || null,
      customer_id: updateData.customer_id || null,
      product_id: updateData.product_id || null,
      quantity: updateData.quantity || null,
      price_per_unit: updateData.price_per_unit || null,
      line_items: updateData.line_items || null,
      subtotal: updateData.subtotal || null,
      discount: updateData.discount || null,
      tax_ppn: updateData.tax_ppn || null,
      tax_pph: updateData.tax_pph || null,
      other_fees: updateData.other_fees || null,
      down_payment: updateData.down_payment || null,
      remaining: updateData.remaining || null
    }

    // Update income (only user's own income)
    const { data, error } = await supabase
      .from('incomes')
      .update(incomeData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating income:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Income not found or unauthorized' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Transaksi berhasil diupdate'
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete income(s)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No IDs provided' },
        { status: 400 }
      )
    }

    // 🔄 RESTORE STOCK: Fetch all incomes first to restore stock
    const { data: incomes, error: fetchError } = await supabase
      .from('incomes')
      .select('id, category, product_id, quantity')
      .in('id', ids)
      .eq('user_id', user.id)

    // ⚠️ STOCK TRACKING DISABLED - stock_quantity column doesn't exist
    // TODO: Implement stock restoration with stock_movements table
    if (!fetchError && incomes && incomes.length > 0) {
      console.log(`📦 Stock restoration pending for ${incomes.length} deleted transactions`)
      // Stock movements will be tracked in stock_movements table
    }

    // Delete incomes (only user's own incomes)
    const { error } = await supabase
      .from('incomes')
      .delete()
      .in('id', ids)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting incomes:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${ids.length} pendapatan berhasil dihapus`
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
