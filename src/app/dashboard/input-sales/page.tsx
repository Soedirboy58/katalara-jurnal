'use client'

import { useState, useEffect } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { InvoiceModal } from '@/components/sales/InvoiceModal'
import { ProductModal } from '@/components/products/ProductModal'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export default function InputSalesPage() {
  const [paymentMethod, setPaymentMethod] = useState('Tunai')
  const [tempoType, setTempoType] = useState('7')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [quantity, setQuantity] = useState('')
  const [pricePerUnit, setPricePerUnit] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [notes, setNotes] = useState('')
  const [showInvoice, setShowInvoice] = useState(false)
  const [invoiceData, setInvoiceData] = useState<any>(null)
  const [businessName, setBusinessName] = useState('Bisnis Saya')
  const [saving, setSaving] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)

  const supabase = createClient()

  // Fetch products from database
  const { products, loading: loadingProducts, refresh: refreshProducts } = useProducts()

  // Load business name
  useEffect(() => {
    const loadBusinessName = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('business_name')
          .eq('user_id', user.id)
          .single()
        
        if (profile?.business_name) {
          setBusinessName(profile.business_name)
        }
      }
    }
    loadBusinessName()
  }, [supabase])

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

  // Calculate due date based on transaction date and tempo days
  const calculateDueDate = (txnDate: string, days: number) => {
    const date = new Date(txnDate)
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }

  // Update due date when transaction date or tempo type changes
  const handleTransactionDateChange = (date: string) => {
    setTransactionDate(date)
    if (paymentMethod === 'Kredit/Tempo') {
      setDueDate(calculateDueDate(date, parseInt(tempoType)))
    }
  }

  const handleTempoTypeChange = (days: string) => {
    setTempoType(days)
    if (paymentMethod === 'Kredit/Tempo') {
      setDueDate(calculateDueDate(transactionDate, parseInt(days)))
    }
  }

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method)
    if (method === 'Kredit/Tempo') {
      setDueDate(calculateDueDate(transactionDate, parseInt(tempoType)))
    } else {
      setDueDate('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedProductId || !quantity || !pricePerUnit) {
      alert('Mohon lengkapi produk, jumlah, dan harga')
      return
    }

    setSaving(true)

    try {
      const product = products.find(p => p.id === selectedProductId)
      const qtyNum = parseInt(quantity.replace(/\./g, ''))
      const priceNum = parseInt(pricePerUnit.replace(/\./g, ''))
      const total = qtyNum * priceNum

      // Check stock availability
      if (product && product.track_inventory) {
        const currentStock = (product as any).stock_quantity || 0
        if (currentStock < qtyNum) {
          alert(`Stok tidak cukup! Stok tersedia: ${currentStock}`)
          setSaving(false)
          return
        }
      }

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`

      // Prepare invoice data
      const invoice = {
        invoiceNumber,
        date: transactionDate,
        customerName: customerName || undefined,
        items: [{
          productName: product?.name || 'Produk',
          quantity: qtyNum,
          pricePerUnit: priceNum,
          total: total
        }],
        subtotal: total,
        tax: 0,
        total: total,
        paymentMethod,
        dueDate: paymentMethod === 'Kredit/Tempo' ? dueDate : undefined
      }

      setInvoiceData(invoice)
      setShowInvoice(true)

      // Update stock in database if product tracks inventory
      if (product && product.track_inventory) {
        const newStock = Math.max(0, ((product as any).stock_quantity || 0) - qtyNum)
        const { error: stockError } = await supabase
          .from('products')
          .update({ 
            stock_quantity: newStock,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedProductId)

        if (stockError) {
          console.error('Error updating stock:', stockError)
          // Don't block the transaction, just log the error
        } else {
          console.log(`✅ Stock updated: ${product.name} - ${qtyNum} units deducted`)
          // Refresh products to update the list
          refreshProducts()
        }
      }

      // Reset form
      setSelectedProductId('')
      setQuantity('')
      setPricePerUnit('')
      setCustomerName('')
      setNotes('')
      setPaymentMethod('Tunai')
      setDueDate('')

    } catch (error) {
      console.error('Error saving transaction:', error)
      alert('Gagal menyimpan transaksi')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setSelectedProductId('')
    setQuantity('')
    setPricePerUnit('')
    setCustomerName('')
    setNotes('')
    setPaymentMethod('Tunai')
    setDueDate('')
    setTransactionDate(new Date().toISOString().split('T')[0])
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Input Penjualan</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Catat setiap transaksi penjualan untuk tracking yang akurat
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Hari Ini</div>
          <div className="text-2xl font-bold text-blue-600">Rp 0</div>
          <div className="text-xs text-gray-500">0 transaksi</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Minggu Ini</div>
          <div className="text-2xl font-bold text-green-600">Rp 0</div>
          <div className="text-xs text-gray-500">0 transaksi</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Bulan Ini</div>
          <div className="text-2xl font-bold text-purple-600">Rp 0</div>
          <div className="text-xs text-gray-500">0 transaksi</div>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaksi Baru</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Transaksi
            </label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => handleTransactionDateChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Produk / Item
            </label>
            <div className="flex gap-2">
              <select 
                value={selectedProductId}
                onChange={(e) => {
                  const productId = e.target.value
                  setSelectedProductId(productId)
                  
                  // Auto-fill price when product is selected
                  if (productId) {
                    const product = products.find(p => p.id === productId)
                    if (product) {
                      setPricePerUnit(formatNumber(product.selling_price.toString()))
                    }
                  } else {
                    setPricePerUnit('')
                  }
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                disabled={loadingProducts}
              >
                <option value="">
                  {loadingProducts ? 'Memuat produk...' : 'Pilih produk...'}
                </option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - Rp {formatNumber(product.selling_price.toString())} {product.track_inventory ? `(Stok: ${(product as any).stock_quantity || 0})` : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowProductModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Produk Baru
              </button>
            </div>
            {selectedProductId && products.length > 0 && (() => {
              const product = products.find(p => p.id === selectedProductId)
              return product ? (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-green-600">
                    ✓ Harga otomatis terisi dari database produk
                  </p>
                  {product.track_inventory && (
                    <p className="text-xs text-blue-600">
                      📦 Stok tersedia: {(product as any).stock_quantity || 0} {(product as any).unit || 'pcs'}
                    </p>
                  )}
                </div>
              ) : null
            })()}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0"
                value={quantity}
                onChange={(e) => handleNumberInput(e.target.value, setQuantity)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {pricePerUnit && (
                <p className="text-xs text-gray-500 mt-1">Rp {pricePerUnit}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pelanggan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Nama pelanggan"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metode Pembayaran
            </label>
            <select 
              value={paymentMethod}
              onChange={(e) => handlePaymentMethodChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>Tunai</option>
              <option>Transfer Bank</option>
              <option>Dompet Digital</option>
              <option>QRIS</option>
              <option>Kredit/Tempo</option>
            </select>
          </div>

          {/* Tempo Options - Show when payment method is Kredit/Tempo */}
          {paymentMethod === 'Kredit/Tempo' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jangka Waktu Tempo
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTempoTypeChange('7')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tempoType === '7'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    7 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTempoTypeChange('14')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tempoType === '14'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    14 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTempoTypeChange('30')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tempoType === '30'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    30 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTempoTypeChange('60')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tempoType === '60'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    60 Hari
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Jatuh Tempo
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
                <p className="text-xs text-gray-600 mt-1">
                  💡 Tanggal otomatis dihitung berdasarkan jangka waktu tempo. Anda bisa edit manual jika perlu.
                </p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-yellow-300">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 text-lg">⚠️</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Piutang Aktif</p>
                    <p className="text-xs text-gray-600">
                      Transaksi ini akan masuk ke daftar piutang dan sistem akan mengirim reminder mendekati jatuh tempo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catatan (Opsional)
            </label>
            <textarea
              rows={3}
              placeholder="Catatan tambahan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving || !selectedProductId || !quantity || !pricePerUnit}
              className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? 'Menyimpan...' : '💾 Simpan Transaksi'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Invoice Modal */}
      {invoiceData && (
        <InvoiceModal
          isOpen={showInvoice}
          onClose={() => setShowInvoice(false)}
          invoiceData={invoiceData}
          businessName={businessName}
        />
      )}

      {/* Product Modal - Quick Add Product */}
      <ProductModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        product={null}
        onSuccess={() => {
          refreshProducts()
          setShowProductModal(false)
        }}
      />

      {/* Recent Transactions */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaksi Terakhir</h2>
        <div className="text-center py-8 text-gray-500">
          <p>Belum ada transaksi hari ini</p>
          <p className="text-sm">Mulai catat penjualan pertama Anda!</p>
        </div>
      </div>
    </div>
  )
}
