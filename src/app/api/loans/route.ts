import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/loans - Get all loans for authenticated user
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query params for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // active, paid_off, defaulted
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('loans')
      .select(`
        *,
        loan_installments(count)
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('loan_date', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status)
    }

    const { data: loans, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      loans,
      total: count,
      limit,
      offset
    })

  } catch (error: any) {
    console.error('Error fetching loans:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch loans' },
      { status: 500 }
    )
  }
}

// POST /api/loans - Create new loan with auto-generated installments
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    const requiredFields = [
      'loan_amount',
      'interest_rate',
      'loan_term_months',
      'loan_date',
      'first_payment_date',
      'lender_name'
    ]

    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return NextResponse.json(
          { error: `Field '${field}' is required` },
          { status: 400 }
        )
      }
    }

    // Calculate monthly installment using anuitas formula
    // PMT = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
    const P = parseFloat(body.loan_amount)
    const annualRate = parseFloat(body.interest_rate) / 100
    const monthlyRate = annualRate / 12
    const n = parseInt(body.loan_term_months)
    
    let installmentAmount: number
    
    if (monthlyRate === 0) {
      // No interest case
      installmentAmount = P / n
    } else {
      // Anuitas formula
      installmentAmount = P * (monthlyRate * Math.pow(1 + monthlyRate, n)) / 
                         (Math.pow(1 + monthlyRate, n) - 1)
    }

    // Round to 2 decimals
    installmentAmount = Math.round(installmentAmount * 100) / 100

    // Create loan record
    const loanData = {
      user_id: user.id,
      loan_amount: P,
      interest_rate: parseFloat(body.interest_rate),
      loan_term_months: n,
      installment_amount: installmentAmount,
      installment_frequency: body.installment_frequency || 'monthly',
      loan_date: body.loan_date,
      first_payment_date: body.first_payment_date,
      lender_name: body.lender_name,
      lender_contact: body.lender_contact || null,
      purpose: body.purpose || null,
      notes: body.notes || null,
      status: 'active',
      total_paid: 0,
      remaining_balance: P,
      income_transaction_id: body.income_transaction_id || null
    }

    const { data: loan, error: loanError } = await supabase
      .from('loans')
      .insert(loanData)
      .select()
      .single()

    if (loanError) throw loanError

    // Generate installment schedule
    const installments = []
    let remainingPrincipal = P
    const firstPaymentDate = new Date(body.first_payment_date)

    for (let i = 1; i <= n; i++) {
      // Calculate due date (add months)
      const dueDate = new Date(firstPaymentDate)
      dueDate.setMonth(dueDate.getMonth() + (i - 1))

      // Calculate interest and principal for this installment
      const interestAmount = remainingPrincipal * monthlyRate
      const principalAmount = installmentAmount - interestAmount
      
      // Last installment adjustment (handle rounding errors)
      const isLastInstallment = i === n
      const adjustedPrincipal = isLastInstallment ? remainingPrincipal : principalAmount
      const adjustedInterest = isLastInstallment ? (installmentAmount - adjustedPrincipal) : interestAmount
      const adjustedTotal = adjustedPrincipal + adjustedInterest

      installments.push({
        loan_id: loan.id,
        installment_number: i,
        due_date: dueDate.toISOString().split('T')[0],
        principal_amount: Math.round(adjustedPrincipal * 100) / 100,
        interest_amount: Math.round(adjustedInterest * 100) / 100,
        total_amount: Math.round(adjustedTotal * 100) / 100,
        status: 'pending'
      })

      remainingPrincipal -= adjustedPrincipal
    }

    // Insert all installments
    const { error: installmentsError } = await supabase
      .from('loan_installments')
      .insert(installments)

    if (installmentsError) {
      // Rollback: delete loan if installments fail
      await supabase.from('loans').delete().eq('id', loan.id)
      throw installmentsError
    }

    // Fetch loan with installments
    const { data: loanWithInstallments } = await supabase
      .from('loans')
      .select(`
        *,
        loan_installments(*)
      `)
      .eq('id', loan.id)
      .single()

    return NextResponse.json({
      message: 'Loan created successfully',
      loan: loanWithInstallments
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating loan:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create loan' },
      { status: 500 }
    )
  }
}
