/**
 * PREVIEW TRANSACTION MODAL
 * Reusable modal for viewing transaction details
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Loader2, Calendar, User, DollarSign, CreditCard, FileText, Package, Printer, Eye, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getIncomeCategoryLabel, getPaymentMethodLabel } from '@/modules/finance/types/financeTypes'
import { IncomePrintModal } from '@/modules/finance/components/incomes/IncomePrintModal'
import { ExpensePrintModal } from '@/modules/finance/components/expenses/ExpensePrintModal'

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
  customer_id?: string
  customer_phone?: string
  customer_email?: string
  customer_address?: string
  counterparty_phone?: string
  counterparty_email?: string
  counterparty_address?: string
  receipt_url?: string
  receipt_filename?: string
  amount: number
  subtotal?: number
  discount_amount?: number
  ppn_amount?: number
  pph_amount?: number
  payment_method: string
  payment_status: string
  payment_status_label?: 'Lunas' | 'Tempo' | 'Sebagian'
  due_date?: string
  po_number?: string
  description?: string
  down_payment?: number
  remaining_payment?: number
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
  const [isPoModalOpen, setIsPoModalOpen] = useState(false)
  const [isIncomePrintOpen, setIsIncomePrintOpen] = useState(false)
  const [isExpensePrintOpen, setIsExpensePrintOpen] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const poPrintRef = useRef<HTMLDivElement | null>(null)

  const openExpensePrint = (opts?: { closePoPreview?: boolean }) => {
    if (opts?.closePoPreview) setIsPoModalOpen(false)
    setIsExpensePrintOpen(true)
  }

  const getExpenseCategoryLabel = (category: string | null | undefined) => {
    const c = (category || '').toString().trim()
    const map: Record<string, string> = {
      raw_materials: '📦 Pembelian Bahan Baku',
      finished_goods: '🎁 Pembelian Produk Jadi',
      office_supplies: '📝 Perlengkapan Kantor',
      utilities: '💡 Utilitas',
      marketing: '📢 Marketing & Promosi',
      employee_expense: '👥 Biaya Karyawan',
      transportation: '🚗 Transportasi & Logistik',
      maintenance: '🔧 Maintenance & Perbaikan',
      other_operating: '📋 Operasional Lainnya',
      equipment: '🏭 Peralatan Produksi',
      technology: '💻 Teknologi & Software',
      property: '🏢 Properti & Bangunan',
      vehicle: '🚚 Kendaraan',
      other_investing: '💼 Investasi Lainnya',
      loan_payment: '🏦 Pembayaran Pinjaman',
      interest: '💰 Bunga Pinjaman',
      dividend: '📊 Dividen',
      other_financing: '💳 Pendanaan Lainnya',
      operational_expense: '📋 Operasional'
    }
    if (map[c]) return map[c]
    if (!c) return '-'
    return c.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
  }

  const normalizePaymentStatus = (raw: string): 'Lunas' | 'Tempo' | 'Sebagian' => {
    const v = (raw || '').toString().trim().toLowerCase()
    if (['paid', 'lunas', 'lunas ', 'lunas.', 'lunas!', 'settled'].includes(v)) return 'Lunas'
    if (v === 'lunas') return 'Lunas'
    if (v === 'paid') return 'Lunas'
    if (['partial', 'sebagian', 'dp', 'down_payment'].includes(v)) return 'Sebagian'
    // Everything else is treated as credit/tempo style
    return 'Tempo'
  }

  const parseEmbeddedMetaFromNotes = (notes: string) => {
    const text = (notes || '').toString()
    const getLineValue = (prefix: string) => {
      const re = new RegExp(`^\\s*${prefix}\\s*:\\s*(.+)\\s*$`, 'im')
      const m = text.match(re)
      return m?.[1]?.trim() || ''
    }

    const parseCurrencyLoose = (raw: string) => {
      const cleaned = (raw || '')
        .toString()
        .replace(/[^0-9.,-]/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
      const n = Number(cleaned)
      return Number.isFinite(n) ? n : 0
    }

    const dpRaw = getLineValue('DP') || getLineValue('Down Payment')
    const remainingRaw = getLineValue('Sisa Hutang') || getLineValue('Remaining')

    return {
      description: getLineValue('Deskripsi'),
      po_number: getLineValue('PO'),
      due_date: getLineValue('Jatuh Tempo'),
      down_payment: dpRaw ? parseCurrencyLoose(dpRaw) : 0,
      remaining_payment: remainingRaw ? parseCurrencyLoose(remainingRaw) : 0
    }
  }

  useEffect(() => {
    if (!isOpen) return

    const loadTransaction = async () => {
      setLoading(true)
      try {
        // Load business profile (for printing)
        try {
          const { data: auth } = await supabase.auth.getUser()
          const userId = auth?.user?.id
          if (userId) {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('business_name')
              .eq('id', userId)
              .maybeSingle()
            setBusinessName((profile?.business_name || '').toString())
          }
        } catch {
          // ignore profile load failures
        }

        const tableName = transactionType === 'income' ? 'transactions' : 'expenses'
        const itemsTableName = transactionType === 'income' ? 'transaction_items' : 'expense_items'
        const itemsFk = transactionType === 'income' ? 'transaction_id' : 'expense_id'

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
          const embedded = parseEmbeddedMetaFromNotes(mainData.notes || '')
          const paymentStatusRaw = mainData.payment_status || '-'

          // Counterparty name (schema drift safe)
          let counterpartyName =
            (transactionType === 'income'
              ? (mainData.customer_name || mainData.customer || mainData.customerName)
              : (mainData.supplier_name || mainData.supplier || mainData.vendor_name || mainData.vendor)) ||
            ''

          const counterpartyId =
            transactionType === 'income'
              ? (mainData.customer_id || mainData.customerId)
              : (mainData.supplier_id || mainData.supplierId)

          let counterpartyPhone =
            (transactionType === 'income'
              ? (mainData.customer_phone || mainData.customerPhone)
              : (mainData.supplier_phone || mainData.supplierPhone)) ||
            ''

          let counterpartyEmail =
            (transactionType === 'income'
              ? (mainData.customer_email || mainData.customerEmail)
              : (mainData.supplier_email || mainData.supplierEmail)) ||
            ''

          let counterpartyAddress =
            (transactionType === 'income'
              ? (mainData.customer_address || mainData.customerAddress)
              : (mainData.supplier_address || mainData.supplierAddress)) ||
            ''

          if ((!counterpartyName || !counterpartyPhone || !counterpartyEmail || !counterpartyAddress) && counterpartyId) {
            const table = transactionType === 'income' ? 'customers' : 'suppliers'
            const { data: party } = await supabase
              .from(table)
              .select('name, phone, email, address')
              .eq('id', counterpartyId)
              .maybeSingle()

            counterpartyName = counterpartyName || party?.name || ''
            counterpartyPhone = counterpartyPhone || party?.phone || ''
            counterpartyEmail = counterpartyEmail || party?.email || ''
            counterpartyAddress = counterpartyAddress || party?.address || ''
          }

          const dueDateRaw =
            mainData.due_date ||
            mainData.payment_due_date ||
            mainData.tempo_date ||
            mainData.dueDate ||
            embedded.due_date ||
            ''

          const paidAmount = Number(mainData.paid_amount ?? mainData.down_payment ?? 0) || embedded.down_payment || 0
          const remaining = Number(mainData.remaining_amount ?? mainData.remaining_payment ?? 0) || embedded.remaining_payment || 0
          const grandTotal = Number(mainData.total || mainData.grand_total || mainData.total_amount || 0) || 0
          const computedRemaining = remaining || (paidAmount > 0 ? Math.max(0, grandTotal - paidAmount) : 0)

          setTransaction({
            id: mainData.id,
            date:
              transactionType === 'income'
                ? (mainData.transaction_date || mainData.income_date || '')
                : (mainData.expense_date || ''),
            category:
              transactionType === 'income'
                ? (mainData.category || mainData.income_category || mainData.incomeCategory || '')
                : (mainData.expense_category || mainData.category || '-'),
            customer_or_supplier: counterpartyName || '-',
            customer_id: transactionType === 'income' ? (mainData.customer_id || mainData.customerId) : undefined,
            customer_phone: transactionType === 'income' ? (counterpartyPhone || '') : undefined,
            customer_email: transactionType === 'income' ? (counterpartyEmail || '') : undefined,
            customer_address: transactionType === 'income' ? (counterpartyAddress || '') : undefined,
            counterparty_phone: counterpartyPhone || '',
            counterparty_email: counterpartyEmail || '',
            counterparty_address: counterpartyAddress || '',
            receipt_url: mainData.receipt_url || mainData.receiptUrl || mainData.receipt || '',
            receipt_filename: mainData.receipt_filename || mainData.receiptFilename || mainData.receipt_name || '',
            amount: grandTotal,
            subtotal: mainData.subtotal || 0,
            discount_amount: mainData.discount_amount || 0,
            ppn_amount: mainData.ppn_amount || 0,
            pph_amount: mainData.pph_amount || 0,
            payment_method: mainData.payment_method || mainData.payment_type || '-',
            payment_status: paymentStatusRaw,
            payment_status_label: normalizePaymentStatus(paymentStatusRaw),
            due_date: dueDateRaw,
            po_number: mainData.po_number || embedded.po_number || '',
            description: mainData.description || embedded.description || '',
            down_payment: paidAmount,
            remaining_payment: computedRemaining,
            notes: mainData.notes || '-',
            items:
              itemsData?.map((it: any) => ({
                product_name: it.product_name,
                qty: it.qty,
                unit: it.unit || 'pcs',
                price_per_unit: it.price_per_unit ?? it.price,
                subtotal: it.subtotal
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

  const handlePrintClick = () => {
    if (transactionType === 'income') {
      setIsIncomePrintOpen(true)
      return
    }

    if (transactionType === 'expense') {
      openExpensePrint()
      return
    }

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
    const raw = (dateString || '').toString().trim()
    if (!raw) return '-'
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return raw
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; emoji: string }> = {
      'Lunas': { bg: 'bg-green-100', text: 'text-green-700', emoji: '✅' },
      'paid': { bg: 'bg-green-100', text: 'text-green-700', emoji: '✅' },
      'Tempo': { bg: 'bg-yellow-100', text: 'text-yellow-700', emoji: '📅' },
      // raw variants
      'unpaid': { bg: 'bg-yellow-100', text: 'text-yellow-700', emoji: '📅' },
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-700', emoji: '📅' },
      'partial': { bg: 'bg-yellow-100', text: 'text-yellow-700', emoji: '📅' },
      'cicilan': { bg: 'bg-yellow-100', text: 'text-yellow-700', emoji: '📅' },
      'belum_lunas': { bg: 'bg-yellow-100', text: 'text-yellow-700', emoji: '📅' }
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

  const displayCategory = !transaction
    ? '-'
    : transactionType === 'expense'
      ? getExpenseCategoryLabel(transaction.category)
      : getIncomeCategoryLabel((transaction.category || '').toString())

  const tempoBadge =
    transaction?.payment_status_label === 'Tempo' ? (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
        ⏳ TEMPO
        {transaction.due_date ? (
          <span className="font-normal text-orange-800">Jatuh Tempo: {formatDate(transaction.due_date)}</span>
        ) : null}
      </span>
    ) : null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                Detail {transactionType === 'income' ? 'Pendapatan' : 'Pengeluaran'}
              </h2>
              <div className="mt-1 flex items-center gap-2 min-w-0">
                <span className="text-xs text-gray-500">ID</span>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-mono font-semibold text-gray-700 tabular-nums whitespace-nowrap">
                  {transactionId.substring(0, 8)}…
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={handlePrintClick}
                className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 transition-colors font-semibold inline-flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span className="sm:hidden">Cetak</span>
                <span className="hidden sm:inline">{transactionType === 'income' ? 'Cetak Dokumen' : 'Cetak'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center justify-center"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
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
              <div className="grid md:grid-cols-2 gap-6">
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
                      <p className="text-base font-semibold text-gray-900">{displayCategory}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 bg-green-100 rounded-lg">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">
                        {transactionType === 'income' ? 'Pelanggan' : 'Pemasok'}
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
                        {getPaymentMethodLabel(transaction.payment_method)}
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
                        {getStatusBadge(transaction.payment_status_label || transaction.payment_status)}
                      </div>
                      {transaction.payment_status_label === 'Tempo' && transaction.due_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          Jatuh tempo: <span className="font-medium text-gray-700">{formatDate(transaction.due_date)}</span>
                        </p>
                      )}
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

              {/* Tempo Tracking (Expense only) */}
              {transactionType === 'expense' && transaction.payment_status_label === 'Tempo' && (
                <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">Status Pembayaran & Tracking Hutang</h3>
                      <p className="text-xs text-gray-600 mt-1">Pantau DP dan sisa hutang ke pemasok.</p>
                    </div>
                    {tempoBadge}
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between bg-white rounded-lg border border-orange-100 px-3 py-2">
                      <span className="text-sm text-gray-700">Uang Muka (DP):</span>
                      <span className="text-sm font-semibold text-green-700">{formatCurrency(transaction.down_payment || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between bg-white rounded-lg border border-orange-100 px-3 py-2">
                      <span className="text-sm text-gray-700">Sisa Hutang ke Pemasok:</span>
                      <span className="text-sm font-semibold text-red-700">{formatCurrency(transaction.remaining_payment || 0)}</span>
                    </div>
                    <div className="text-xs text-orange-800 bg-orange-100 rounded-lg px-3 py-2">
                      💡 Pengingat: Pastikan pelunasan sebelum jatuh tempo untuk menjaga hubungan baik dengan pemasok.
                    </div>
                  </div>
                </div>
              )}

              {/* PO Preview + Download */}
              {transactionType === 'expense' && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Pesanan Pembelian (PO)</div>
                      <div className="text-xs text-white/80">Preview lembar PO & unduh PDF</div>
                    </div>
                  </div>

                  <div className="p-4 text-sm grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <div className="text-xs text-gray-500">Nomor PO</div>
                      <div className="font-semibold text-gray-900">{transaction.po_number || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Pemasok</div>
                      <div className="font-semibold text-gray-900">{transaction.customer_or_supplier || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Jatuh Tempo</div>
                      <div className="font-semibold text-gray-900">
                        {transaction.payment_status_label === 'Tempo' && transaction.due_date
                          ? formatDate(transaction.due_date)
                          : '-'}
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-3 border-t bg-white flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPoModalOpen(true)}
                      className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Lihat PO
                    </button>
                    <button
                      type="button"
                      onClick={() => openExpensePrint()}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Cetak Dokumen
                    </button>
                  </div>
                </div>
              )}

              {/* Financial Breakdown */}
              {((transaction.subtotal || 0) > 0 || (transaction.discount_amount || 0) > 0 || (transaction.ppn_amount || 0) > 0 || (transaction.pph_amount || 0) > 0) && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-2">
                  <h3 className="font-semibold text-gray-900 mb-3">Rincian Keuangan</h3>
                  
                  {(transaction.subtotal || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-900">{formatCurrency(transaction.subtotal || 0)}</span>
                    </div>
                  )}
                  
                  {(transaction.discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Diskon</span>
                      <span className="font-medium text-red-600">- {formatCurrency(transaction.discount_amount || 0)}</span>
                    </div>
                  )}
                  
                  {(transaction.ppn_amount || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">PPN (11%)</span>
                      <span className="font-medium text-gray-900">{formatCurrency(transaction.ppn_amount || 0)}</span>
                    </div>
                  )}
                  
                  {(transaction.pph_amount || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">PPh 23</span>
                      <span className="font-medium text-gray-900">{formatCurrency(transaction.pph_amount || 0)}</span>
                    </div>
                  )}
                  
                  <div className="pt-2 border-t border-gray-300 flex justify-between">
                    <span className="font-semibold text-gray-900">Grand Total</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(transaction.amount)}</span>
                  </div>
                </div>
              )}

              {/* Notes */}
              {(transaction.po_number || transaction.description) && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Informasi Transaksi</h3>
                  <div className="space-y-2 text-sm">
                    {transaction.po_number && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 w-24">No. PO</span>
                        <span className="font-mono font-semibold text-gray-900">{transaction.po_number}</span>
                      </div>
                    )}
                    {transaction.description && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 w-24">Deskripsi</span>
                        <span className="text-gray-700 whitespace-pre-wrap">{transaction.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {transaction.notes && transaction.notes !== '-' && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Catatan</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{transaction.notes}</p>
                </div>
              )}

              {transactionType === 'expense' && transaction.receipt_url && transaction.receipt_url !== '-' && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Bukti</h3>
                  <a
                    href={transaction.receipt_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {transaction.receipt_filename ? `Lihat: ${transaction.receipt_filename}` : 'Lihat Bukti (Receipt)'}
                  </a>
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
                  type="button"
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

      {/* PO Preview Modal (Expense only) */}
      {isPoModalOpen && transactionType === 'expense' && transaction ? (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">Pesanan Pembelian (PO)</div>
                <div className="text-lg font-bold text-gray-900">
                  PO {transaction.po_number || transaction.id.substring(0, 8)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openExpensePrint({ closePoPreview: true })}
                  className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Cetak
                </button>
                <button
                  type="button"
                  onClick={() => setIsPoModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                  aria-label="Tutup Preview PO"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5" ref={poPrintRef}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-gray-500">Tanggal</div>
                  <div className="font-semibold text-gray-900">{formatDate(transaction.date)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Status</div>
                  <div className="mt-1">
                    {getStatusBadge(transaction.payment_status_label || transaction.payment_status)}
                  </div>
                  {transaction.payment_status_label === 'Tempo' && transaction.due_date ? (
                    <div className="text-xs text-gray-600 mt-1">
                      Jatuh Tempo: <span className="font-semibold text-gray-900">{formatDate(transaction.due_date)}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border rounded-lg p-4">
                <div>
                  <div className="text-xs text-gray-500">Pemasok</div>
                  <div className="font-semibold text-gray-900">{transaction.customer_or_supplier || '-'}</div>
                </div>
                <div className="sm:text-right">
                  <div className="text-xs text-gray-500">Kategori</div>
                  <div className="font-semibold text-gray-900">{displayCategory}</div>
                </div>
              </div>

              <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Daftar Item</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Harga</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(transaction.items || []).length ? (
                        (transaction.items || []).map((it, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{it.product_name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 text-right">{it.qty} {it.unit}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatCurrency(it.price_per_unit)}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(it.subtotal)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-4 py-4 text-sm text-gray-500" colSpan={4}>Tidak ada item</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">{formatCurrency(transaction.subtotal || transaction.amount)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-bold mt-2">
                  <span className="text-gray-900">TOTAL</span>
                  <span className="text-red-600">{formatCurrency(transaction.amount)}</span>
                </div>
              </div>

              {transaction.payment_status_label === 'Tempo' ? (
                <div className="mt-4 border border-orange-200 bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-gray-900">Tracking Hutang</div>
                      <div className="text-xs text-gray-600 mt-1">DP dan sisa hutang ke pemasok.</div>
                    </div>
                    {tempoBadge}
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between bg-white rounded-lg border border-orange-100 px-3 py-2">
                      <span className="text-gray-700">Down Payment (DP):</span>
                      <span className="font-semibold text-green-700">{formatCurrency(transaction.down_payment || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between bg-white rounded-lg border border-orange-100 px-3 py-2">
                      <span className="text-gray-700">Sisa Hutang:</span>
                      <span className="font-semibold text-red-700">{formatCurrency(transaction.remaining_payment || 0)}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Income Print Modal (Struk / Invoice) */}
      {transactionType === 'income' && transaction ? (
        <IncomePrintModal
          isOpen={isIncomePrintOpen}
          onClose={() => setIsIncomePrintOpen(false)}
          businessName={businessName || 'Bisnis Saya'}
          incomeData={{
            id: transaction.id,
            income_date: transaction.date,
            amount: transaction.amount,
            subtotal: transaction.subtotal || 0,
            discount: transaction.discount_amount || 0,
            tax_ppn: transaction.ppn_amount || 0,
            tax_pph: transaction.pph_amount || 0,
            payment_method: transaction.payment_method,
            payment_status: transaction.payment_status_label || transaction.payment_status,
            due_date: transaction.due_date,
            payment_type: transaction.payment_status_label === 'Tempo' ? 'tempo' : 'cash',
            customer_id: transaction.customer_id || 'anonymous',
            customer_name: transaction.customer_or_supplier,
            customer_phone: transaction.customer_phone,
            customer_email: transaction.customer_email,
            customer_address: transaction.customer_address,
            description: transaction.description,
            line_items:
              transaction.items?.map((it) => ({
                product_name: it.product_name,
                quantity: it.qty,
                unit: it.unit,
                price_per_unit: it.price_per_unit,
                subtotal: it.subtotal
              })) || []
          }}
        />
      ) : null}

      {/* Expense Print Modal (PO / Ringkasan) */}
      {transactionType === 'expense' && transaction ? (
        <ExpensePrintModal
          isOpen={isExpensePrintOpen}
          onClose={() => setIsExpensePrintOpen(false)}
          businessName={businessName || 'Bisnis Saya'}
          expenseData={{
            id: transaction.id,
            expense_date: transaction.date,
            amount: transaction.amount,
            subtotal: transaction.subtotal || 0,
            discount_amount: transaction.discount_amount || 0,
            ppn_amount: transaction.ppn_amount || 0,
            pph_amount: transaction.pph_amount || 0,
            payment_method: transaction.payment_method,
            payment_status: transaction.payment_status_label || transaction.payment_status,
            due_date: transaction.due_date,
            payment_type: transaction.payment_status_label === 'Tempo' ? 'tempo' : 'cash',
            supplier_name: transaction.customer_or_supplier,
            supplier_phone: transaction.counterparty_phone,
            supplier_email: transaction.counterparty_email,
            supplier_address: transaction.counterparty_address,
            expense_category: transaction.category,
            description: transaction.description,
            notes: transaction.notes,
            po_number: transaction.po_number,
            down_payment: transaction.down_payment,
            remaining_payment: transaction.remaining_payment,
            receipt_url: transaction.receipt_url,
            receipt_filename: transaction.receipt_filename,
            items:
              transaction.items?.map((it) => ({
                product_name: it.product_name,
                qty: it.qty,
                unit: it.unit,
                price_per_unit: it.price_per_unit,
                subtotal: it.subtotal
              })) || []
          }}
        />
      ) : null}
    </div>
  )
}
