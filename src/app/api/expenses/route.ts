import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Force dynamic rendering to fix cookies issue
export const dynamic = 'force-dynamic'

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

    // Generate PO Number: PO/YYYY/XXXXXX
    const year = new Date().getFullYear()
    const { data: lastPO } = await supabase
      .from('expenses')
      .select('po_number')
      .like('po_number', `PO/${year}/%`)
      .order('po_number', { ascending: false })
      .limit(1)
      .single()

    let po_number = `PO/${year}/000001`
    if (lastPO && lastPO.po_number) {
      const lastNum = parseInt(lastPO.po_number.split('/')[2])
      const nextNum = (lastNum + 1).toString().padStart(6, '0')
      po_number = `PO/${year}/${nextNum}`
    }

    // Prepare expense data
    const expenseData: any = {
      owner_id: user.id,
      user_id: user.id,
      po_number,
      expense_date: expense_date || new Date().toISOString().split('T')[0],
      category,
      expense_type: expense_type || 'operating',
      asset_category: asset_category || null,
      is_capital_expenditure: is_capital_expenditure || false,
      description: description || null,
      notes: notes || null,
      payment_method,
      payment_type: payment_type || 'cash',
      payment_status: payment_status || 'Lunas',
      due_date: due_date || null,
      receipt_url: receipt_url || null,
      receipt_filename: receipt_filename || null
    }

    // Multi-items logic
    if (line_items && Array.isArray(line_items) && line_items.length > 0) {
      expenseData.supplier_id = supplier_id || null
      expenseData.subtotal = parseFloat(subtotal || 0)
      expenseData.discount_percent = parseFloat(discount_percent || 0)
      expenseData.discount_amount = parseFloat(discount_amount || 0)
      expenseData.tax_amount = parseFloat(tax_amount || 0)
      expenseData.other_fees = parseFloat(other_fees || 0)
      expenseData.down_payment = parseFloat(down_payment || 0)
      expenseData.remaining_payment = parseFloat(remaining_payment || 0)
      expenseData.grand_total = parseFloat(grand_total || 0)
      expenseData.amount = expenseData.grand_total
    } else {
      // Legacy single-item expense
      expenseData.amount = parseFloat(amount || 0)
    }

    // Insert expense
    const { data: expenseRecord, error: expenseError } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select()
      .single()

    if (expenseError) {
      console.error('Insert expense error:', expenseError)
      return NextResponse.json({ error: expenseError.message }, { status: 500 })
    }

    // Insert expense_items if multi-items
    if (line_items && line_items.length > 0) {
      const itemsToInsert = line_items.map((item: any) => ({
        expense_id: expenseRecord.id,
        product_id: item.product_id || null,
        product_name: item.product_name,
        quantity: parseFloat(item.quantity),
        unit: item.unit || 'pcs',
        price_per_unit: parseFloat(item.price_per_unit),
        subtotal: parseFloat(item.subtotal),
        notes: item.notes || null
      }))

      const { error: itemsError } = await supabase
        .from('expense_items')
        .insert(itemsToInsert)

      if (itemsError) {
        console.error('Insert expense_items error:', itemsError)
        // Rollback expense if items insert fails
        await supabase.from('expenses').delete().eq('id', expenseRecord.id)
        return NextResponse.json({ error: itemsError.message }, { status: 500 })
      }

      // Update product stock if product_id exists (auto inventory)
      for (const item of line_items) {
        if (item.product_id) {
          const { data: product } = await supabase
            .from('products')
            .select('stock_quantity, track_inventory')
            .eq('id', item.product_id)
            .single()

          if (product && product.track_inventory) {
            const newStock = (product.stock_quantity || 0) + parseFloat(item.quantity)
            await supabase
              .from('products')
              .update({ stock_quantity: newStock })
              .eq('id', item.product_id)
          }
        }
      }

      // Update supplier total_purchases & total_payables
      if (supplier_id) {
        const { data: supplier } = await supabase
          .from('suppliers')
          .select('total_purchases, total_payables')
          .eq('id', supplier_id)
          .single()

        if (supplier) {
          await supabase
            .from('suppliers')
            .update({
              total_purchases: (supplier.total_purchases || 0) + parseFloat(grand_total),
              total_payables: (supplier.total_payables || 0) + parseFloat(remaining_payment || 0)
            })
            .eq('id', supplier_id)
        }
      }
      
      // Handle production output (raw materials → finished goods)
      if (production_output && production_output.product_id && production_output.quantity) {
        const { data: finishedProduct } = await supabase
          .from('products')
          .select('stock_quantity, track_inventory, name')
          .eq('id', production_output.product_id)
          .single()

        if (finishedProduct && finishedProduct.track_inventory) {
          const newStock = (finishedProduct.stock_quantity || 0) + parseFloat(production_output.quantity)
          await supabase
            .from('products')
            .update({ stock_quantity: newStock })
            .eq('id', production_output.product_id)
          
          console.log(`✅ Production Output: ${finishedProduct.name} +${production_output.quantity} → ${newStock}`)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: expenseRecord,
      po_number,
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

    // Build query with supplier JOIN
    let query = supabase
      .from('expenses')
      .select(`
        *,
        supplier:suppliers(id, name, phone, email)
      `, { count: 'exact' })
      .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
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
      query = query.eq('category', category)
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

    // Fetch expense_items if requested
    if (includeItems && data && data.length > 0) {
      const expenseIds = data.map(exp => exp.id)
      const { data: items } = await supabase
        .from('expense_items')
        .select('*')
        .in('expense_id', expenseIds)

      // Attach items to expenses
      const expensesWithItems = data.map(expense => ({
        ...expense,
        items: items?.filter(item => item.expense_id === expense.id) || []
      }))

      return NextResponse.json({ 
        success: true, 
        data: expensesWithItems,
        count,
        limit,
        offset
      })
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

    // Delete expenses (RLS will ensure user owns them)
    // RLS policy sudah handle owner_id OR user_id
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
