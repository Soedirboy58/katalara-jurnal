import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function safeSupabaseHost() {
  try {
    const raw = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!raw) return null
    return new URL(raw).host
  } catch {
    return null
  }
}

type PaymentStatusLabel = 'paid' | 'unpaid' | 'partial'

type TransactionsUserColumn = 'owner_id' | 'user_id'
type CustomersUserColumn = 'owner_id' | 'user_id'

const otherTransactionsUserColumn = (col: TransactionsUserColumn): TransactionsUserColumn =>
  col === 'owner_id' ? 'user_id' : 'owner_id'

const toNumber = (v: any): number => {
  const n = typeof v === 'number' ? v : Number((v ?? '').toString().replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

function extractMissingColumn(err: any): { table?: string; column?: string } | null {
  const msg = (err?.message || err?.details || '').toString()
  // Postgres patterns:
  // - column transactions.user_id does not exist
  // - column "user_id" of relation "transactions" does not exist
  const m1 = msg.match(/column\s+([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s+does not exist/i)
  if (m1) return { table: m1[1], column: m1[2] }
  const m2 = msg.match(/column\s+"([a-zA-Z0-9_]+)"\s+of\s+relation\s+"([a-zA-Z0-9_]+)"\s+does not exist/i)
  if (m2) return { table: m2[2], column: m2[1] }

  // PostgREST schema cache variants:
  // - Could not find the 'owner_id' column of 'transactions' in the schema cache
  // - Could not find the 'owner_id' column of "transactions" in the schema cache
  const m3 = msg.match(/could not find the '([a-zA-Z0-9_]+)' column of '([a-zA-Z0-9_]+)' in the schema cache/i)
  if (m3) return { table: m3[2], column: m3[1] }
  const m4 = msg.match(/could not find the '([a-zA-Z0-9_]+)' column of\s+"([a-zA-Z0-9_]+)"\s+in the schema cache/i)
  if (m4) return { table: m4[2], column: m4[1] }

  return null
}

function errorPayload(err: any) {
  const text = `${err?.message ?? ''}\n${err?.details ?? ''}\n${err?.hint ?? ''}`
  const constraintMatch =
    text.match(/unique constraint\s+"([^"]+)"/i) ||
    text.match(/violates\s+unique\s+constraint\s+"([^"]+)"/i) ||
    text.match(/constraint\s+"([^"]+)"/i)

  const conflictKeyMatch = text.match(/Key\s*\(([^)]+)\)\s*=\s*\(([^)]+)\)\s*already exists/i)
  const conflictColumns = conflictKeyMatch?.[1]
    ? conflictKeyMatch[1].split(',').map((s) => s.trim()).filter(Boolean)
    : undefined

  return {
    message: err?.message,
    code: err?.code,
    details: err?.details,
    hint: err?.hint,
    constraint: constraintMatch?.[1],
    conflictColumns
  }
}

