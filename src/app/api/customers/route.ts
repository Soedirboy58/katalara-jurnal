import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type CustomersUserColumn = 'owner_id' | 'user_id'

type TransactionsUserColumn = 'owner_id' | 'user_id'

async function getTransactionsUserColumn(supabase: any): Promise<TransactionsUserColumn> {
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

    return (
      msg.includes('does not exist') &&
      (msg.includes(`transactions.${c}`) ||
        msg.includes(`column transactions.${c}`) ||
        msg.includes(`column \"${c}\"`) ||
        msg.includes(`\"${c}\" of relation \"transactions\"`) ||
        msg.includes(` ${c} `))
    )
  }

  {
    const { error } = await supabase.from('transactions').select('user_id').limit(1)
    if (!error) return 'user_id'
    if (!isMissingColumn(error, 'user_id')) return 'user_id'
  }

  {
    const { error } = await supabase.from('transactions').select('owner_id').limit(1)
    if (!error) return 'owner_id'
    return 'owner_id'
  }
}

const toNumber = (v: any): number => {
  const n = typeof v === 'number' ? v : Number((v ?? '').toString().replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

const maxIsoDate = (a?: string | null, b?: string | null) => {
  const aa = (a || '').toString()
  const bb = (b || '').toString()
  if (!aa) return bb || null
  if (!bb) return aa || null
  return aa > bb ? aa : bb
}

async function getCustomersUserColumn(supabase: any, userId: string): Promise<CustomersUserColumn> {
  const isMissingColumn = (err: any, col: string) => {
    const code = (err?.code || err?.error_code || '').toString().toUpperCase()
    if (code === '42703') return true

    const msg = (err?.message || err?.details || '').toString().toLowerCase()
    const c = col.toLowerCase()

    // PostgREST schema-cache / column missing variants
    // e.g. "Could not find the 'owner_id' column of 'customers' in the schema cache"
    if (code.startsWith('PGRST')) {
      if (msg.includes('schema cache') && msg.includes(c)) return true
      if (msg.includes('could not find') && msg.includes(c) && (msg.includes('column') || msg.includes('field'))) return true
      if (msg.includes('unknown field') && msg.includes(c)) return true
    }

    return (
      msg.includes('does not exist') &&
      (msg.includes(`customers.${c}`) ||
        msg.includes(`column customers.${c}`) ||
        msg.includes(`column \"${c}\"`) ||
        msg.includes(`\"${c}\" of relation \"customers\"`) ||
        msg.includes(` ${c} `))
    )
  }

  {
    const { error } = await supabase.from('customers').select('owner_id').limit(1)
    if (!error) return 'owner_id'
    if (!isMissingColumn(error, 'owner_id')) return 'owner_id'
  }

  {
    const { error } = await supabase.from('customers').select('user_id').limit(1)
    if (!error) return 'user_id'
    return 'user_id'
  }
}

// GET - Fetch customer by ID or list all
export async function GET(request: NextRequest) {
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

    const userCol = await getCustomersUserColumn(supabase, user.id)

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('id')
    const active = searchParams.get('active') !== 'false' // Default true
    const withStats = searchParams.get('with_stats') === 'true' || searchParams.get('withStats') === 'true'

    if (customerId) {
      // Fetch single customer
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq(userCol, user.id)
        .single()

      if (error) {
        console.error('Error fetching customer:', error)
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data
      })
    } else {
      // Fetch all customers
      let query = supabase
        .from('customers')
        .select('*')
        .eq(userCol, user.id)
        .order('created_at', { ascending: false })

      if (active) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching customers:', error)
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        )
      }

      // If requested, compute derived stats from transactions/incomes (best-effort).
      if (withStats) {
        try {
          const rows = (data || []) as any[]
          const byId = new Map<string, { total_transactions: number; total_purchase: number; last_transaction_date: string | null }>()
          for (const c of rows) {
            byId.set(c.id, {
              total_transactions: toNumber((c as any).total_transactions ?? 0),
              total_purchase: toNumber((c as any).total_purchase ?? (c as any).total_purchases ?? 0),
              last_transaction_date: (c as any).last_transaction_date ?? (c as any).last_transaction ?? null
            })
          }

          // 1) Transactions (preferred)
          try {
            const txUserCol = await getTransactionsUserColumn(supabase)
            const { data: txs, error: txErr } = await supabase
              .from('transactions')
              .select('customer_id,total,transaction_date')
              .eq(txUserCol, user.id)
              .not('customer_id', 'is', null)

            if (!txErr && txs) {
              for (const t of txs as any[]) {
                const cid = (t as any).customer_id
                if (!cid || !byId.has(cid)) continue
                const s = byId.get(cid)!
                s.total_transactions += 1
                s.total_purchase += toNumber((t as any).total ?? (t as any).grand_total ?? (t as any).total_amount ?? 0)
                const d = ((t as any).transaction_date || '').toString().slice(0, 10) || null
                s.last_transaction_date = maxIsoDate(s.last_transaction_date, d)
              }
            }
          } catch (e) {
            // ignore missing table/RLS mismatch; we'll still try legacy incomes
            console.warn('customers stats: transactions aggregation skipped', e)
          }

          // 2) Legacy incomes fallback
          try {
            const { data: incs, error: incErr } = await supabase
              .from('incomes')
              .select('customer_id,amount,income_date')
              .eq('user_id', user.id)
              .not('customer_id', 'is', null)

            if (!incErr && incs) {
              for (const t of incs as any[]) {
                const cid = (t as any).customer_id
                if (!cid || !byId.has(cid)) continue
                const s = byId.get(cid)!
                s.total_transactions += 1
                s.total_purchase += toNumber((t as any).amount ?? 0)
                const d = ((t as any).income_date || '').toString().slice(0, 10) || null
                s.last_transaction_date = maxIsoDate(s.last_transaction_date, d)
              }
            }
          } catch (e) {
            console.warn('customers stats: incomes aggregation skipped', e)
          }

          const enriched = rows.map((c) => {
            const s = byId.get(c.id)
            if (!s) return c
            return {
              ...c,
              total_transactions: s.total_transactions,
              total_purchase: s.total_purchase,
              last_transaction_date: s.last_transaction_date
            }
          })

          return NextResponse.json({
            success: true,
            data: enriched,
            count: enriched.length
          })
        } catch (e: any) {
          console.warn('customers stats: enrichment failed, returning base rows', e)
        }
      }

      return NextResponse.json({
        success: true,
        data: data || [],
        count: data?.length || 0
      })
    }
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - Create new customer
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userCol = await getCustomersUserColumn(supabase, user.id)

    const body = await request.json()
    
    // Validation
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nama pelanggan wajib diisi' },
        { status: 400 }
      )
    }

    // Check duplicate name (optional - can be removed if you want to allow same names)
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq(userCol, user.id)
      .ilike('name', body.name.trim())
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Pelanggan dengan nama ini sudah ada' },
        { status: 400 }
      )
    }

    const customerData = {
      [userCol]: user.id,
      name: body.name.trim(),
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      notes: body.notes || null,
      is_active: true
    }

    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single()

    if (error) {
      console.error('Error creating customer:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Pelanggan berhasil ditambahkan'
    })
  } catch (error: any) {
    console.error('POST /api/customers error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Update customer
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userCol = await getCustomersUserColumn(supabase, user.id)

    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Customer ID required' },
        { status: 400 }
      )
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (body.name) updateData.name = body.name.trim()
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.email !== undefined) updateData.email = body.email
    if (body.address !== undefined) updateData.address = body.address
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const { data, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', body.id)
      .eq(userCol, user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating customer:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Pelanggan berhasil diupdate'
    })
  } catch (error: any) {
    console.error('PATCH /api/customers error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete customer (set is_active = false)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userCol = await getCustomersUserColumn(supabase, user.id)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Customer ID required' },
        { status: 400 }
      )
    }

    // Soft delete
    const { error } = await supabase
      .from('customers')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq(userCol, user.id)

    if (error) {
      console.error('Error deleting customer:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Pelanggan berhasil dihapus'
    })
  } catch (error: any) {
    console.error('DELETE /api/customers error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
