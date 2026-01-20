import { NextResponse } from 'next/server'
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type DbUser = { user_id: string } | { id: string } | { owner_id: string }

const paidLabels = ['paid', 'lunas', 'Lunas']

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
      },
    }
  }

  if (hasUserId) {
    return {
      apply(q: any) {
        return q.eq('user_id', userId)
      },
    }
  }

  if (hasOwnerId) {
    return {
      apply(q: any) {
        return q.eq('owner_id', userId)
      },
    }
  }

  return {
    apply(q: any) {
      return q
    },
  }
}

async function pickAmountColumn(supabase: any, table: string, candidates: string[]) {
  for (const col of candidates) {
    const ok = await tableHasColumn(supabase, table, col)
    if (ok) return col
  }
  return candidates[0]
}

function requireCronAuth(req: Request): string | null {
  // In dev/local allow without secret.
  if (process.env.NODE_ENV !== 'production') return null

  const secret = process.env.CRON_SECRET || process.env.CRON_API_KEY
  if (!secret) return 'Missing CRON_SECRET / CRON_API_KEY env'

  const auth = req.headers.get('authorization') || ''
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  const alt = req.headers.get('x-cron-secret') || ''

  if (token === secret || alt === secret) return null
  return 'Forbidden'
}

async function upsertNotification(
  supabase: any,
  notif: {
    user_id: string
    notification_key: string
    type: string
    title: string
    message: string
    severity: 'info' | 'warning' | 'critical' | 'success'
    action_url?: string | null
    entity_type?: string | null
    entity_id?: string | null
  }
) {
  const payload = {
    user_id: notif.user_id,
    notification_key: notif.notification_key,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    severity: notif.severity,
    action_url: notif.action_url || null,
    entity_type: notif.entity_type || null,
    entity_id: notif.entity_id || null,
  }

  return supabase
    .from('notifications')
    .upsert(payload, { onConflict: 'user_id,notification_key' })
}

