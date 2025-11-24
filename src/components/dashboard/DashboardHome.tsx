'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  UsersIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlusIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline'
import { InsightsPanel } from './InsightsPanel'
import { HealthScoreCard } from './HealthScoreCard'
import { SalesChart } from './SalesChart'
import { RevenueExpenseChart } from './RevenueExpenseChart'

interface KPICard {
  title: string
  value: string
  subtitle: string
  icon: any
  trend?: {
    value: string
    isPositive: boolean
  }
  color: string
}

export function DashboardHome() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [businessName, setBusinessName] = useState('')
  const [businessConfig, setBusinessConfig] = useState<any>(null)
  const [kpiData, setKpiData] = useState<any>(null)
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [showAllTransactions, setShowAllTransactions] = useState(false)
  const [currentTrxPage, setCurrentTrxPage] = useState(1)
  const trxPerPage = 10
  
  // Settings & ROI
  const [settings, setSettings] = useState<any>(null)
  const [roi, setRoi] = useState<number | null>(null)
  
  // Health Score State
  const [healthScore, setHealthScore] = useState<any>(null)
  const [loadingHealthScore, setLoadingHealthScore] = useState(true)

  // Fetch Health Score
  useEffect(() => {
    const fetchHealthScore = async () => {
      try {
        setLoadingHealthScore(true)
        const response = await fetch('/api/health-score')
        const result = await response.json()
        
        if (result.success) {
          setHealthScore(result.data)
        }
      } catch (error) {
        console.error('Failed to load health score:', error)
      } finally {
        setLoadingHealthScore(false)
      }
    }
    
    fetchHealthScore()
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchHealthScore, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Load profile
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('business_name')
            .eq('user_id', user.id)
            .single()
          
          if (profile) {
            setBusinessName(profile.business_name)
          }

          // Load business config
          const { data: config } = await supabase
            .from('business_configurations')
            .select('*')
            .eq('user_id', user.id)
            .single()
          
          if (config) {
            setBusinessConfig(config)
          }

          // Load KPI data from API
          await refreshKpiData()
          await fetchRecentTransactions()
          await loadSettings()
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
    
    // Auto-refresh KPI when user returns to page (visibility change)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshKpiData()
        fetchRecentTransactions()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [supabase])
  
  const refreshKpiData = async () => {
    try {
      // Force cache bust with timestamp
      const timestamp = Date.now()
      const kpiResponse = await fetch(`/api/kpi?t=${timestamp}`, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      
      console.log('KPI API Response Status:', kpiResponse.status)
      
      if (kpiResponse.ok) {
        const kpiResult = await kpiResponse.json()
        console.log('KPI API Result:', kpiResult)
        
        if (kpiResult.success) {
          console.log('Setting KPI Data:', kpiResult.data)
          setKpiData(kpiResult.data)
        } else {
          console.error('KPI API returned success:false', kpiResult)
        }
      } else {
        const errorText = await kpiResponse.text()
        console.error('KPI API Error Response:', errorText)
      }
    } catch (error) {
      console.error('Error refreshing KPI:', error)
    }
  }
  
  const fetchRecentTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // Fetch all expenses (will paginate in UI)
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
        .order('expense_date', { ascending: false })
        .limit(100) // Get last 100 transactions
      
      if (expenses) {
        setRecentTransactions(expenses)
      }
    } catch (error) {
      console.error('Error fetching recent transactions:', error)
    }
  }
  
  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const result = await response.json()
      
      if (result.success && result.data) {
        setSettings(result.data)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }
  
  useEffect(() => {
    if (kpiData && settings?.track_roi) {
      calculateROI()
    }
  }, [kpiData, settings])
  
  const calculateROI = () => {
    if (!kpiData) return
    
    const period = settings?.roi_period || 'monthly'
    let revenue = 0
    let expenses = 0
    
    switch(period) {
      case 'daily':
        revenue = kpiData.today?.income || 0
        expenses = kpiData.today?.expense || 0
        break
      case 'weekly':
        // Assume week is ~7x daily (simplified)
        revenue = (kpiData.today?.income || 0) * 7
        expenses = (kpiData.today?.expense || 0) * 7
        break
      case 'monthly':
      default:
        revenue = kpiData.month?.income || 0
        expenses = kpiData.month?.expense || 0
        break
    }
    
    if (expenses > 0) {
      const roiValue = ((revenue - expenses) / expenses) * 100
      setRoi(roiValue)
    }
  }

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  // Debug: Log kpiData whenever it changes
  useEffect(() => {
    console.log('kpiData state updated:', kpiData)
    if (kpiData?.month) {
      console.log('Chart Data - Revenue (All):', kpiData.month.income, 'Expense (All):', kpiData.month.expense)
      console.log('Chart Data - Revenue (Paid):', kpiData.month.incomePaid, 'Expense (Paid):', kpiData.month.expensePaid)
    }
  }, [kpiData])

  const kpiCards: KPICard[] = [
    // CRITICAL: Piutang Jatuh Tempo
    {
      title: 'Piutang Jatuh Tempo',
      value: kpiData?.overdueReceivables?.count !== undefined ? String(kpiData.overdueReceivables.count) : '0',
      subtitle: kpiData?.overdueReceivables?.amount ? formatCurrency(kpiData.overdueReceivables.amount) : 'Rp 0',
      icon: ExclamationTriangleIcon,
      trend: kpiData?.overdueReceivables?.count > 0 
        ? { value: 'URGENT!', isPositive: false }
        : { value: 'Clear', isPositive: true },
      color: kpiData?.overdueReceivables?.count > 0 ? 'red' : 'green'
    },
    // CRITICAL: Utang Jatuh Tempo
    {
      title: 'Utang Jatuh Tempo',
      value: kpiData?.overduePayables?.count !== undefined ? String(kpiData.overduePayables.count) : '0',
      subtitle: kpiData?.overduePayables?.amount ? formatCurrency(kpiData.overduePayables.amount) : 'Rp 0',
      icon: CreditCardIcon,
      trend: kpiData?.overduePayables?.count > 0 
        ? { value: 'Bayar Sekarang!', isPositive: false }
        : { value: 'Clear', isPositive: true },
      color: kpiData?.overduePayables?.count > 0 ? 'red' : 'green'
    },
    // TARGET: Progress Harian
    {
      title: 'Target Harian',
      value: kpiData?.today?.targetProgress !== undefined ? `${kpiData.today.targetProgress}%` : '0%',
      subtitle: `${kpiData?.today?.income ? formatCurrency(kpiData.today.income) : 'Rp 0'} / ${kpiData?.today?.target ? formatCurrency(kpiData.today.target) : 'Set Target'}`,
      icon: ArrowTrendingUpIcon,
      trend: kpiData?.today?.targetProgress >= 100
        ? { value: 'Target Tercapai!', isPositive: true }
        : kpiData?.today?.targetProgress >= 50
        ? { value: 'On Track', isPositive: true }
        : { value: 'Perlu Effort', isPositive: false },
      color: kpiData?.today?.targetProgress >= 100 ? 'green' : kpiData?.today?.targetProgress >= 50 ? 'blue' : 'yellow'
    },
    // CASH: Posisi Kas
    {
      title: 'Posisi Kas',
      value: kpiData?.operations?.cashPosition !== undefined ? formatCurrency(kpiData.operations.cashPosition) : 'Rp 0',
      subtitle: 'Saldo setelah utang',
      icon: CurrencyDollarIcon,
      trend: kpiData?.operations?.cashPosition > 0 
        ? { value: 'Sehat', isPositive: true }
        : { value: 'Kritis!', isPositive: false },
      color: kpiData?.operations?.cashPosition > 0 ? 'green' : 'red'
    },
    // CUSTOMER RETENTION: Repeat Customer Rate
    {
      title: 'Repeat Customer',
      value: kpiData?.customers?.repeatRate !== undefined ? `${kpiData.customers.repeatRate.toFixed(1)}%` : '0%',
      subtitle: `${kpiData?.customers?.repeat || 0} dari ${kpiData?.customers?.total || 0} pelanggan`,
      icon: UsersIcon,
      trend: (() => {
        const rate = kpiData?.customers?.repeatRate || 0
        if (rate >= 60) return { value: 'Excellent!', isPositive: true }
        if (rate >= 40) return { value: 'Good', isPositive: true }
        if (rate >= 20) return { value: 'Fair', isPositive: false }
        return { value: 'Need Improvement', isPositive: false }
      })(),
      color: (() => {
        const rate = kpiData?.customers?.repeatRate || 0
        if (rate >= 60) return 'green'
        if (rate >= 40) return 'blue'
        if (rate >= 20) return 'yellow'
        return 'red'
      })()
    },
    // GROWTH: Pengeluaran Bulan Ini vs Bulan Lalu
    {
      title: 'Pengeluaran Bulan Ini',
      value: kpiData?.month?.expenseGrowth !== undefined ? `${kpiData.month.expenseGrowth > 0 ? '+' : ''}${kpiData.month.expenseGrowth}%` : '0%',
      subtitle: `${kpiData?.month?.expense ? formatCurrency(kpiData.month.expense) : 'Rp 0'} / ${kpiData?.month?.expensePrevMonth ? formatCurrency(kpiData.month.expensePrevMonth) : 'Set Limit'}`,
      icon: ShoppingBagIcon,
      trend: kpiData?.month?.expenseGrowth > 50
        ? { value: 'Naik Drastis!', isPositive: false }
        : kpiData?.month?.expenseGrowth > 20
        ? { value: 'Naik Signifikan', isPositive: false }
        : kpiData?.month?.expenseGrowth > 0
        ? { value: 'Naik Sedikit', isPositive: false }
        : kpiData?.month?.expenseGrowth < -20
        ? { value: 'Turun Banyak', isPositive: true }
        : { value: 'Stabil', isPositive: true },
      color: kpiData?.month?.expenseGrowth > 50 ? 'red' : kpiData?.month?.expenseGrowth > 20 ? 'yellow' : kpiData?.month?.expenseGrowth > 0 ? 'orange' : 'green'
    }
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-500' },
      red: { bg: 'bg-red-50', text: 'text-red-600', icon: 'text-red-500' },
      green: { bg: 'bg-green-50', text: 'text-green-600', icon: 'text-green-500' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-500' },
      yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', icon: 'text-yellow-500' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'text-orange-500' }
    }
    return colors[color] || colors.blue
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 sm:p-6 text-white">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2">
          Selamat Datang{businessName ? `, ${businessName}` : ''}! 👋
        </h1>
        <p className="text-sm sm:text-base text-blue-100">
          Berikut adalah ringkasan bisnis Anda hari ini
        </p>
      </div>
      
      {/* Smart Alerts Section */}
      {settings && kpiData && (
        <div className="space-y-3">
          {/* Expense Limit Warning */}
          {settings.daily_expense_limit && kpiData.today?.expenses && (() => {
            const percentage = (kpiData.today.expenses / settings.daily_expense_limit) * 100
            const threshold = settings.notification_threshold || 80
            
            if (percentage >= threshold) {
              return (
                <div key="expense-alert" className={`rounded-lg p-4 border-l-4 ${
                  percentage >= 100 
                    ? 'bg-red-50 border-red-500' 
                    : 'bg-amber-50 border-amber-500'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 ${
                      percentage >= 100 ? 'text-red-600' : 'text-amber-600'
                    }`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${
                        percentage >= 100 ? 'text-red-900' : 'text-amber-900'
                      }`}>
                        {percentage >= 100 ? '🚨 Limit Pengeluaran Terlampaui!' : '⚠️ Mendekati Limit Pengeluaran'}
                      </h3>
                      <p className={`text-sm mt-1 ${
                        percentage >= 100 ? 'text-red-800' : 'text-amber-800'
                      }`}>
                        Pengeluaran hari ini: <strong>{formatCurrency(kpiData.today.expenses)}</strong> ({percentage.toFixed(0)}% dari limit {formatCurrency(settings.daily_expense_limit)})
                      </p>
                      <a 
                        href="/dashboard/settings" 
                        className="inline-flex items-center gap-1 text-sm font-medium mt-2 text-blue-600 hover:text-blue-700"
                      >
                        Atur limit di Pengaturan →
                      </a>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          })()}

          {/* Overdue Receivables Alert */}
          {kpiData.overdueReceivables?.count > 0 && (
            <div key="receivables-alert" className="rounded-lg p-4 border-l-4 bg-orange-50 border-orange-500">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 text-orange-600">
                  <ExclamationTriangleIcon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900">
                    ⏰ Ada {kpiData.overdueReceivables.count} Piutang Lewat Tempo
                  </h3>
                  <p className="text-sm mt-1 text-orange-800">
                    Total: <strong>{formatCurrency(kpiData.overdueReceivables.amount)}</strong> perlu ditagih segera
                  </p>
                  <a 
                    href="/dashboard/input-income" 
                    className="inline-flex items-center gap-1 text-sm font-medium mt-2 text-blue-600 hover:text-blue-700"
                  >
                    Lihat daftar piutang →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Overdue Payables Alert */}
          {kpiData.overduePayables?.count > 0 && (
            <div key="payables-alert" className="rounded-lg p-4 border-l-4 bg-red-50 border-red-500">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 text-red-600">
                  <ExclamationTriangleIcon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900">
                    💳 Ada {kpiData.overduePayables.count} Utang Jatuh Tempo
                  </h3>
                  <p className="text-sm mt-1 text-red-800">
                    Total: <strong>{formatCurrency(kpiData.overduePayables.amount)}</strong> perlu dilunasi
                  </p>
                  <a 
                    href="/dashboard/input-expenses" 
                    className="inline-flex items-center gap-1 text-sm font-medium mt-2 text-blue-600 hover:text-blue-700"
                  >
                    Lihat daftar utang →
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ROI Widget - Professional Minimal Design */}
      {settings?.track_roi && roi !== null && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  roi >= 0 ? 'bg-emerald-50' : 'bg-red-50'
                }`}>
                  <ArrowTrendingUpIcon className={`w-5 h-5 ${
                    roi >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Return on Investment</h3>
                  <p className="text-xs text-gray-500">
                    {settings.roi_period === 'daily' ? 'Harian' : settings.roi_period === 'weekly' ? 'Mingguan' : 'Bulanan'}
                  </p>
                </div>
              </div>
            </div>

            {/* ROI Value - Hero Element */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className={`text-6xl font-bold tracking-tight ${
                  roi >= 20 ? 'text-emerald-600' :
                  roi >= 0 ? 'text-blue-600' :
                  'text-red-600'
                }`}>
                  {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                </div>
                <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                  roi >= 0 ? 'bg-emerald-100' : 'bg-red-100'
                }`}>
                  {roi >= 0 ? (
                    <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  ) : (
                    <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {roi >= 100 ? 'ROI Sangat Tinggi' :
                 roi >= 50 ? 'ROI Bagus' :
                 roi >= 20 ? 'ROI Positif' :
                 roi >= 0 ? 'ROI Tipis' :
                 'ROI Negatif'}
              </p>
            </div>

            {/* Interpretation */}
            <div className={`rounded-lg p-4 ${
              roi >= 20 ? 'bg-emerald-50 border border-emerald-200' :
              roi >= 0 ? 'bg-blue-50 border border-blue-200' :
              'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-xs leading-relaxed ${
                roi >= 20 ? 'text-emerald-900' :
                roi >= 0 ? 'text-blue-900' :
                'text-red-900'
              }`}>
                {roi >= 100 ? 'Setiap Rp 100 investasi menghasilkan Rp ' + (100 + roi).toFixed(0) + ' kembali.' :
                 roi >= 50 ? 'Bisnis menghasilkan ' + roi.toFixed(0) + '% lebih dari biaya operasional.' :
                 roi >= 20 ? 'Bisnis profitable dengan margin ' + roi.toFixed(0) + '%.' :
                 roi >= 0 ? 'ROI tipis (' + roi.toFixed(0) + '%). Perlu optimasi untuk meningkatkan profit.' :
                 'Pengeluaran melebihi pendapatan. Perlu tindakan segera.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Grid - Mobile Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {kpiCards.map((card, index) => {
          const colors = getColorClasses(card.color)
          const Icon = card.icon
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5 lg:p-6 hover:shadow-md transition-shadow duration-200 active:scale-[0.98]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">
                    {card.title}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 break-words">
                    {card.value}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">{card.subtitle}</p>
                </div>
                <div className={`p-2 sm:p-3 ${colors.bg} rounded-lg flex-shrink-0`}>
                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${colors.icon}`} />
                </div>
              </div>
              {card.trend && (
                <div className="mt-3 sm:mt-4 flex items-center">
                  {card.trend.isPositive ? (
                    <ArrowTrendingUpIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 mr-1" />
                  )}
                  <span
                    className={`text-xs sm:text-sm font-medium ${
                      card.trend.isPositive ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {card.trend.value}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500 ml-1">vs kemarin</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick Setup Prompt */}
      {(!settings?.daily_expense_limit && !settings?.daily_revenue_target) && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900">💡 Tingkatkan Kontrol Keuangan</h3>
              <p className="text-sm text-purple-800 mt-1">
                Atur limit pengeluaran harian, target pemasukan, dan analisa ROI untuk kontrol finansial yang lebih baik
              </p>
              <a 
                href="/dashboard/settings" 
                className="inline-flex items-center gap-1 text-sm font-medium mt-2 text-purple-700 hover:text-purple-900"
              >
                Atur Sekarang →
              </a>
            </div>
          </div>
        </div>
      )}
      
      {/* Business Health Score */}
      {loadingHealthScore ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      ) : (
        <HealthScoreCard 
          cashFlowHealth={healthScore?.cashFlowHealth}
          profitabilityHealth={healthScore?.profitabilityHealth}
          growthHealth={healthScore?.growthHealth}
          efficiencyHealth={healthScore?.efficiencyHealth}
        />
      )}

      {/* AI Insights Panel */}
      <InsightsPanel 
        businessCategory={businessConfig?.business_category}
        monthlyRevenue={45000000}
        monthlyTarget={businessConfig?.monthly_revenue_target || 50000000}
        profitMargin={22}
        targetMargin={businessConfig?.profit_margin_target || 25}
        cashBalance={15000000}
        minCashAlert={businessConfig?.minimum_cash_alert || 10000000}
      />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <SalesChart refreshTrigger={kpiData} />
        <RevenueExpenseChart 
          revenue={kpiData?.month?.incomePaid || 0} 
          expense={kpiData?.month?.expensePaid || 0}
          loading={loading}
        />
      </div>

      {/* Recent Transactions - Aktivitas Hari Ini */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            Aktivitas Hari Ini
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">{recentTransactions.length} total transaksi</span>
            {recentTransactions.length > 5 && (
              <button
                onClick={() => {
                  setShowAllTransactions(!showAllTransactions)
                  setCurrentTrxPage(1)
                }}
                className="text-xs text-[#1088ff] hover:text-[#0d6ecc] font-medium transition-colors"
              >
                {showAllTransactions ? 'Tampilkan Sedikit' : 'Lihat Semua'}
              </button>
            )}
          </div>
        </div>
        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-xs sm:text-sm text-gray-500">
            Belum ada transaksi. Mulai tambahkan pengeluaran pertama Anda!
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Tanggal</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Kategori</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Deskripsi</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Pembayaran</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(showAllTransactions 
                    ? recentTransactions.slice((currentTrxPage - 1) * trxPerPage, currentTrxPage * trxPerPage)
                    : recentTransactions.slice(0, 5)
                  ).map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {new Date(transaction.expense_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {transaction.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {transaction.expense_name || transaction.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {transaction.payment_method}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-red-600 text-right whitespace-nowrap">
                        {formatCurrency(parseFloat(transaction.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Mobile Cards View */}
            <div className="sm:hidden space-y-3">
              {(showAllTransactions 
                ? recentTransactions.slice((currentTrxPage - 1) * trxPerPage, currentTrxPage * trxPerPage)
                : recentTransactions.slice(0, 5)
              ).map((transaction) => (
                <div key={transaction.id} className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {transaction.expense_name || transaction.description || 'Pengeluaran'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(transaction.expense_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-red-600">
                      {formatCurrency(parseFloat(transaction.amount))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {transaction.category}
                    </span>
                    <span className="text-xs text-gray-500">{transaction.payment_method}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination - Only show when viewing all */}
            {showAllTransactions && Math.ceil(recentTransactions.length / trxPerPage) > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                <div className="text-sm text-gray-600">
                  Halaman {currentTrxPage} dari {Math.ceil(recentTransactions.length / trxPerPage)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentTrxPage(prev => Math.max(1, prev - 1))}
                    disabled={currentTrxPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setCurrentTrxPage(prev => Math.min(Math.ceil(recentTransactions.length / trxPerPage), prev + 1))}
                    disabled={currentTrxPage === Math.ceil(recentTransactions.length / trxPerPage)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
