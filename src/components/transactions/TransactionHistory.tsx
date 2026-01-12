/**
 * UNIFIED TRANSACTION HISTORY COMPONENT
 * Reusable untuk Income & Expense history
 * Features: Filter, Pagination, Bulk Delete, Card/List View, Edit/Preview/Delete
 */

'use client'

import { useState } from 'react'
import { Search, Filter, Calendar, LayoutGrid, List, Trash2, Edit, Eye, ChevronLeft, ChevronRight } from 'lucide-react'

export interface TransactionHistoryItem {
  id: string
  date: string
  category: string // category code (used for filtering)
  category_label?: string // display label
  customer_or_supplier?: string
  amount: number
  status: 'Lunas' | 'Tempo' | 'Sebagian'
  payment_method?: string
  description?: string
  po_number?: string
  due_date?: string
}

export interface TransactionFilters {
  searchQuery: string
  dateRange: {
    start: string
    end: string
  }
  category: string
  status: string
}

interface TransactionHistoryProps {
  title: string
  type: 'income' | 'expense'
  transactions: TransactionHistoryItem[]
  loading: boolean
  filters: TransactionFilters
  onFilterChange: (filters: TransactionFilters) => void
  onEdit: (id: string) => void
  onPreview: (id: string) => void
  onDelete: (id: string) => void
  onBulkDelete: (ids: string[]) => void
  totalPages: number
  currentPage: number
  onPageChange: (page: number) => void
}

export function TransactionHistory({
  title,
  type,
  transactions,
  loading,
  filters,
  onFilterChange,
  onEdit,
  onPreview,
  onDelete,
  onBulkDelete,
  totalPages,
  currentPage,
  onPageChange
}: TransactionHistoryProps) {
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

  // Apply client-side filtering
  const filteredTransactions = transactions.filter(transaction => {
    // Search filter
    if (filters.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase()
      const matchesSearch = 
        transaction.category?.toLowerCase().includes(searchLower) ||
        transaction.category_label?.toLowerCase().includes(searchLower) ||
        transaction.customer_or_supplier?.toLowerCase().includes(searchLower) ||
        transaction.description?.toLowerCase().includes(searchLower) ||
        transaction.po_number?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Date range filter
    if (filters.dateRange.start && transaction.date < filters.dateRange.start) {
      return false
    }
    if (filters.dateRange.end && transaction.date > filters.dateRange.end) {
      return false
    }

    // Category filter
    if (filters.category && transaction.category !== filters.category) {
      return false
    }

    // Status filter
    if (filters.status && transaction.status !== filters.status) {
      return false
    }

    return true
  })

  // Apply pagination
  const itemsPerPage = 10
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex)
  const calculatedTotalPages = Math.ceil(filteredTransactions.length / itemsPerPage)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const raw = (dateString || '').toString().trim()
    if (!raw) return '-'
    const date = new Date(raw)
    if (Number.isNaN(date.getTime())) return raw
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(paginatedTransactions.map(t => t.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds)
    if (checked) {
      newSet.add(id)
    } else {
      newSet.delete(id)
    }
    setSelectedIds(newSet)
  }

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return
    if (confirm(`Hapus ${selectedIds.size} transaksi yang dipilih?`)) {
      onBulkDelete(Array.from(selectedIds))
      setSelectedIds(new Set())
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'Lunas': 'bg-green-100 text-green-800',
      'Tempo': 'bg-yellow-100 text-yellow-800',
      'Sebagian': 'bg-orange-100 text-orange-800'
    }
    return statusMap[status as keyof typeof statusMap] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <div className="flex items-center gap-2 justify-between sm:justify-end">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`p-2 rounded ${viewMode === 'card' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Toggle */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filter</span>
            </button>
          </div>
        </div>

        {/* Search & Bulk Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari transaksi..."
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={handleBulkDelete}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-medium">Hapus ({selectedIds.size})</span>
            </button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => onFilterChange({
                  ...filters,
                  dateRange: { ...filters.dateRange, start: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Akhir</label>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => onFilterChange({
                  ...filters,
                  dateRange: { ...filters.dateRange, end: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select
                value={filters.category}
                onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Kategori</option>
                {type === 'income' ? (
                  <>
                    <option value="product_sales">Penjualan Produk</option>
                    <option value="service_income">Jasa/Layanan</option>
                    <option value="other_income">Lainnya</option>
                    <option value="asset_sale">Jual Aset</option>
                    <option value="investment_return">Return Investasi</option>
                    <option value="other_investing">Investasi Lainnya</option>
                    <option value="capital_injection">Modal Masuk Pribadi</option>
                    <option value="loan_received">Pinjaman Diterima</option>
                    <option value="investor_funding">Dana Investor</option>
                    <option value="other_financing">Pendanaan Lainnya</option>
                  </>
                ) : (
                  <>
                    <option value="raw_materials">Bahan Baku</option>
                    <option value="finished_goods">Barang Jadi</option>
                    <option value="operational">Operasional</option>
                    <option value="utilities">Utilitas</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Status</option>
                <option value="Lunas">Lunas</option>
                <option value="Tempo">Tempo</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-gray-600">Memuat data...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Tidak ada transaksi{filters.searchQuery || filters.category || filters.status ? ' yang sesuai filter' : ''}</p>
          </div>
        ) : viewMode === 'list' ? (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === paginatedTransactions.length && paginatedTransactions.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tanggal</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Kategori</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    {type === 'income' ? 'Customer' : 'Supplier'}
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Jumlah</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(transaction.id)}
                        onChange={(e) => handleSelectOne(transaction.id, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">{formatDate(transaction.date)}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      <div className="font-medium text-gray-900">
                        {transaction.category_label || transaction.category}
                      </div>
                      {transaction.description && (
                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                          {transaction.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {transaction.customer_or_supplier || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-right text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(transaction.status)}`}>
                        {transaction.status}
                      </span>
                      {(transaction.status === 'Tempo' || transaction.status === 'Sebagian') && transaction.due_date && (
                        <div className="text-xs text-red-600 mt-1">
                          Jatuh tempo: {formatDate(transaction.due_date)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onPreview(transaction.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Lihat"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(transaction.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(transaction.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedTransactions.map((transaction) => (
              <div key={transaction.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(transaction.id)}
                    onChange={(e) => handleSelectOne(transaction.id, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 mt-1"
                  />
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(transaction.date)}</span>
                  </div>
                  {(transaction.status === 'Tempo' || transaction.status === 'Sebagian') && transaction.due_date && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <Calendar className="w-4 h-4" />
                      <span>Jatuh tempo: {formatDate(transaction.due_date)}</span>
                    </div>
                  )}
                  <div className="text-sm font-medium text-gray-900">{transaction.category_label || transaction.category}</div>
                  {transaction.description && (
                    <div className="text-xs text-gray-500 line-clamp-2">
                      {transaction.description}
                    </div>
                  )}
                  {transaction.customer_or_supplier && (
                    <div className="text-sm text-gray-600">{transaction.customer_or_supplier}</div>
                  )}
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(transaction.amount)}</div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => onPreview(transaction.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">Lihat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(transaction.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-sm">Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(transaction.id)}
                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {calculatedTotalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Halaman {currentPage} dari {calculatedTotalPages} • Total {filteredTransactions.length} transaksi
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: Math.min(calculatedTotalPages, 5) }, (_, i) => {
                const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i
                if (page > calculatedTotalPages) return null
                return (
                  <button
                    type="button"
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      page === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === calculatedTotalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
