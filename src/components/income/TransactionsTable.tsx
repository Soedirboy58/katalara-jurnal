'use client'

import { useState } from 'react'
import { PrintModal } from './PrintModal'

interface Transaction {
  id: string
  income_date: string
  income_type: string
  category: string
  amount: number
  payment_method: string
  payment_status: string
  payment_type?: string
  due_date?: string
  customer_name?: string
  customer_phone?: string
  product_name?: string
  quantity?: number
  price_per_unit?: number
  description?: string
}

interface TransactionsTableProps {
  transactions: Transaction[]
  businessName: string
  onRefresh: () => void
  onEdit?: (transaction: Transaction) => void
}

export function TransactionsTable({ transactions, businessName, onRefresh, onEdit }: TransactionsTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Filter states
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Apply filters
  const filteredTransactions = transactions.filter(t => {
    // Date filter
    if (filterStartDate && t.income_date < filterStartDate) return false
    if (filterEndDate && t.income_date > filterEndDate) return false
    
    // Category filter
    if (filterCategory !== 'all' && t.category !== filterCategory) return false
    
    // Status filter
    if (filterStatus !== 'all' && t.payment_status !== filterStatus) return false
    
    return true
  })
  
  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex)

  // Bulk actions
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === currentTransactions.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(currentTransactions.map(t => t.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    
    const confirmed = confirm(`Hapus ${selectedIds.size} transaksi terpilih?`)
    if (!confirmed) return

    setIsDeleting(true)
    try {
      const response = await fetch('/api/income', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      })

      if (response.ok) {
        setSelectedIds(new Set())
        onRefresh()
      } else {
        alert('Gagal menghapus transaksi')
      }
    } catch (error) {
      alert('Error: ' + error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePrint = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setPrintModalOpen(true)
  }

  const getCategoryLabel = (type: string, category: string) => {
    const labels: Record<string, Record<string, string>> = {
      operating: {
        product_sales: 'Penjualan Produk',
        service_income: 'Pendapatan Jasa',
        other_income: 'Pendapatan Lain'
      },
      investing: {
        asset_sales: 'Jual Aset',
        investment_return: 'Return Investasi',
        interest_income: 'Bunga Bank'
      },
      financing: {
        owner_capital: 'Modal Masuk',
        loan_received: 'Pinjaman Diterima',
        investor_funding: 'Dana Investor'
      }
    }
    return labels[type]?.[category] || category
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'Lunas': 'bg-green-100 text-green-800',
      'Tempo': 'bg-orange-100 text-orange-800',
      'Pending': 'bg-orange-100 text-orange-800'
    }
    const displayStatus = status === 'Pending' ? 'Tempo' : status
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {displayStatus}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filter Transaksi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Date Range */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Category Filter */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Kategori</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Kategori</option>
              <option value="product_sales">Penjualan Produk</option>
              <option value="service_income">Pendapatan Jasa</option>
              <option value="other_income">Pendapatan Lain</option>
              <option value="owner_capital">Modal Masuk</option>
              <option value="loan_received">Pinjaman Diterima</option>
              <option value="investor_funding">Dana Investor</option>
              <option value="asset_sales">Jual Aset</option>
              <option value="investment_return">Return Investasi</option>
              <option value="interest_income">Bunga Bank</option>
            </select>
          </div>
          
          {/* Status Filter */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Status Pembayaran</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="Lunas">Lunas</option>
              <option value="Pending">Tempo</option>
            </select>
          </div>
        </div>
        
        {/* Filter Summary & Reset */}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-gray-600">
            Menampilkan <span className="font-semibold text-blue-600">{filteredTransactions.length}</span> dari {transactions.length} transaksi
          </p>
          {(filterStartDate || filterEndDate || filterCategory !== 'all' || filterStatus !== 'all') && (
            <button
              onClick={() => {
                setFilterStartDate('')
                setFilterEndDate('')
                setFilterCategory('all')
                setFilterStatus('all')
              }}
              className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reset Filter
            </button>
          )}
        </div>
      </div>
      
      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selectedIds.size} transaksi terpilih
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const selected = transactions.find(t => selectedIds.has(t.id))
                if (selected) handlePrint(selected)
              }}
              disabled={selectedIds.size !== 1}
              className="p-2 bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Preview Cetak"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
            >
              {isDeleting ? 'Menghapus...' : 'Hapus'}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm font-medium"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.size === currentTransactions.length && currentTransactions.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Tanggal
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Kategori
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Jumlah
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Belum ada transaksi
                </td>
              </tr>
            ) : (
              currentTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(transaction.id)}
                      onChange={() => toggleSelect(transaction.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(transaction.income_date).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {getCategoryLabel(transaction.income_type, transaction.category)}
                      </div>
                      {transaction.product_name && (
                        <div className="text-xs text-gray-500">{transaction.product_name}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {transaction.customer_name || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                    Rp {transaction.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      {getStatusBadge(transaction.payment_status)}
                      {transaction.payment_type === 'tempo' && transaction.due_date && (
                        <span className="text-xs text-gray-500">
                          {new Date(transaction.due_date).toLocaleDateString('id-ID')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(transaction)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded hover:bg-amber-700"
                          title="Edit transaksi"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => handlePrint(transaction)}
                        className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        title="Preview Cetak"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {currentTransactions.length === 0 ? (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center text-gray-500">
            Belum ada transaksi
          </div>
        ) : (
          currentTransactions.map((transaction) => (
            <div key={transaction.id} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
              {/* Header with checkbox and date */}
              <div className="flex items-start justify-between">
                <input
                  type="checkbox"
                  checked={selectedIds.has(transaction.id)}
                  onChange={() => toggleSelect(transaction.id)}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1 mx-3">
                  <div className="text-xs text-gray-500">
                    {new Date(transaction.income_date).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="font-semibold text-gray-900 mt-0.5">
                    {getCategoryLabel(transaction.income_type, transaction.category)}
                  </div>
                  {transaction.product_name && (
                    <div className="text-xs text-gray-500 mt-0.5">{transaction.product_name}</div>
                  )}
                </div>
                {getStatusBadge(transaction.payment_status)}
              </div>

              {/* Customer */}
              {transaction.customer_name && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-gray-700">{transaction.customer_name}</span>
                </div>
              )}

              {/* Due date for tempo */}
              {transaction.payment_type === 'tempo' && transaction.due_date && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-600">
                    Jatuh tempo: {new Date(transaction.due_date).toLocaleDateString('id-ID')}
                  </span>
                </div>
              )}

              {/* Amount and action */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="text-xl font-bold text-gray-900">
                  Rp {transaction.amount.toLocaleString('id-ID')}
                </div>
                <div className="flex items-center gap-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(transaction)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 active:bg-amber-800"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => handlePrint(transaction)}
                    className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    title="Preview Cetak"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {transactions.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Tampilkan:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-600">
              dari {transactions.length} transaksi
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span className="text-sm text-gray-600">
              Halaman {currentPage} dari {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {selectedTransaction && (
        <PrintModal
          isOpen={printModalOpen}
          onClose={() => {
            setPrintModalOpen(false)
            setSelectedTransaction(null)
          }}
          incomeData={selectedTransaction}
          businessName={businessName}
        />
      )}
    </div>
  )
}
