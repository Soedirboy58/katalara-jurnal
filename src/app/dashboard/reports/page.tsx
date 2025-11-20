'use client'

import { useState } from 'react'
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
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 mb-6 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Laporan Arus Kas (Cash Flow)</h3>
                <p className="text-sm text-gray-600">Analisis lengkap pemasukan dan pengeluaran bulanan</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-700">
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
            className="ml-4 flex-shrink-0 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
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
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="text-sm font-medium text-gray-700">Periode:</div>
          <div className="flex flex-wrap gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Hari Ini
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
              7 Hari
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
              30 Hari
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
              Bulan Ini
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
              Custom
            </button>
          </div>
          <button className="sm:ml-auto px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            📥 Export PDF
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-x-auto">
        <div className="flex border-b border-gray-200">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Total Penjualan</div>
                <div className="text-2xl font-bold text-blue-600">Rp 0</div>
                <div className="text-xs text-green-600 mt-1">↑ 0% vs periode lalu</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Jumlah Transaksi</div>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-xs text-gray-500 mt-1">Transaksi</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Rata-rata per Transaksi</div>
                <div className="text-2xl font-bold text-gray-900">Rp 0</div>
                <div className="text-xs text-gray-500 mt-1">Average</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Produk Terjual</div>
                <div className="text-2xl font-bold text-gray-900">0</div>
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Produk Terlaris</h3>
              <div className="text-center py-8 text-gray-500">
                <p>Belum ada data penjualan</p>
              </div>
            </div>
          </>
        )}

        {activeTab === 'expenses' && (
          <>
            {/* Expenses Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Total Pengeluaran</div>
                <div className="text-2xl font-bold text-red-600">Rp 0</div>
                <div className="text-xs text-red-600 mt-1">↑ 0% vs periode lalu</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Jumlah Transaksi</div>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-xs text-gray-500 mt-1">Transaksi</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Rata-rata per Hari</div>
                <div className="text-2xl font-bold text-gray-900">Rp 0</div>
                <div className="text-xs text-gray-500 mt-1">Average</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">% dari Revenue</div>
                <div className="text-2xl font-bold text-gray-900">0%</div>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Total Pendapatan</div>
                <div className="text-2xl font-bold text-blue-600">Rp 0</div>
                <div className="text-xs text-gray-500 mt-1">Revenue</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Total Pengeluaran</div>
                <div className="text-2xl font-bold text-red-600">Rp 0</div>
                <div className="text-xs text-gray-500 mt-1">Expenses</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Laba Bersih</div>
                <div className="text-2xl font-bold text-green-600">Rp 0</div>
                <div className="text-xs text-gray-500 mt-1">Net Profit</div>
              </div>
            </div>

            {/* Profit Margin */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit Margin</h3>
              <div className="text-center py-12">
                <div className="text-5xl font-bold text-green-600 mb-2">0%</div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Total Piutang</div>
                <div className="text-2xl font-bold text-yellow-600">Rp 0</div>
                <div className="text-xs text-gray-500 mt-1">Outstanding</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Jatuh Tempo</div>
                <div className="text-2xl font-bold text-red-600">Rp 0</div>
                <div className="text-xs text-gray-500 mt-1">Overdue</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Dalam 7 Hari</div>
                <div className="text-2xl font-bold text-orange-600">Rp 0</div>
                <div className="text-xs text-gray-500 mt-1">Due Soon</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Pelanggan</div>
                <div className="text-2xl font-bold text-gray-900">0</div>
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
