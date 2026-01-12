/**
 * INPUT INCOME PAGE (REFACTORED)
 * Finance Module - Incomes
 */

'use client'

import { useEffect, useMemo, useState } from 'react'
import { HelpCircle } from 'lucide-react'

import { IncomesForm } from '@/modules/finance/components/incomes/IncomesForm'
import { useIncomes } from '@/modules/finance/hooks/useIncomes'
import { useProducts } from '@/hooks/useProducts'

import CustomerModal from '@/components/modals/CustomerModal'
import { ProductModal } from '@/components/products/ProductModal'
import {
  TransactionHistory,
  type TransactionFilters,
  type TransactionHistoryItem
} from '@/components/transactions/TransactionHistory'
import { getIncomeCategoryLabel } from '@/modules/finance/types/financeTypes'
import type { IncomeFormData } from '@/modules/finance/types/financeTypes'
import { EditTransactionModal } from '@/components/transactions/EditTransactionModal'
import { PreviewTransactionModal } from '@/components/transactions/PreviewTransactionModal'

export const dynamic = 'force-dynamic'

export default function InputIncomePage() {
  const { incomes, loading: loadingIncomes, error, fetchIncomes, createIncome, deleteIncome } = useIncomes({
    autoFetch: true
  })

  const { products, loading: loadingProducts, refresh: refreshProducts } = useProducts()

  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; type: 'success' | 'error' | 'warning'; message: string }>(
    { show: false, type: 'success', message: '' }
  )

  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    setToast({ show: true, type, message })
    window.setTimeout(() => setToast({ show: false, type, message: '' }), 3500)
  }

  // Modals
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [showProductModal, setShowProductModal] = useState(false)

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [selectedTransactionId, setSelectedTransactionId] = useState<string>('')

  // History
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<TransactionFilters>({
    searchQuery: '',
    dateRange: { start: '', end: '' },
    category: '',
    status: ''
  })

  const historyItems: TransactionHistoryItem[] = useMemo(() => {
    return (incomes || []).map((t: any) => {
      const rawStatus = (t.payment_status || '').toString().toLowerCase().trim()
      const status: TransactionHistoryItem['status'] =
        rawStatus === 'paid' || rawStatus === 'lunas'
          ? 'Lunas'
          : rawStatus === 'partial'
            ? 'Sebagian'
            : 'Tempo'

      const dateRaw = (t.transaction_date || t.income_date || '').toString()
      const date = dateRaw ? dateRaw.slice(0, 10) : ''

      const catRaw = (t.category || t.income_category || t.incomeCategory || '').toString()
      const categoryLabel = catRaw ? getIncomeCategoryLabel(catRaw) : '❓ Kategori belum tersimpan'

      return {
        id: t.id,
        date,
        category: catRaw,
        category_label: categoryLabel,
        customer_or_supplier: t.customer_name || undefined,
        amount: Number(t.total || t.grand_total || t.total_amount || t.amount || 0),
        status,
        payment_method: t.payment_type || t.payment_method || undefined,
        description: t.notes || undefined,
        due_date: t.due_date || undefined
      }
    })
  }, [incomes])

  useEffect(() => {
    setCurrentPage(1)
  }, [filters.searchQuery, filters.category, filters.status, filters.dateRange?.start, filters.dateRange?.end])

  const handleSubmit = async (data: IncomeFormData) => {
    try {
      setSaving(true)
      const result = await createIncome(data)

      if (!result.success) {
        showToast('error', result.error || '❌ Gagal menyimpan transaksi')
        return { success: false, error: result.error || 'Gagal menyimpan transaksi' }
      }

      await refreshProducts()
      setSelectedCustomer(null)

      if (result.warning) showToast('warning', result.warning)
      else showToast('success', '✅ Transaksi berhasil disimpan')

      return { success: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan'
      console.error('Submit error:', err)
      showToast('error', `❌ Gagal menyimpan: ${message}`)
      return { success: false, error: message }
    } finally {
      setSaving(false)
    }
  }

  const handleRefresh = async () => {
    await fetchIncomes()
    await refreshProducts()
  }

  const handleDelete = async (incomeId: string) => {
    const confirmed = confirm('⚠️ Yakin ingin menghapus transaksi ini?\n\nStok produk akan dikembalikan (rollback).')
    if (!confirmed) return

    const result = await deleteIncome(incomeId)
    if (result.success) {
      showToast('success', '✅ Transaksi berhasil dihapus')
      await refreshProducts()
      await fetchIncomes()
    } else {
      showToast('error', `❌ Gagal menghapus: ${result.error || 'Unknown error'}`)
    }
  }

  const handleBulkDelete = async (ids: string[]) => {
    const confirmed = confirm(`Hapus ${ids.length} transaksi yang dipilih?\n\nStok produk akan dikembalikan (rollback).`)
    if (!confirmed) return

    // Prefer bulk delete endpoint (if available)
    const res = await fetch('/api/transactions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    }).catch(() => null as any)

    const json = res ? await res.json().catch(() => null) : null
    if (res?.ok && json?.success) {
      showToast('success', `✅ ${ids.length} transaksi berhasil dihapus`)
      await fetchIncomes()
      await refreshProducts()
      return
    }

    // Fallback: per-item delete via hook
    const results = await Promise.all(ids.map((id) => deleteIncome(id)))
    const failed = results.filter((r) => !r.success)

    if (failed.length) showToast('error', `❌ Gagal menghapus ${failed.length} transaksi. Cek satu per satu.`)
    else showToast('success', `✅ ${ids.length} transaksi berhasil dihapus`)

    await fetchIncomes()
    await refreshProducts()
  }

  const handleEdit = (incomeId: string) => {
    setSelectedTransactionId(incomeId)
    setEditModalOpen(true)
  }

  const handlePreview = (incomeId: string) => {
    setSelectedTransactionId(incomeId)
    setPreviewModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">💰 Input Pendapatan</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Catat transaksi pendapatan dari penjualan produk, jasa, atau sumber lainnya
              </p>
            </div>
            <button
              type="button"
              onClick={() => showToast('warning', 'Tutorial belum diaktifkan di versi ini')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Tutorial</span>
            </button>
          </div>
        </div>

        <IncomesForm
          onSubmit={handleSubmit}
          loading={saving}
          products={products as any}
          loadingProducts={loadingProducts}
          onAddProduct={() => setShowProductModal(true)}
          onAddCustomer={() => setShowCustomerModal(true)}
          selectedCustomer={selectedCustomer}
        />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">📊 Riwayat Transaksi</h2>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loadingIncomes}
              className="px-3 py-2 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              🔄 Refresh
            </button>
          </div>

          <TransactionHistory
            title="Riwayat Transaksi Pendapatan"
            type="income"
            transactions={historyItems}
            loading={loadingIncomes}
            currentPage={currentPage}
            totalPages={Math.max(1, Math.ceil(historyItems.length / 10))}
            filters={filters}
            onFilterChange={setFilters}
            onPageChange={setCurrentPage}
            onEdit={handleEdit}
            onPreview={handlePreview}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">⚠️ Error: {error}</p>
          </div>
        )}
      </div>

      {toast.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]">
          <div
            className={`rounded-lg shadow-2xl p-4 min-w-[280px] max-w-md border-l-4 ${
              toast.type === 'success'
                ? 'bg-green-50 border-green-500'
                : toast.type === 'error'
                  ? 'bg-red-50 border-red-500'
                  : 'bg-yellow-50 border-yellow-500'
            }`}
          >
            <p className="text-sm text-gray-900">{toast.message}</p>
          </div>
        </div>
      )}

      {showCustomerModal && (
        <CustomerModal
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          onSelect={(c: any) => {
            setSelectedCustomer(c)
            setShowCustomerModal(false)
          }}
          selectedCustomer={selectedCustomer}
        />
      )}

      {showProductModal && (
        <ProductModal
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
          product={null}
          onSuccess={async () => {
            await refreshProducts()
            setShowProductModal(false)
          }}
        />
      )}

      <EditTransactionModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        transactionId={selectedTransactionId}
        transactionType="income"
        onSuccess={async () => {
          await fetchIncomes()
          await refreshProducts()
        }}
      />

      <PreviewTransactionModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        transactionId={selectedTransactionId}
        transactionType="income"
      />
    </div>
  )
}
