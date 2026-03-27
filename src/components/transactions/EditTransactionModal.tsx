/**
 * EDIT TRANSACTION MODAL
 * Reusable modal for editing income/expense transactions
 */

'use client'

import { useState, useEffect } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Income } from '@/modules/finance/types/financeTypes'
import { showToast, ToastContainer } from '@/components/ui/Toast'

export interface EditTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transactionId: string
  transactionType: 'income' | 'expense'
  onSuccess?: () => void
}

interface EditFormData {
  date: string
  category: string
  customer_or_supplier: string
  amount: number
  payment_method: string
  payment_status: string
  notes: string
}

interface EditRestrictions {
  hasLinkedItems: boolean
  hasLinkedParty: boolean
}

export function EditTransactionModal({
  isOpen,
  onClose,
  transactionId,
  transactionType,
  onSuccess
}: EditTransactionModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [restrictions, setRestrictions] = useState<EditRestrictions>({
    hasLinkedItems: false,
    hasLinkedParty: false,
  })
  const [formData, setFormData] = useState<EditFormData>({
    date: '',
    category: '',
    customer_or_supplier: '',
    amount: 0,
    payment_method: 'cash',
    payment_status: 'Lunas',
    notes: ''
  })

  // Load transaction data
  useEffect(() => {
    if (!isOpen) return

    const loadTransaction = async () => {
      setLoading(true)
      try {
        const tableName = transactionType === 'income' ? 'incomes' : 'expenses'
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', transactionId)
          .single()

        if (error) throw error

        if (data) {
          let hasLinkedItems = false

          if (transactionType === 'expense') {
            const { count } = await supabase
              .from('expense_items')
              .select('id', { count: 'exact', head: true })
              .eq('expense_id', transactionId)
            hasLinkedItems = Number(count || 0) > 0
          } else {
            hasLinkedItems =
              (Array.isArray((data as any).line_items) && (data as any).line_items.length > 0) ||
              Boolean((data as any).product_id) ||
              Number((data as any).quantity || 0) > 0
          }

          setRestrictions({
            hasLinkedItems,
            hasLinkedParty: Boolean((data as any).customer_id || (data as any).supplier_id),
          })

          setFormData({
            date: data[transactionType === 'income' ? 'income_date' : 'expense_date'] || '',
            category:
              transactionType === 'income'
                ? (data.income_category || data.category || '')
                : (data.expense_category || data.category || ''),
            customer_or_supplier: data[transactionType === 'income' ? 'customer_name' : 'supplier_name'] || '',
            amount: data.grand_total || data.total_amount || 0,
            payment_method: data.payment_method || 'cash',
            payment_status: data.payment_status || 'Lunas',
            notes: data.notes || ''
          })
        }
      } catch (error) {
        console.error('Error loading transaction:', error)
        showToast('Gagal memuat data transaksi', 'error')
        onClose()
      } finally {
        setLoading(false)
      }
    }

    loadTransaction()
  }, [isOpen, transactionId, transactionType, supabase, onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const tableName = transactionType === 'income' ? 'incomes' : 'expenses'
      const dateField = transactionType === 'income' ? 'income_date' : 'expense_date'
      const categoryField = transactionType === 'income' ? 'income_category' : 'expense_category'
      const customerSupplierField = transactionType === 'income' ? 'customer_name' : 'supplier_name'

      let updateData: any = {
        [dateField]: formData.date,
        // schema drift safe: try both specific and generic columns
        [categoryField]: formData.category,
        category: formData.category,
        payment_method: formData.payment_method,
        payment_status: formData.payment_status,
        notes: formData.notes,
        updated_at: new Date().toISOString()
      }

      if (!restrictions.hasLinkedParty) {
        updateData[customerSupplierField] = formData.customer_or_supplier
      }

      if (!restrictions.hasLinkedItems) {
        updateData.grand_total = formData.amount
        if (transactionType === 'income') {
          updateData.amount = formData.amount
        }
      }

      const extractMissingColumn = (err: any) => {
        const msg = ((err as any)?.message || (err as any)?.details || '').toString()
        let m = msg.match(/Could not find the '([^']+)' column/i)
        if (m?.[1]) return m[1]
        m = msg.match(/column\s+[^.]+\.([^\s]+)\s+does not exist/i)
        if (m?.[1]) return m[1].replace(/"/g, '')
        m = msg.match(/column\s+"([^"]+)"\s+does not exist/i)
        if (m?.[1]) return m[1]
        return ''
      }

      const isSchemaMismatch = (err: any) => {
        const msg = ((err as any)?.message || '').toString().toLowerCase()
        const code = (err as any)?.code || ''
        return code === '42703' || msg.includes('column') || msg.includes('could not find')
      }

      let lastError: any = null
      for (let i = 0; i < 8; i++) {
        const { error } = await supabase.from(tableName).update(updateData).eq('id', transactionId)
        if (!error) {
          lastError = null
          break
        }

        lastError = error
        if (!isSchemaMismatch(error)) break

        const missing = extractMissingColumn(error)
        if (missing && Object.prototype.hasOwnProperty.call(updateData, missing)) {
          delete updateData[missing]
          continue
        }

        // If we couldn't detect the missing key, drop one of the category keys as a safe fallback.
        if (Object.prototype.hasOwnProperty.call(updateData, categoryField)) {
          delete updateData[categoryField]
          continue
        }
        if (Object.prototype.hasOwnProperty.call(updateData, 'category')) {
          delete updateData.category
          continue
        }

        break
      }

      if (lastError) throw lastError

      showToast('Transaksi berhasil diperbarui', 'success')
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error updating transaction:', error)
      showToast('Gagal memperbarui transaksi', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof EditFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Edit {transactionType === 'income' ? 'Pendapatan' : 'Pengeluaran'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Perbarui data transaksi
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={saving}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Memuat data...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan kategori"
                  required
                />
              </div>

              {/* Customer/Supplier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {transactionType === 'income' ? 'Customer' : 'Supplier'}
                </label>
                <input
                  type="text"
                  value={formData.customer_or_supplier}
                  onChange={(e) => handleChange('customer_or_supplier', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={transactionType === 'income' ? 'Nama customer' : 'Nama supplier'}
                  disabled={restrictions.hasLinkedParty}
                />
                {restrictions.hasLinkedParty && (
                  <p className="mt-1 text-xs text-amber-700">
                    Nama pihak dikunci di modal ini karena transaksi terhubung ke data master customer/supplier.
                  </p>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                  disabled={restrictions.hasLinkedItems}
                />
                {restrictions.hasLinkedItems && (
                  <p className="mt-1 text-xs text-amber-700">
                    Total dikunci karena transaksi memiliki item terkait. Ubah item melalui alur transaksi baru agar stok dan subtotal tetap sinkron.
                  </p>
                )}
              </div>

              {(restrictions.hasLinkedItems || restrictions.hasLinkedParty) && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Edit pada modal ini dibatasi ke metadata aman seperti tanggal, kategori, metode/status pembayaran, dan catatan. Pembatasan ini menjaga hubungan antar data tetap konsisten.
                </div>
              )}

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metode Pembayaran <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => handleChange('payment_method', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="cash">💵 Tunai</option>
                  <option value="transfer">🏦 Transfer</option>
                  <option value="tempo">📅 Tempo</option>
                  <option value="qris">📱 QRIS</option>
                  <option value="e-wallet">💳 Dompet Digital</option>
                </select>
              </div>

              {/* Payment Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status Pembayaran <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.payment_status}
                  onChange={(e) => handleChange('payment_status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Lunas">✅ Lunas</option>
                  <option value="Pending">⏳ Menunggu</option>
                  <option value="Tempo">📅 Tempo</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Catatan tambahan..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={saving}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  )
}
