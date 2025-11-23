import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Helper function to calculate cash flow health
async function calculateCashFlowHealth(supabase: any, userId: string) {
  const thisMonth = new Date()
  const startOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1).toISOString().split('T')[0]
  
  try {
    // Total Revenue from incomes
    const { data: incomes } = await supabase
      .from('incomes')
      .select('amount')
      .eq('user_id', userId)
      .eq('payment_status', 'Lunas')
      .gte('income_date', startOfMonth)
    
    const totalRevenue = incomes?.reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0) || 0
    
    // Total Expenses
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount')
      .or(`owner_id.eq.${userId},user_id.eq.${userId}`)
      .gte('expense_date', startOfMonth)
    
    const totalExpenses = expenses?.reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0) || 0
    
    // Calculate health score
    if (totalRevenue === 0 && totalExpenses === 0) return 70 // Default for new users
    if (totalRevenue === 0) return 30 // Only expenses, bad
    
    const netCashFlow = totalRevenue - totalExpenses
    const cashFlowRatio = (netCashFlow / totalRevenue) * 100
    
    // Convert to 0-100 scale
    // Positive ratio = good (60-100), negative = bad (0-40)
    let score = 50 + (cashFlowRatio / 2)
    return Math.max(0, Math.min(100, Math.round(score)))
  } catch (error) {
    console.error('Cash flow calculation error:', error)
    return 50
  }
}

// Helper function to calculate profitability health
async function calculateProfitabilityHealth(supabase: any, userId: string) {
  const thisMonth = new Date()
  const startOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1).toISOString().split('T')[0]
  
  try {
    // Get Revenue & Expenses
    const { data: incomes } = await supabase
      .from('incomes')
      .select('amount')
      .eq('user_id', userId)
      .eq('payment_status', 'Lunas')
      .gte('income_date', startOfMonth)
    
    const totalRevenue = incomes?.reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0) || 0
    
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount')
      .or(`owner_id.eq.${userId},user_id.eq.${userId}`)
      .gte('expense_date', startOfMonth)
    
    const totalExpenses = expenses?.reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0) || 0
    
    if (totalRevenue === 0 && totalExpenses === 0) return 70
    if (totalRevenue === 0) return 20
    
    const profitMargin = ((totalRevenue - totalExpenses) / totalRevenue) * 100
    
    // Scale to 0-100
    if (profitMargin >= 30) return 100
    if (profitMargin >= 20) return 80 + Math.round((profitMargin - 20) * 2)
    if (profitMargin >= 10) return 60 + Math.round((profitMargin - 10) * 2)
    if (profitMargin >= 0) return 40 + Math.round(profitMargin * 2)
    return Math.max(0, 40 + Math.round(profitMargin * 2))
  } catch (error) {
    console.error('Profitability calculation error:', error)
    return 50
  }
}

// Helper function to calculate growth health
async function calculateGrowthHealth(supabase: any, userId: string) {
  const thisMonth = new Date()
  const startOfThisMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1).toISOString().split('T')[0]
  const startOfLastMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - 1, 1).toISOString().split('T')[0]
  const endOfLastMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 0).toISOString().split('T')[0]
  
  try {
    // This month revenue
    const { data: thisMonthData } = await supabase
      .from('incomes')
      .select('amount')
      .eq('user_id', userId)
      .eq('payment_status', 'Lunas')
      .gte('income_date', startOfThisMonth)
    
    const thisMonthRevenue = thisMonthData?.reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0) || 0
    
    // Last month revenue
    const { data: lastMonthData } = await supabase
      .from('incomes')
      .select('amount')
      .eq('user_id', userId)
      .eq('payment_status', 'Lunas')
      .gte('income_date', startOfLastMonth)
      .lte('income_date', endOfLastMonth)
    
    const lastMonthRevenue = lastMonthData?.reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0) || 0
    
    // Default for new business
    if (lastMonthRevenue === 0 && thisMonthRevenue === 0) return 70
    if (lastMonthRevenue === 0) return 90 // First month with sales
    
    const growthPercentage = ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    
    // Scale to 0-100
    if (growthPercentage >= 20) return 100
    if (growthPercentage >= 10) return 80 + Math.round((growthPercentage - 10) * 2)
    if (growthPercentage >= 0) return 50 + Math.round(growthPercentage * 3)
    if (growthPercentage >= -10) return 30 + Math.round((growthPercentage + 10) * 2)
    return Math.max(0, 30 + Math.round((growthPercentage + 10) * 1.5))
  } catch (error) {
    console.error('Growth calculation error:', error)
    return 50
  }
}

// Helper function to calculate efficiency health
async function calculateEfficiencyHealth(supabase: any, userId: string) {
  const thisMonth = new Date()
  const startOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1).toISOString().split('T')[0]
  
  try {
    // Total Revenue (only paid)
    const { data: incomes } = await supabase
      .from('incomes')
      .select('amount')
      .eq('user_id', userId)
      .eq('payment_status', 'Lunas')
      .gte('income_date', startOfMonth)
    
    const totalRevenue = incomes?.reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0) || 0
    
    // Operating Expenses only
    const { data: operatingExpenses } = await supabase
      .from('expenses')
      .select('amount')
      .or(`owner_id.eq.${userId},user_id.eq.${userId}`)
      .eq('expense_type', 'operating')
      .gte('expense_date', startOfMonth)
    
    const totalOperating = operatingExpenses?.reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0) || 0
    
    if (totalRevenue === 0 && totalOperating === 0) return 70
    if (totalRevenue === 0) return 20
    
    const operatingRatio = (totalOperating / totalRevenue) * 100
    
    // Lower ratio = better efficiency
    if (operatingRatio <= 30) return 100
    if (operatingRatio <= 50) return 80 + Math.round(50 - operatingRatio)
    if (operatingRatio <= 70) return 60 + Math.round(70 - operatingRatio)
    if (operatingRatio <= 90) return 40 + Math.round(90 - operatingRatio)
    return Math.max(0, 40 - Math.round((operatingRatio - 90) * 2))
  } catch (error) {
    console.error('Efficiency calculation error:', error)
    return 50
  }
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

    // Calculate all 4 metrics in parallel
    const [cashFlowHealth, profitabilityHealth, growthHealth, efficiencyHealth] = await Promise.all([
      calculateCashFlowHealth(supabase, user.id),
      calculateProfitabilityHealth(supabase, user.id),
      calculateGrowthHealth(supabase, user.id),
      calculateEfficiencyHealth(supabase, user.id)
    ])

    const overall = Math.round((cashFlowHealth + profitabilityHealth + growthHealth + efficiencyHealth) / 4)

    return NextResponse.json({
      success: true,
      data: {
        cashFlowHealth,
        profitabilityHealth,
        growthHealth,
        efficiencyHealth,
        overall
      }
    })

  } catch (error: any) {
    console.error('GET /api/health-score error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
