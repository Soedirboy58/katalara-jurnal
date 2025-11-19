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

  useEffect(() => {
    const loadUserData = async () => {
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

          // Load business config for insights
          const { data: config } = await supabase
            .from('business_configurations')
            .select('*')
            .eq('user_id', user.id)
            .single()
          
          if (config) {
            setBusinessConfig(config)
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [supabase])

  const kpiCards: KPICard[] = [
    {
      title: 'Penjualan Hari Ini',
      value: 'Rp 2.500.000',
      subtitle: '15 transaksi',
      icon: CurrencyDollarIcon,
      trend: { value: '+12%', isPositive: true },
      color: 'blue'
    },
    {
      title: 'Pengeluaran Hari Ini',
      value: 'Rp 800.000',
      subtitle: '8 transaksi',
      icon: ShoppingBagIcon,
      trend: { value: '+5%', isPositive: false },
      color: 'red'
    },
    {
      title: 'Omset Bulan Ini',
      value: 'Rp 45.000.000',
      subtitle: '125 transaksi',
      icon: ChartBarIcon,
      trend: { value: '+18%', isPositive: true },
      color: 'green'
    },
    {
      title: 'Total Pelanggan',
      value: '42',
      subtitle: 'Pelanggan aktif',
      icon: UsersIcon,
      color: 'purple'
    },
    {
      title: 'Total Piutang',
      value: 'Rp 3.200.000',
      subtitle: '12 pelanggan',
      icon: CreditCardIcon,
      color: 'yellow'
    },
    {
      title: 'Pelanggan Overdue',
      value: '5',
      subtitle: 'Butuh follow-up',
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
        
        {/* Quick Actions - Mobile Optimized */}
        <div className="mt-3 sm:mt-4 flex flex-wrap gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs sm:text-sm font-medium transition-colors">
            <PlusIcon className="h-4 w-4" />
            Tambah Penjualan
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs sm:text-sm font-medium transition-colors">
            <ArrowUpTrayIcon className="h-4 w-4" />
            Input Pengeluaran
          </button>
        </div>
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

      {/* Charts Section (Placeholder) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Penjualan 7 Hari Terakhir
          </h3>
          <div className="h-48 sm:h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-500">Chart akan ditambahkan segera</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Revenue vs Expense
          </h3>
          <div className="h-48 sm:h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-500">Chart akan ditambahkan segera</p>
          </div>
        </div>
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
