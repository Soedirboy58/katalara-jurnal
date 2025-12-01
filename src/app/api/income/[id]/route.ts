import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// DELETE - Delete single income transaction
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get ID from params
    const { id } = await context.params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      )
    }

    // First, get the transaction details to restore stock if needed
    const { data: transaction, error: fetchError } = await supabase
      .from('incomes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // ⚠️ STOCK TRACKING DISABLED - stock_quantity column doesn't exist in products table
    // TODO: Implement stock restoration with stock_movements table when deleting income
    if (transaction.category === 'product_sales' && transaction.product_id) {
      console.log(`📦 Stock restoration pending for product ${transaction.product_id}`)
      // Stock movements will be tracked separately
    }

    // Delete the income transaction (only if it belongs to the user)
    const { error: deleteError } = await supabase
      .from('incomes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Security: only delete own transactions

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Transaction deleted successfully' 
    })

  } catch (error: any) {
    console.error('DELETE /api/income/[id] error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