function buildInvoiceUniqFixSql(constraintOrIndexName?: string) {
  const safeName = (constraintOrIndexName || '').replace(/"/g, '""')
  const lines = [
    '-- Fix invoice uniqueness so it is PER USER (recommended)',
    "-- Run this in Supabase SQL editor",
    '',
    ...(safeName
      ? [
          `ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS \"${safeName}\";`,
          `DROP INDEX IF EXISTS public.\"${safeName}\";`,
          ''
        ]
      : []),
    '-- Ensure per-user uniqueness',
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_user_invoice ON public.transactions(user_id, invoice_number);'
  ]
  return lines.join('\n')
}

function buildTransactionsRlsFixSql() {
  return [
    '-- Fix RLS policies for unified transactions system',
    '-- Run this in Supabase SQL editor',
    '',
    'ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;',
    '',
    'DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;',
    'DROP POLICY IF EXISTS "transactions_insert_own" ON public.transactions;',
    'DROP POLICY IF EXISTS "transactions_update_own" ON public.transactions;',
    'DROP POLICY IF EXISTS "transactions_delete_own" ON public.transactions;',
    '',
    'CREATE POLICY "transactions_select_own" ON public.transactions',
    'FOR SELECT USING (COALESCE(user_id, owner_id) = auth.uid());',
    '',
    'CREATE POLICY "transactions_insert_own" ON public.transactions',
    'FOR INSERT WITH CHECK (COALESCE(user_id, owner_id) = auth.uid());',
    '',
    'CREATE POLICY "transactions_update_own" ON public.transactions',
    'FOR UPDATE USING (COALESCE(user_id, owner_id) = auth.uid())',
    'WITH CHECK (COALESCE(user_id, owner_id) = auth.uid());',
    '',
    'CREATE POLICY "transactions_delete_own" ON public.transactions',
    'FOR DELETE USING (COALESCE(user_id, owner_id) = auth.uid());',
    '',
    'DROP POLICY IF EXISTS "transaction_items_select_own" ON public.transaction_items;',
    'DROP POLICY IF EXISTS "transaction_items_insert_own" ON public.transaction_items;',
    'DROP POLICY IF EXISTS "transaction_items_update_own" ON public.transaction_items;',
    'DROP POLICY IF EXISTS "transaction_items_delete_own" ON public.transaction_items;',
    '',
    'CREATE POLICY "transaction_items_select_own" ON public.transaction_items',
    'FOR SELECT USING (',
    '  EXISTS (',
    '    SELECT 1 FROM public.transactions t',
    '    WHERE t.id = transaction_items.transaction_id',
    '      AND COALESCE(t.user_id, t.owner_id) = auth.uid()',
    '  )',
    ');',
    '',
    'CREATE POLICY "transaction_items_insert_own" ON public.transaction_items',
    'FOR INSERT WITH CHECK (',
    '  EXISTS (',
    '    SELECT 1 FROM public.transactions t',
    '    WHERE t.id = transaction_items.transaction_id',
    '      AND COALESCE(t.user_id, t.owner_id) = auth.uid()',
    '  )',
    ');',
    '',
    'CREATE POLICY "transaction_items_update_own" ON public.transaction_items',
    'FOR UPDATE USING (',
    '  EXISTS (',
    '    SELECT 1 FROM public.transactions t',
    '    WHERE t.id = transaction_items.transaction_id',
    '      AND COALESCE(t.user_id, t.owner_id) = auth.uid()',
    '  )',
    ')',
    'WITH CHECK (',
    '  EXISTS (',
    '    SELECT 1 FROM public.transactions t',
    '    WHERE t.id = transaction_items.transaction_id',
    '      AND COALESCE(t.user_id, t.owner_id) = auth.uid()',
    '  )',
    ');',
    '',
    'CREATE POLICY "transaction_items_delete_own" ON public.transaction_items',
    'FOR DELETE USING (',
    '  EXISTS (',
    '    SELECT 1 FROM public.transactions t',
    '    WHERE t.id = transaction_items.transaction_id',
    '      AND COALESCE(t.user_id, t.owner_id) = auth.uid()',
    '  )',
    ');'
  ].join('\n')
}

function buildTransactionsGrantFixSql() {
  return [
    '-- Fix Postgres privileges (GRANT) for unified transactions system',
    '-- Run this in Supabase SQL editor',
    '',
    '-- Ensure authenticated role can access your tables (RLS still applies separately)',
    'GRANT USAGE ON SCHEMA public TO authenticated;',
    'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.customers TO authenticated;',
    'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.products TO authenticated;',
    'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.transactions TO authenticated;',
    'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.transaction_items TO authenticated;',
    'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.payments TO authenticated;',
    'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.stock_movements TO authenticated;',
    '',
    '-- Safe defaults for future tables/sequences in public schema',
    'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;',
    'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;',
    'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;'
  ].join('\n')
}

function errorText(err: any) {
  return `${err?.message ?? ''}\n${err?.details ?? ''}\n${err?.hint ?? ''}`.toLowerCase()
}

function isRlsDeniedError(err: any) {
  const t = errorText(err)
  return (
    t.includes('row level security') ||
    t.includes('row-level security') ||
    t.includes('violates row-level security policy') ||
    t.includes('new row violates row-level security policy')
  )
}

function isPermissionDeniedError(err: any) {
  const t = errorText(err)
  // Common Postgres patterns:
  // - permission denied for table <tbl>
  // - permission denied for relation <tbl>
  // - must be owner of relation <tbl>
  // - insufficient privilege
  return (
    t.includes('permission denied') ||
    t.includes('must be owner of relation') ||
    t.includes('insufficient privilege')
  )
}

function computeDiscountAmount(subtotal: number, mode: 'percent' | 'nominal', value: number) {
  if (mode === 'percent') return Math.max(0, (subtotal * Math.max(0, value)) / 100)
  return Math.max(0, value)
}

function computePpnAmount(afterDiscount: number, enabled: boolean, rate: number) {
  if (!enabled) return 0
  const r = Math.max(0, rate)
  return Math.max(0, (afterDiscount * r) / 100)
}

async function getTransactionsUserColumn(
  supabase: any,
  userId: string
): Promise<TransactionsUserColumn> {
  const isMissingColumn = (err: any, col: string) => {
    const code = (err?.code || err?.error_code || '').toString().toUpperCase()
    // Postgres undefined_column
    if (code === '42703') return true

    const msg = (err?.message || err?.details || '').toString().toLowerCase()
    const c = col.toLowerCase()

    // PostgREST schema-cache / column missing variants (often PGRSTxxx)
    // e.g. "Could not find the 'owner_id' column of 'transactions' in the schema cache"
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
    // Any other error (RLS, permission) => assume column exists.
    return true
  }

  // Prefer `user_id` when both exist (newer schema uses user_id NOT NULL)
  if (await hasColumn('user_id')) return 'user_id'
  if (await hasColumn('owner_id')) return 'owner_id'
  // Fallback (should not happen in a valid schema)
  return 'owner_id'
}

async function getCustomersUserColumn(
  supabase: any,
  userId: string
): Promise<CustomersUserColumn> {
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
      msg.includes(`customers.${c}`) ||
      msg.includes(`column customers.${c}`) ||
      msg.includes(`column \"${c}\"`) ||
      msg.includes(`\"${c}\" of relation \"customers\"`) ||
      msg.includes(` ${c} `)
    )
  }

  const hasColumn = async (col: CustomersUserColumn) => {
    const { error } = await supabase.from('customers').select(col).limit(1)
    if (!error) return true
    if (isMissingColumn(error, col)) return false
    return true
  }

  // Prefer `user_id` when both exist (newer schema uses user_id NOT NULL)
  if (await hasColumn('user_id')) return 'user_id'
  if (await hasColumn('owner_id')) return 'owner_id'
  return 'owner_id'
}

