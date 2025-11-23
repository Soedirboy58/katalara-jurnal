import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/loans/installments/pay - Mark installment as paid and create expense
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.installment_id || !body.paid_date || body.paid_amount === undefined) {
      return NextResponse.json(
        { error: 'installment_id, paid_date, and paid_amount are required' },
        { status: 400 }
      )
    }

    // Get installment with loan info
    const { data: installment, error: fetchError } = await supabase
      .from('loan_installments')
      .select(`
        *,
        loans!inner(*)
      `)
      .eq('id', body.installment_id)
      .single()

    if (fetchError) throw fetchError

    // Verify loan belongs to user
    if ((installment.loans as any).user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if already paid
    if (installment.status === 'paid') {
      return NextResponse.json(
        { error: 'Installment already paid' },
        { status: 400 }
      )
    }

    // Create expense transaction for the payment
    const expenseData = {
      user_id: user.id,
      category: 'debt_payment',
      subcategory: 'loan_installment',
      amount: parseFloat(body.paid_amount),
      transaction_date: body.paid_date,
      description: `Bayar cicilan ${(installment.loans as any).lender_name} - Cicilan #${installment.installment_number}`,
      payment_method: body.payment_method || 'cash',
      notes: body.notes || null
    }

    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select()
      .single()

    if (expenseError) throw expenseError

    // Update installment status
    const { data: updatedInstallment, error: updateError } = await supabase
      .from('loan_installments')
      .update({
        status: 'paid',
        paid_date: body.paid_date,
        paid_amount: parseFloat(body.paid_amount),
        expense_transaction_id: expense.id
      })
      .eq('id', body.installment_id)
      .select()
      .single()

    if (updateError) {
      // Rollback: delete expense if update fails
      await supabase.from('expenses').delete().eq('id', expense.id)
      throw updateError
    }

    // Recalculate loan totals
    const { data: allInstallments } = await supabase
      .from('loan_installments')
      .select('paid_amount, status')
      .eq('loan_id', (installment.loans as any).id)

    const totalPaid = allInstallments?.reduce(
      (sum, inst) => sum + (parseFloat(inst.paid_amount as any) || 0),
      0
    ) || 0

    const remainingBalance = (installment.loans as any).loan_amount - totalPaid

    // Check if all installments are paid
    const allPaid = allInstallments?.every(inst => inst.status === 'paid')
    const loanStatus = allPaid ? 'paid_off' : 'active'

    // Update loan totals
    await supabase
      .from('loans')
      .update({
        total_paid: totalPaid,
        remaining_balance: remainingBalance,
        status: loanStatus
      })
      .eq('id', (installment.loans as any).id)

    return NextResponse.json({
      message: 'Payment recorded successfully',
      installment: updatedInstallment,
      expense,
      loan_status: loanStatus
    })

  } catch (error: any) {
    console.error('Error processing payment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process payment' },
      { status: 500 }
    )
  }
}

// GET /api/loans/installments - Get upcoming installments (reminders)
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30') // Next N days
    const status = searchParams.get('status') || 'pending'

    const today = new Date().toISOString().split('T')[0]
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)
    const futureDateStr = futureDate.toISOString().split('T')[0]

    const { data: installments, error } = await supabase
      .from('loan_installments')
      .select(`
        *,
        loans!inner(
          lender_name,
          loan_amount,
          user_id
        )
      `)
      .eq('loans.user_id', user.id)
      .eq('status', status)
      .gte('due_date', today)
      .lte('due_date', futureDateStr)
      .order('due_date', { ascending: true })

    if (error) throw error

    return NextResponse.json({ installments })

  } catch (error: any) {
    console.error('Error fetching installments:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch installments' },
      { status: 500 }
    )
  }
}
