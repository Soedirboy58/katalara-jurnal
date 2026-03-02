'use client'

import { useEffect, useMemo, useState } from 'react'
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  BanknotesIcon,
  DocumentChartBarIcon 
} from '@heroicons/react/24/outline'

const tabs = [
  { id: 'sales', name: 'Penjualan', icon: CurrencyDollarIcon },
  { id: 'expenses', name: 'Pengeluaran', icon: BanknotesIcon },
  { id: 'profit-loss', name: 'Laba Rugi', icon: ChartBarIcon },
  { id: 'receivables', name: 'Piutang', icon: DocumentChartBarIcon },
]

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales')
  const [rangeKey, setRangeKey] = useState<'today' | '7d' | '30d' | 'month' | 'custom'>('today')
  const [customRange, setCustomRange] = useState({ start: '', end: '' })
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const dateRange = useMemo(() => {
    const now = new Date()
    if (rangeKey === 'custom' && customRange.start && customRange.end) {
      return { start: customRange.start, end: customRange.end }
    }

    if (rangeKey === 'today') {
      const today = now.toISOString().split('T')[0]
      return { start: today, end: today }
    }

    if (rangeKey === '7d') {
      const start = new Date(now)
      start.setDate(start.getDate() - 6)
      return { start: start.toISOString().split('T')[0], end: now.toISOString().split('T')[0] }
    }

    if (rangeKey === '30d') {
      const start = new Date(now)
      start.setDate(start.getDate() - 29)
      return { start: start.toISOString().split('T')[0], end: now.toISOString().split('T')[0] }
    }

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    return { start: startOfMonth.toISOString().split('T')[0], end: now.toISOString().split('T')[0] }
  }, [rangeKey, customRange])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value || 0)
  }

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          start: dateRange.start,
          end: dateRange.end,
        })
        const res = await fetch(`/api/reports/summary?${params.toString()}`)
        const json = await res.json().catch(() => null as any)
        if (!res.ok) return
        setReportData(json)
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [dateRange.start, dateRange.end])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Laporan & Analisis</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Review performa bisnis Anda secara komprehensif
        </p>
      </div>

      {/* Quick Access Card - Cash Flow Report */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 sm:p-6 mb-6 shadow-sm hover:shadow-md transition-all">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Laporan Arus Kas (Cash Flow)</h3>
                <p className="text-xs sm:text-sm text-gray-600">Analisis lengkap pemasukan dan pengeluaran bulanan</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs sm:text-sm text-gray-700">
              <span className="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-blue-200">
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Aktivitas Operasional
              </span>
              <span className="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-blue-200">
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Aktivitas Investasi
              </span>
              <span className="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-blue-200">
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Aktivitas Pendanaan
              </span>
            </div>
          </div>
          <a 
            href="/dashboard/reports/cash-flow"
            className="flex-shrink-0 w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            Lihat Laporan
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-700">
            <span>Periode:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setRangeKey('today')}
                className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                  rangeKey === 'today' ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => setRangeKey('7d')}
                className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                  rangeKey === '7d' ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                7 Hari
              </button>
              <button
                onClick={() => setRangeKey('30d')}
                className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                  rangeKey === '30d' ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                30 Hari
              </button>
              <button
                onClick={() => setRangeKey('month')}
                className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                  rangeKey === 'month' ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Bulan Ini
              </button>
              <button
                onClick={() => setRangeKey('custom')}
                className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                  rangeKey === 'custom' ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          {rangeKey === 'custom' && (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="date"
                value={customRange.start}
                onChange={(e) => setCustomRange((prev) => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg"
              />
              <input
                type="date"
                value={customRange.end}
                onChange={(e) => setCustomRange((prev) => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg"
              />
            </div>
          )}

          <button className="self-start sm:self-end px-4 py-2 border border-gray-300 text-gray-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            📥 Export PDF
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-x-auto">
        <div className="flex border-b border-gray-200 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                {tab.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'sales' && (
          <>
            {/* Sales Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Total Penjualan</div>
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{formatCurrency(reportData?.sales?.total || 0)}</div>
                <div className="text-xs text-gray-500 mt-1">{dateRange.start} s/d {dateRange.end}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Jumlah Transaksi</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{reportData?.sales?.count || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Transaksi</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Rata-rata per Transaksi</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(reportData?.sales?.avg || 0)}</div>
                <div className="text-xs text-gray-500 mt-1">Average</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Produk Terjual</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{reportData?.sales?.items || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Items</div>
              </div>
            </div>

            {/* Chart Placeholder */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tren Penjualan</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center text-gray-500">
                  <ChartBarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Chart akan ditampilkan di sini</p>
                  <p className="text-sm">Mulai input transaksi untuk melihat grafik</p>
                </div>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Produk Terlaris</h3>
              {!reportData?.topProducts?.length ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Belum ada data penjualan</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {reportData.topProducts.map((row: any) => (
                    <div key={row.name} className="flex items-center justify-between text-sm text-gray-700">
                      <span className="font-medium text-gray-900 truncate">{row.name}</span>
                      <span className="text-xs text-gray-500">{row.qty} pcs</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'expenses' && (
          <>
            {/* Expenses Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Total Pengeluaran</div>
                <div className="text-xl sm:text-2xl font-bold text-red-600">{formatCurrency(reportData?.expenses?.total || 0)}</div>
                <div className="text-xs text-gray-500 mt-1">{dateRange.start} s/d {dateRange.end}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Jumlah Transaksi</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{reportData?.expenses?.count || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Transaksi</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Rata-rata per Hari</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(reportData?.expenses?.avgDaily || 0)}</div>
                <div className="text-xs text-gray-500 mt-1">Average</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">% dari Revenue</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{(reportData?.expenses?.ratio || 0).toFixed(1)}%</div>
                <div className="text-xs text-gray-500 mt-1">Expense Ratio</div>
              </div>
            </div>

            {/* Chart Placeholder */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tren Pengeluaran</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center text-gray-500">
                  <ChartBarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Chart akan ditampilkan di sini</p>
                </div>
              </div>
            </div>

            {/* Expense Categories */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pengeluaran per Kategori</h3>
              <div className="text-center py-8 text-gray-500">
                <p>Belum ada data pengeluaran</p>
              </div>
            </div>
          </>
        )}

        {activeTab === 'profit-loss' && (
          <>
            {/* Profit/Loss Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Total Pendapatan</div>
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{formatCurrency(reportData?.profitLoss?.revenue || 0)}</div>
                <div className="text-xs text-gray-500 mt-1">Revenue</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Total Pengeluaran</div>
                <div className="text-xl sm:text-2xl font-bold text-red-600">{formatCurrency(reportData?.profitLoss?.expenses || 0)}</div>
                <div className="text-xs text-gray-500 mt-1">Expenses</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Laba Bersih</div>
                <div className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(reportData?.profitLoss?.netProfit || 0)}</div>
                <div className="text-xs text-gray-500 mt-1">Net Profit</div>
              </div>
            </div>

            {/* Profit Margin */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit Margin</h3>
              <div className="text-center py-12">
                <div className="text-4xl sm:text-5xl font-bold text-green-600 mb-2">{(reportData?.profitLoss?.margin || 0).toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Profit Margin</div>
                <div className="text-xs text-gray-500 mt-4">Target: 25%</div>
              </div>
            </div>

            {/* Chart Placeholder */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Expense</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center text-gray-500">
                  <ChartBarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Comparative chart akan ditampilkan di sini</p>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'receivables' && (
          <>
            {/* Receivables Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Total Piutang</div>
                <div className="text-xl sm:text-2xl font-bold text-yellow-600">{formatCurrency(reportData?.receivables?.total || 0)}</div>
                <div className="text-xs text-gray-500 mt-1">Outstanding</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Jatuh Tempo</div>
                <div className="text-xl sm:text-2xl font-bold text-red-600">{formatCurrency(reportData?.receivables?.overdue || 0)}</div>
                <div className="text-xs text-gray-500 mt-1">Overdue</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Dalam 7 Hari</div>
                <div className="text-xl sm:text-2xl font-bold text-orange-600">{formatCurrency(reportData?.receivables?.dueSoon || 0)}</div>
                <div className="text-xs text-gray-500 mt-1">Due Soon</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Pelanggan</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{reportData?.receivables?.customers || 0}</div>
                <div className="text-xs text-gray-500 mt-1">With Receivables</div>
              </div>
            </div>

            {/* Receivables Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daftar Piutang</h3>
              <div className="text-center py-8 text-gray-500">
                <p>Belum ada piutang terdaftar</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
