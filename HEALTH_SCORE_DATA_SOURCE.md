# HEALTH SCORE DATA SOURCE - PENTING!

## 📋 Status Saat Ini

**⚠️ PERLU PERHATIAN:** Business Health Score saat ini menggunakan **nilai default hardcoded**, BUKAN data real dari database.

## 🔍 Detail Masalah

### Lokasi File
`katalara-nextjs/src/components/dashboard/HealthScoreCard.tsx`

### Nilai Default Hardcoded
```typescript
export function HealthScoreCard({
  cashFlowHealth = 85,        // ❌ HARDCODED
  profitabilityHealth = 78,   // ❌ HARDCODED
  growthHealth = 92,          // ❌ HARDCODED
  efficiencyHealth = 70       // ❌ HARDCODED
}: HealthScoreProps) {
```

### Kesalahan di Footer
Component footer mengatakan:
> "Score dihitung berdasarkan 20+ metrik finansial & operasional bisnis Anda. Diperbarui real-time."

**Ini TIDAK BENAR** - Score saat ini static, tidak ada perhitungan real-time.

## ✅ Solusi yang Direkomendasikan

### 1. Hitung Cash Flow Health
```typescript
// Formula: (Revenue - Expenses) / Revenue * 100
// Data dari: transactions (revenue) + expenses
const calculateCashFlowHealth = async (userId: string) => {
  const thisMonth = new Date()
  const startOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1)
  
  // Total Revenue
  const { data: transactions } = await supabase
    .from('transactions')
    .select('total_amount')
    .eq('owner_id', userId)
    .gte('transaction_date', startOfMonth.toISOString())
  
  const totalRevenue = transactions?.reduce((sum, t) => sum + t.total_amount, 0) || 0
  
  // Total Expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount')
    .eq('owner_id', userId)
    .gte('expense_date', startOfMonth.toISOString())
  
  const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0
  
  // Calculate health score
  if (totalRevenue === 0) return 50 // Default neutral score
  
  const netCashFlow = totalRevenue - totalExpenses
  const cashFlowRatio = (netCashFlow / totalRevenue) * 100
  
  // Convert to 0-100 scale
  // Positive ratio = good (60-100), negative = bad (0-40)
  return Math.max(0, Math.min(100, 50 + cashFlowRatio / 2))
}
```

### 2. Hitung Profitability Health
```typescript
// Formula: (Net Profit / Revenue) * 100
const calculateProfitabilityHealth = async (userId: string) => {
  const thisMonth = new Date()
  const startOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1)
  
  // Get Revenue & Expenses
  const totalRevenue = ... // same as above
  const totalExpenses = ... // same as above
  
  if (totalRevenue === 0) return 50
  
  const profitMargin = ((totalRevenue - totalExpenses) / totalRevenue) * 100
  
  // Scale to 0-100:
  // 30%+ margin = 100 (excellent)
  // 20% margin = 80 (good)
  // 10% margin = 60 (fair)
  // 0% margin = 40 (break-even)
  // Negative margin = 0-40 (loss)
  
  if (profitMargin >= 30) return 100
  if (profitMargin >= 20) return 80 + (profitMargin - 20) * 2
  if (profitMargin >= 10) return 60 + (profitMargin - 10) * 2
  if (profitMargin >= 0) return 40 + (profitMargin) * 2
  return Math.max(0, 40 + (profitMargin * 2))
}
```

### 3. Hitung Growth Health
```typescript
// Formula: Compare current month vs previous month revenue
const calculateGrowthHealth = async (userId: string) => {
  const thisMonth = new Date()
  const startOfThisMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1)
  const startOfLastMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - 1, 1)
  
  // This month revenue
  const { data: thisMonthData } = await supabase
    .from('transactions')
    .select('total_amount')
    .eq('owner_id', userId)
    .gte('transaction_date', startOfThisMonth.toISOString())
  
  const thisMonthRevenue = thisMonthData?.reduce((sum, t) => sum + t.total_amount, 0) || 0
  
  // Last month revenue
  const { data: lastMonthData } = await supabase
    .from('transactions')
    .select('total_amount')
    .eq('owner_id', userId)
    .gte('transaction_date', startOfLastMonth.toISOString())
    .lt('transaction_date', startOfThisMonth.toISOString())
  
  const lastMonthRevenue = lastMonthData?.reduce((sum, t) => sum + t.total_amount, 0) || 0
  
  if (lastMonthRevenue === 0) return 70 // Default for new business
  
  const growthPercentage = ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
  
  // Scale to 0-100:
  // 20%+ growth = 100
  // 10% growth = 80
  // 0% growth = 50 (flat)
  // -10% decline = 30
  // -20%+ decline = 0
  
  if (growthPercentage >= 20) return 100
  if (growthPercentage >= 10) return 80 + (growthPercentage - 10) * 2
  if (growthPercentage >= 0) return 50 + (growthPercentage * 3)
  if (growthPercentage >= -10) return 30 + ((growthPercentage + 10) * 2)
  return Math.max(0, 30 + ((growthPercentage + 10) * 1.5))
}
```

