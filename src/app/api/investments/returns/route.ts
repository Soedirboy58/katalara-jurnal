import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/investments/returns - Record investment return (interest, dividend, etc)
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    const required = ['investment_id', 'return_date', 'return_amount', 'return_type']

    for (const field of required) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return NextResponse.json(
          { error: `Field '${field}' is required` },
          { status: 400 }
        )
      }
    }

    // Validate return type
    const validTypes = ['interest', 'dividend', 'capital_gain', 'liquidation']
    if (!validTypes.includes(body.return_type)) {
      return NextResponse.json(
        { error: `Invalid return_type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Get investment details
    const { data: investment, error: investmentError } = await supabase
      .from('investments')
      .select('*')
      .eq('id', body.investment_id)
      .eq('user_id', user.id)
      .single()

    if (investmentError) {
      if (investmentError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Investment not found' }, { status: 404 })
      }
      throw investmentError
    }

    const returnAmount = parseFloat(body.return_amount)

    // Create income transaction for the return
    const incomeData = {
      user_id: user.id,
      category: 'investment_return',
      subcategory: body.return_type,
      amount: returnAmount,
      transaction_date: body.return_date,
      description: `${body.return_type === 'interest' ? 'Bunga' : body.return_type === 'dividend' ? 'Dividen' : 'Return'} dari ${investment.investment_name}`,
      payment_method: body.payment_method || 'transfer',
      notes: body.notes || null
    }

    const { data: income, error: incomeError } = await supabase
      .from('incomes')
      .insert(incomeData)
      .select()
      .single()

    if (incomeError) throw incomeError

    // Record investment return
    const returnData = {
      investment_id: body.investment_id,
      return_date: body.return_date,
      return_amount: returnAmount,
      return_type: body.return_type,
      income_transaction_id: income.id,
      notes: body.notes || null
    }

    const { data: returnRecord, error: returnError } = await supabase
      .from('investment_returns')
      .insert(returnData)
      .select()
      .single()

    if (returnError) {
      // Rollback: delete income if return record fails
      await supabase.from('incomes').delete().eq('id', income.id)
      throw returnError
    }

    // Update investment totals
    const { data: allReturns } = await supabase
      .from('investment_returns')
      .select('return_amount')
      .eq('investment_id', body.investment_id)

    const totalReturns = allReturns?.reduce(
      (sum, r) => sum + parseFloat(r.return_amount as any),
      0
    ) || 0

    const currentValue = investment.principal_amount + totalReturns

    // If liquidation, mark investment as liquidated
    const updateData: any = {
      total_returns: totalReturns,
      current_value: currentValue
    }

    if (body.return_type === 'liquidation') {
      updateData.status = 'liquidated'
    }

    await supabase
      .from('investments')
      .update(updateData)
      .eq('id', body.investment_id)

    return NextResponse.json({
      message: 'Investment return recorded successfully',
      return: returnRecord,
      income
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error recording investment return:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to record investment return' },
      { status: 500 }
    )
  }
}

// GET /api/investments/returns - Get investment returns
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const investmentId = searchParams.get('investment_id')
    const returnType = searchParams.get('return_type')

    let query = supabase
      .from('investment_returns')
      .select(`
        *,
        investments!inner(
          investment_name,
          investment_type,
          user_id
        )
      `)
      .eq('investments.user_id', user.id)
      .order('return_date', { ascending: false })

    if (investmentId) {
      query = query.eq('investment_id', investmentId)
    }

    if (returnType) {
      query = query.eq('return_type', returnType)
    }

    const { data: returns, error } = await query

    if (error) throw error

    return NextResponse.json({ returns })

  } catch (error: any) {
    console.error('Error fetching investment returns:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch investment returns' },
      { status: 500 }
    )
  }
}
