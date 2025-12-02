/**
 * ExpensesList Component
 * 
 * Features:
 * - Display recent expenses
 * - Search & filter
 * - Quick view details
 * - Status badges
 */

'use client'

import { Search, Filter, Calendar, Package, DollarSign, Clock } from 'lucide-react'
import type { Expense } from '@/hooks/expenses/useExpensesList'

interface ExpensesListProps {
  expenses: Expense[]
  loading: boolean
  error: string | null
  searchQuery: string
  onSearchChange: (query: string) => void
  onRefresh: () => void
}

export const ExpensesList: React.FC<ExpensesListProps> = ({
  expenses,
  loading,
  error,
  searchQuery,
  onSearchChange,
  onRefresh
}) => {
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date)
  }
  
  const getStatusBadge = (status: 'Lunas' | 'Tempo') => {
    if (status === 'Lunas') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          Lunas
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
        <Clock className="w-3 h-3 mr-1" />
        Tempo
      </span>
    )
  }
  
  const getCategoryBadge = (type: string) => {
    const colors = {
      operating: 'bg-blue-100 text-blue-700',
      investing: 'bg-purple-100 text-purple-700',
      financing: 'bg-pink-100 text-pink-700'
    }
    
    const labels = {
      operating: 'Operasional',
      investing: 'Investasi',
      financing: 'Financing'
    }
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-700'}`}>
        {labels[type as keyof typeof labels] || type}
      </span>
    )
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Riwayat Pengeluaran
        </h3>
        <button
          type="button"
          onClick={onRefresh}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      
      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari berdasarkan PO, deskripsi, atau catatan..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>
      
      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm text-gray-500 mt-2">Memuat data...</p>
        </div>
      )}
      
      {/* Expenses List */}
      {!loading && !error && (
        <>
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {searchQuery
                  ? 'Tidak ada pengeluaran yang cocok dengan pencarian'
                  : 'Belum ada pengeluaran tercatat'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-mono text-gray-500">
                          {expense.id.slice(0, 8)}
                        </span>
                        {getStatusBadge(expense.payment_status)}
                        {getCategoryBadge(expense.expense_type)}
                      </div>
                      <h4 className="font-medium text-gray-800">
                        {expense.description}
                      </h4>
                      {expense.supplier_name && (
                        <p className="text-sm text-gray-500 mt-1">
                          Supplier: {expense.supplier_name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-800">
                        {formatRupiah(expense.grand_total)}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center justify-end gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(expense.expense_date)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Tempo Info */}
                  {expense.payment_status === 'Tempo' && expense.remaining_payment > 0 && (
                    <div className="bg-orange-50 rounded px-3 py-2 mt-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Sisa pembayaran:</span>
                        <span className="font-semibold text-orange-600">
                          {formatRupiah(expense.remaining_payment)}
                        </span>
                      </div>
                      {expense.due_date && (
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-gray-600">Jatuh tempo:</span>
                          <span className="text-gray-800">
                            {formatDate(expense.due_date)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Notes */}
                  {expense.notes && (
                    <p className="text-sm text-gray-600 mt-2 italic">
                      "{expense.notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {/* Summary Stats */}
      {!loading && expenses.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-500 mb-1">Total Transaksi</div>
              <div className="font-semibold text-gray-800">{expenses.length}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Lunas</div>
              <div className="font-semibold text-green-600">
                {expenses.filter(e => e.payment_status === 'Lunas').length}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Tempo</div>
              <div className="font-semibold text-orange-600">
                {expenses.filter(e => e.payment_status === 'Tempo').length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
