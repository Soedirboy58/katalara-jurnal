import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const toNumber = (v: any): number => {
  const n = typeof v === 'number' ? v : Number((v ?? '').toString().replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

async function updateProductStockBothBestEffort(supabase: any, productId: string, newStock: number) {
  // Try updating both columns together first.
  const both = await supabase
    .from('products')
    .update({ stock: newStock, stock_quantity: newStock, updated_at: new Date().toISOString() })
    .eq('id', productId)

  if (!both.error) return

  // If schema drift (one of the columns missing), retry individually.
  const msg = (both.error as any)?.message?.toString()?.toLowerCase?.() || ''
  const code = ((both.error as any)?.code || '').toString()
  const isMissingColumn = code === '42703' || msg.includes('column') || msg.includes('stock_quantity') || msg.includes('stock')
  if (!isMissingColumn) return

  try {
    await supabase
      .from('products')
      .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
      .eq('id', productId)
  } catch {
    // ignore
  }

  try {
    await supabase
      .from('products')
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', productId)
  } catch {
    // ignore
  }
}

async function restoreStocksFromIncomeTransaction(supabase: any, transaction: any) {
  if (!transaction || transaction.category !== 'product_sales') return

  // Parse line_items if exists (can be JSON string or array)
  let lineItems: any[] = []
  try {
    const raw = (transaction as any).line_items
    if (raw) {
      lineItems = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (!Array.isArray(lineItems)) lineItems = []
    }
  } catch {
    lineItems = []
  }

  // If there are no line_items, fallback to legacy single product fields.
  if (!lineItems.length && (transaction as any).product_id) {
    lineItems = [
      {
        product_id: (transaction as any).product_id,
        qty: (transaction as any).quantity
      }
    ]
  }

  if (!lineItems.length) return

  for (const item of lineItems) {
    const productId = (item as any)?.product_id || (item as any)?.productId
    if (!productId) continue

    const qty = toNumber((item as any)?.quantity ?? (item as any)?.qty ?? 0)
    if (!qty) continue

    try {
      const { data: product } = await supabase
        .from('products')
        .select('stock, stock_quantity')
        .eq('id', productId)
        .single()

      const currentStock = toNumber((product as any)?.stock ?? (product as any)?.stock_quantity ?? 0)
      const restoredStock = Math.max(0, currentStock + qty)

      await updateProductStockBothBestEffort(supabase, productId, restoredStock)
    } catch {
      // Don't block deletion if restore fails
    }
  }
}

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

    // ✅ RESTORE STOCK when deleting income transaction (best-effort; never blocks deletion)
    try {
      await restoreStocksFromIncomeTransaction(supabase, transaction)
    } catch (error) {
      console.error('Error restoring stock:', error)
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
