import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/investments - Get all investments
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // deposit, stocks, bonds, mutual_funds, property
    const status = searchParams.get('status')

    let query = supabase
      .from('investments')
      .select(`
        *,
        investment_returns(count, return_amount.sum())
      `)
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })

    if (type) {
      query = query.eq('investment_type', type)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: investments, error } = await query

    if (error) throw error

    return NextResponse.json({ investments })

  } catch (error: any) {
    console.error('Error fetching investments:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch investments' },
      { status: 500 }
    )
  }
}

// POST /api/investments - Create new investment
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    const required = [
      'investment_type',
      'investment_name',
      'principal_amount',
      'start_date'
    ]

    for (const field of required) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return NextResponse.json(
          { error: `Field '${field}' is required` },
          { status: 400 }
        )
      }
    }

    // Validate investment type
    const validTypes = ['deposit', 'stocks', 'bonds', 'mutual_funds', 'property']
    if (!validTypes.includes(body.investment_type)) {
      return NextResponse.json(
        { error: `Invalid investment_type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const principalAmount = parseFloat(body.principal_amount)

    const investmentData = {
      user_id: user.id,
      investment_type: body.investment_type,
      investment_name: body.investment_name,
      principal_amount: principalAmount,
      current_value: body.current_value ? parseFloat(body.current_value) : principalAmount,
      interest_rate: body.interest_rate ? parseFloat(body.interest_rate) : null,
      investment_term_months: body.investment_term_months ? parseInt(body.investment_term_months) : null,
      start_date: body.start_date,
      maturity_date: body.maturity_date || null,
      bank_name: body.bank_name || null,
      account_number: body.account_number || null,
      auto_rollover: body.auto_rollover || false,
      status: 'active',
      total_returns: 0,
      notes: body.notes || null,
      expense_transaction_id: body.expense_transaction_id || null
    }

    const { data: investment, error } = await supabase
      .from('investments')
      .insert(investmentData)
      .select()
      .single()

    if (error) throw error

    // Optionally create expense transaction for the investment
    if (body.create_expense && body.transaction_date) {
      const expenseData = {
        user_id: user.id,
        category: 'investment',
        subcategory: body.investment_type,
        amount: principalAmount,
        transaction_date: body.transaction_date,
        description: `Investasi ${body.investment_name}`,
        payment_method: body.payment_method || 'transfer',
        notes: body.notes || null
      }

      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert(expenseData)
        .select()
        .single()

      if (!expenseError) {
        // Link expense to investment
        await supabase
          .from('investments')
          .update({ expense_transaction_id: expense.id })
          .eq('id', investment.id)
      }
    }

    return NextResponse.json({
      message: 'Investment created successfully',
      investment
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating investment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create investment' },
      { status: 500 }
    )
  }
}
