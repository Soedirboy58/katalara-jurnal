'use client'

import { 
  LightBulbIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface Insight {
  id: string
  type: 'success' | 'warning' | 'info' | 'opportunity'
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
}

interface InsightsPanelProps {
  businessCategory?: string
  monthlyRevenue?: number
  monthlyTarget?: number
  profitMargin?: number
  targetMargin?: number
  cashBalance?: number
  minCashAlert?: number
}

export function InsightsPanel({
  businessCategory,
  monthlyRevenue = 45000000,
  monthlyTarget = 50000000,
  profitMargin = 22,
  targetMargin = 25,
  cashBalance = 15000000,
  minCashAlert = 10000000
}: InsightsPanelProps) {
  
  // Generate smart insights based on business data
  const generateInsights = (): Insight[] => {
    const insights: Insight[] = []

    // Revenue Performance
    const revenueProgress = (monthlyRevenue / monthlyTarget) * 100
    if (revenueProgress >= 90) {
      insights.push({
        id: 'revenue-excellent',
        type: 'success',
        title: '🎉 Target Penjualan Hampir Tercapai!',
        description: `Anda sudah mencapai ${revenueProgress.toFixed(0)}% dari target bulan ini (Rp ${monthlyRevenue.toLocaleString('id-ID')}). Pertahankan momentum!`,
        action: {
          label: 'Lihat Detail Penjualan',
          href: '/dashboard/sales'
        }
      })
    } else if (revenueProgress < 70) {
      insights.push({
        id: 'revenue-warning',
        type: 'warning',
        title: '⚠️ Penjualan Perlu Ditingkatkan',
        description: `Target bulan ini: Rp ${monthlyTarget.toLocaleString('id-ID')}. Saat ini baru ${revenueProgress.toFixed(0)}%. Pertimbangkan strategi promosi atau diskon terbatas.`,
        action: {
          label: 'Strategi Boost Penjualan',
          href: '/dashboard/insights/boost-sales'
        }
      })
    }

    // Profit Margin Analysis
    if (profitMargin < targetMargin) {
      const gap = targetMargin - profitMargin
      insights.push({
        id: 'margin-low',
        type: 'warning',
        title: '📉 Profit Margin di Bawah Target',
        description: `Margin saat ini ${profitMargin}%, target ${targetMargin}%. Selisih ${gap.toFixed(1)}%. Review pricing atau kurangi biaya operasional.`,
        action: {
          label: 'Analisis Margin',
          href: '/dashboard/insights/margin'
        }
      })
    } else if (profitMargin > targetMargin + 5) {
      insights.push({
        id: 'margin-excellent',
        type: 'success',
        title: '💰 Profit Margin Sangat Baik!',
        description: `Margin Anda ${profitMargin}%, melebihi target ${targetMargin}%. Pertimbangkan reinvestasi untuk pertumbuhan.`
      })
    }

    // Cash Flow Health
    if (cashBalance < minCashAlert) {
      insights.push({
        id: 'cash-critical',
        type: 'warning',
        title: '🚨 Kas Mendekati Batas Minimum',
        description: `Saldo kas Rp ${cashBalance.toLocaleString('id-ID')} sudah di bawah alert threshold Rp ${minCashAlert.toLocaleString('id-ID')}. Prioritaskan penagihan piutang.`,
        action: {
          label: 'Kelola Kas',
          href: '/dashboard/cash-flow'
        }
      })
    } else if (cashBalance > minCashAlert * 3) {
      insights.push({
        id: 'cash-opportunity',
        type: 'opportunity',
        title: '💡 Opportunity: Investasi Modal',
        description: `Kas Anda sehat (Rp ${cashBalance.toLocaleString('id-ID')}). Pertimbangkan investasi stok atau ekspansi bisnis.`,
        action: {
          label: 'Lihat Rekomendasi',
          href: '/dashboard/insights/investment'
        }
      })
    }

    // Business-specific insights
    if (businessCategory === 'Retail & Toko') {
      insights.push({
        id: 'retail-tip',
        type: 'info',
        title: '📦 Tips Retail: Analisis Stok',
        description: 'Produk dengan turnover lambat mengikat modal. Review stok yang > 60 hari dan pertimbangkan bundling/promo.',
        action: {
          label: 'Analisis Stok',
          href: '/dashboard/inventory'
        }
      })
    }

    if (businessCategory === 'Kuliner & F&B') {
      insights.push({
        id: 'fb-tip',
        type: 'info',
        title: '🍽️ Tips F&B: Menu Engineering',
        description: 'Fokus promosi pada produk high-margin low-cost. Track food cost ratio (idealnya <35%).',
        action: {
          label: 'Menu Analytics',
          href: '/dashboard/products'
        }
      })
    }

    // Smart Recommendation
    insights.push({
      id: 'ai-recommendation',
      type: 'opportunity',
      title: '✨ Rekomendasi AI: Optimasi Harga',
      description: 'Berdasarkan data kompetitor dan margin, beberapa produk Anda bisa dinaikkan harga 5-8% tanpa menurunkan demand.',
      action: {
        label: 'Lihat Analisis Pricing',
        href: '/dashboard/insights/pricing'
      }
    })

    return insights
  }

  const insights = generateInsights()

  const getInsightStyle = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: 'text-green-600',
          title: 'text-green-900',
          IconComponent: CheckCircleIcon
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-600',
          title: 'text-yellow-900',
          IconComponent: ExclamationTriangleIcon
        }
      case 'opportunity':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          icon: 'text-purple-600',
          title: 'text-purple-900',
          IconComponent: SparklesIcon
        }
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          title: 'text-blue-900',
          IconComponent: LightBulbIcon
        }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <SparklesIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          Insights & Rekomendasi
        </h3>
        <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
          AI-Powered
        </span>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => {
          const style = getInsightStyle(insight.type)
          const IconComponent = style.IconComponent

          return (
            <div
              key={insight.id}
              className={`${style.bg} border ${style.border} rounded-lg p-3 sm:p-4 transition-all hover:shadow-sm`}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <IconComponent className={`h-5 w-5 sm:h-6 sm:w-6 ${style.icon} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm sm:text-base font-semibold ${style.title} mb-1 break-words`}>
                    {insight.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words">
                    {insight.description}
                  </p>
                  {insight.action && (
                    <button
                      onClick={() => {
                        // Navigation would be implemented here
                        console.log(`Navigate to: ${insight.action?.href}`)
                      }}
                      className="mt-2 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                    >
                      {insight.action.label}
                      <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          💡 Insights diperbarui setiap hari berdasarkan data bisnis Anda
        </p>
      </div>
    </div>
  )
}