async function adjustStockSafe(
  supabase: any,
  productId: string,
  quantityChange: number,
  notes: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('adjust_stock', {
      p_product_id: productId,
      p_quantity_change: quantityChange,
      p_notes: notes
    })
    if (error) throw error
    // The RPC returns JSON with {success:boolean, message?:string}
    if (data && typeof data === 'object' && data.success === false) {
      return { ok: false, error: (data.message || 'Stock adjustment rejected').toString() }
    }

    // Best-effort: keep legacy `products.stock` in sync if DB still uses it.
    // Our adjust_stock RPC may update stock_quantity only, while many UIs read `stock`.
    if (data && typeof data === 'object' && (data as any).new_stock !== undefined) {
      const next = Number((data as any).new_stock)
      if (Number.isFinite(next)) {
        try {
          await supabase.from('products').update({ stock: next, stock_quantity: next }).eq('id', productId)
        } catch {
          // ignore
        }
      }
    }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Failed to adjust stock' }
  }
}

async function generateInvoiceNumber(
  supabase: any,
  userId: string,
  userCol?: TransactionsUserColumn
): Promise<{ ok: boolean; invoice?: string; error?: string; source?: 'rpc' | 'table-fallback' }> {
  try {
    // Supabase RPC args must match function parameter names.
    // Some DBs use `p_user_id`, older patches might use `user_id`.
    let data: any = null
    {
      const r1 = await supabase.rpc('generate_invoice_number', { p_user_id: userId })
      if (!r1.error) {
        data = r1.data
      } else {
        const r2 = await supabase.rpc('generate_invoice_number', { user_id: userId })
        if (r2.error) throw r2.error
        data = r2.data
      }
    }
    if (!data) return { ok: false, error: 'generate_invoice_number returned empty value' }

    const invoice = (data as string).toString()

    // Fallback safety: if RPC keeps returning an already-used invoice, compute next from table.
    // This makes the app resilient even when the DB function wasn't updated or is buggy.
    if (userCol) {
      const existsRes = await supabase
        .from('transactions')
        .select('id')
        .eq(userCol, userId)
        .eq('invoice_number', invoice)
        .limit(1)

      // If select itself errors (schema drift), ignore and trust RPC.
      if (!existsRes.error && (existsRes.data || []).length > 0) {
        const year = new Date().getFullYear().toString()
        const pattern = `INV-${year}-%`

        const listRes = await supabase
          .from('transactions')
          .select('invoice_number')
          .eq(userCol, userId)
          .like('invoice_number', pattern)
          .limit(1000)

        if (!listRes.error) {
          const maxSuffix = (listRes.data || []).reduce((max: number, row: any) => {
            const inv = (row?.invoice_number || '').toString()
            const m = inv.match(/(\d+)$/)
            if (!m) return max
            const n = Number(m[1])
            return Number.isFinite(n) ? Math.max(max, n) : max
          }, 0)

          const next = `INV-${year}-${String(maxSuffix + 1).padStart(4, '0')}`
          return { ok: true, invoice: next, source: 'table-fallback' }
        }
      }
    }

    return { ok: true, invoice, source: 'rpc' }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Failed to generate invoice number' }
  }
}

