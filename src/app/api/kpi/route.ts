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
    return {
      apply(q: any) {
        return q.eq('user_id', userId)
      }
    }
  }

  if (hasOwnerId) {
    return {
      apply(q: any) {
        return q.eq('owner_id', userId)
      }
    }
  }

  // Unknown schema; return a no-op filter (RLS should still protect data)
  return {
    apply(q: any) {
      return q
    }
  }
}

async function pickAmountColumn(supabase: any, table: string, candidates: string[]) {
  for (const col of candidates) {
    const ok = await tableHasColumn(supabase, table, col)
    if (ok) return col
  }
  return candidates[0]
}

const paidLabels = ['paid', 'lunas', 'Lunas', 'selesai', 'done']

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
    console.log('[KPI API] Starting request...')
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('[KPI API] Auth error:', userError)
      return NextResponse.json({ error: 'Auth error: ' + userError.message }, { status: 401 })
    }
    
    if (!user) {
      console.error('[KPI API] No user found')
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }
    
    console.log('[KPI API] User ID:', user.id)

    // Get today's date range
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
    
    // Get start of current month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    
    // Get previous month range (for Growth KPI)
    const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const endOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59)

    const todayStr = startOfDay.toISOString().split('T')[0]
    const monthStr = startOfMonth.toISOString().split('T')[0]
    const prevMonthStartStr = startOfPrevMonth.toISOString().split('T')[0]
    const prevMonthEndStr = endOfPrevMonth.toISOString().split('T')[0]
    
    console.log('[KPI API] Date filters - Today:', todayStr, 'Month:', monthStr, 'PrevMonth:', prevMonthStartStr, '-', prevMonthEndStr)

    // Parallel queries for performance with individual error handling
    const fetchExpensesToday = async () => {
      try {
        const ownership = await getOwnershipFilter(supabase, 'expenses', user.id)
        const amountCol = await pickAmountColumn(supabase, 'expenses', ['grand_total', 'amount', 'total'])
        let q: any = supabase.from('expenses').select(amountCol)
        q = ownership.apply(q)
        const { data, error } = await q.eq('expense_date', todayStr)
        
        if (error) {
          console.error('[KPI API] Error fetching expenses today:', error)
          return 0
        }
        const total =
          data?.reduce((sum, e: any) => sum + toNumber(e?.[amountCol]), 0) || 0
        console.log('[KPI API] Expenses today:', total)
        return total
      } catch (err) {
        console.error('[KPI API] Exception in expenses today:', err)
        return 0
      }
    }

    const fetchExpensesMonth = async () => {
      try {
        const ownership = await getOwnershipFilter(supabase, 'expenses', user.id)
        const amountCol = await pickAmountColumn(supabase, 'expenses', ['grand_total', 'amount', 'total'])
        let q: any = supabase.from('expenses').select(amountCol)
        q = ownership.apply(q)
        const { data, error } = await q.gte('expense_date', monthStr)
        
        if (error) {
          console.error('[KPI API] Error fetching expenses this month:', error)
          return 0
        }
        const total =
          data?.reduce((sum, e: any) => sum + toNumber(e?.[amountCol]), 0) || 0
        console.log('[KPI API] Expenses month:', total)
        return total
      } catch (err) {
        console.error('[KPI API] Exception in expenses month:', err)
        return 0
      }
    }

    const fetchExpensesPreviousMonth = async () => {
      try {
        const ownership = await getOwnershipFilter(supabase, 'expenses', user.id)
        const amountCol = await pickAmountColumn(supabase, 'expenses', ['grand_total', 'amount', 'total'])
        let q: any = supabase.from('expenses').select(amountCol)
        q = ownership.apply(q)
        const { data, error } = await q.gte('expense_date', prevMonthStartStr).lte('expense_date', prevMonthEndStr)
        
        if (error) {
          console.error('[KPI API] Error fetching expenses last month:', error)
          return 0
        }
        const total =
          data?.reduce((sum, e: any) => sum + toNumber(e?.[amountCol]), 0) || 0
        console.log('[KPI API] Expenses previous month:', total)
        return total
      } catch (err) {
        console.error('[KPI API] Exception in expenses previous month:', err)
        return 0
      }
    }

    const fetchTotalProducts = async () => {
      try {
        const ownership = await getOwnershipFilter(supabase, 'products', user.id)
        let q: any = supabase.from('products').select('id', { count: 'exact', head: true })
        q = ownership.apply(q)
        const { count, error } = await q
        
        if (error) {
          console.error('[KPI API] Error fetching products:', error)
          return 0
        }
        console.log('[KPI API] Total products:', count)
        return count || 0
      } catch (err) {
        console.error('[KPI API] Exception in products:', err)
        return 0
      }
    }

    const fetchLowStockProducts = async () => {
      // ⚠️ STOCK TRACKING DISABLED - 'stock' column doesn't exist in products table
      // TODO: Implement with stock_movements table
      console.log('[KPI API] Low stock monitoring pending - stock_movements table needed')
      return 0 // Will be implemented with proper inventory tracking
    }

    // === NEW UMKM-RELEVANT KPIs ===

    const fetchIncomeAmountColumn = async () => {
      return pickAmountColumn(supabase, 'transactions', ['total', 'amount', 'grand_total', 'total_amount'])
    }

    const fetchIncomeOwnership = async () => {
      return getOwnershipFilter(supabase, 'transactions', user.id)
    }

    const fetchIncomeDateColumn = async () => {
      // unified table uses transaction_date; legacy incomes uses income_date
      const hasTransactionDate = await tableHasColumn(supabase, 'transactions', 'transaction_date')
      return hasTransactionDate ? 'transaction_date' : 'income_date'
    }

    // 1. PIUTANG JATUH TEMPO (Overdue Receivables) - from unified `transactions` when available
    const fetchOverdueReceivables = async () => {
      try {
        const ownership = await fetchIncomeOwnership()
        const amountCol = await fetchIncomeAmountColumn()

        // Prefer unified transactions
        const txRes = await ownership
          .apply(
            supabase
              .from('transactions')
              .select(`${amountCol}, due_date`)
              .not('due_date', 'is', null)
              .lt('due_date', todayStr)
              .neq('payment_status', 'paid')
          )

        if (!txRes.error) {
          const total = txRes.data?.reduce((sum: number, row: any) => sum + toNumber(row?.[amountCol]), 0) || 0
          return { count: txRes.data?.length || 0, amount: total }
        }

        // Fallback to legacy incomes if unified schema isn't available
        if (!isSchemaMismatchError(txRes.error)) {
          console.error('[KPI API] Error fetching overdue receivables (transactions):', txRes.error)
          return { count: 0, amount: 0 }
        }

        const { data, error } = await supabase
          .from('incomes')
          .select('amount, due_date')
          .eq('user_id', user.id)
          .not('due_date', 'is', null)
          .lt('due_date', todayStr)

        if (error) {
          console.error('[KPI API] Error fetching overdue receivables (incomes):', error)
          return { count: 0, amount: 0 }
        }

        const total = data?.reduce((sum, i: any) => sum + toNumber(i.amount), 0) || 0
        console.log('[KPI API] Overdue receivables:', data?.length, 'items, Rp', total)
        return { count: data?.length || 0, amount: total }
      } catch (err) {
        console.error('[KPI API] Exception in overdue receivables:', err)
        return { count: 0, amount: 0 }
      }
    }

    // 2. UTANG JATUH TEMPO (Overdue Payables)
    const fetchOverduePayables = async () => {
      try {
        const ownership = await getOwnershipFilter(supabase, 'expenses', user.id)
        const amountCol = await pickAmountColumn(supabase, 'expenses', ['grand_total', 'amount', 'total'])
        const hasDueDate = await tableHasColumn(supabase, 'expenses', 'due_date')

        const paidList = `(${paidLabels.map((v) => `"${v}"`).join(',')})`

        let q: any = supabase
          .from('expenses')
          .select(`${amountCol}${hasDueDate ? ',due_date' : ''}`)
        q = ownership.apply(q)
        if (hasDueDate) q = q.not('due_date', 'is', null).lt('due_date', todayStr)
        // Include NULLs as unpaid, and exclude paid statuses (best-effort across old/new labels)
        q = q.or(`payment_status.is.null,payment_status.not.in.${paidList}`)

        const { data, error } = await q
        
        if (error) {
          console.error('[KPI API] Error fetching overdue payables:', error)
          return { count: 0, amount: 0 }
        }
        
        const total = data?.reduce((sum: number, e: any) => sum + toNumber(e?.[amountCol]), 0) || 0
        console.log('[KPI API] Overdue payables:', data?.length, 'items, Rp', total)
        return { count: data?.length || 0, amount: total }
      } catch (err) {
        console.error('[KPI API] Exception in overdue payables:', err)
        return { count: 0, amount: 0 }
      }
    }

    // 3. TODAY'S INCOME (for target tracking - ALL incomes)
    const fetchIncomesToday = async () => {
      try {
        const ownership = await fetchIncomeOwnership()
        const amountCol = await fetchIncomeAmountColumn()
        const dateCol = await fetchIncomeDateColumn()

        const startIso = `${todayStr}T00:00:00`
        const endIso = `${todayStr}T23:59:59`

        const txRes = await ownership
          .apply(
            supabase
              .from('transactions')
              .select(amountCol)
              .gte(dateCol, startIso)
              .lte(dateCol, endIso)
          )

        if (!txRes.error) {
          const total = txRes.data?.reduce((sum: number, row: any) => sum + toNumber(row?.[amountCol]), 0) || 0
          console.log('[KPI API] Incomes today (transactions):', total)
          return total
        }

        if (!isSchemaMismatchError(txRes.error)) {
          console.error('[KPI API] Error fetching incomes today (transactions):', txRes.error)
          return 0
        }

        // Fallback legacy
        const { data, error } = await supabase
          .from('incomes')
          .select('amount')
          .eq('user_id', user.id)
          .eq('income_date', todayStr)

        if (error) {
          console.error('[KPI API] Error fetching incomes today (incomes):', error)
          return 0
        }

        const total = data?.reduce((sum, i: any) => sum + toNumber(i.amount), 0) || 0
        console.log('[KPI API] Incomes today (incomes):', total)
        return total
      } catch (err) {
        console.error('[KPI API] Exception in incomes today:', err)
        return 0
      }
    }

    // 4. MONTH INCOME (for reporting - ALL incomes)
    const fetchIncomesMonth = async () => {
      try {
        const ownership = await fetchIncomeOwnership()
        const amountCol = await fetchIncomeAmountColumn()
        const dateCol = await fetchIncomeDateColumn()

        const startIso = `${monthStr}T00:00:00`

        const txRes = await ownership
          .apply(supabase.from('transactions').select(amountCol).gte(dateCol, startIso))

        if (!txRes.error) {
          const total = txRes.data?.reduce((sum: number, row: any) => sum + toNumber(row?.[amountCol]), 0) || 0
          console.log('[KPI API] Incomes month (transactions):', total)
          return total
        }

        if (!isSchemaMismatchError(txRes.error)) {
          console.error('[KPI API] Error fetching incomes month (transactions):', txRes.error)
          return 0
        }

        const { data, error } = await supabase
          .from('incomes')
          .select('amount')
          .eq('user_id', user.id)
          .gte('income_date', monthStr)

        if (error) {
          console.error('[KPI API] Error fetching incomes month (incomes):', error)
          return 0
        }

        const total = data?.reduce((sum, i: any) => sum + toNumber(i.amount), 0) || 0
        console.log('[KPI API] Incomes month (incomes):', total)
        return total
      } catch (err) {
        console.error('[KPI API] Exception in incomes month:', err)
        return 0
      }
    }

    // 5. MONTH INCOME PAID (for cash position - paid only)
    const fetchIncomesMonthPaid = async () => {
      try {
        const ownership = await fetchIncomeOwnership()
        const amountCol = await fetchIncomeAmountColumn()
        const dateCol = await fetchIncomeDateColumn()

        const startIso = `${monthStr}T00:00:00`

        const txRes = await ownership
          .apply(
            supabase
              .from('transactions')
              .select(amountCol)
              .eq('payment_status', 'paid')
              .gte(dateCol, startIso)
          )

        if (!txRes.error) {
          const total = txRes.data?.reduce((sum: number, row: any) => sum + toNumber(row?.[amountCol]), 0) || 0
          console.log('[KPI API] Paid incomes month (transactions):', total)
          return total
        }

        if (!isSchemaMismatchError(txRes.error)) {
          console.error('[KPI API] Error fetching paid incomes month (transactions):', txRes.error)
          return 0
        }

        const { data, error } = await supabase
          .from('incomes')
          .select('amount')
          .eq('user_id', user.id)
          .in('payment_status', paidLabels)
          .gte('income_date', monthStr)

        if (error) {
          console.error('[KPI API] Error fetching paid incomes month (incomes):', error)
          return 0
        }

        const total = data?.reduce((sum, i: any) => sum + toNumber(i.amount), 0) || 0
        console.log('[KPI API] Paid incomes month (incomes):', total)
        return total
      } catch (err) {
        console.error('[KPI API] Exception in paid incomes month:', err)
        return 0
      }
    }

    // 6. MONTH EXPENSES PAID (for cash position - paid only)
    const fetchExpensesMonthPaid = async () => {
      try {
        const ownership = await getOwnershipFilter(supabase, 'expenses', user.id)
        const amountCol = await pickAmountColumn(supabase, 'expenses', ['grand_total', 'amount', 'total'])
        let q: any = supabase.from('expenses').select(amountCol)
        q = ownership.apply(q)
        const { data, error } = await q.in('payment_status', paidLabels).gte('expense_date', monthStr)
        
        if (error) {
          console.error('[KPI API] Error fetching paid expenses month:', error)
          return 0
        }

        const total = data?.reduce((sum: number, e: any) => sum + toNumber(e?.[amountCol]), 0) || 0
        console.log('[KPI API] Paid expenses month:', total)
        return total
      } catch (err) {
        console.error('[KPI API] Exception in paid expenses month:', err)
        return 0
      }
    }

    // 7. GET USER TARGET from business_configurations
    const fetchUserTarget = async () => {
      try {
        const { data, error } = await supabase
          .from('business_configurations')
          .select('daily_revenue_target, daily_expense_limit')
          .eq('user_id', user.id)
          .single()
        
        if (error || !data) {
          console.log('[KPI API] No business config found, using defaults')
          return { dailyTarget: 0, dailyExpenseLimit: 0 }
        }
        
        return {
          dailyTarget: parseFloat(data.daily_revenue_target?.toString() || '0'),
          dailyExpenseLimit: parseFloat(data.daily_expense_limit?.toString() || '0')
        }
      } catch (err) {
        console.error('[KPI API] Exception in user target:', err)
        return { dailyTarget: 0, dailyExpenseLimit: 0 }
      }
    }

    // 8. CRITICAL STOCK (stock <= min_stock_alert)
    // ⚠️ STOCK TRACKING DISABLED - stock_quantity column doesn't exist in products table
    // TODO: Implement critical stock alerts using stock_movements table
    const fetchCriticalStock = async () => {
      console.log('[KPI API] Critical stock monitoring pending - stock_movements table needed')
      return 0 // Will be implemented with proper inventory tracking
    }

    // 9. REPEAT CUSTOMER RATE (customers with 2+ transactions)
    const fetchRepeatCustomerRate = async () => {
      try {
        const ownership = await getOwnershipFilter(supabase, 'customers', user.id)
        const hasTotalTransactions = await tableHasColumn(supabase, 'customers', 'total_transactions')

        // If `total_transactions` exists, use it (fast).
        const { data: customers, error: customerError } = await ownership.apply(
          supabase
            .from('customers')
            .select(hasTotalTransactions ? 'id, name, total_transactions' : 'id, name')
        )
        
        if (customerError) {
          console.error('[KPI API] Error fetching customers:', customerError)
          return { total: 0, repeat: 0, rate: 0 }
        }

        const totalCustomers = customers?.length || 0
        
        if (totalCustomers === 0) {
          return { total: 0, repeat: 0, rate: 0 }
        }

        // Count customers with 2+ transactions (repeat customers)
        let repeatCount = 0
        if (hasTotalTransactions) {
          repeatCount = customers?.filter((c: any) => (c.total_transactions || 0) >= 2).length || 0
        } else {
          // Fallback: estimate using unified transactions (all-time, capped)
          const txOwnership = await fetchIncomeOwnership()
          const { data: txRows, error: txErr } = await txOwnership.apply(
            supabase
              .from('transactions')
              .select('customer_id')
              .not('customer_id', 'is', null)
              .limit(5000)
          )

          if (!txErr && txRows?.length) {
            const counts = new Map<string, number>()
            for (const r of txRows) {
              const id = (r as any)?.customer_id
              if (!id) continue
              counts.set(id, (counts.get(id) || 0) + 1)
            }
            repeatCount = Array.from(counts.values()).filter((n) => n >= 2).length
          }
        }
        const repeatRate = (repeatCount / totalCustomers) * 100
        
        console.log('[KPI API] Repeat customers:', repeatCount, '/', totalCustomers, '=', repeatRate.toFixed(1), '%')
        return { total: totalCustomers, repeat: repeatCount, rate: repeatRate }
      } catch (err) {
        console.error('[KPI API] Exception in repeat customer rate:', err)
        return { total: 0, repeat: 0, rate: 0 }
      }
    }

    const [
      overdueReceivables,
      overduePayables,
      incomesToday,
      incomesMonth,
      incomesMonthPaid,
      expensesToday,
      expensesMonth,
      expensesMonthPaid,
      expensesPrevMonth,
      userTarget,
      totalProducts,
      criticalStock,
      repeatCustomerData
    ] = await Promise.all([
      fetchOverdueReceivables(),
      fetchOverduePayables(),
      fetchIncomesToday(),
      fetchIncomesMonth(),
      fetchIncomesMonthPaid(),
      fetchExpensesToday(),
      fetchExpensesMonth(),
      fetchExpensesMonthPaid(),
      fetchExpensesPreviousMonth(),
      fetchUserTarget(),
      fetchTotalProducts(),
      fetchCriticalStock(),
      fetchRepeatCustomerRate()
    ])

    // Calculate important metrics
    const targetProgress = userTarget.dailyTarget > 0 
      ? (incomesToday / userTarget.dailyTarget) * 100 
      : 0
    
    const expenseVsLimit = userTarget.dailyExpenseLimit > 0
      ? (expensesToday / userTarget.dailyExpenseLimit) * 100
      : 0

    // Calculate expense growth (Nov vs Okt)
    const expenseGrowth = expensesPrevMonth > 0
      ? ((expensesMonth - expensesPrevMonth) / expensesPrevMonth) * 100
      : 0

    // Cash Position: Only count LUNAS transactions (actual cash in/out)
    const cashPosition = incomesMonthPaid - expensesMonthPaid

    return NextResponse.json({
      success: true,
      data: {
        // CRITICAL: Piutang Jatuh Tempo
        overdueReceivables: {
          count: overdueReceivables.count,
          amount: overdueReceivables.amount
        },
        
        // CRITICAL: Utang Jatuh Tempo
        overduePayables: {
          count: overduePayables.count,
          amount: overduePayables.amount
        },
        
        // TODAY: Target tracking
        today: {
          income: incomesToday,
          expense: expensesToday,
          target: userTarget.dailyTarget,
          targetProgress: Math.round(targetProgress),
          expenseLimit: userTarget.dailyExpenseLimit,
          expenseVsLimit: Math.round(expenseVsLimit)
        },
        
        // MONTH: Financial overview with Growth
        month: {
          income: incomesMonth,
          expense: expensesMonth,
          expensePrevMonth: expensesPrevMonth,
          expenseGrowth: Math.round(expenseGrowth),
          netProfit: incomesMonth - expensesMonth,
          // Actual cash in/out (Lunas only)
          incomePaid: incomesMonthPaid,
          expensePaid: expensesMonthPaid
        },
        
        // OPERATIONAL: Products & Cash
        operations: {
          totalProducts: totalProducts,
          criticalStock: criticalStock,
          cashPosition: cashPosition // Real cash = Lunas Income - Lunas Expense
        },
        
        // CUSTOMER RETENTION: Repeat Customer Rate
        customers: {
          total: repeatCustomerData.total,
          repeat: repeatCustomerData.repeat,
          repeatRate: repeatCustomerData.rate
        }
      }
    })

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'An error occurred'
    console.error('GET /api/kpi error:', err)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
