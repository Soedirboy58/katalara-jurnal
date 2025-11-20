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
