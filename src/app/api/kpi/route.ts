import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get today's date range
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
    
    // Get start of month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const todayStr = startOfDay.toISOString().split('T')[0]
    const monthStr = startOfMonth.toISOString().split('T')[0]

    // Parallel queries for performance
    const [
      expensesToday,
      expensesMonth,
      salesToday, 
      salesMonth,
      totalProducts,
      lowStockProducts
    ] = await Promise.all([
      // Expenses today (support owner_id atau user_id)
      supabase
        .from('expenses')
        .select('amount')
        .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
        .eq('expense_date', todayStr)
        .then(({ data, error }) => {
          if (error) throw error
          return data?.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0
        }),

      // Expenses this month (support owner_id atau user_id)
      supabase
        .from('expenses')
        .select('amount')
        .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
        .gte('expense_date', monthStr)
        .then(({ data, error }) => {
          if (error) throw error
          return data?.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0
        }),

      // Sales today (placeholder - implement when sales table exists)
      Promise.resolve(0),

      // Sales this month (placeholder)
      Promise.resolve(0),

      // Total products (support owner_id atau user_id)
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
        .then(({ count, error }) => {
          if (error) throw error
          return count || 0
        }),

      // Low stock products (support owner_id atau user_id)
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
        .lte('stock', 10)
        .then(({ count, error }) => {
          if (error) throw error
          return count || 0
        })
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
