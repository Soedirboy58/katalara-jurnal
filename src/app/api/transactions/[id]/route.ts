import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type TransactionsUserColumn = 'owner_id' | 'user_id'

async function getTransactionsUserColumn(
  supabase: any,
  userId: string
): Promise<TransactionsUserColumn> {
  const isMissingColumn = (err: any, col: string) => {
    const code = (err?.code || err?.error_code || '').toString().toUpperCase()
    if (code === '42703') return true

    const msg = (err?.message || err?.details || '').toString().toLowerCase()
    const c = col.toLowerCase()

    if (code.startsWith('PGRST')) {
      if (msg.includes('schema cache') && msg.includes(c)) return true
      if (msg.includes('could not find') && msg.includes(c) && (msg.includes('column') || msg.includes('field'))) return true
      if (msg.includes('unknown field') && msg.includes(c)) return true
    }

    if (!msg.includes('does not exist')) return false
    return (
      msg.includes(`transactions.${c}`) ||
      msg.includes(`column transactions.${c}`) ||
      msg.includes(`column \"${c}\"`) ||
      msg.includes(`\"${c}\" of relation \"transactions\"`) ||
      msg.includes(` ${c} `)
    )
  }

  const hasColumn = async (col: TransactionsUserColumn) => {
    const { error } = await supabase.from('transactions').select(col).limit(1)
    if (!error) return true
    if (isMissingColumn(error, col)) return false
    return true
  }

  if (await hasColumn('owner_id')) return 'owner_id'
  if (await hasColumn('user_id')) return 'user_id'
  return 'owner_id'
}

const toNumber = (v: any): number => {
  const n = typeof v === 'number' ? v : Number((v ?? '').toString().replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

async function adjustStockSafe(
  supabase: any,
  productId: string,
  quantityChange: number,
  notes: string
): Promise<void> {
  try {
    await supabase.rpc('adjust_stock', {
      p_product_id: productId,
      p_quantity_change: quantityChange,
      p_notes: notes
    })
  } catch {
    // best-effort
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })

    const userCol = await getTransactionsUserColumn(supabase, user.id)

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq(userCol, user.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 })
    }

    const { data: items } = await supabase
      .from('transaction_items')
      .select('*')
      .eq('transaction_id', id)
      .order('created_at', { ascending: true })

    return NextResponse.json({ success: true, data: { transaction: data, items: items || [] } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })

    const userCol = await getTransactionsUserColumn(supabase, user.id)

    const { data: txn, error: txnErr } = await supabase
      .from('transactions')
      .select('id, invoice_number')
      .eq('id', id)
      .eq(userCol, user.id)
      .single()

    if (txnErr || !txn) {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 })
    }

    const { data: items } = await supabase
      .from('transaction_items')
      .select('id, product_id, qty, stock_deducted')
      .eq('transaction_id', id)

    // Rollback stock for deducted items
    const qtyByProduct = new Map<string, number>()
    ;(items || []).forEach((it: any) => {
      if (!it.stock_deducted) return
      if (!it.product_id) return
      const qty = toNumber(it.qty)
      if (!qty) return
      qtyByProduct.set(it.product_id, (qtyByProduct.get(it.product_id) || 0) + qty)
    })

    for (const [pid, qty] of qtyByProduct.entries()) {
      await adjustStockSafe(supabase, pid, +qty, `Rollback delete sale ${txn.invoice_number} (${txn.id})`)
    }

    await supabase.from('transaction_items').delete().eq('transaction_id', id)

    const { error: delErr } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq(userCol, user.id)

    if (delErr) {
      return NextResponse.json({ success: false, error: delErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Transaksi berhasil dihapus' })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Internal server error' }, { status: 500 })
  }
}