// GET - list sales transactions (pendapatan) from `transactions`
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const sp = request.nextUrl.searchParams
    const startDate = sp.get('start_date')
    const endDate = sp.get('end_date')
    const status = sp.get('payment_status')
    const limit = Math.min(200, Math.max(1, Number(sp.get('limit') || 50)))
    const offset = Math.max(0, Number(sp.get('offset') || 0))

    const run = async (userCol: TransactionsUserColumn) => {
      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq(userCol, user.id)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (startDate) query = query.gte('transaction_date', `${startDate}T00:00:00`)
      if (endDate) query = query.lte('transaction_date', `${endDate}T23:59:59`)
      if (status) query = query.eq('payment_status', status)

      query = query.range(offset, offset + limit - 1)
      return await query
    }

    const candidates: TransactionsUserColumn[] = ['owner_id', 'user_id']
    let lastErr: any = null
    for (const col of candidates) {
      const res = await run(col)
      if (!res.error) {
        return NextResponse.json({ success: true, data: res.data || [], count: res.count || 0 })
      }

      lastErr = res.error
      const missing = extractMissingColumn(res.error)
      // Only fall back when we can confidently say it's a missing-column/schema-cache issue.
      if (missing?.table === 'transactions' && (missing.column === 'owner_id' || missing.column === 'user_id')) {
        continue
      }

      return NextResponse.json(
        { success: false, error: res.error.message, meta: { ...errorPayload(res.error), triedUserColumns: candidates } },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: lastErr?.message || 'Failed to fetch transactions',
        meta: { ...errorPayload(lastErr), triedUserColumns: candidates }
      },
      { status: 500 }
    )
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Internal server error' }, { status: 500 })
  }
}