### 4. Hitung Efficiency Health
```typescript
// Formula: Operating ratio (Operating Expenses / Revenue)
const calculateEfficiencyHealth = async (userId: string) => {
  const thisMonth = new Date()
  const startOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1)
  
  // Total Revenue
  const totalRevenue = ... // same as cash flow
  
  // Operating Expenses only (exclude investing & financing)
  const { data: operatingExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .eq('owner_id', userId)
    .eq('expense_type', 'operating')
    .gte('expense_date', startOfMonth.toISOString())
  
  const totalOperating = operatingExpenses?.reduce((sum, e) => sum + e.amount, 0) || 0
  
  if (totalRevenue === 0) return 50
  
  const operatingRatio = (totalOperating / totalRevenue) * 100
  
  // Lower ratio = better efficiency
  // 30% or less = 100 (excellent)
  // 50% = 80 (good)
  // 70% = 60 (fair)
  // 90% = 40 (poor)
  // 100%+ = 0 (critical)
  
  if (operatingRatio <= 30) return 100
  if (operatingRatio <= 50) return 80 + (50 - operatingRatio)
  if (operatingRatio <= 70) return 60 + (70 - operatingRatio)
  if (operatingRatio <= 90) return 40 + (90 - operatingRatio)
  return Math.max(0, 40 - (operatingRatio - 90) * 2)
}
```

## 📁 File yang Perlu Dibuat

### `/api/health-score/route.ts`
```typescript
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
        getAll() { return cookieStore.getAll() },
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

    // Calculate all 4 metrics
    const cashFlowHealth = await calculateCashFlowHealth(supabase, user.id)
    const profitabilityHealth = await calculateProfitabilityHealth(supabase, user.id)
    const growthHealth = await calculateGrowthHealth(supabase, user.id)
    const efficiencyHealth = await calculateEfficiencyHealth(supabase, user.id)

    return NextResponse.json({
      success: true,
      data: {
        cashFlowHealth,
        profitabilityHealth,
        growthHealth,
        efficiencyHealth,
        overall: Math.round((cashFlowHealth + profitabilityHealth + growthHealth + efficiencyHealth) / 4)
      }
    })

  } catch (error: any) {
    console.error('GET /api/health-score error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

### Update Dashboard Page
`katalara-nextjs/src/app/dashboard/page.tsx`

```typescript
// Fetch health score dari API
useEffect(() => {
  const fetchHealthScore = async () => {
    try {
      const response = await fetch('/api/health-score')
      const result = await response.json()
      
      if (result.success) {
        setHealthScoreData(result.data)
      }
    } catch (error) {
      console.error('Failed to load health score:', error)
    }
  }
  
  fetchHealthScore()
}, [])

// Pass real data to component
<HealthScoreCard
  cashFlowHealth={healthScoreData?.cashFlowHealth}
  profitabilityHealth={healthScoreData?.profitabilityHealth}
  growthHealth={healthScoreData?.growthHealth}
  efficiencyHealth={healthScoreData?.efficiencyHealth}
/>
```

## 🎯 Hasil Akhir

Setelah implementasi:
- ✅ Health score akan **dihitung dari data real** transactions & expenses
- ✅ Score akan **update otomatis** saat ada transaksi baru
- ✅ Footer component akan **benar-benar accurate**
- ✅ User dapat **melihat perubahan real-time** pada business health mereka

## 📌 Catatan Penting

1. **Caching**: Pertimbangkan cache 5-15 menit untuk performa (bukan real-time 100%, tapi cukup responsif)
2. **Default Values**: Untuk bisnis baru tanpa data, gunakan nilai netral (50-70) agar tidak misleading
3. **Historical Tracking**: Simpan snapshot health score harian/mingguan untuk trend analysis
4. **Alert System**: Tambahkan notifikasi jika score turun drastis (> 20 poin)

## 🚀 Prioritas Implementasi

1. **HIGH**: Buat `/api/health-score` endpoint dengan 4 calculation functions
2. **HIGH**: Update dashboard page untuk fetch dari API
3. **MEDIUM**: Update footer text di HealthScoreCard component
4. **LOW**: Tambah historical tracking & trend chart
5. **LOW**: Implement alert system untuk score drops

---

**Dibuat:** 20 November 2024  
**Status:** DOKUMENTASI - Belum Diimplementasi  
**Next Action:** Implementasi API endpoint health-score
