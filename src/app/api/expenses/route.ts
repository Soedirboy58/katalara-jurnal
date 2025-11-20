import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Force dynamic rendering to fix cookies issue
export const dynamic = 'force-dynamic'

// POST: Create new expense
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
      receipt_filename
    } = body

    // Validate required fields
    if (!amount || !category || !payment_method) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, category, payment_method' }, 
        { status: 400 }
      )
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Insert expense (dengan owner_id dan user_id untuk backward compatibility)
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        owner_id: user.id,
        user_id: user.id,
        expense_date: expense_date || new Date().toISOString().split('T')[0],
        amount: parseFloat(amount),
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
      })
      .select()
      .single()

    if (error) {
      console.error('Insert expense error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })

  } catch (error: any) {
    console.error('POST /api/expenses error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET: Fetch expenses with filters
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
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build query (support owner_id atau user_id)
    let query = supabase
      .from('expenses')
      .select('*', { count: 'exact' })
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

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Fetch expenses error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
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
