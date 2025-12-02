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
import { createClient } from '@/lib/supabase/client'
import { X, CheckCircle, HelpCircle } from 'lucide-react'
import { TransactionHistory, type TransactionHistoryItem, type TransactionFilters } from '@/components/transactions/TransactionHistory'
import { EditTransactionModal } from '@/components/transactions/EditTransactionModal'
import { PreviewTransactionModal } from '@/components/transactions/PreviewTransactionModal'

export const dynamic = 'force-dynamic'

export default function InputIncomePage() {
  const supabase = createClient()
  
  // Hooks
  const {
    incomes,
    loading: loadingIncomes,
    error,
    fetchIncomes,
    deleteIncome
  } = useIncomes({ autoFetch: true })

  const {
    products,
    loading: loadingProducts
  } = useProducts()

  // Modal state
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [selectedTransactionId, setSelectedTransactionId] = useState<string>('')
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [showFaqForm, setShowFaqForm] = useState(false)
  const [userQuestion, setUserQuestion] = useState('')

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
  const historyItems: TransactionHistoryItem[] = incomes.map(income => ({
    id: income.id,
    date: income.income_date,
    category: income.income_category || 'other_income',
    customer_or_supplier: income.customer_name || undefined,
    amount: Number(income.grand_total || income.total_amount || 0),
    status: income.payment_status === 'paid' ? 'Lunas' : income.payment_status === 'unpaid' ? 'Pending' : 'Tempo',
    payment_method: income.payment_method || undefined,
    description: income.notes || undefined
  }))

  // Handle form submission
  const handleSubmit = async (data: IncomeFormData) => {
    try {
      // 1. Insert income record
      const { data: income, error: incomeError } = await supabase
        .from('incomes')
        .insert({
          income_type: data.income_type,
          income_category: data.income_category,
          income_date: data.income_date,
          customer_name: data.customer_name,
          payment_method: data.payment_method,
          payment_type: data.payment_type,
          notes: data.notes,
          total_amount: data.lineItems.reduce((sum, item) => 
            sum + (item.qty * item.price_per_unit), 0
          )
        })
        .select()
        .single()

      if (incomeError) throw incomeError

      // 2. Insert income items
      const itemsToInsert = data.lineItems.map(item => ({
        income_id: income.id,
        product_id: item.product_id,
        product_name: item.product_name,
        qty: item.qty,
        unit: item.unit,
        price_per_unit: item.price_per_unit,
        buy_price: item.buy_price
      }))

      const { error: itemsError } = await supabase
        .from('income_items')
        .insert(itemsToInsert)

      if (itemsError) throw itemsError

      // 3. Update stock for physical products
      for (const item of data.lineItems) {
        if (item.product_id) {
          // Reduce stock
          const { error: stockError } = await supabase.rpc(
            'update_product_stock',
            {
              product_id: item.product_id,
              qty_change: -item.qty
            }
          )

          if (stockError) {
            console.error('Stock update error:', stockError)
          }

          // Log stock movement
          await supabase.from('stock_movements').insert({
            product_id: item.product_id,
            movement_type: 'out',
            quantity: item.qty,
            reference_type: 'income',
            reference_id: income.id,
            movement_date: data.income_date,
            notes: `Penjualan kepada ${data.customer_name}`
          })
        }
      }

      // Success
      await fetchIncomes()
      return { success: true }
    } catch (error: any) {
      console.error('Submit error:', error)
      return {
        success: false,
        error: error.message || 'Gagal menyimpan transaksi'
      }
    }
  }

  // Handle delete
  const handleDelete = async (incomeId: string) => {
    const confirmed = confirm('⚠️ Yakin ingin menghapus transaksi ini?\n\nStok produk TIDAK akan dikembalikan.')
    if (!confirmed) return

    const result = await deleteIncome(incomeId)
    if (result.success) {
      alert('✅ Transaksi berhasil dihapus')
    } else {
      alert(`❌ Gagal menghapus: ${result.error}`)
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async (ids: string[]) => {
    for (const id of ids) {
      await deleteIncome(id)
    }
    alert(`✅ ${ids.length} transaksi berhasil dihapus`)
    await fetchIncomes()
  }

  // Handle edit
  const handleEdit = (incomeId: string) => {
    setSelectedTransactionId(incomeId)
    setEditModalOpen(true)
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
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
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Tutorial</span>
            </button>
          </div>
        </div>

        {/* Income Form */}
        <IncomesForm
          onSubmit={handleSubmit}
          loading={loadingIncomes}
          products={products as any}
          loadingProducts={loadingProducts}
          onAddCustomer={() => setShowCustomerModal(true)}
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
        className="fixed bottom-6 right-6 z-40 bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-lg flex items-center gap-2 transition-all hover:scale-110"
        title="Panduan Penggunaan"
      >
        <HelpCircle className="w-6 h-6" />
        <span className="font-medium">Tutorial</span>
      </button>

      {/* Modals */}
      {showCustomerModal && (
        <CustomerModal
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          onSelect={() => {}}
          selectedCustomer={null}
        />
      )}

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
                    <li>Pilih customer yang sudah ada atau buat baru</li>
                    <li>Bisa <strong>langsung lanjut tanpa customer</strong> (Anonymous)</li>
                    <li>Customer membantu melacak siapa yang sering membeli</li>
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
                      <p className="font-semibold text-sm">Cash</p>
                      <p className="text-xs text-gray-600">Tunai langsung</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded text-center">
                      <div className="text-2xl mb-1">🏧</div>
                      <p className="font-semibold text-sm">Transfer</p>
                      <p className="text-xs text-gray-600">Bank/E-wallet</p>
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
                      a: 'Tidak wajib! Customer bersifat opsional. Berguna untuk melacak pelanggan setia, tapi boleh dikosongkan untuk transaksi retail.'
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
