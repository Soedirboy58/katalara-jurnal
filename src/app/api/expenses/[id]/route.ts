import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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

    // First, get the expense details to restore stock if needed
    const { data: expense, error: fetchError } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    // 🔄 RESTORE STOCK: If this is a product purchase, restore the stock
    if (expense.product_id && expense.quantity) {
      console.log(`🔄 Restoring stock for deleted expense...`)
      
      // Get product details
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_quantity, track_inventory, name')
        .eq('id', expense.product_id)
        .single()

      if (!productError && product && product.track_inventory) {
        // SUBTRACT stock (expense delete = remove stock that was added)
        const restoredStock = (product.stock_quantity || 0) - parseFloat(expense.quantity)
        console.log(`  ➖ Restoring stock from ${product.stock_quantity} to ${restoredStock} for ${product.name}`)
        
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock_quantity: restoredStock })
          .eq('id', expense.product_id)
        
        if (updateError) {
          console.error('  ❌ Error restoring stock:', updateError)
        } else {
          console.log('  ✅ Stock restored successfully')
        }
      }
    }

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
      message: 'Expense deleted successfully' 
    })

  } catch (error: any) {
    console.error('DELETE /api/expenses/[id] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