export async function GET(req: Request) {
  const authErr = requireCronAuth(req)
  if (authErr) return NextResponse.json({ ok: false, error: authErr }, { status: 403 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { ok: false, error: 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    )
  }

  const supabase = createSupabaseJsClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const url = new URL(req.url)
  const final = url.searchParams.get('final') === '1'

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const in3Days = new Date(today)
  in3Days.setDate(in3Days.getDate() + 3)
  const in3DaysStr = in3Days.toISOString().split('T')[0]

  // Load all users from user_profiles (service role bypasses RLS)
  const { data: users, error: usersErr } = await supabase
    .from('user_profiles')
    .select('user_id')

  if (usersErr) {
    return NextResponse.json({ ok: false, error: usersErr.message }, { status: 500 })
  }

  const userIds = (users || [])
    .map((u: DbUser) => (u as any).user_id || (u as any).id || (u as any).owner_id)
    .filter(Boolean)

  let inserted = 0
  const errors: Array<{ userId: string; error: string }> = []

  for (const userId of userIds) {
    try {
      // Settings (schema-drift safe between user_id/owner_id)
      let settings: any = null
      let settingsErr: any = null

      ;({ data: settings, error: settingsErr } = await supabase
        .from('business_configurations')
        .select('daily_expense_limit,daily_revenue_target,enable_expense_notifications,notification_threshold')
        .eq('user_id', userId)
        .maybeSingle())

      if (settingsErr && isSchemaMismatchError(settingsErr)) {
        ;({ data: settings, error: settingsErr } = await supabase
          .from('business_configurations')
          .select('daily_expense_limit,daily_revenue_target,enable_expense_notifications,notification_threshold')
          .eq('owner_id', userId)
          .maybeSingle())
      }

      if (settingsErr && settingsErr.code !== 'PGRST116') {
        throw new Error(`settings: ${settingsErr.message}`)
      }

      const dailyExpenseLimit = toNumber(settings?.daily_expense_limit)
      const dailyRevenueTarget = toNumber(settings?.daily_revenue_target)
      const enableExpenseNotifications = settings?.enable_expense_notifications !== false
      const thresholdPct = toNumber(settings?.notification_threshold) || 80

      // Compute today's expense (cash-out only for limit)
      const expenseOwnership = await getOwnershipFilter(supabase, 'expenses', userId)
      const expenseAmountCol = await pickAmountColumn(supabase, 'expenses', ['grand_total', 'amount', 'total'])

      const hasPaymentStatus = await tableHasColumn(supabase, 'expenses', 'payment_status')
      const hasPaidAmount = await tableHasColumn(supabase, 'expenses', 'paid_amount')
      const hasDownPayment = await tableHasColumn(supabase, 'expenses', 'down_payment')

      const extraCols = [
        hasPaymentStatus ? 'payment_status' : null,
        hasPaidAmount ? 'paid_amount' : null,
        hasDownPayment ? 'down_payment' : null,
      ].filter(Boolean)

      const selectCols = [expenseAmountCol, ...extraCols]
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(',')

      let expQ: any = supabase.from('expenses').select(selectCols)
      expQ = expenseOwnership.apply(expQ)
      const { data: expRows, error: expErr } = await expQ.eq('expense_date', todayStr)
      if (expErr && !isSchemaMismatchError(expErr)) {
        throw new Error(`expenses: ${expErr.message}`)
      }

      const isPaid = (status: unknown) => {
        const s = (status ?? '').toString().trim().toLowerCase()
        return paidLabels.some((p) => (p ?? '').toString().trim().toLowerCase() === s)
      }

      const cashSplit = (expRows || []).reduce(
        (acc: { all: number; cash: number; unpaid: number }, row: any) => {
          const total = Math.max(0, toNumber(row?.[expenseAmountCol]))
          acc.all += total

          const paid = Math.max(toNumber(row?.paid_amount), toNumber(row?.down_payment))
          const rowCash = isPaid(row?.payment_status) ? total : Math.min(total, Math.max(0, paid))
          acc.cash += rowCash
          acc.unpaid += Math.max(0, total - rowCash)
          return acc
        },
        { all: 0, cash: 0, unpaid: 0 }
      )

      const expenseTotalCash = cashSplit.cash
      const expenseTempo = cashSplit.unpaid

      if (dailyExpenseLimit > 0 && enableExpenseNotifications) {
        const pct = (expenseTotalCash / dailyExpenseLimit) * 100
        if (pct >= thresholdPct) {
          const over = pct >= 100
          const key = `expense_limit_${over ? 'over' : 'near'}_${todayStr}`
          const title = over ? '🚨 Limit Pengeluaran Terlampaui' : '⚠️ Mendekati Limit Pengeluaran'
          const message = `Kas keluar hari ini Rp ${expenseTotalCash.toLocaleString('id-ID')} (${pct.toFixed(0)}% dari limit Rp ${dailyExpenseLimit.toLocaleString('id-ID')}).${expenseTempo > 0 ? ` Belanja tempo Rp ${expenseTempo.toLocaleString('id-ID')} (belum mengurangi kas).` : ''}`

          const res = await upsertNotification(supabase, {
            user_id: userId,
            notification_key: key,
            type: 'expense_limit',
            title,
            message,
            severity: over ? 'critical' : 'warning',
            action_url: '/dashboard/settings',
          })

          if (res.error) throw new Error(`notif(expense_limit): ${res.error.message}`)
          inserted++
        }
      }

      // Compute today's income (transactions)
      const incomeOwnership = await getOwnershipFilter(supabase, 'transactions', userId)
      const incomeAmountCol = await pickAmountColumn(supabase, 'transactions', ['total', 'amount', 'grand_total', 'total_amount'])
      const hasTransactionDate = await tableHasColumn(supabase, 'transactions', 'transaction_date')
      const dateCol = hasTransactionDate ? 'transaction_date' : 'income_date'

      const startIso = `${todayStr}T00:00:00`
      const endIso = `${todayStr}T23:59:59`

      let incQ: any = supabase.from('transactions').select(incomeAmountCol)
      incQ = incomeOwnership.apply(incQ)
      const { data: incRows, error: incErr } = await incQ.gte(dateCol, startIso).lte(dateCol, endIso)
      if (incErr && !isSchemaMismatchError(incErr)) {
        throw new Error(`transactions: ${incErr.message}`)
      }

      const incomeTotal = (incRows || []).reduce((sum: number, row: any) => sum + toNumber(row?.[incomeAmountCol]), 0)

      if (dailyRevenueTarget > 0) {
        if (incomeTotal >= dailyRevenueTarget) {
          const key = `revenue_target_achieved_${todayStr}`
          const message = `Target pemasukan harian tercapai: Rp ${incomeTotal.toLocaleString('id-ID')} (target Rp ${dailyRevenueTarget.toLocaleString('id-ID')}).`
          const res = await upsertNotification(supabase, {
            user_id: userId,
            notification_key: key,
            type: 'revenue_target',
            title: '✅ Target Pemasukan Tercapai',
            message,
            severity: 'success',
            action_url: '/dashboard',
          })
          if (res.error) throw new Error(`notif(revenue_target_ok): ${res.error.message}`)
          inserted++
        } else if (final) {
          const key = `revenue_target_missed_${todayStr}`
          const message = `Target pemasukan hari ini belum tercapai: Rp ${incomeTotal.toLocaleString('id-ID')} dari target Rp ${dailyRevenueTarget.toLocaleString('id-ID')}.`
          const res = await upsertNotification(supabase, {
            user_id: userId,
            notification_key: key,
            type: 'revenue_target',
            title: '⚠️ Target Pemasukan Belum Tercapai',
            message,
            severity: 'warning',
            action_url: '/dashboard',
          })
          if (res.error) throw new Error(`notif(revenue_target_miss): ${res.error.message}`)
          inserted++
        }
      }

      // Due-date reminders
      // IMPORTANT: In Postgres, `col NOT IN (...)` excludes NULLs (it becomes NULL/unknown).
      // Many legacy rows have NULL payment_status, so include NULL explicitly as unpaid.
      const paidList = `(${paidLabels.map((v) => `"${v}"`).join(',')})`

      // Receivables: transactions with due_date not null, due soon/overdue, not paid
      const { data: rxRows, error: rxErr } = await incomeOwnership
        .apply(
          supabase
            .from('transactions')
            .select(`${incomeAmountCol},due_date,payment_status`)
            .not('due_date', 'is', null)
        )
        .lte('due_date', in3DaysStr)
        .or(`payment_status.is.null,payment_status.not.in.${paidList}`)

      if (rxErr && !isSchemaMismatchError(rxErr)) {
        throw new Error(`receivables: ${rxErr.message}`)
      }

      const rxOverdue = (rxRows || []).filter((r: any) => (r?.due_date || '').toString() < todayStr)
      const rxSoon = (rxRows || []).filter((r: any) => {
        const d = (r?.due_date || '').toString()
        return d >= todayStr && d <= in3DaysStr
      })

      if (rxOverdue.length) {
        const total = rxOverdue.reduce((s: number, r: any) => s + toNumber(r?.[incomeAmountCol]), 0)
        const res = await upsertNotification(supabase, {
          user_id: userId,
          notification_key: `receivables_overdue_${todayStr}`,
          type: 'due_date',
          title: `⏰ Piutang Lewat Tempo (${rxOverdue.length})`,
          message: `Ada ${rxOverdue.length} piutang lewat tempo. Total Rp ${total.toLocaleString('id-ID')}.`,
          severity: 'warning',
          action_url: '/dashboard/input-income',
        })
        if (res.error) throw new Error(`notif(rx_overdue): ${res.error.message}`)
        inserted++
      }

      if (rxSoon.length) {
        const total = rxSoon.reduce((s: number, r: any) => s + toNumber(r?.[incomeAmountCol]), 0)
        const res = await upsertNotification(supabase, {
          user_id: userId,
          notification_key: `receivables_due_soon_${todayStr}`,
          type: 'due_date',
          title: `🔔 Piutang Jatuh Tempo (≤3 hari) (${rxSoon.length})`,
          message: `Ada ${rxSoon.length} piutang akan jatuh tempo ≤3 hari. Total Rp ${total.toLocaleString('id-ID')}.`,
          severity: 'info',
          action_url: '/dashboard/input-income',
        })
        if (res.error) throw new Error(`notif(rx_due_soon): ${res.error.message}`)
        inserted++
      }

      // Payables: expenses with due_date not null and unpaid
      const expenseHasDueDate = await tableHasColumn(supabase, 'expenses', 'due_date')
      if (expenseHasDueDate) {
        let payQ: any = supabase.from('expenses').select(`${expenseAmountCol},due_date,payment_status`)
        payQ = expenseOwnership.apply(payQ)
        payQ = payQ.not('due_date', 'is', null).lte('due_date', in3DaysStr)
        payQ = payQ.or(`payment_status.is.null,payment_status.not.in.${paidList}`)

        const { data: payRows, error: payErr } = await payQ
        if (payErr && !isSchemaMismatchError(payErr)) {
          throw new Error(`payables: ${payErr.message}`)
        }

        const payOverdue = (payRows || []).filter((r: any) => (r?.due_date || '').toString() < todayStr)
        const paySoon = (payRows || []).filter((r: any) => {
          const d = (r?.due_date || '').toString()
          return d >= todayStr && d <= in3DaysStr
        })

        if (payOverdue.length) {
          const total = payOverdue.reduce((s: number, r: any) => s + toNumber(r?.[expenseAmountCol]), 0)
          const res = await upsertNotification(supabase, {
            user_id: userId,
            notification_key: `payables_overdue_${todayStr}`,
            type: 'due_date',
            title: `💳 Utang Lewat Tempo (${payOverdue.length})`,
            message: `Ada ${payOverdue.length} utang lewat tempo. Total Rp ${total.toLocaleString('id-ID')}.`,
            severity: 'warning',
            action_url: '/dashboard/input-expenses',
          })
          if (res.error) throw new Error(`notif(pay_overdue): ${res.error.message}`)
          inserted++
        }

        if (paySoon.length) {
          const total = paySoon.reduce((s: number, r: any) => s + toNumber(r?.[expenseAmountCol]), 0)
          const res = await upsertNotification(supabase, {
            user_id: userId,
            notification_key: `payables_due_soon_${todayStr}`,
            type: 'due_date',
            title: `🔔 Utang Jatuh Tempo (≤3 hari) (${paySoon.length})`,
            message: `Ada ${paySoon.length} utang akan jatuh tempo ≤3 hari. Total Rp ${total.toLocaleString('id-ID')}.`,
            severity: 'info',
            action_url: '/dashboard/input-expenses',
          })
          if (res.error) throw new Error(`notif(pay_due_soon): ${res.error.message}`)
          inserted++
        }
      }
    } catch (e: any) {
      errors.push({ userId, error: e?.message || 'Unknown error' })
    }
  }

  return NextResponse.json({ ok: true, users: userIds.length, inserted, errors, final })
}
