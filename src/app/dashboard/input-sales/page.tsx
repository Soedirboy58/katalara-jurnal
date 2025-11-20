'use client'

import { useState, useEffect } from 'react'
import { useProducts } from '@/hooks/useProducts'

export const dynamic = 'force-dynamic'

export default function InputSalesPage() {
  const [paymentMethod, setPaymentMethod] = useState('Tunai')
  const [tempoType, setTempoType] = useState('7')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [quantity, setQuantity] = useState('')
  const [pricePerUnit, setPricePerUnit] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')

  // Fetch products from database
  const { products, loading: loadingProducts } = useProducts()

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
        
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Transaksi
            </label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => handleTransactionDateChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            {selectedProductId && products.length > 0 && (
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
              <option>E-Wallet</option>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Simpan Transaksi
            </button>
            <button
              type="button"
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

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
