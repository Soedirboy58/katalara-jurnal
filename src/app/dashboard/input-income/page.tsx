/**
 * INPUT INCOME PAGE (REFACTORED)
 * Finance Module - Incomes
 * 
 * Thin wrapper page using modular components
 * Original: 3140 lines → Refactored: < 200 lines
 */

'use client'

import { useState, useEffect } from 'react'
import { useIncomes } from '@/modules/finance/hooks/useIncomes'
import { IncomesForm } from '@/modules/finance/components/incomes/IncomesForm'
import { useProducts } from '@/hooks/useProducts'
import CustomerModal from '@/components/modals/CustomerModal'
import type { IncomeFormData } from '@/modules/finance/types/financeTypes'
import { X, CheckCircle, HelpCircle } from 'lucide-react'
import { TransactionHistory, type TransactionHistoryItem, type TransactionFilters } from '@/components/transactions/TransactionHistory'
import { getIncomeCategoryLabel } from '@/modules/finance/types/financeTypes'
import { EditTransactionModal } from '@/components/transactions/EditTransactionModal'
import { PreviewTransactionModal } from '@/components/transactions/PreviewTransactionModal'
import { ProductModal } from '@/components/products/ProductModal'

export const dynamic = 'force-dynamic'

export default function InputIncomePage() {
  // Hooks
  const {
    incomes,
    loading: loadingIncomes,
    error,
    fetchIncomes,
    createIncome,
    deleteIncome
  } = useIncomes({ autoFetch: true })

  const {
    products,
    loading: loadingProducts,
    refresh: refreshProducts
  } = useProducts()

  // Modal state
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [selectedTransactionId, setSelectedTransactionId] = useState<string>('')
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [showFaqForm, setShowFaqForm] = useState(false)
  const [userQuestion, setUserQuestion] = useState('')

  // Save UX state
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{
    show: boolean
    type: 'success' | 'error' | 'warning'
    message: string
  }>({
    show: false,
    type: 'success',
    message: ''
  })

  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    setToast({ show: true, type, message })
    setTimeout(() => setToast({ show: false, type, message: '' }), 4000)
  }

  // Transaction history state
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<TransactionFilters>({
    searchQuery: '',
    dateRange: {
      start: '',
      end: ''
    },
    category: '',
    status: ''
  })

  // Show tutorial on first visit
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('katalara_income_tutorial_seen_v2')
    if (!hasSeenTutorial) {
      setShowTutorial(true)
    }
  }, [])

  // Convert incomes to TransactionHistoryItem format
  const historyItems: TransactionHistoryItem[] = incomes.map((t: any) => {
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

  // Handle form submission
  const handleSubmit = async (data: IncomeFormData) => {
    try {
      setSaving(true)
      const result = await createIncome(data)

      if (!result.success) {
        showToast('error', result.error || '❌ Gagal menyimpan transaksi')
        return {
          success: false,
          error: result.error || 'Gagal menyimpan transaksi'
        }
      }

      await refreshProducts()
      setSelectedCustomer(null)
      if (result.warning) showToast('warning', result.warning)
      else showToast('success', '✅ Transaksi berhasil disimpan')
      return { success: true }
    } catch (error: any) {
      console.error('Submit error:', error)
      showToast('error', `❌ Gagal menyimpan: ${error.message || 'Terjadi kesalahan'}`)
      return {
        success: false,
        error: error.message || 'Gagal menyimpan transaksi'
      }
    } finally {
      setSaving(false)
    }
  }

  // Handle delete
  const handleDelete = async (incomeId: string) => {
    const confirmed = confirm('⚠️ Yakin ingin menghapus transaksi ini?\n\nStok produk akan dikembalikan (rollback).')
    if (!confirmed) return

    const result = await deleteIncome(incomeId)
    if (result.success) {
      alert('✅ Transaksi berhasil dihapus')
      await refreshProducts()
    } else {
      alert(`❌ Gagal menghapus: ${result.error}`)
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async (ids: string[]) => {
    const confirmed = confirm(`Hapus ${ids.length} transaksi yang dipilih?\n\nStok produk akan dikembalikan (rollback).`)
    if (!confirmed) return

    // Prefer bulk delete on transactions endpoint; fall back to per-item delete (supports legacy incomes)
    const res = await fetch('/api/transactions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    }).catch(() => null as any)

    const json = res ? await res.json().catch(() => null) : null
    if (res?.ok && json?.success) {
      alert(`✅ ${ids.length} transaksi berhasil dihapus`)
      await fetchIncomes()
      await refreshProducts()
      return
    }

    // Fallback: delete one-by-one via hook
    const results = await Promise.all(ids.map((id) => deleteIncome(id)))
    const failed = results.filter((r) => !r.success)
    if (failed.length) {
      alert(`❌ Gagal menghapus ${failed.length} transaksi. Cek satu per satu.`)
    } else {
      alert(`✅ ${ids.length} transaksi berhasil dihapus`)
    }
    await fetchIncomes()
    await refreshProducts()
  }

  // Handle edit
  const handleEdit = (incomeId: string) => {
    alert('⚠️ Edit transaksi pendapatan belum tersedia (sementara).')
  }

  // Handle preview
  const handlePreview = (incomeId: string) => {
    setSelectedTransactionId(incomeId)
    setPreviewModalOpen(true)
  }

  // Handle refresh
  const handleRefresh = async () => {
    await fetchIncomes()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6 pb-24">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                💰 Input Pendapatan
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Catat transaksi pendapatan dari penjualan produk, jasa, atau sumber lainnya
              </p>
            </div>
            <button
              onClick={() => setShowTutorial(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Tutorial</span>
            </button>
          </div>
        </div>

        {/* Income Form */}
        <IncomesForm
          onSubmit={handleSubmit}
          loading={saving}
          products={products as any}
          loadingProducts={loadingProducts}
          onAddProduct={() => setShowProductModal(true)}
          onAddCustomer={() => setShowCustomerModal(true)}
          selectedCustomer={selectedCustomer}
        />

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                📊 Riwayat Transaksi
              </h2>
              <button
                onClick={handleRefresh}
                disabled={loadingIncomes}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          <TransactionHistory
            title="Riwayat Transaksi Pendapatan"
            type="income"
            transactions={historyItems}
            loading={loadingIncomes}
            currentPage={currentPage}
            totalPages={Math.ceil(historyItems.length / 10)}
            filters={filters}
            onFilterChange={setFilters}
            onPageChange={setCurrentPage}
            onEdit={handleEdit}
            onPreview={handlePreview}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              ⚠️ Error: {error}
            </p>
          </div>
        )}
      </div>

      {/* Floating Tutorial Button */}
      <button
        type="button"
        onClick={() => setShowTutorial(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 bg-green-600 hover:bg-green-700 text-white rounded-full p-3 sm:p-4 shadow-lg flex items-center gap-2 transition-all hover:scale-110"
        title="Panduan Penggunaan"
      >
        <HelpCircle className="w-6 h-6" />
        <span className="font-medium hidden sm:inline">Tutorial</span>
      </button>

      {/* Modals */}
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

      {/* Saving Overlay */}
      {saving && (
        <div className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 w-full max-w-sm">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Menyimpan transaksi...</p>
                <p className="text-xs text-gray-600">Mohon tunggu sebentar</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification (Centered) */}
      {toast.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-slide-in">
          <div
            className={`
              rounded-lg shadow-2xl p-4 min-w-[300px] max-w-md
              flex items-start gap-3 border-l-4
              ${
                toast.type === 'success'
                  ? 'bg-green-50 border-green-500'
                  : toast.type === 'error'
                    ? 'bg-red-50 border-red-500'
                    : 'bg-amber-50 border-amber-500'
              }
            `}
          >
            <span className="text-2xl flex-shrink-0">
              {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : '⚠️'}
            </span>
            <div className="flex-1">
              <p
                className={`
                  text-sm font-medium
                  ${
                    toast.type === 'success'
                      ? 'text-green-900'
                      : toast.type === 'error'
                        ? 'text-red-900'
                        : 'text-amber-900'
                  }
                `}
              >
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast({ ...toast, show: false })}
              className={`
                flex-shrink-0 rounded-full p-1 transition-colors
                ${
                  toast.type === 'success'
                    ? 'hover:bg-green-200'
                    : toast.type === 'error'
                      ? 'hover:bg-red-200'
                      : 'hover:bg-amber-200'
                }
              `}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <ProductModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        product={null}
        onSuccess={async () => {
          await refreshProducts()
          setShowProductModal(false)
        }}
      />

      {/* Tutorial Modal - Enhanced Educational Version */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">📚 Panduan Input Pendapatan</h2>
                  <p className="text-sm text-gray-500 mt-1">Belajar sambil mencatat keuangan bisnis Anda</p>
                </div>
                <button
                  onClick={() => setShowTutorial(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Educational Section: Understanding Finance Categories */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-lg mb-6 border border-green-200">
                <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
                  <span className="text-2xl">🎓</span> Memahami Jenis Pendapatan
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                  Platform Katalara menggunakan sistem pencatatan berdasarkan <strong>3 aktivitas keuangan</strong>.
                  Yuk pelajari bersama agar Anda bisa membedakan jenis pendapatan bisnis!
                </p>
                
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
                    <h4 className="font-bold text-green-700 mb-2">💰 Aktivitas Operasional</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Pendapatan dari <strong>kegiatan utama bisnis</strong> Anda sehari-hari.
                    </p>
                    <div className="bg-green-50 p-3 rounded text-sm">
                      <p className="font-semibold text-green-800 mb-1">Contoh:</p>
                      <ul className="list-disc list-inside text-gray-700 space-y-1">
                        <li>Penjualan produk ke pelanggan</li>
                        <li>Pendapatan jasa yang Anda tawarkan</li>
                        <li>Komisi dari hasil penjualan</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                    <h4 className="font-bold text-blue-700 mb-2">📈 Aktivitas Investasi</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Pendapatan dari <strong>penjualan aset jangka panjang</strong> atau investasi bisnis.
                    </p>
                    <div className="bg-blue-50 p-3 rounded text-sm">
                      <p className="font-semibold text-blue-800 mb-1">Contoh:</p>
                      <ul className="list-disc list-inside text-gray-700 space-y-1">
                        <li>Jual peralatan/mesin bekas</li>
                        <li>Dividen dari investasi saham</li>
                        <li>Hasil sewa properti bisnis</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                    <h4 className="font-bold text-purple-700 mb-2">🏦 Aktivitas Pendanaan</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Pendapatan dari <strong>penambahan modal</strong> bisnis Anda.
                    </p>
                    <div className="bg-purple-50 p-3 rounded text-sm">
                      <p className="font-semibold text-purple-800 mb-1">Contoh:</p>
                      <ul className="list-disc list-inside text-gray-700 space-y-1">
                        <li>Pinjaman dari bank/lembaga keuangan</li>
                        <li>Tambahan modal dari investor</li>
                        <li>Penambahan modal pribadi</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step-by-step Guide */}
              <div className="space-y-5">
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">1️⃣ Informasi Dasar</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                    <li>Tanggal transaksi otomatis terisi hari ini (bisa diubah)</li>
                    <li>Pilih <strong>jenis pendapatan</strong> sesuai kategori di atas</li>
                    <li>Pilih <strong>kategori spesifik</strong> untuk detail lebih lanjut</li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">2️⃣ Customer (Opsional)</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                    <li>Pilih pelanggan yang sudah ada atau buat baru</li>
                    <li>Bisa <strong>langsung lanjut tanpa pelanggan</strong> (Anonymous)</li>
                    <li>Pelanggan membantu melacak siapa yang sering membeli</li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">3️⃣ Tambah Item Produk/Jasa</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                    <li>Pilih produk dari daftar atau <strong>buat produk baru</strong></li>
                    <li>Masukkan jumlah, satuan, dan harga jual</li>
                    <li>Klik "Tambah" untuk memasukkan ke daftar</li>
                    <li><strong>Stok otomatis berkurang</strong> saat transaksi disimpan</li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">4️⃣ Metode Pembayaran</h3>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    <div className="bg-gray-50 p-3 rounded text-center">
                      <div className="text-2xl mb-1">💵</div>
                      <p className="font-semibold text-sm">Tunai</p>
                      <p className="text-xs text-gray-600">Tunai langsung</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded text-center">
                      <div className="text-2xl mb-1">🏧</div>
                      <p className="font-semibold text-sm">Transfer</p>
                      <p className="text-xs text-gray-600">Bank/Dompet Digital</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded text-center">
                      <div className="text-2xl mb-1">📅</div>
                      <p className="font-semibold text-sm">Tempo</p>
                      <p className="text-xs text-gray-600">Bayar nanti (piutang)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-green-600" />
                  Pertanyaan yang Sering Ditanyakan (FAQ)
                </h3>
                <div className="space-y-2">
                  {[
                    {
                      q: 'Apa bedanya penjualan produk dengan pendapatan jasa?',
                      a: 'Penjualan produk = menjual barang fisik (stok berkurang). Pendapatan jasa = menjual layanan/keahlian (tidak ada stok).'
                    },
                    {
                      q: 'Bagaimana jika customer belum bayar (tempo)?',
                      a: 'Pilih metode "Tempo" dan atur tanggal jatuh tempo. Sistem akan mencatat sebagai piutang dan mengingatkan Anda saat jatuh tempo.'
                    },
                    {
                      q: 'Apakah harus input customer setiap transaksi?',
                      a: 'Tidak wajib! Pelanggan bersifat opsional. Berguna untuk melacak pelanggan setia, tapi boleh dikosongkan untuk transaksi retail.'
                    },
                    {
                      q: 'Kenapa stok produk berkurang otomatis?',
                      a: 'Katalara otomatis mengurangi stok saat ada penjualan. Ini membantu Anda tahu kapan harus re-stock tanpa hitung manual.'
                    }
                  ].map((faq, idx) => (
                    <div key={idx} className="border rounded-lg">
                      <button
                        onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                        className="w-full text-left p-3 hover:bg-gray-50 flex justify-between items-center"
                      >
                        <span className="font-medium text-sm text-gray-800">{faq.q}</span>
                        <span className="text-gray-400">{activeFaq === idx ? '−' : '+'}</span>
                      </button>
                      {activeFaq === idx && (
                        <div className="px-3 pb-3 text-sm text-gray-600 bg-gray-50">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Ask Admin */}
                <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                  {!showFaqForm ? (
                    <div className="text-center">
                      <p className="text-sm text-gray-700 mb-3">
                        Masih ada yang membingungkan? Tanya langsung ke admin!
                      </p>
                      <button
                        onClick={() => setShowFaqForm(true)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium inline-flex items-center gap-2"
                      >
                        <HelpCircle className="w-4 h-4" />
                        Ajukan Pertanyaan
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tulis pertanyaan Anda:
                      </label>
                      <textarea
                        value={userQuestion}
                        onChange={(e) => setUserQuestion(e.target.value)}
                        placeholder="Contoh: Bagaimana cara input penjualan konsinyasi?"
                        className="w-full px-3 py-2 border rounded-lg text-sm mb-3"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const waMessage = encodeURIComponent(
                              `Halo Admin Katalara! Saya punya pertanyaan tentang Input Pendapatan:\n\n${userQuestion}\n\nMohon bantuannya ya 🙏`
                            )
                            window.open(`https://wa.me/6281234567890?text=${waMessage}`, '_blank')
                            setUserQuestion('')
                            setShowFaqForm(false)
                          }}
                          disabled={!userQuestion.trim()}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium"
                        >
                          📱 Kirim ke WhatsApp Admin
                        </button>
                        <button
                          onClick={() => {
                            setShowFaqForm(false)
                            setUserQuestion('')
                          }}
                          className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Footer Actions */}
              <div className="mt-6 border-t pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="dontShowAgainIncome"
                    onChange={(e) => {
                      if (e.target.checked) {
                        localStorage.setItem('katalara_income_tutorial_seen_v2', 'true')
                      } else {
                        localStorage.removeItem('katalara_income_tutorial_seen_v2')
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="dontShowAgainIncome" className="text-sm text-gray-600 cursor-pointer">
                    Jangan tampilkan panduan ini lagi
                  </label>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowTutorial(false)}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Siap Mulai Input Pendapatan!
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <EditTransactionModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        transactionId={selectedTransactionId}
        transactionType="income"
        onSuccess={fetchIncomes}
      />

      {/* Preview Modal */}
      <PreviewTransactionModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        transactionId={selectedTransactionId}
        transactionType="income"
      />
    </div>
  )
}
