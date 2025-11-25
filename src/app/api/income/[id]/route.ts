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

    // If this is a product sales transaction, restore the stock
    if (transaction.category === 'product_sales' && transaction.product_id) {
      console.log(`🔄 Restoring stock for deleted transaction...`)
      
      // Get product details
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_quantity, track_inventory, name')
        .eq('id', transaction.product_id)
        .single()

      if (!productError && product && product.track_inventory) {
        const restoredStock = (product.stock_quantity || 0) + parseFloat(transaction.quantity || 0)
        console.log(`  ➕ Restoring stock from ${product.stock_quantity} to ${restoredStock} for ${product.name}`)
        
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock_quantity: restoredStock })
          .eq('id', transaction.product_id)
        
        if (updateError) {
          console.error('  ❌ Error restoring stock:', updateError)
        } else {
          console.log('  ✅ Stock restored successfully')
        }
      }
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
