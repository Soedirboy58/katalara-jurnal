/**
 * PREVIEW TRANSACTION MODAL
 * Reusable modal for viewing transaction details
 */

'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Calendar, User, DollarSign, CreditCard, FileText, Package, Printer } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export interface PreviewTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transactionId: string
  transactionType: 'income' | 'expense'
}

interface TransactionDetail {
  id: string
  date: string
  category: string
  customer_or_supplier: string
  amount: number
  subtotal?: number
  discount_amount?: number
  ppn_amount?: number
  pph_amount?: number
  payment_method: string
  payment_status: string
  notes: string
  items?: Array<{
    product_name: string
    qty: number
    unit: string
    price_per_unit: number
    subtotal: number
  }>
  created_at: string
  updated_at: string
}

export function PreviewTransactionModal({
  isOpen,
  onClose,
  transactionId,
  transactionType
}: PreviewTransactionModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const loadTransaction = async () => {
      setLoading(true)
      try {
        const tableName = transactionType === 'income' ? 'incomes' : 'expenses'
        const itemsTableName = transactionType === 'income' ? 'income_items' : 'expense_items'
        const itemsFk = transactionType === 'income' ? 'income_id' : 'expense_id'

        // Load main transaction
        const { data: mainData, error: mainError } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', transactionId)
          .single()

        if (mainError) throw mainError

        // Load transaction items
        const { data: itemsData, error: itemsError } = await supabase
          .from(itemsTableName)
          .select('*')
          .eq(itemsFk, transactionId)

        if (itemsError) console.warn('No items found:', itemsError)

        if (mainData) {
          setTransaction({
            id: mainData.id,
            date: mainData[transactionType === 'income' ? 'income_date' : 'expense_date'] || '',
            category: mainData[transactionType === 'income' ? 'income_category' : 'expense_category'] || '-',
            customer_or_supplier: mainData[transactionType === 'income' ? 'customer_name' : 'supplier_name'] || '-',
            amount: mainData.grand_total || mainData.total_amount || 0,
            subtotal: mainData.subtotal || 0,
            discount_amount: mainData.discount_amount || 0,
            ppn_amount: mainData.ppn_amount || 0,
            pph_amount: mainData.pph_amount || 0,
            payment_method: mainData.payment_method || '-',
            payment_status: mainData.payment_status || '-',
            notes: mainData.notes || '-',
            items: itemsData?.map(item => ({
              product_name: item.product_name,
              qty: item.qty,
              unit: item.unit || 'pcs',
              price_per_unit: item.price_per_unit,
              subtotal: item.subtotal
            })) || [],
            created_at: mainData.created_at,
            updated_at: mainData.updated_at
          })
        }
      } catch (error) {
        console.error('Error loading transaction:', error)
        alert('❌ Gagal memuat detail transaksi')
        onClose()
      } finally {
        setLoading(false)
      }
    }

    loadTransaction()
  }, [isOpen, transactionId, transactionType, supabase, onClose])

  const handlePrint = () => {
    window.print()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; emoji: string }> = {
      'Lunas': { bg: 'bg-green-100', text: 'text-green-700', emoji: '✅' },
      'paid': { bg: 'bg-green-100', text: 'text-green-700', emoji: '✅' },
      'Pending': { bg: 'bg-yellow-100', text: 'text-yellow-700', emoji: '⏳' },
      'unpaid': { bg: 'bg-yellow-100', text: 'text-yellow-700', emoji: '⏳' },
      'Tempo': { bg: 'bg-blue-100', text: 'text-blue-700', emoji: '📅' },
      'partial': { bg: 'bg-orange-100', text: 'text-orange-700', emoji: '⚠️' }
    }

    const style = statusMap[status] || { bg: 'bg-gray-100', text: 'text-gray-700', emoji: '❓' }
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
        <span>{style.emoji}</span>
        {status}
      </span>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Detail {transactionType === 'income' ? 'Pendapatan' : 'Pengeluaran'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              ID: {transactionId.substring(0, 8)}...
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Memuat detail...</span>
            </div>
          ) : transaction ? (
            <div className="space-y-6">
              {/* Transaction Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 bg-blue-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Tanggal Transaksi</p>
                      <p className="text-base font-semibold text-gray-900">
                        {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 bg-purple-100 rounded-lg">
                      <Package className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Kategori</p>
                      <p className="text-base font-semibold text-gray-900">
                        {transaction.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 bg-green-100 rounded-lg">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">
                        {transactionType === 'income' ? 'Customer' : 'Supplier'}
                      </p>
                      <p className="text-base font-semibold text-gray-900">
                        {transaction.customer_or_supplier}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 bg-orange-100 rounded-lg">
                      <CreditCard className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Metode Pembayaran</p>
                      <p className="text-base font-semibold text-gray-900">
                        {transaction.payment_method}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 bg-yellow-100 rounded-lg">
                      <FileText className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Status Pembayaran</p>
                      <div className="mt-1">
                        {getStatusBadge(transaction.payment_status)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 bg-red-100 rounded-lg">
                      <DollarSign className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items List */}
              {transaction.items && transaction.items.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Item Transaksi</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Produk
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Qty
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Harga
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {transaction.items.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {item.product_name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 text-right">
                              {item.qty} {item.unit}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 text-right">
                              {formatCurrency(item.price_per_unit)}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                              {formatCurrency(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Financial Breakdown */}
              {(transaction.subtotal > 0 || transaction.discount_amount > 0 || transaction.ppn_amount > 0 || transaction.pph_amount > 0) && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-2">
                  <h3 className="font-semibold text-gray-900 mb-3">Rincian Keuangan</h3>
                  
                  {transaction.subtotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-900">{formatCurrency(transaction.subtotal)}</span>
                    </div>
                  )}
                  
                  {transaction.discount_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Diskon</span>
                      <span className="font-medium text-red-600">- {formatCurrency(transaction.discount_amount)}</span>
                    </div>
                  )}
                  
                  {transaction.ppn_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">PPN</span>
                      <span className="font-medium text-gray-900">{formatCurrency(transaction.ppn_amount)}</span>
                    </div>
                  )}
                  
                  {transaction.pph_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">PPh</span>
                      <span className="font-medium text-gray-900">{formatCurrency(transaction.pph_amount)}</span>
                    </div>
                  )}
                  
                  <div className="pt-2 border-t border-gray-300 flex justify-between">
                    <span className="font-semibold text-gray-900">Grand Total</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(transaction.amount)}</span>
                  </div>
                </div>
              )}

              {/* Notes */}
              {transaction.notes && transaction.notes !== '-' && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Catatan</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{transaction.notes}</p>
                </div>
              )}

              {/* Metadata */}
              <div className="border-t border-gray-200 pt-4 grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <span className="font-medium">Dibuat:</span>{' '}
                  {new Date(transaction.created_at).toLocaleString('id-ID')}
                </div>
                <div>
                  <span className="font-medium">Diperbarui:</span>{' '}
                  {new Date(transaction.updated_at).toLocaleString('id-ID')}
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Tutup
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Data tidak ditemukan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
