import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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
        const { data, error } = await supabase
          .from('expenses')
          .select('amount')
          .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
          .eq('expense_date', todayStr)
        
        if (error) {
          console.error('[KPI API] Error fetching expenses today:', error)
          return 0
        }
        const total = data?.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0
        console.log('[KPI API] Expenses today:', total)
        return total
      } catch (err) {
        console.error('[KPI API] Exception in expenses today:', err)
        return 0
      }
    }

    const fetchExpensesMonth = async () => {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select('amount')
          .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
          .gte('expense_date', monthStr)
        
        if (error) {
          console.error('[KPI API] Error fetching expenses month:', error)
          return 0
        }
        const total = data?.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0
        console.log('[KPI API] Expenses month:', total)
        return total
      } catch (err) {
        console.error('[KPI API] Exception in expenses month:', err)
        return 0
      }
    }

    const fetchExpensesPreviousMonth = async () => {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select('amount')
          .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
          .gte('expense_date', prevMonthStartStr)
          .lte('expense_date', prevMonthEndStr)
        
        if (error) {
          console.error('[KPI API] Error fetching expenses previous month:', error)
          return 0
        }
        const total = data?.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0
        console.log('[KPI API] Expenses previous month:', total)
        return total
      } catch (err) {
        console.error('[KPI API] Exception in expenses previous month:', err)
        return 0
      }
    }

    const fetchTotalProducts = async () => {
      try {
        const { count, error } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
        
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
      try {
        const { count, error } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
          .lte('stock', 10)
        
        if (error) {
          console.error('[KPI API] Error fetching low stock:', error)
          return 0
        }
        console.log('[KPI API] Low stock products:', count)
        return count || 0
      } catch (err) {
        console.error('[KPI API] Exception in low stock:', err)
        return 0
      }
    }

    // === NEW UMKM-RELEVANT KPIs ===
    
    // 1. PIUTANG JATUH TEMPO (Overdue Receivables)
    const fetchOverdueReceivables = async () => {
      try {
        const { data, error } = await supabase
          .from('incomes')
          .select('amount, customer_name, due_date')
          .eq('user_id', user.id)
          .eq('payment_status', 'Pending')
          .not('due_date', 'is', null)
          .lt('due_date', todayStr)
        
        if (error) {
          console.error('[KPI API] Error fetching overdue receivables:', error)
          return { count: 0, amount: 0 }
        }
        
        const total = data?.reduce((sum, i) => sum + parseFloat(i.amount.toString()), 0) || 0
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
        const { data, error } = await supabase
          .from('expenses')
          .select('amount, notes, due_date')
          .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
          .eq('payment_status', 'Pending')
          .not('due_date', 'is', null)
          .lt('due_date', todayStr)
        
        if (error) {
          console.error('[KPI API] Error fetching overdue payables:', error)
          return { count: 0, amount: 0 }
        }
        
        const total = data?.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0
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
        const { data, error } = await supabase
          .from('incomes')
          .select('amount')
          .eq('user_id', user.id)
          .eq('income_date', todayStr)
        
        if (error) {
          console.error('[KPI API] Error fetching incomes today:', error)
          return 0
        }
        const total = data?.reduce((sum, i) => sum + parseFloat(i.amount.toString()), 0) || 0
        console.log('[KPI API] Incomes today:', total)
        return total
      } catch (err) {
        console.error('[KPI API] Exception in incomes today:', err)
        return 0
      }
    }

    // 4. MONTH INCOME (for reporting - ALL incomes)
    const fetchIncomesMonth = async () => {
      try {
        const { data, error } = await supabase
          .from('incomes')
          .select('amount')
          .eq('user_id', user.id)
          .gte('income_date', monthStr)
        
        if (error) {
          console.error('[KPI API] Error fetching incomes month:', error)
          return 0
        }
        const total = data?.reduce((sum, i) => sum + parseFloat(i.amount.toString()), 0) || 0
        console.log('[KPI API] Incomes month:', total)
        return total
      } catch (err) {
        console.error('[KPI API] Exception in incomes month:', err)
        return 0
      }
    }

    // 5. MONTH INCOME PAID (for cash position - LUNAS only)
    const fetchIncomesMonthPaid = async () => {
      try {
        const { data, error } = await supabase
          .from('incomes')
          .select('amount')
          .eq('user_id', user.id)
          .eq('payment_status', 'Lunas')
          .gte('income_date', monthStr)
        
        if (error) {
          console.error('[KPI API] Error fetching paid incomes month:', error)
          return 0
        }
        const total = data?.reduce((sum, i) => sum + parseFloat(i.amount.toString()), 0) || 0
        console.log('[KPI API] Paid incomes month:', total)
        return total
      } catch (err) {
        console.error('[KPI API] Exception in paid incomes month:', err)
        return 0
      }
    }

    // 6. MONTH EXPENSES PAID (for cash position - LUNAS only)
    const fetchExpensesMonthPaid = async () => {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select('amount')
          .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
          .eq('payment_status', 'Lunas')
          .gte('expense_date', monthStr)
        
        if (error) {
          console.error('[KPI API] Error fetching paid expenses month:', error)
          return 0
        }
        const total = data?.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0
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
    const fetchCriticalStock = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, stock_quantity, min_stock_alert')
          .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
          .eq('track_inventory', true)
        
        if (error) {
          console.error('[KPI API] Error fetching critical stock:', error)
          return 0
        }
        
        // Count products where stock <= min_stock_alert
        const critical = data?.filter(p => 
          p.stock_quantity <= (p.min_stock_alert || 0)
        ).length || 0
        
        console.log('[KPI API] Critical stock items:', critical)
        return critical
      } catch (err) {
        console.error('[KPI API] Exception in critical stock:', err)
        return 0
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
      criticalStock
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
      fetchCriticalStock()
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
        }
      }
    })

  } catch (error: any) {
    console.error('GET /api/kpi error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
