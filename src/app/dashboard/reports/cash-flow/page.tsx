'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CashFlowData {
  operating: {
    revenue: number
    expenses: {[key: string]: number}
    netOperating: number
  }
  investing: {
    expenses: {[key: string]: number}
    netInvesting: number
  }
  financing: {
    expenses: {[key: string]: number}
    netFinancing: number
  }
  netCashFlow: number
  openingBalance: number
  closingBalance: number
}

export default function CashFlowReportPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [cashFlowData, setCashFlowData] = useState<CashFlowData | null>(null)
  const [businessInfo, setBusinessInfo] = useState<any>(null)

  useEffect(() => {
    loadBusinessInfo()
  }, [])

  useEffect(() => {
    if (selectedMonth) {
      fetchCashFlowData()
    }
  }, [selectedMonth])

  const loadBusinessInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('business_configurations')
        .select('business_name, business_category, owner_name')
        .eq('owner_id', user.id)
        .single()

      setBusinessInfo(data)
    } catch (error) {
      console.error('Error loading business info:', error)
    }
  }

  const fetchCashFlowData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [year, month] = selectedMonth.split('-')
      const startDate = `${year}-${month}-01`
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]

      // Fetch revenues from incomes table (only Lunas)
      const { data: incomes } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id)
        .eq('payment_status', 'Lunas')
        .gte('income_date', startDate)
        .lte('income_date', endDate)

      const totalRevenue = incomes?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0

      // Fetch expenses by type (only Lunas)
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .eq('payment_status', 'Lunas')
        .gte('expense_date', startDate)
        .lte('expense_date', endDate)

      // Group expenses by type and category
      const operating: {[key: string]: number} = {}
      const investing: {[key: string]: number} = {}
      const financing: {[key: string]: number} = {}

      expenses?.forEach(expense => {
        const amount = parseFloat(expense.amount)
        const category = expense.category || 'Lainnya'

        if (expense.expense_type === 'operating' || !expense.expense_type) {
          operating[category] = (operating[category] || 0) + amount
        } else if (expense.expense_type === 'investing') {
          investing[category] = (investing[category] || 0) + amount
        } else if (expense.expense_type === 'financing') {
          financing[category] = (financing[category] || 0) + amount
        }
      })

      const totalOperatingExpenses = Object.values(operating).reduce((sum, v) => sum + v, 0)
      const totalInvestingExpenses = Object.values(investing).reduce((sum, v) => sum + v, 0)
      const totalFinancingExpenses = Object.values(financing).reduce((sum, v) => sum + v, 0)

      const netOperating = totalRevenue - totalOperatingExpenses
      const netInvesting = -totalInvestingExpenses
      const netFinancing = -totalFinancingExpenses
      const netCashFlow = netOperating + netInvesting + netFinancing

      setCashFlowData({
        operating: {
          revenue: totalRevenue,
          expenses: operating,
          netOperating
        },
        investing: {
          expenses: investing,
          netInvesting
        },
        financing: {
          expenses: financing,
          netFinancing
        },
        netCashFlow,
        openingBalance: 0, // Could fetch from previous month
        closingBalance: netCashFlow
      })
    } catch (error) {
      console.error('Error fetching cash flow:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  const handlePrint = () => {
    window.print()
  }

  const getMonthName = () => {
    const [year, month] = selectedMonth.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Controls - Hidden on print */}
      <div className="bg-white border-b border-gray-200 p-4 print:hidden">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Laporan Arus Kas</h1>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handlePrint}
                disabled={loading || !cashFlowData}
                className="px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Print / PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content - Print optimized */}
      <div className="max-w-5xl mx-auto p-3 sm:p-6 print:p-0">
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Memuat laporan...</p>
          </div>
        ) : cashFlowData ? (
          <div className="bg-white rounded-lg shadow-sm print:shadow-none print:rounded-none">
            {/* Header */}
            <div className="border-b border-gray-200 p-4 sm:p-8 text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{businessInfo?.business_name || 'UMKM'}</h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1">{businessInfo?.owner_name || ''}</p>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mt-3 sm:mt-4">LAPORAN ARUS KAS</h3>
              <p className="text-sm sm:text-base text-gray-600">Periode: {getMonthName()}</p>
            </div>

            {/* Cash Flow Statement */}
            <div className="p-4 sm:p-8 space-y-6">
              {/* Operating Activities */}
              <div>
                <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-3 pb-2 border-b">Arus Kas dari Kegiatan Operasi</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="font-medium">Penerimaan Kas:</span>
                    <span></span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm pl-4 sm:pl-6 gap-2">
                    <span className="flex-shrink-0">Pendapatan Penjualan</span>
                    <span className="font-medium text-right whitespace-nowrap">{formatCurrency(cashFlowData.operating.revenue)}</span>
                  </div>

                  <div className="flex justify-between text-xs sm:text-sm mt-4">
                    <span className="font-medium">Pengeluaran Kas:</span>
                    <span></span>
                  </div>
                  {Object.entries(cashFlowData.operating.expenses).map(([category, amount]) => (
                    <div key={category} className="flex justify-between text-xs sm:text-sm pl-4 sm:pl-6 gap-2">
                      <span className="flex-1 min-w-0 break-words">{category}</span>
                      <span className="text-right whitespace-nowrap flex-shrink-0">{formatCurrency(amount)}</span>
                    </div>
                  ))}

                  <div className="flex justify-between text-xs sm:text-sm font-semibold pt-2 mt-2 border-t gap-2">
                    <span className="flex-1 min-w-0">Arus Kas Bersih dari Kegiatan Operasi</span>
                    <span className={`text-right whitespace-nowrap flex-shrink-0 ${cashFlowData.operating.netOperating >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(cashFlowData.operating.netOperating)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Investing Activities */}
              {Object.keys(cashFlowData.investing.expenses).length > 0 && (
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-3 pb-2 border-b">Arus Kas dari Kegiatan Investasi</h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="font-medium">Pengeluaran Kas:</span>
                      <span></span>
                    </div>
                    {Object.entries(cashFlowData.investing.expenses).map(([category, amount]) => (
                      <div key={category} className="flex justify-between text-xs sm:text-sm pl-4 sm:pl-6 gap-2">
                        <span className="flex-1 min-w-0 break-words">{category}</span>
                        <span className="text-right whitespace-nowrap flex-shrink-0">{formatCurrency(amount)}</span>
                      </div>
                    ))}

                    <div className="flex justify-between text-xs sm:text-sm font-semibold pt-2 mt-2 border-t gap-2">
                      <span className="flex-1 min-w-0">Arus Kas Bersih dari Kegiatan Investasi</span>
                      <span className="text-red-600 text-right whitespace-nowrap flex-shrink-0">{formatCurrency(cashFlowData.investing.netInvesting)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Financing Activities */}
              {Object.keys(cashFlowData.financing.expenses).length > 0 && (
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-3 pb-2 border-b">Arus Kas dari Kegiatan Pendanaan</h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="font-medium">Pengeluaran Kas:</span>
                      <span></span>
                    </div>
                    {Object.entries(cashFlowData.financing.expenses).map(([category, amount]) => (
                      <div key={category} className="flex justify-between text-xs sm:text-sm pl-4 sm:pl-6 gap-2">
                        <span className="flex-1 min-w-0 break-words">{category}</span>
                        <span className="text-right whitespace-nowrap flex-shrink-0">{formatCurrency(amount)}</span>
                      </div>
                    ))}

                    <div className="flex justify-between text-xs sm:text-sm font-semibold pt-2 mt-2 border-t gap-2">
                      <span className="flex-1 min-w-0">Arus Kas Bersih dari Kegiatan Pendanaan</span>
                      <span className="text-red-600 text-right whitespace-nowrap flex-shrink-0">{formatCurrency(cashFlowData.financing.netFinancing)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-2 mt-6">
                <div className="flex justify-between text-sm sm:text-base font-bold gap-2">
                  <span className="flex-1 min-w-0">Kenaikan (Penurunan) Bersih Kas dan Setara Kas</span>
                  <span className={`text-right whitespace-nowrap flex-shrink-0 ${cashFlowData.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(cashFlowData.netCashFlow)}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm text-gray-600 gap-2">
                  <span className="flex-1 min-w-0">Kas dan Setara Kas Pada Awal Periode</span>
                  <span className="text-right whitespace-nowrap flex-shrink-0">{formatCurrency(cashFlowData.openingBalance)}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base font-semibold pt-2 border-t border-gray-300 gap-2">
                  <span className="flex-1 min-w-0">Kas dan Setara Kas Pada Akhir Periode</span>
                  <span className={`text-right whitespace-nowrap flex-shrink-0 ${cashFlowData.closingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(cashFlowData.closingBalance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 sm:p-6 text-right text-xs text-gray-500 print:text-gray-700">
              <p className="break-words">Dicetak pada: {new Date().toLocaleDateString('id-ID', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center text-gray-500">
            <p>Pilih bulan untuk melihat laporan</p>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          @page {
            size: A4 portrait;
            margin: 2cm;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
