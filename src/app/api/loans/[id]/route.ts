import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/loans/[id] - Get single loan with installments
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { data: loan, error } = await supabase
      .from('loans')
      .select(`
        *,
        loan_installments(*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ loan })

  } catch (error: any) {
    console.error('Error fetching loan:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch loan' },
      { status: 500 }
    )
  }
}

// PATCH /api/loans/[id] - Update loan
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Fields that can be updated
    const allowedFields = [
      'lender_name',
      'lender_contact',
      'purpose',
      'notes',
      'status'
    ]

    const updates: any = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const { data: loan, error } = await supabase
      .from('loans')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({
      message: 'Loan updated successfully',
      loan
    })

  } catch (error: any) {
    console.error('Error updating loan:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update loan' },
      { status: 500 }
    )
  }
}

// DELETE /api/loans/[id] - Delete loan (soft delete by setting status)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if loan has any paid installments
    const { data: paidInstallments } = await supabase
      .from('loan_installments')
      .select('id')
      .eq('loan_id', id)
      .eq('status', 'paid')
      .limit(1)

    if (paidInstallments && paidInstallments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete loan with paid installments. Set status to "defaulted" instead.' },
        { status: 400 }
      )
    }

    // Hard delete if no payments made
    const { error } = await supabase
      .from('loans')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({
      message: 'Loan deleted successfully'
    })

  } catch (error: any) {
    console.error('Error deleting loan:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete loan' },
      { status: 500 }
    )
  }
}
