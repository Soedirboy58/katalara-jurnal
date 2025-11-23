import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/investors - Get all investor funding records
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('investor_funding')
      .select(`
        *,
        profit_sharing_payments(count)
      `)
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: investors, error } = await query

    if (error) throw error

    return NextResponse.json({ investors })

  } catch (error: any) {
    console.error('Error fetching investors:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch investors' },
      { status: 500 }
    )
  }
}

// POST /api/investors - Create new investor funding
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
      'investment_amount',
      'profit_share_percentage',
      'payment_frequency',
      'start_date',
      'investor_name'
    ]

    for (const field of required) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return NextResponse.json(
          { error: `Field '${field}' is required` },
          { status: 400 }
        )
      }
    }

    // Validate profit share percentage
    const profitShare = parseFloat(body.profit_share_percentage)
    if (profitShare <= 0 || profitShare > 100) {
      return NextResponse.json(
        { error: 'Profit share percentage must be between 0 and 100' },
        { status: 400 }
      )
    }

    const fundingData = {
      user_id: user.id,
      investment_amount: parseFloat(body.investment_amount),
      profit_share_percentage: profitShare,
      payment_frequency: body.payment_frequency,
      start_date: body.start_date,
      end_date: body.end_date || null,
      duration_months: body.duration_months ? parseInt(body.duration_months) : null,
      investor_name: body.investor_name,
      investor_contact: body.investor_contact || null,
      investor_bank_account: body.investor_bank_account || null,
      agreement_number: body.agreement_number || null,
      notes: body.notes || null,
      status: 'active',
      total_profit_shared: 0,
      income_transaction_id: body.income_transaction_id || null
    }

    const { data: funding, error } = await supabase
      .from('investor_funding')
      .insert(fundingData)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      message: 'Investor funding created successfully',
      funding
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating investor funding:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create investor funding' },
      { status: 500 }
    )
  }
}
