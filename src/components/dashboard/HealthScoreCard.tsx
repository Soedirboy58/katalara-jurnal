'use client'

import { 
  HeartIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

interface HealthMetric {
  name: string
  score: number
  status: 'excellent' | 'good' | 'warning' | 'critical'
  description: string
}

interface HealthScoreProps {
  cashFlowHealth?: number
  profitabilityHealth?: number
  growthHealth?: number
  efficiencyHealth?: number
}

export function HealthScoreCard({
  cashFlowHealth = 85,
  profitabilityHealth = 78,
  growthHealth = 92,
  efficiencyHealth = 70
}: HealthScoreProps) {
  
  const getStatus = (score: number): HealthMetric['status'] => {
    if (score >= 80) return 'excellent'
    if (score >= 60) return 'good'
    if (score >= 40) return 'warning'
    return 'critical'
  }

  const metrics: HealthMetric[] = [
    {
      name: 'Cash Flow',
      score: cashFlowHealth,
      status: getStatus(cashFlowHealth),
      description: 'Kesehatan arus kas'
    },
    {
      name: 'Profitability',
      score: profitabilityHealth,
      status: getStatus(profitabilityHealth),
      description: 'Tingkat keuntungan'
    },
    {
      name: 'Growth',
      score: growthHealth,
      status: getStatus(growthHealth),
      description: 'Pertumbuhan bisnis'
    },
    {
      name: 'Efficiency',
      score: efficiencyHealth,
      status: getStatus(efficiencyHealth),
      description: 'Efisiensi operasional'
    }
  ]

  const overallScore = Math.round(
    (cashFlowHealth + profitabilityHealth + growthHealth + efficiencyHealth) / 4
  )

  const getScoreColor = (score: number) => {
    if (score >= 80) return { text: 'text-green-600', bg: 'bg-green-600', ring: 'ring-green-600' }
    if (score >= 60) return { text: 'text-blue-600', bg: 'bg-blue-600', ring: 'ring-blue-600' }
    if (score >= 40) return { text: 'text-yellow-600', bg: 'bg-yellow-600', ring: 'ring-yellow-600' }
    return { text: 'text-red-600', bg: 'bg-red-600', ring: 'ring-red-600' }
  }

  const getStatusIcon = (status: HealthMetric['status']) => {
    switch (status) {
      case 'excellent':
        return <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
      case 'good':
        return <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
      case 'warning':
        return <ExclamationCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
      case 'critical':
        return <XCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
    }
  }

  const getStatusLabel = (status: HealthMetric['status']) => {
    switch (status) {
      case 'excellent': return 'Sangat Baik'
      case 'good': return 'Baik'
      case 'warning': return 'Perlu Perhatian'
      case 'critical': return 'Kritis'
    }
  }

  const overallColor = getScoreColor(overallScore)
  const circumference = 2 * Math.PI * 45 // radius = 45

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <HeartIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          Business Health Score
        </h3>
      </div>

      {/* Overall Score Circle */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6">
        <div className="relative flex-shrink-0">
          <svg className="w-28 h-28 sm:w-32 sm:h-32 -rotate-90" viewBox="0 0 112 112">
            {/* Background circle */}
            <circle
              cx="56"
              cy="56"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200"
            />
            {/* Progress circle */}
            <circle
              cx="56"
              cy="56"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (overallScore / 100) * circumference}
              strokeLinecap="round"
              className={`${overallColor.bg} transition-all duration-1000 ease-out`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
            <div className={`text-3xl sm:text-4xl font-bold ${overallColor.text} leading-none tabular-nums`}>
              {overallScore}
            </div>
            <div className="text-xs text-gray-500 mt-1 whitespace-nowrap">dari 100</div>
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <p className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
            {overallScore >= 80 ? '🎉 Bisnis Sangat Sehat!' : 
             overallScore >= 60 ? '👍 Bisnis Cukup Sehat' :
             overallScore >= 40 ? '⚠️ Perlu Perbaikan' :
             '🚨 Butuh Perhatian Serius'}
          </p>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            {overallScore >= 80 ? 'Pertahankan momentum dan konsistensi operasional.' : 
             overallScore >= 60 ? 'Beberapa area perlu optimasi untuk pertumbuhan.' :
             overallScore >= 40 ? 'Fokus perbaikan pada area merah & kuning.' :
             'Segera tangani masalah kritis cash flow & profitability.'}
          </p>
        </div>
      </div>

      {/* Individual Metrics */}
      <div className="space-y-3">
        {metrics.map((metric) => {
          const color = getScoreColor(metric.score)
          return (
            <div key={metric.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {getStatusIcon(metric.status)}
                  <span className="font-medium text-gray-700">{metric.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 hidden sm:inline">
                    {getStatusLabel(metric.status)}
                  </span>
                  <span className={`font-bold ${color.text}`}>{metric.score}/100</span>
                </div>
              </div>
              <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full ${color.bg} transition-all duration-1000 ease-out rounded-full`}
                  style={{ width: `${metric.score}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 pl-6 sm:pl-7">{metric.description}</p>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-start gap-2 text-xs text-gray-600">
          <span className="flex-shrink-0">💡</span>
          <p className="leading-relaxed">
            Score dihitung berdasarkan 20+ metrik finansial & operasional bisnis Anda. Diperbarui real-time.
          </p>
        </div>
      </div>
    </div>
  )
}
