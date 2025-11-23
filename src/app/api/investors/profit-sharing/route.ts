import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/investors/profit-sharing - Record profit sharing payment
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
      'funding_id',
      'period_start',
      'period_end',
      'business_revenue',
      'business_expenses',
      'due_date'
    ]

    for (const field of required) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `Field '${field}' is required` },
          { status: 400 }
        )
      }
    }

    // Get investor funding details
    const { data: funding, error: fundingError } = await supabase
      .from('investor_funding')
      .select('*')
      .eq('id', body.funding_id)
      .eq('user_id', user.id)
      .single()

    if (fundingError) {
      if (fundingError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Investor funding not found' }, { status: 404 })
      }
      throw fundingError
    }

    // Calculate net profit and investor share
    const revenue = parseFloat(body.business_revenue)
    const expenses = parseFloat(body.business_expenses)
    const netProfit = revenue - expenses

    if (netProfit < 0) {
      return NextResponse.json(
        { error: 'Net profit is negative. Cannot distribute loss to investor.' },
        { status: 400 }
      )
    }

    const shareAmount = netProfit * (funding.profit_share_percentage / 100)

    const paymentData: any = {
      funding_id: body.funding_id,
      period_start: body.period_start,
      period_end: body.period_end,
      business_revenue: revenue,
      business_expenses: expenses,
      net_profit: netProfit,
      share_percentage: funding.profit_share_percentage,
      share_amount: Math.round(shareAmount * 100) / 100,
      due_date: body.due_date,
      status: body.status || 'pending',
      paid_date: body.paid_date || null,
      notes: body.notes || null,
      expense_transaction_id: null
    }

    // If status is 'paid', create expense transaction
    if (body.status === 'paid' && body.paid_date) {
      const expenseData = {
        user_id: user.id,
        category: 'investor_payment',
        subcategory: 'profit_sharing',
        amount: paymentData.share_amount,
        transaction_date: body.paid_date,
        description: `Bagi hasil ke ${funding.investor_name} - ${body.period_start} s/d ${body.period_end}`,
        payment_method: body.payment_method || 'transfer',
        notes: body.notes || null
      }

      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert(expenseData)
        .select()
        .single()

      if (expenseError) throw expenseError

      paymentData.expense_transaction_id = expense.id
    }

    const { data: payment, error: paymentError } = await supabase
      .from('profit_sharing_payments')
      .insert(paymentData)
      .select()
      .single()

    if (paymentError) throw paymentError

    // Update total_profit_shared in investor_funding
    const { data: allPayments } = await supabase
      .from('profit_sharing_payments')
      .select('share_amount')
      .eq('funding_id', body.funding_id)
      .eq('status', 'paid')

    const totalShared = allPayments?.reduce(
      (sum, p) => sum + parseFloat(p.share_amount as any),
      0
    ) || 0

    await supabase
      .from('investor_funding')
      .update({ total_profit_shared: totalShared })
      .eq('id', body.funding_id)

    return NextResponse.json({
      message: 'Profit sharing payment recorded successfully',
      payment
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error recording profit sharing:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to record profit sharing' },
      { status: 500 }
    )
  }
}

// GET /api/investors/profit-sharing - Get profit sharing payments
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fundingId = searchParams.get('funding_id')
    const status = searchParams.get('status')

    let query = supabase
      .from('profit_sharing_payments')
      .select(`
        *,
        investor_funding!inner(
          investor_name,
          user_id
        )
      `)
      .eq('investor_funding.user_id', user.id)
      .order('due_date', { ascending: false })

    if (fundingId) {
      query = query.eq('funding_id', fundingId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: payments, error } = await query

    if (error) throw error

    return NextResponse.json({ payments })

  } catch (error: any) {
    console.error('Error fetching profit sharing payments:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}
