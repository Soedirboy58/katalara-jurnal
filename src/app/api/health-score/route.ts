import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type UserColumn = 'user_id' | 'owner_id'

const clampScore = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

const toNumber = (v: any): number => {
  const n = typeof v === 'number' ? v : Number((v ?? '').toString().replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

const normalize = (v: unknown) => (v ?? '').toString().trim().toLowerCase()

const isPaidStatus = (status: unknown) => {
  const s = normalize(status)
  if (!s) return false
  return ['paid', 'lunas', 'selesai', 'done', 'completed'].includes(s)
}

const isTempoPayment = (row: any) => {
  const type = normalize(row?.payment_type)
  const method = normalize(row?.payment_method)
  const status = normalize(row?.payment_status)

  // Strong signal: has due date
  if (row?.due_date) return true

  // Common labels
  if (['tempo', 'credit', 'kredit', 'hutang', 'piutang'].includes(type)) return true
  if (['tempo', 'credit', 'kredit'].includes(method)) return true

  // Some UIs store "Pending" for tempo
  if (status === 'pending') return true

  return false
}

const isoDate = (d: Date) => d.toISOString().split('T')[0]

function monthRanges(now = new Date()) {
  const startThis = new Date(now.getFullYear(), now.getMonth(), 1)
  const startLast = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endLast = new Date(now.getFullYear(), now.getMonth(), 0)
  return {
    startThisDate: isoDate(startThis),
    startLastDate: isoDate(startLast),
    endLastDate: isoDate(endLast)
  }
}

async function detectUserColumn(supabase: any, table: string, preferred: UserColumn = 'user_id'): Promise<UserColumn> {
  const isMissingColumn = (err: any, col: string) => {
    const code = (err?.code || err?.error_code || '').toString().toUpperCase()
    if (code === '42703') return true
    const msg = (err?.message || err?.details || '').toString().toLowerCase()
    if (code.startsWith('PGRST') && msg.includes('schema cache') && msg.includes(col.toLowerCase())) return true
    if (code.startsWith('PGRST') && msg.includes('could not find') && msg.includes(col.toLowerCase())) return true
    if (msg.includes('does not exist') && msg.includes(col.toLowerCase())) return true
    return false
  }

  const hasColumn = async (col: UserColumn) => {
    const { error } = await supabase.from(table).select(col).limit(1)
    if (!error) return true
    if (isMissingColumn(error, col)) return false
    return true // unknown error: assume exists to avoid breaking
  }

  if (preferred === 'user_id') {
    if (await hasColumn('user_id')) return 'user_id'
    if (await hasColumn('owner_id')) return 'owner_id'
    return 'owner_id'
  }

  if (await hasColumn('owner_id')) return 'owner_id'
  if (await hasColumn('user_id')) return 'user_id'
  return 'owner_id'
}

async function loadRevenueAndCashIn(supabase: any, userId: string, startDate: string, endDate?: string) {
  // Prefer unified `transactions` table (new system)
  try {
    const userCol = await detectUserColumn(supabase, 'transactions', 'user_id')
    let query = supabase
      .from('transactions')
      .select('*')
      .eq(userCol, userId)
      .gte('transaction_date', `${startDate}T00:00:00`)

    if (endDate) {
      query = query.lte('transaction_date', `${endDate}T23:59:59`)
    }

    const { data, error } = await query
    if (error) throw error

    const rows = data || []
    const revenue = rows.reduce(
      (sum: number, r: any) => sum + toNumber(r?.total ?? r?.total_amount ?? r?.grand_total ?? 0),
      0
    )

    // Cash-in rules:
    // - If status is paid, treat full total as cash-in (even if paid_amount is missing)
    // - If tempo, treat cash-in as paid_amount/down_payment (could be 0)
    // - Else, fallback to total (cash/transfer)
    const cashIn = rows.reduce((sum: number, r: any) => {
      const total = toNumber(r?.total ?? r?.total_amount ?? r?.grand_total ?? 0)
      const paid = Math.max(toNumber(r?.paid_amount ?? 0), toNumber(r?.down_payment ?? 0))
      if (isPaidStatus(r?.payment_status)) return sum + total
      if (isTempoPayment(r)) return sum + Math.min(total, Math.max(0, paid))
      if (paid > 0) return sum + Math.min(total, paid)
      return sum + total
    }, 0)
    return { revenue, cashIn, source: 'transactions' as const }
  } catch (e) {
    // Fallback to legacy `incomes`
    try {
      let q = supabase
        .from('incomes')
        .select('income_date,amount,payment_status')
        .eq('user_id', userId)
        .gte('income_date', startDate)

      if (endDate) q = q.lte('income_date', endDate)

      // If payment_status exists and matches Bahasa labels, prefer only paid.
      const { data } = await q
      const rows = data || []
      const revenue = rows
        .filter((r: any) => {
          const ps = (r?.payment_status || '').toString().toLowerCase()
          return !ps || ps === 'lunas' || ps === 'paid'
        })
        .reduce((sum: number, r: any) => sum + toNumber(r?.amount ?? 0), 0)

      // Legacy incomes has no paid_amount; treat paid revenue as revenue.
      return { revenue, cashIn: revenue, source: 'incomes' as const }
    } catch {
      return { revenue: 0, cashIn: 0, source: 'none' as const }
    }
  }
}

async function loadExpensesAndCashOut(supabase: any, userId: string, startDate: string, endDate?: string) {
  try {
    const userCol = await detectUserColumn(supabase, 'expenses', 'user_id')
    let q = supabase
      .from('expenses')
      .select('*')
      .eq(userCol, userId)
      .gte('expense_date', startDate)

    if (endDate) q = q.lte('expense_date', endDate)

    const { data, error } = await q
    if (error) throw error

    const rows = data || []
    const total = rows.reduce((sum: number, r: any) => sum + toNumber(r?.grand_total ?? r?.amount ?? 0), 0)

    // Cash-out rules:
    // - If status is paid, treat full total as cash-out
    // - If tempo, treat cash-out as down_payment/paid_amount (could be 0)
    // - Else, fallback to total (cash/transfer)
    const cashOut = rows.reduce((sum: number, r: any) => {
      const totalRow = toNumber(r?.grand_total ?? r?.amount ?? 0)
      const paid = Math.max(toNumber(r?.down_payment ?? 0), toNumber(r?.paid_amount ?? r?.paid_total ?? 0))
      if (isPaidStatus(r?.payment_status)) return sum + totalRow
      if (isTempoPayment(r)) return sum + Math.min(totalRow, Math.max(0, paid))
      if (paid > 0) return sum + Math.min(totalRow, paid)
      return sum + totalRow
    }, 0)

    const operating = rows
      .filter((r: any) => ((r?.expense_type || '').toString().toLowerCase() || 'operating') === 'operating')
      .reduce((sum: number, r: any) => sum + toNumber(r?.grand_total ?? r?.amount ?? 0), 0)

    return { total, cashOut, operating }
  } catch {
    return { total: 0, cashOut: 0, operating: 0 }
  }
}

function scoreCashFlow(cashIn: number, cashOut: number) {
  if (cashIn === 0 && cashOut === 0) return 70
  if (cashIn === 0 && cashOut > 0) return 30
  if (cashIn <= 0) return 50

  const net = cashIn - cashOut
  const ratioPct = (net / cashIn) * 100
  return clampScore(50 + ratioPct / 2)
}

function scoreProfitability(revenue: number, expenses: number) {
  if (revenue === 0 && expenses === 0) return 70
  if (revenue === 0) return 20
  const marginPct = ((revenue - expenses) / revenue) * 100

  if (marginPct >= 30) return 100
  if (marginPct >= 20) return clampScore(80 + (marginPct - 20) * 2)
  if (marginPct >= 10) return clampScore(60 + (marginPct - 10) * 2)
  if (marginPct >= 0) return clampScore(40 + marginPct * 2)
  return clampScore(40 + marginPct * 2)
}

function scoreGrowth(currRevenue: number, prevRevenue: number) {
  if (prevRevenue === 0 && currRevenue === 0) return 70
  if (prevRevenue === 0 && currRevenue > 0) return 90
  if (prevRevenue <= 0) return 50
  const growthPct = ((currRevenue - prevRevenue) / prevRevenue) * 100

  if (growthPct >= 20) return 100
  if (growthPct >= 10) return clampScore(80 + (growthPct - 10) * 2)
  if (growthPct >= 0) return clampScore(50 + growthPct * 3)
  if (growthPct >= -10) return clampScore(30 + (growthPct + 10) * 2)
  return clampScore(30 + (growthPct + 10) * 1.5)
}

function scoreEfficiency(revenue: number, operatingExpenses: number) {
  if (revenue === 0 && operatingExpenses === 0) return 70
  if (revenue === 0) return 20
  const ratioPct = (operatingExpenses / revenue) * 100

  if (ratioPct <= 30) return 100
  if (ratioPct <= 50) return clampScore(80 + (50 - ratioPct))
  if (ratioPct <= 70) return clampScore(60 + (70 - ratioPct))
  if (ratioPct <= 90) return clampScore(40 + (90 - ratioPct))
  return clampScore(40 - (ratioPct - 90) * 2)
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

    const { startThisDate, startLastDate, endLastDate } = monthRanges(new Date())

    // Load data for this month and last month
    const [revThis, revLast, expThis] = await Promise.all([
      loadRevenueAndCashIn(supabase, user.id, startThisDate),
      loadRevenueAndCashIn(supabase, user.id, startLastDate, endLastDate),
      loadExpensesAndCashOut(supabase, user.id, startThisDate)
    ])

    const cashFlowHealth = scoreCashFlow(revThis.cashIn, expThis.cashOut)
    const profitabilityHealth = scoreProfitability(revThis.revenue, expThis.total)
    const growthHealth = scoreGrowth(revThis.revenue, revLast.revenue)
    const efficiencyHealth = scoreEfficiency(revThis.revenue, expThis.operating)
    const overall = clampScore((cashFlowHealth + profitabilityHealth + growthHealth + efficiencyHealth) / 4)

    return NextResponse.json({
      success: true,
      data: {
        cashFlowHealth,
        profitabilityHealth,
        growthHealth,
        efficiencyHealth,
        overall,
        // Optional debug info for troubleshooting (UI can ignore)
        meta: {
          period: { startThisDate, startLastDate, endLastDate },
          revenue: { thisMonth: revThis.revenue, lastMonth: revLast.revenue, source: revThis.source },
          cash: { cashInThisMonth: revThis.cashIn, cashOutThisMonth: expThis.cashOut },
          expenses: { thisMonthTotal: expThis.total, thisMonthOperating: expThis.operating }
        }
      }
    })

  } catch (error: any) {
    console.error('GET /api/health-score error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