// POST - create sales transaction with items + stock deduction
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const userCol = await getTransactionsUserColumn(supabase, user.id)
    const customersUserCol = await getCustomersUserColumn(supabase, user.id)

    const transactionDate = (body.transaction_date || body.income_date || '').toString()
    if (!transactionDate) {
      return NextResponse.json({ success: false, error: 'Missing transaction_date' }, { status: 400 })
    }

    const items: Array<any> = Array.isArray(body.items)
      ? body.items
      : Array.isArray(body.lineItems)
        ? body.lineItems
        : []

    if (!items.length) {
      return NextResponse.json({ success: false, error: 'Minimal 1 item wajib diisi' }, { status: 400 })
    }

    const paymentType: 'cash' | 'tempo' = body.payment_type === 'tempo' ? 'tempo' : 'cash'
    const tempoDays = Math.max(1, Number(body.tempo_days || body.tempoDays || 7))
    const dueDate = (body.due_date || body.dueDate || '').toString() || null

    if (paymentType === 'tempo' && !dueDate) {
      return NextResponse.json({ success: false, error: 'Tanggal jatuh tempo wajib diisi untuk Tempo' }, { status: 400 })
    }

    const discountMode: 'percent' | 'nominal' = body.discount_mode === 'nominal' ? 'nominal' : 'percent'
    const discountValue = toNumber(body.discount_value ?? body.discountValue ?? (discountMode === 'percent' ? body.discountPercent : body.discountAmount))
    const includePpn = Boolean(body.ppn_enabled ?? body.include_ppn ?? body.includeTax)
    const ppnRate = toNumber(body.ppn_rate ?? body.taxPPN ?? 11) || 11

    const otherFees = toNumber(body.other_fees ?? 0)
    const notes = (body.notes || '').toString() || null
    const category = (body.category || body.income_category || body.incomeCategory || '').toString() || null

    // Customer linking / creation
    let customerId: string | null = (body.customer_id || '').toString() || null
    let customerName: string = (body.customer_name || '').toString().trim()
    const customerPhone: string | null = (body.customer_phone || '').toString().trim() || null
    const customerAddress: string | null = (body.customer_address || '').toString().trim() || null

    if (!customerName) customerName = 'Umum / Walk-in'

    if (!customerId && customerName && customerName !== 'Umum / Walk-in') {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id, name')
        .eq(customersUserCol, user.id)
        .ilike('name', customerName)
        .limit(1)
        .maybeSingle()

      if (existingCustomer?.id) {
        customerId = existingCustomer.id
        customerName = existingCustomer.name
      } else {
        // Create customer (best-effort across owner_id/user_id variants)
        let newCustomer: any = null
        let newCustomerError: any = null
        let insertPayload: any = {
          // When schema has both columns, populate both; missing-column retry below removes the invalid one.
          user_id: user.id,
          owner_id: user.id,
          name: customerName,
          phone: customerPhone,
          address: customerAddress,
          is_active: true
        }
        for (let attempt = 0; attempt < 4; attempt++) {
          const res = await supabase
            .from('customers')
            .insert(insertPayload)
            .select('id, name')
            .single()
          newCustomer = res.data
          newCustomerError = res.error
          if (!newCustomerError) break

          const missing = extractMissingColumn(newCustomerError)
          if (missing?.table === 'customers' && missing.column && Object.prototype.hasOwnProperty.call(insertPayload, missing.column)) {
            delete insertPayload[missing.column]
            continue
          }
          // As a last resort, ensure we have at least the detected ownership column.
          if ((newCustomerError?.message || '').toLowerCase().includes('null value') && customersUserCol) {
            insertPayload[customersUserCol] = user.id
          }
          break
        }

        if (!newCustomerError && newCustomer?.id) {
          customerId = newCustomer.id
          customerName = newCustomer.name
        }
      }
    }

    const normalizedItems = items.map((it) => {
      const qty = toNumber(it.qty ?? it.quantity)
      const price = toNumber(it.price ?? it.price_per_unit)
      return {
        product_id: (it.product_id || '').toString() || null,
        product_name: (it.product_name || it.productName || it.description || '').toString() || 'Item',
        qty,
        unit: (it.unit || 'pcs').toString(),
        price,
        subtotal: Math.max(0, qty * price)
      }
    })

    const subtotal = normalizedItems.reduce((s, it) => s + it.subtotal, 0)
    const discountAmount = computeDiscountAmount(subtotal, discountMode, discountValue)
    const afterDiscount = Math.max(0, subtotal - discountAmount)
    const ppnAmount = computePpnAmount(afterDiscount, includePpn, ppnRate)
    const total = Math.max(0, afterDiscount + ppnAmount + otherFees)

    const downPayment = Math.max(0, Math.min(total, toNumber(body.down_payment ?? body.downPayment ?? 0)))

    const paidAmount = paymentType === 'cash' ? total : downPayment
    const remainingAmount = Math.max(0, total - paidAmount)

    const paymentStatus: PaymentStatusLabel = remainingAmount === 0
      ? 'paid'
      : paidAmount > 0
        ? 'partial'
        : 'unpaid'

    // Store a stable value ('cash' | 'tempo') so UI + any DB constraints stay consistent.
    // Tempo duration is represented by due_date (and request tempo_days), not encoded in payment_type.
    const paymentTypeStored = paymentType

    // Invoice (MUST be sequential)
    const inv1 = await generateInvoiceNumber(supabase, user.id, userCol)
    if (!inv1.ok || !inv1.invoice) {
      return NextResponse.json(
        { success: false, error: `Gagal generate invoice number: ${inv1.error || 'unknown'}` },
        { status: 500 }
      )
    }

    const incomeType = (body.income_type || body.incomeType || '').toString().trim() || undefined

    const transactionInsertBase: any = {
      // Populate both for compatibility + satisfy NOT NULL in newer schemas.
      user_id: user.id,
      owner_id: user.id,
      [userCol]: user.id,
      invoice_number: inv1.invoice,
      transaction_date: new Date(transactionDate).toISOString(),
      customer_id: customerId,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_address: customerAddress,
      payment_type: paymentTypeStored,
      due_date: paymentType === 'tempo' ? dueDate : null,
      subtotal,
      discount_type: discountMode,
      discount_value: discountValue,
      discount_amount: discountAmount,
      ppn_rate: includePpn ? ppnRate : 0,
      ppn_amount: ppnAmount,
      pph_rate: 0,
      pph_amount: 0,
      total,
      paid_amount: paidAmount,
      remaining_amount: remainingAmount,
      payment_status: paymentStatus,
      notes,
      // Compatibility: newer unified schema uses `category`, some older setups may still use `income_category`.
      category,
      income_category: category,
      income_type: incomeType
    }

    // Insert transaction with retries:
    // - handle invoice conflict (regen invoice)
    // - handle missing column (drop field and retry)
    let transactionRow: any = null
    {
      let transactionInsert: any = { ...transactionInsertBase }
      let lastErr: any = null
      const removedColumns: string[] = []
      let invoiceRegens = 0
      const attemptedInvoices: string[] = []
      for (let attempt = 0; attempt < 10; attempt++) {
        if (transactionInsert?.invoice_number) attemptedInvoices.push(transactionInsert.invoice_number)
        let { data: t, error: tErr } = await supabase
          .from('transactions')
          .insert([transactionInsert])
          .select('*')
          .single()

        const tErrMsg = (tErr?.message || '').toString().toLowerCase()
        const tErrConstraint = (tErr?.details || tErr?.message || '').toString().match(/unique constraint\s+"([^"]+)"/i)?.[1]
        const isInvoiceUniqueViolation =
          tErr?.code === '23505' && (tErrMsg.includes('invoice') || tErrMsg.includes('uniq_user_invoice') || (tErrConstraint || '').toLowerCase().includes('invoice'))

        if (tErr && isInvoiceUniqueViolation) {
          lastErr = tErr
          const inv2 = await generateInvoiceNumber(supabase, user.id, userCol)
          if (!inv2.ok || !inv2.invoice) {
            return NextResponse.json({ success: false, error: 'Gagal generate invoice number', meta: inv2 }, { status: 500 })
          }
          invoiceRegens += 1

          // If invoice generator keeps returning the same value, retries won't help.
          // This usually means the DB still has a GLOBAL unique constraint on invoice_number.
          if (inv2.invoice === transactionInsert.invoice_number) {
            const meta = {
              ...errorPayload(tErr),
              userCol,
              invoiceRegens,
              attemptedInvoices,
              recommendedSql: buildInvoiceUniqFixSql(errorPayload(tErr)?.constraint)
            }
            return NextResponse.json(
              {
                success: false,
                error:
                  'Invoice number bentrok dan generator tidak bisa maju (kemungkinan masih ada UNIQUE global pada invoice_number). Jalankan SQL perbaikan di meta.recommendedSql',
                meta
              },
              { status: 500 }
            )
          }

          transactionInsert = { ...transactionInsert, invoice_number: inv2.invoice }
          continue
        }

        if (tErr) {
          lastErr = tErr
          const isRls = tErr?.code === '42501' || tErrMsg.includes('row-level security')
          if (isRls) {
            const classifiedAs = isPermissionDeniedError(tErr)
              ? 'permission'
              : isRlsDeniedError(tErr)
                ? 'rls'
                : 'unknown'

            return NextResponse.json(
              {
                success: false,
                error:
                  classifiedAs === 'permission'
                    ? 'Akses ditolak oleh Postgres (permission denied). Jalankan SQL di meta.recommendedSql untuk melakukan GRANT pada role authenticated.'
                    : classifiedAs === 'rls'
                      ? 'Akses ditolak oleh Row Level Security (RLS) untuk tabel transactions. Jalankan SQL di meta.recommendedSql untuk menambahkan policy yang benar.'
                      : 'Akses ditolak (42501). Bisa karena RLS atau permission (GRANT). Lihat meta.dbError dan jalankan SQL yang sesuai di meta.recommendedSql.',
                meta: {
                  ...errorPayload(tErr),
                  errorClass: classifiedAs,
                  recommendedSql:
                    classifiedAs === 'permission'
                      ? buildTransactionsGrantFixSql()
                      : classifiedAs === 'rls'
                        ? buildTransactionsRlsFixSql()
                        : [
                            '-- 42501 can be caused by missing RLS policies OR missing GRANT privileges.',
                            '-- Try ONE of the following depending on meta.dbError.message/details:',
                            '',
                            buildTransactionsGrantFixSql(),
                            '',
                            buildTransactionsRlsFixSql()
                          ].join('\n'),
                  debug: {
                    supabaseHost: safeSupabaseHost(),
                    authUserId: user.id,
                    userCol,
                    insertUserId: transactionInsert?.user_id ?? null,
                    insertOwnerId: transactionInsert?.owner_id ?? null,
                    insertUserColValue: transactionInsert?.[userCol] ?? null
                  },
                  dbError: {
                    code: tErr?.code,
                    message: tErr?.message,
                    details: tErr?.details,
                    hint: tErr?.hint
                  }
                }
              },
              { status: 403 }
            )
          }

          const missing = extractMissingColumn(tErr)
          if (missing?.table === 'transactions' && missing.column) {
            // If the user-binding column is wrong, swap owner_id <-> user_id.
            if ((missing.column === 'owner_id' || missing.column === 'user_id') && Object.prototype.hasOwnProperty.call(transactionInsert, missing.column)) {
              const alt = missing.column === 'owner_id' ? 'user_id' : 'owner_id'
              transactionInsert[alt] = user.id
              delete transactionInsert[missing.column]
              removedColumns.push(`transactions.${missing.column}`)
              continue
            }

            if (Object.prototype.hasOwnProperty.call(transactionInsert, missing.column)) {
              delete transactionInsert[missing.column]
              removedColumns.push(`transactions.${missing.column}`)
              continue
            }
          }
          return NextResponse.json(
            { success: false, error: tErr.message, meta: errorPayload(tErr) },
            { status: 500 }
          )
        }

        transactionRow = t
        break
      }

      if (!transactionRow) {
        const last = errorPayload(lastErr)
        console.error('Transaction insert retry exceeded', {
          userId: user.id,
          userCol,
          attempts: 10,
          removedColumns,
          invoiceRegens,
          lastErr: last,
          finalPayloadKeys: Object.keys(transactionInsert || {})
        })
        return NextResponse.json(
          {
            success: false,
            error: 'Gagal menyimpan transaksi (retry exceeded)',
            meta: {
              userCol,
              removedColumns,
              invoiceRegens,
              lastErr: last,
              attemptedInvoices,
              finalPayloadKeys: Object.keys(transactionInsert || {}),
              recommendedSql: buildInvoiceUniqFixSql(last?.constraint)
            }
          },
          { status: 500 }
        )
      }
    }

    // Insert items
    const itemsInsertBase = normalizedItems.map((it) => ({
      transaction_id: transactionRow.id,
      product_id: it.product_id,
      product_name: it.product_name,
      qty: it.qty,
      unit: it.unit,
      price: it.price,
      subtotal: it.subtotal,
      stock_deducted: false
    }))

    let insertedItems: any[] = []
    {
      let itemsInsert: any[] = itemsInsertBase
      for (let attempt = 0; attempt < 6; attempt++) {
        const res = await supabase
          .from('transaction_items')
          .insert(itemsInsert)
          .select('id, product_id, qty')

        if (res.error) {
          const missing = extractMissingColumn(res.error)
          if (missing?.table === 'transaction_items' && missing.column) {
            // Remove missing column from each row and retry.
            itemsInsert = itemsInsert.map((r) => {
              const copy: any = { ...r }
              delete copy[missing.column as string]
              return copy
            })
            continue
          }

          // Rollback main transaction if items fail
          await supabase.from('transactions').delete().eq('id', transactionRow.id)
          return NextResponse.json(
            { success: false, error: res.error.message, meta: errorPayload(res.error) },
            { status: 500 }
          )
        }

        insertedItems = (res.data || []) as any[]
        break
      }

      if (!insertedItems.length) {
        await supabase.from('transactions').delete().eq('id', transactionRow.id)
        return NextResponse.json({ success: false, error: 'Gagal menyimpan item transaksi' }, { status: 500 })
      }
    }

    // Deduct stock for tracked products (prevent negative stock)
    const qtyNeededByProduct = new Map<string, number>()
    for (const it of normalizedItems) {
      const pid = (it.product_id || '').toString()
      if (!pid) continue
      const qty = toNumber(it.qty)
      if (!qty) continue
      qtyNeededByProduct.set(pid, (qtyNeededByProduct.get(pid) || 0) + qty)
    }

    const productIds = Array.from(qtyNeededByProduct.keys())
    const trackMap = new Map<string, boolean>()
    const stockMap = new Map<string, number>()
    const nameMap = new Map<string, string>()

    if (productIds.length) {
      const { data: products, error: prodErr } = await supabase
        .from('products')
        .select('id, name, track_inventory, stock, stock_quantity')
        .in('id', productIds)

      // If schema drift prevents stock check, fallback to best-effort deduction (older DBs).
      const missing = prodErr ? extractMissingColumn(prodErr) : null
      if (!prodErr || missing) {
        for (const p of products || []) {
          nameMap.set(p.id, (p.name || '').toString())
          // Default to tracking inventory unless explicitly false
          trackMap.set(p.id, p.track_inventory !== false)

          const stockLegacy = toNumber(p.stock)
          const stockQty = toNumber(p.stock_quantity)

          // Canonicalize available stock to match DB RPC behavior.
          // - If stock_quantity exists and is non-zero, prefer it.
          // - If stock_quantity is 0 but legacy stock has value, use legacy stock.
          // This avoids false "Insufficient stock" when the columns drift.
          let canonical = stockQty
          if (stockQty <= 0 && stockLegacy > 0) canonical = stockLegacy
          if (stockQty > 0 && stockLegacy <= 0) canonical = stockQty
          if (stockQty > 0 && stockLegacy > 0) canonical = stockQty
          if (canonical < 0) canonical = 0

          stockMap.set(p.id, canonical)

          // Best-effort: keep both columns in sync when they differ.
          // Ignore any errors (RLS / missing columns in older schemas).
          const updates: any = {}
          if (Number.isFinite(stockLegacy) && canonical !== stockLegacy) updates.stock = canonical
          if (Number.isFinite(stockQty) && canonical !== stockQty) updates.stock_quantity = canonical
          if (Object.keys(updates).length) {
            try {
              await supabase
                .from('products')
                .update(updates)
                .eq('id', p.id)
            } catch {
              // ignore
            }
          }
        }
      }
    }

    // Pre-check stock to avoid negative values.
    const insufficient: Array<{ product_id: string; name?: string; available: number; requested: number }> = []
    for (const [pid, requested] of qtyNeededByProduct.entries()) {
      const tracked = trackMap.get(pid)
      if (!tracked) continue
      const available = stockMap.get(pid)
      // If we couldn't read stock (undefined), skip hard-blocking to remain compatible.
      if (typeof available !== 'number') continue
      if (available < requested) {
        insufficient.push({ product_id: pid, name: nameMap.get(pid), available, requested })
      }
    }

    if (insufficient.length) {
      // Rollback created rows
      await supabase.from('transaction_items').delete().eq('transaction_id', transactionRow.id)
      await supabase.from('transactions').delete().eq('id', transactionRow.id)
      return NextResponse.json(
        {
          success: false,
          error: 'Stok produk tidak cukup / habis. Transaksi dibatalkan.',
          meta: { insufficient }
        },
        { status: 400 }
      )
    }

    // Apply stock movements per product; rollback if any adjustment fails.
    const deductedProducts: Array<{ product_id: string; qty: number }> = []
    for (const [pid, qty] of qtyNeededByProduct.entries()) {
      if (!trackMap.get(pid)) continue
      const note = `Sale ${transactionRow.invoice_number} (${transactionRow.id})`
      const res = await adjustStockSafe(supabase, pid, -qty, note)
      if (!res.ok) {
        const msg = (res.error || '').toString().toLowerCase()
        // Rollback any prior deductions
        for (const d of deductedProducts) {
          await adjustStockSafe(supabase, d.product_id, +d.qty, `Rollback failed sale ${transactionRow.invoice_number}`)
        }
        await supabase.from('transaction_items').delete().eq('transaction_id', transactionRow.id)
        await supabase.from('transactions').delete().eq('id', transactionRow.id)

        if (msg.includes('insufficient stock') || msg.includes('stok') || msg.includes('insufficient')) {
          return NextResponse.json(
            {
              success: false,
              error: 'Stok produk tidak cukup / habis. Transaksi dibatalkan.',
              meta: {
                insufficient: [
                  {
                    product_id: pid,
                    name: nameMap.get(pid),
                    available: stockMap.get(pid) ?? 0,
                    requested: qty
                  }
                ]
              }
            },
            { status: 400 }
          )
        }

        return NextResponse.json(
          { success: false, error: res.error || 'Gagal mengurangi stok. Transaksi dibatalkan.' },
          { status: 400 }
        )
      }
      deductedProducts.push({ product_id: pid, qty })
    }

    // Mark all items as deducted (best-effort; ignore missing-column schemas)
    if (deductedProducts.length) {
      const upd = await supabase
        .from('transaction_items')
        .update({ stock_deducted: true })
        .eq('transaction_id', transactionRow.id)
      if (upd.error && !extractMissingColumn(upd.error)) {
        console.warn('Failed to mark stock_deducted:', upd.error)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        transaction: transactionRow,
        items_count: (insertedItems || []).length,
        stock_deducted_items: deductedProducts.length ? (insertedItems || []).length : 0
      }
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE (bulk)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : []
    if (!ids.length) {
      return NextResponse.json({ success: false, error: 'No IDs provided' }, { status: 400 })
    }

    // Fetch items to rollback stock
    const fetchTxns = async (userCol: TransactionsUserColumn) =>
      await supabase
        .from('transactions')
        .select('id, invoice_number')
        .in('id', ids)
        .eq(userCol, user.id)

    const candidates: TransactionsUserColumn[] = ['owner_id', 'user_id']
    let txns: any = null
    let fetchTxnErr: any = null
    for (const col of candidates) {
      const res = await fetchTxns(col)
      if (!res.error) {
        txns = res.data
        fetchTxnErr = null
        break
      }

      fetchTxnErr = res.error
      const missing = extractMissingColumn(res.error)
      if (missing?.table === 'transactions' && (missing.column === 'owner_id' || missing.column === 'user_id')) {
        continue
      }
      break
    }

    if (fetchTxnErr) {
      return NextResponse.json(
        { success: false, error: fetchTxnErr.message, meta: { ...errorPayload(fetchTxnErr), triedUserColumns: candidates } },
        { status: 500 }
      )
    }

    const txnIds = (txns || []).map((t: any) => t.id)
    if (!txnIds.length) {
      return NextResponse.json({ success: true, message: 'No matching transactions' })
    }

    const { data: items } = await supabase
      .from('transaction_items')
      .select('product_id, qty, stock_deducted, transaction_id')
      .in('transaction_id', txnIds)

    // Sum rollback per product
    const qtyByProduct = new Map<string, number>()
    ;(items || []).forEach((it: any) => {
      if (!it.stock_deducted) return
      if (!it.product_id) return
      const qty = toNumber(it.qty)
      if (!qty) return
      qtyByProduct.set(it.product_id, (qtyByProduct.get(it.product_id) || 0) + qty)
    })

    for (const [pid, qty] of qtyByProduct.entries()) {
      await adjustStockSafe(supabase, pid, +qty, `Rollback delete sales (${txnIds.length} txn)`) // best-effort
    }

    // Delete items then transactions
    await supabase.from('transaction_items').delete().in('transaction_id', txnIds)

    const doDelete = async (userCol: TransactionsUserColumn) =>
      await supabase
        .from('transactions')
        .delete()
        .in('id', txnIds)
        .eq(userCol, user.id)

    let delErr: any = null
    for (const col of candidates) {
      const res = await doDelete(col)
      if (!res.error) {
        delErr = null
        break
      }

      delErr = res.error
      const missing = extractMissingColumn(res.error)
      if (missing?.table === 'transactions' && (missing.column === 'owner_id' || missing.column === 'user_id')) {
        continue
      }
      break
    }

    if (delErr) {
      return NextResponse.json(
        { success: false, error: delErr.message, meta: { ...errorPayload(delErr), triedUserColumns: candidates } },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: `${txnIds.length} transaksi berhasil dihapus` })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Internal server error' }, { status: 500 })
  }
}
