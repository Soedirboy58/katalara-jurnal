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

    // Fetch sales data for each day (only Lunas)
    const salesPromises = dates.map(async (dateStr) => {
      const { data, error } = await supabase
        .from('incomes')
        .select('amount')
        .eq('user_id', user.id)
        .eq('payment_status', 'Lunas')
        .eq('income_date', dateStr)

      if (error) {
        console.error(`[Sales 7 Days] Error for ${dateStr}:`, error)
        return { date: dateStr, sales: 0 }
      }

      const total = data?.reduce((sum, income) => sum + parseFloat(income.amount.toString()), 0) || 0
      
      return {
        date: dateStr,
        sales: total
      }
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
