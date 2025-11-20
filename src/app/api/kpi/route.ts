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
    
    // Get start of month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const todayStr = startOfDay.toISOString().split('T')[0]
    const monthStr = startOfMonth.toISOString().split('T')[0]
    
    console.log('[KPI API] Date filters - Today:', todayStr, 'Month:', monthStr)

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

    const [
      expensesToday,
      expensesMonth,
      salesToday, 
      salesMonth,
      totalProducts,
      lowStockProducts
    ] = await Promise.all([
      fetchExpensesToday(),
      fetchExpensesMonth(),
      Promise.resolve(0), // Sales today placeholder
      Promise.resolve(0), // Sales month placeholder
      fetchTotalProducts(),
      fetchLowStockProducts()
    ])

    // Calculate net profit
    const netProfitToday = salesToday - expensesToday
    const netProfitMonth = salesMonth - expensesMonth

    return NextResponse.json({
      success: true,
      data: {
        today: {
          sales: salesToday,
          expenses: expensesToday,
          netProfit: netProfitToday
        },
        month: {
          sales: salesMonth,
          expenses: expensesMonth,
          netProfit: netProfitMonth
        },
        products: {
          total: totalProducts,
          lowStock: lowStockProducts
        }
      }
    })

  } catch (error: any) {
    console.error('GET /api/kpi error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
