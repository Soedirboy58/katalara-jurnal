'use client'

import { useState } from 'react'
import { 
  HeartIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface HealthMetric {
  name: string
  score: number
  status: 'excellent' | 'good' | 'warning' | 'critical'
  description: string
  details: string
  recommendation: string
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
  const [selectedMetric, setSelectedMetric] = useState<HealthMetric | null>(null)
  
  const getStatus = (score: number): HealthMetric['status'] => {
    if (score >= 80) return 'excellent'
    if (score >= 60) return 'good'
    if (score >= 40) return 'warning'
    return 'critical'
  }

  const getMetricDetails = (name: string, score: number): { details: string, recommendation: string } => {
    const status = getStatus(score)
    
    if (name === 'Cash Flow') {
      if (status === 'excellent') return {
        details: 'Uang masuk jauh lebih banyak dari uang keluar. Bisnis Anda sehat dan stabil! 💰',
        recommendation: 'Bagus sekali! Sisihkan sebagian keuntungan untuk tabungan darurat atau beli peralatan baru yang bisa nambah omset.'
      }
      if (status === 'good') return {
        details: 'Uang masuk cukup untuk bayar semua pengeluaran, masih ada sisa lumayan. 👍',
        recommendation: 'Jaga terus! Cek daftar piutang (tagihan yang belum dibayar customer) biar cepat masuk.'
      }
      if (status === 'warning') return {
        details: 'Uang masuk dan keluar hampir sama. Kalau ada pengeluaran dadakan bisa kekurangan. ⚠️',
        recommendation: 'Mulai pangkas pengeluaran yang nggak penting. Tagih customer yang nunggak. Cari cara nambah omset.'
      }
      return {
        details: 'BAHAYA! Uang keluar lebih banyak dari uang masuk. Kalau dibiarkan bisa bangkrut. 🚨',
        recommendation: 'SEGERA TINDAK: Stop beli barang yang nggak urgent. Tagih SEMUA piutang. Kalau perlu pinjam dulu ke keluarga/teman.'
      }
    }
    
    if (name === 'Profitability') {
      if (status === 'excellent') return {
        details: 'Keuntungan bersih Anda SANGAT BESAR! Dari Rp 100 jual, untungnya lebih dari Rp 30. 🎉',
        recommendation: 'Mantap! Sebagian untung bisa dipake buat beli barang lebih banyak atau buka cabang baru.'
      }
      if (status === 'good') return {
        details: 'Keuntungan bagus. Dari Rp 100 jual, untung Rp 10-30. Bisnis jalan lancar. 💪',
        recommendation: 'Coba cari supplier yang lebih murah atau cara kerja yang lebih hemat tanpa nurunin kualitas.'
      }
      if (status === 'warning') return {
        details: 'Keuntungan tipis banget. Dari Rp 100 jual, untungnya cuma Rp 5-10. Gampang rugi kalau ada masalah. 😰',
        recommendation: 'Naikin harga sedikit ATAU cari cara kurangin biaya. Jangan jual rugi!'
      }
      return {
        details: 'BAHAYA! Bisnis RUGI. Uang keluar lebih banyak dari uang masuk jual barang. 💸',
        recommendation: 'DARURAT: Cek semua pengeluaran, potong yang nggak perlu. Harga jual mungkin terlalu murah.'
      }
    }
    
    if (name === 'Growth') {
      if (status === 'excellent') return {
        details: 'Penjualan naik PESAT! Bulan ini jauh lebih laris dari bulan lalu (naik >20%). 📈',
        recommendation: 'Keren! Pastikan stok barang cukup dan kualitas tetap terjaga meskipun order banyak.'
      }
      if (status === 'good') return {
        details: 'Penjualan terus naik stabil. Bulan ini lebih bagus dari bulan lalu (naik 5-20%). 👏',
        recommendation: 'Lanjutkan! Coba promosi lebih gencar lagi atau jual produk baru biar makin laris.'
      }
      if (status === 'warning') return {
        details: 'Penjualan stagnan, nggak naik-naik. Bulan ini sama aja kayak bulan lalu. 😕',
        recommendation: 'Coba cek kompetitor, bikin promo diskon, atau cari customer baru di area lain.'
      }
      return {
        details: 'BAHAYA! Penjualan TURUN terus setiap bulan. Customer makin sedikit. 📉',
        recommendation: 'SEGERA CEK: Apa ada kompetitor baru? Harga kemahalan? Produk kurang laku? Perlu ganti strategi!'
      }
    }
    
    // Efficiency
    if (status === 'excellent') return {
      details: 'Cara kerja Anda SANGAT HEMAT! Biaya operasional cuma 30% dari omset. Sisanya untung bersih. 🎯',
      recommendation: 'Pertahankan cara kerja ini! Catat semua prosesnya biar nggak lupa.'
    }
    if (status === 'good') return {
      details: 'Cara kerja cukup hemat. Biaya operasional 30-50% dari omset. Masih wajar. ✅',
      recommendation: 'Coba cari cara lebih cepat atau tools yang bisa bantu kerja biar makin hemat.'
    }
    if (status === 'warning') return {
      details: 'Biaya operasional mulai boros. Habis 50-70% dari omset. Untung jadi tipis. ⚠️',
      recommendation: 'Cek semua pengeluaran: gaji, sewa, listrik, transport. Ada yang bisa dipotong? Nego supplier biar lebih murah.'
    }
    return {
      details: 'BAHAYA! Biaya operasional TERLALU BESAR. Habis lebih dari 70% omset. Nggak kuat lama. 💸',
      recommendation: 'DARURAT: Kurangin pengeluaran drastis. Cek semua kontrak langganan, supplier, gaji. Mana yang bisa dihemat?'
    }
  }

  const metrics: HealthMetric[] = [
    {
      name: 'Cash Flow',
      score: cashFlowHealth,
      status: getStatus(cashFlowHealth),
      description: 'Uang masuk vs keluar',
      ...getMetricDetails('Cash Flow', cashFlowHealth)
    },
    {
      name: 'Profitability',
      score: profitabilityHealth,
      status: getStatus(profitabilityHealth),
      description: 'Seberapa untung',
      ...getMetricDetails('Profitability', profitabilityHealth)
    },
    {
      name: 'Growth',
      score: growthHealth,
      status: getStatus(growthHealth),
      description: 'Penjualan naik/turun',
      ...getMetricDetails('Growth', growthHealth)
    },
    {
      name: 'Efficiency',
      score: efficiencyHealth,
      status: getStatus(efficiencyHealth),
      description: 'Seberapa hemat',
      ...getMetricDetails('Efficiency', efficiencyHealth)
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
                  <button
                    onClick={() => setSelectedMetric(metric)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    title="Lihat detail"
                  >
                    <InformationCircleIcon className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                  </button>
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

      {/* Detail Modal */}
      {selectedMetric && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" onClick={() => setSelectedMetric(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                {getStatusIcon(selectedMetric.status)}
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedMetric.name}</h3>
                  <p className="text-sm text-gray-500">{selectedMetric.description}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMetric(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Score Display */}
              <div className="flex items-center justify-center">
                <div className="relative">
                  <svg className="w-32 h-32 -rotate-90" viewBox="0 0 112 112">
                    <circle cx="56" cy="56" r="45" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-200" />
                    <circle
                      cx="56" cy="56" r="45" stroke="currentColor" strokeWidth="8" fill="none"
                      strokeDasharray={2 * Math.PI * 45}
                      strokeDashoffset={2 * Math.PI * 45 - (selectedMetric.score / 100) * 2 * Math.PI * 45}
                      strokeLinecap="round"
                      className={`${getScoreColor(selectedMetric.score).bg} transition-all duration-1000`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className={`text-4xl font-bold ${getScoreColor(selectedMetric.score).text}`}>
                      {selectedMetric.score}
                    </div>
                    <div className="text-xs text-gray-500">/ 100</div>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex justify-center">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  selectedMetric.status === 'excellent' ? 'bg-green-100 text-green-700' :
                  selectedMetric.status === 'good' ? 'bg-blue-100 text-blue-700' :
                  selectedMetric.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {getStatusLabel(selectedMetric.status)}
                </span>
              </div>

              {/* Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">📊 Analisis</h4>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedMetric.details}</p>
              </div>

              {/* Recommendation */}
              <div className={`rounded-lg p-4 ${
                selectedMetric.status === 'excellent' ? 'bg-green-50 border border-green-200' :
                selectedMetric.status === 'good' ? 'bg-blue-50 border border-blue-200' :
                selectedMetric.status === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-red-50 border border-red-200'
              }`}>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">💡 Rekomendasi</h4>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedMetric.recommendation}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end">
              <button
                onClick={() => setSelectedMetric(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-start gap-2 text-xs text-gray-600">
          <span className="flex-shrink-0">💡</span>
          <p className="leading-relaxed">
            Score dihitung otomatis dari data transaksi Anda. Klik tombol ℹ️ di setiap indikator untuk penjelasan lengkap.
          </p>
        </div>
      </div>
    </div>
  )
}
