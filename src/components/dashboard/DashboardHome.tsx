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
          const kpiResponse = await fetch('/api/kpi')
          if (kpiResponse.ok) {
            const kpiResult = await kpiResponse.json()
            if (kpiResult.success) {
              setKpiData(kpiResult.data)
            }
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  const kpiCards: KPICard[] = [
    {
      title: 'Penjualan Hari Ini',
      value: kpiData ? formatCurrency(kpiData.today.sales) : 'Rp 0',
      subtitle: 'Target harian',
      icon: CurrencyDollarIcon,
      color: 'blue'
    },
    {
      title: 'Pengeluaran Hari Ini',
      value: kpiData ? formatCurrency(kpiData.today.expenses) : 'Rp 0',
      subtitle: 'Total pengeluaran',
      icon: ShoppingBagIcon,
      color: 'red'
    },
    {
      title: 'Laba Hari Ini',
      value: kpiData ? formatCurrency(kpiData.today.netProfit) : 'Rp 0',
      subtitle: 'Penjualan - Pengeluaran',
      icon: ChartBarIcon,
      trend: kpiData?.today.netProfit > 0 
        ? { value: 'Profit', isPositive: true }
        : kpiData?.today.netProfit < 0
        ? { value: 'Loss', isPositive: false }
        : undefined,
      color: 'green'
    },
    {
      title: 'Omset Bulan Ini',
      value: kpiData ? formatCurrency(kpiData.month.sales) : 'Rp 0',
      subtitle: 'Total penjualan bulan ini',
      icon: ChartBarIcon,
      color: 'purple'
    },
    {
      title: 'Total Produk',
      value: kpiData ? String(kpiData.products.total) : '0',
      subtitle: 'Produk terdaftar',
      icon: ShoppingBagIcon,
      color: 'yellow'
    },
    {
      title: 'Stok Menipis',
      value: kpiData ? String(kpiData.products.lowStock) : '0',
      subtitle: 'Perlu restock',
      icon: ExclamationTriangleIcon,
      color: 'orange'
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

      {/* Business Health Score */}
      <HealthScoreCard 
        cashFlowHealth={85}
        profitabilityHealth={businessConfig?.profit_margin_target || 78}
        growthHealth={92}
        efficiencyHealth={70}
      />

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
        <SalesChart />
        <RevenueExpenseChart revenue={45000000} expense={32000000} />
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          Transaksi Terakhir
        </h3>
        <div className="text-center py-8 sm:py-12 text-xs sm:text-sm text-gray-500">
          Belum ada transaksi. Mulai tambahkan penjualan pertama Anda!
        </div>
      </div>
    </div>
  )
}
