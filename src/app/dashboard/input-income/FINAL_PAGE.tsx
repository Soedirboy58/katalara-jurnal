'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useProducts } from '@/hooks/useProducts'

export const dynamic = 'force-dynamic'

export default function InputIncomePage() {
  const supabase = createClient()
  const { products, loading: loadingProducts } = useProducts()
  
  // Form states
  const [incomeType, setIncomeType] = useState<'operating' | 'investing' | 'financing'>('operating')
  const [category, setCategory] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Tunai')
  
  // Product sales specific
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [pricePerUnit, setPricePerUnit] = useState('')
  const [customerName, setCustomerName] = useState('')
  
  // UI states
  const [submitting, setSubmitting] = useState(false)
  const [showEducationalModal, setShowEducationalModal] = useState(false)
  const [toast, setToast] = useState<{show: boolean, type: 'success' | 'error' | 'warning', message: string}>({
    show: false,
    type: 'success',
    message: ''
  })
  
  // KPI stats
  const [kpiStats, setKpiStats] = useState({
    today: { amount: 0, count: 0 },
    week: { amount: 0, count: 0 },
    month: { amount: 0, count: 0 }
  })
  const [loadingKpi, setLoadingKpi] = useState(true)

  // Check if user has seen educational modal
  useEffect(() => {
    const hasSeenModal = localStorage.getItem('katalara_income_education_seen')
    if (!hasSeenModal) {
      setShowEducationalModal(true)
    }
    fetchKpiStats()
  }, [])

  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    setToast({ show: true, type, message })
    setTimeout(() => setToast({ show: false, type, message: '' }), 4000)
  }

  const closeEducationalModal = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      localStorage.setItem('katalara_income_education_seen', 'true')
    }
    setShowEducationalModal(false)
  }

  const fetchKpiStats = async () => {
    try {
      setLoadingKpi(true)
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
      
      // TODO: Fetch from API when ready
      setKpiStats({
        today: { amount: 0, count: 0 },
        week: { amount: 0, count: 0 },
        month: { amount: 0, count: 0 }
      })
    } catch (error) {
      console.error('Failed to fetch KPI:', error)
    } finally {
      setLoadingKpi(false)
    }
  }

  // Format number with thousand separator
  const formatNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, '')
    if (!numbers) return ''
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  // Handle number input
  const handleNumberInput = (value: string, setter: (val: string) => void) => {
    setter(formatNumber(value))
  }

  // Reset category when income type changes
  const handleIncomeTypeChange = (type: 'operating' | 'investing' | 'financing') => {
    setIncomeType(type)
    setCategory('')
    // Reset product sales fields
    setSelectedProductId('')
    setQuantity('')
    setPricePerUnit('')
    setCustomerName('')
  }

  // Handle category change
  const handleCategoryChange = (cat: string) => {
    setCategory(cat)
    
    // If not product_sales, clear product-specific fields
    if (cat !== 'product_sales') {
      setSelectedProductId('')
      setQuantity('')
      setPricePerUnit('')
      setCustomerName('')
    } else {
      // Clear simple amount for product sales
      setAmount('')
    }
  }

  // Calculate total for product sales
  const calculateTotal = () => {
    if (!quantity || !pricePerUnit) return 0
    const qtyNum = parseInt(quantity.replace(/\./g, ''))
    const priceNum = parseInt(pricePerUnit.replace(/\./g, ''))
    return qtyNum * priceNum
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (category === 'product_sales') {
      if (!selectedProductId || !quantity || !pricePerUnit) {
        showToast('warning', '⚠️ Mohon lengkapi produk, jumlah, dan harga')
        return
      }
    } else {
      if (!amount) {
        showToast('warning', '⚠️ Mohon masukkan jumlah pendapatan')
        return
      }
    }

    setSubmitting(true)

    try {
      const finalAmount = category === 'product_sales' 
        ? calculateTotal()
        : parseFloat(amount.replace(/\./g, ''))

      const payload = {
        income_date: transactionDate,
        income_type: incomeType,
        category,
        amount: finalAmount,
        description: description || null,
        notes: notes || null,
        payment_method: paymentMethod,
        // Product sales specific
        product_id: category === 'product_sales' ? selectedProductId : null,
        quantity: category === 'product_sales' ? parseInt(quantity.replace(/\./g, '')) : null,
        price_per_unit: category === 'product_sales' ? parseInt(pricePerUnit.replace(/\./g, '')) : null,
        customer_name: category === 'product_sales' ? (customerName || null) : null
      }

      // TODO: Send to API
      console.log('Income payload:', payload)
      
      showToast('success', '✅ Pendapatan berhasil disimpan!')
      
      // Reset form
      resetForm()
      fetchKpiStats()
      
    } catch (error: any) {
      console.error('Submit error:', error)
      showToast('error', '❌ Gagal menyimpan: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setCategory('')
    setAmount('')
    setDescription('')
    setNotes('')
    setSelectedProductId('')
    setQuantity('')
    setPricePerUnit('')
    setCustomerName('')
    setPaymentMethod('Tunai')
    setTransactionDate(new Date().toISOString().split('T')[0])
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Input Pendapatan</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Catat semua pendapatan bisnis untuk tracking yang akurat
          </p>
        </div>
        <button
          onClick={() => setShowEducationalModal(true)}
          className="flex items-center gap-2 bg-[#1088ff] hover:bg-[#0d6ecc] text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg whitespace-nowrap"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="hidden sm:inline">Panduan Kategori</span>
          <span className="sm:hidden">📚</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Hari Ini</div>
          {loadingKpi ? (
            <div className="text-2xl font-bold text-gray-400 animate-pulse">Loading...</div>
          ) : (
            <div className="text-2xl font-bold text-green-600">
              Rp {kpiStats.today.amount.toLocaleString('id-ID')}
            </div>
          )}
          <div className="text-xs text-gray-500">{kpiStats.today.count} transaksi</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Minggu Ini</div>
          {loadingKpi ? (
            <div className="text-2xl font-bold text-gray-400 animate-pulse">Loading...</div>
          ) : (
            <div className="text-2xl font-bold text-blue-600">
              Rp {kpiStats.week.amount.toLocaleString('id-ID')}
            </div>
          )}
          <div className="text-xs text-gray-500">{kpiStats.week.count} transaksi</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Bulan Ini</div>
          {loadingKpi ? (
            <div className="text-2xl font-bold text-gray-400 animate-pulse">Loading...</div>
          ) : (
            <div className="text-2xl font-bold text-purple-600">
              Rp {kpiStats.month.amount.toLocaleString('id-ID')}
            </div>
          )}
          <div className="text-xs text-gray-500">{kpiStats.month.count} transaksi</div>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pendapatan Baru</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Pendapatan
            </label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe Transaksi
            </label>
            <select
              value={incomeType}
              onChange={(e) => handleIncomeTypeChange(e.target.value as 'operating' | 'investing' | 'financing')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
            >
              <option value="operating">Operasional</option>
              <option value="investing">Investasi</option>
              <option value="financing">Pendanaan</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {incomeType === 'operating' && 'Pendapatan dari aktivitas bisnis utama'}
              {incomeType === 'investing' && 'Pendapatan dari investasi aset atau instrumen keuangan'}
              {incomeType === 'financing' && 'Pendapatan dari modal atau pinjaman'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori Pendapatan
            </label>
            <select 
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
            >
              <option value="">Pilih kategori...</option>
              
              {incomeType === 'operating' && (
                <optgroup label="Pendapatan Operasional">
                  <option value="product_sales">🛒 Penjualan Produk</option>
                  <option value="service_income">💼 Pendapatan Jasa</option>
                  <option value="rental_income">🏢 Pendapatan Sewa</option>
                  <option value="commission">💸 Komisi & Bonus</option>
                  <option value="other_operating">📝 Lain-lain</option>
                </optgroup>
              )}
              
              {incomeType === 'investing' && (
                <optgroup label="Pendapatan Investasi">
                  <option value="interest_income">💹 Bunga Deposito/Tabungan</option>
                  <option value="dividend_income">📊 Dividen Saham</option>
                  <option value="capital_gain">📈 Capital Gain (Jual Aset)</option>
                  <option value="other_investing">💰 Lain-lain</option>
                </optgroup>
              )}
              
              {incomeType === 'financing' && (
                <optgroup label="Pendapatan Pendanaan">
                  <option value="capital_injection">💰 Modal Masuk (Setoran)</option>
                  <option value="loan_received">🏦 Pinjaman Diterima</option>
                  <option value="grant_received">🎁 Hibah/Grant</option>
                </optgroup>
              )}
            </select>
          </div>

          {/* Dynamic Info Box for Capital Injection */}
          {category === 'capital_injection' && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <h4 className="text-sm font-semibold text-green-900 mb-1">Apa itu Modal Masuk?</h4>
                  <p className="text-xs text-green-800 mb-2">
                    <strong>Modal Masuk</strong> adalah uang pribadi yang Anda masukkan ke bisnis untuk menambah kas atau modal usaha.
                  </p>
                  <p className="text-xs text-green-700">
                    ✅ <strong>Contoh:</strong> Setor Rp 10 juta dari tabungan pribadi ke kas bisnis untuk beli stok besar-besaran.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PRODUCT SALES - Detailed Form */}
          {category === 'product_sales' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-2xl">🛒</span>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Penjualan Produk</h3>
                  <p className="text-xs text-gray-600">
                    Pilih produk dari inventory dan sistem akan hitung total otomatis
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Produk / Item
                </label>
                <select 
                  value={selectedProductId}
                  onChange={(e) => {
                    const productId = e.target.value
                    setSelectedProductId(productId)
                    
                    // Auto-fill price when product is selected
                    if (productId) {
                      const product = products.find(p => p.id === productId)
                      if (product) {
                        setPricePerUnit(formatNumber(product.sell_price.toString()))
                      }
                    } else {
                      setPricePerUnit('')
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  disabled={loadingProducts}
                >
                  <option value="">
                    {loadingProducts ? 'Memuat produk...' : 'Pilih produk...'}
                  </option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - Rp {formatNumber(product.sell_price.toString())}
                      {product.track_inventory && ` (Stok: ${product.stock_quantity} ${product.stock_unit})`}
                    </option>
                  ))}
                </select>
                {selectedProductId && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Harga otomatis terisi dari database produk
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9.]*"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => handleNumberInput(e.target.value, setQuantity)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Harga Satuan
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9.]*"
                      placeholder="0"
                      value={pricePerUnit}
                      onChange={(e) => handleNumberInput(e.target.value, setPricePerUnit)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {quantity && pricePerUnit && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Total Penjualan:</span>
                    <span className="text-xl font-bold text-green-600">
                      Rp {calculateTotal().toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pelanggan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Nama pelanggan"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>
          )}

          {/* SIMPLE AMOUNT INPUT - For non-product categories */}
          {category && category !== 'product_sales' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah Pendapatan
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9.]*"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => handleNumberInput(e.target.value, setAmount)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                />
              </div>
              {amount && (
                <p className="text-xs text-gray-500 mt-1">Rp {amount}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metode Pembayaran
            </label>
            <select 
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
            >
              <option>Tunai</option>
              <option>Transfer Bank</option>
              <option>E-Wallet</option>
              <option>QRIS</option>
              <option>Kartu Kredit/Debit</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi
            </label>
            <textarea
              rows={3}
              placeholder="Detail pendapatan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catatan (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Catatan tambahan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 sm:flex-none px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Menyimpan...' : '💰 Simpan Pendapatan'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={submitting}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Educational Modal */}
      {showEducationalModal && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-[#1088ff] text-white p-6 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <span className="text-4xl">💰</span>
                <div>
                  <h2 className="text-2xl font-bold">Panduan Kategori Pendapatan</h2>
                  <p className="text-blue-100 text-sm">Pahami setiap kategori untuk pencatatan yang akurat</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* 3 TIPE TRANSAKSI */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-900 font-medium">
                  💵 Sistem menggunakan <strong>3 Tipe Transaksi Pendapatan</strong> sesuai standar Laporan Arus Kas
                </p>
              </div>

              {/* OPERASIONAL */}
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span>🛒</span> 1. OPERASIONAL
                </h3>
                <p className="text-sm text-gray-700 mb-2">
                  Pendapatan dari aktivitas bisnis utama sehari-hari.
                </p>
                
                <ul className="text-xs text-gray-600 space-y-1 ml-4">
                  <li>• <strong>Penjualan Produk:</strong> Jual nasi goreng, baju, aksesoris (paling sering!)</li>
                  <li>• <strong>Pendapatan Jasa:</strong> Ongkos jahit, service HP, konsultasi</li>
                  <li>• <strong>Pendapatan Sewa:</strong> Sewakan gedung/kendaraan ke orang lain</li>
                  <li>• <strong>Komisi & Bonus:</strong> Komisi dari supplier, cashback, referral</li>
                </ul>
              </div>

              {/* INVESTASI */}
              <div className="border-l-4 border-purple-500 pl-4 py-2">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span>📊</span> 2. INVESTASI
                </h3>
                <p className="text-sm text-gray-700 mb-2">
                  Pendapatan dari aset investasi atau instrumen keuangan.
                </p>
                <ul className="text-xs text-gray-600 space-y-1 ml-4">
                  <li>• <strong>Bunga Deposito:</strong> Bunga dari tabungan/deposito bank</li>
                  <li>• <strong>Dividen Saham:</strong> Bagi hasil dari kepemilikan saham</li>
                  <li>• <strong>Capital Gain:</strong> Untung jual aset (tanah, emas, saham)</li>
                </ul>
              </div>

              {/* PENDANAAN */}
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span>💰</span> 3. PENDANAAN
                </h3>
                <p className="text-sm text-gray-700 mb-2">
                  Transaksi terkait modal pemilik dan pinjaman.
                </p>
                <ul className="text-xs text-gray-600 space-y-1 ml-4">
                  <li>• <strong>Modal Masuk:</strong> Setor uang pribadi ke bisnis</li>
                  <li>• <strong>Pinjaman Diterima:</strong> KUR, P2P lending, pinjaman bank</li>
                  <li>• <strong>Hibah/Grant:</strong> Bantuan modal dari pemerintah/lembaga</li>
                </ul>
              </div>

              {/* Modal Masuk - SPECIAL HIGHLIGHT */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <span className="text-3xl">💡</span>
                  <div>
                    <h3 className="font-bold text-green-900 mb-2">Modal Masuk vs Penjualan</h3>
                    <div className="bg-white rounded-lg p-3 mb-2">
                      <p className="text-xs text-gray-800 font-semibold mb-1">Modal Masuk:</p>
                      <p className="text-xs text-gray-700">
                        Uang <strong>pribadi</strong> yang Anda setor ke bisnis. Bukan pendapatan usaha, tapi penambahan modal owner.
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-800 font-semibold mb-1">Penjualan Produk:</p>
                      <p className="text-xs text-gray-700">
                        Uang dari <strong>customer</strong> yang beli produk/jasa Anda. Ini pendapatan bisnis yang sebenarnya!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-4 rounded-b-2xl flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  id="dontShowAgainIncome"
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span>Jangan tampilkan lagi</span>
              </label>
              <button
                onClick={() => {
                  const checkbox = document.getElementById('dontShowAgainIncome') as HTMLInputElement
                  closeEducationalModal(checkbox?.checked || false)
                }}
                className="bg-[#1088ff] hover:bg-[#0d6ecc] text-white px-6 py-2 rounded-lg font-medium transition-all"
              >
                Mengerti, Mulai Input!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-slide-in">
          <div className={`
            rounded-lg shadow-2xl p-4 min-w-[300px] max-w-md
            flex items-start gap-3 border-l-4
            ${
              toast.type === 'success' ? 'bg-green-50 border-green-500' :
              toast.type === 'error' ? 'bg-red-50 border-red-500' :
              'bg-amber-50 border-amber-500'
            }
          `}>
            <span className="text-2xl flex-shrink-0">
              {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : '⚠️'}
            </span>
            <div className="flex-1">
              <p className={`
                text-sm font-medium
                ${
                  toast.type === 'success' ? 'text-green-900' :
                  toast.type === 'error' ? 'text-red-900' :
                  'text-amber-900'
                }
              `}>
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast({ ...toast, show: false })}
              className={`
                flex-shrink-0 rounded-full p-1 transition-colors
                ${
                  toast.type === 'success' ? 'hover:bg-green-200' :
                  toast.type === 'error' ? 'hover:bg-red-200' :
                  'hover:bg-amber-200'
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

      {/* Recent Transactions */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaksi Terakhir</h2>
        <div className="text-center py-8 text-gray-500">
          <p>Belum ada pendapatan tercatat</p>
          <p className="text-sm">Mulai catat pendapatan pertama Anda!</p>
        </div>
      </div>
    </div>
  )
}
