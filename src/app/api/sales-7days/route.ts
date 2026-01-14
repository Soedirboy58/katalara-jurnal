import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const toNumber = (v: unknown): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  const n = Number((v ?? '').toString().replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

const isSchemaMismatchError = (err: any) => {
  const msg = ((err?.message || err?.details || '') as string).toLowerCase()
  const code = (err?.code || err?.error_code || '').toString()
  return (
    code === '42703' ||
    msg.includes('does not exist') ||
    msg.includes('could not find') ||
    msg.includes('schema cache') ||
    msg.includes('unknown field')
  )
}

async function tableHasColumn(supabase: any, table: string, column: string) {
  const { error } = await supabase.from(table).select(column).limit(1)
  if (!error) return true
  return !isSchemaMismatchError(error)
}

async function getOwnershipFilter(supabase: any, table: string, userId: string) {
  const hasUserId = await tableHasColumn(supabase, table, 'user_id')
  const hasOwnerId = await tableHasColumn(supabase, table, 'owner_id')

  if (hasUserId && hasOwnerId) {
    return {
      apply(q: any) {
        return q.or(`user_id.eq.${userId},owner_id.eq.${userId}`)
      }
    }
  }
  if (hasUserId) {
    return { apply: (q: any) => q.eq('user_id', userId) }
  }
  if (hasOwnerId) {
    return { apply: (q: any) => q.eq('owner_id', userId) }
  }
  return { apply: (q: any) => q }
}

export async function GET(request: Request) {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get last 7 days date range
    const today = new Date()
    const dates = []
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(today.getDate() - i)
      dates.push(date.toISOString().split('T')[0])
    }

    const txOwnership = await getOwnershipFilter(supabase, 'transactions', user.id)

    // Fetch sales data for each day (paid only)
    const salesPromises = dates.map(async (dateStr) => {
      const startIso = `${dateStr}T00:00:00`
      const endIso = `${dateStr}T23:59:59`

      // Prefer unified `transactions`
      const txRes = await txOwnership.apply(
        supabase
          .from('transactions')
          .select('total')
          .eq('payment_status', 'paid')
          .gte('transaction_date', startIso)
          .lte('transaction_date', endIso)
      )

      if (!txRes.error) {
        const total = txRes.data?.reduce((sum: number, row: any) => sum + toNumber(row?.total), 0) || 0
        return { date: dateStr, sales: total }
      }

      // Fallback to legacy incomes
      if (!isSchemaMismatchError(txRes.error)) {
        console.error(`[Sales 7 Days] Error for ${dateStr} (transactions):`, txRes.error)
        return { date: dateStr, sales: 0 }
      }

      const { data, error } = await supabase
        .from('incomes')
        .select('amount')
        .eq('user_id', user.id)
        .in('payment_status', ['paid', 'lunas', 'Lunas'])
        .eq('income_date', dateStr)

      if (error) {
        console.error(`[Sales 7 Days] Error for ${dateStr} (incomes):`, error)
        return { date: dateStr, sales: 0 }
      }

      const total = data?.reduce((sum: number, income: any) => sum + toNumber(income?.amount), 0) || 0
      return { date: dateStr, sales: total }
    })

    const salesData = await Promise.all(salesPromises)

    // Format dates to Indonesian day names
    const formattedData = salesData.map(item => {
      const date = new Date(item.date + 'T00:00:00')
      const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' })
      
      return {
        date: dayName,
        fullDate: item.date,
        sales: item.sales
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedData
    })

  } catch (error: any) {
    console.error('[Sales 7 Days] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
