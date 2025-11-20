'use client'

import { useState } from 'react'

export const dynamic = 'force-dynamic'

export default function InputExpensesPage() {
  const [paymentMethod, setPaymentMethod] = useState('Tunai')
  const [tempoType, setTempoType] = useState('7')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [amount, setAmount] = useState('')

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
    if (paymentMethod === 'Tempo/Hutang') {
      setDueDate(calculateDueDate(date, parseInt(tempoType)))
    }
  }

  const handleTempoTypeChange = (days: string) => {
    setTempoType(days)
    if (paymentMethod === 'Tempo/Hutang') {
      setDueDate(calculateDueDate(transactionDate, parseInt(days)))
    }
  }

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method)
    if (method === 'Tempo/Hutang') {
      setDueDate(calculateDueDate(transactionDate, parseInt(tempoType)))
    } else {
      setDueDate('')
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Input Pengeluaran</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Catat setiap pengeluaran untuk kontrol keuangan yang lebih baik
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Hari Ini</div>
          <div className="text-2xl font-bold text-red-600">Rp 0</div>
          <div className="text-xs text-gray-500">0 transaksi</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Minggu Ini</div>
          <div className="text-2xl font-bold text-orange-600">Rp 0</div>
          <div className="text-xs text-gray-500">0 transaksi</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Bulan Ini</div>
          <div className="text-2xl font-bold text-yellow-600">Rp 0</div>
          <div className="text-xs text-gray-500">0 transaksi</div>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pengeluaran Baru</h2>
        
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Pengeluaran
            </label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => handleTransactionDateChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori Pengeluaran
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
              <option>Pilih kategori...</option>
              <option>Bahan Baku / Stok</option>
              <option>Gaji Karyawan</option>
              <option>Sewa Tempat</option>
              <option>Listrik & Air</option>
              <option>Internet & Komunikasi</option>
              <option>Marketing & Promosi</option>
              <option>Transportasi</option>
              <option>Perawatan & Maintenance</option>
              <option>Pajak & Perizinan</option>
              <option>Lain-lain</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jumlah Pengeluaran
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            {amount && (
              <p className="text-xs text-gray-500 mt-1">Rp {amount}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Penerima / Vendor (Opsional)
            </label>
            <input
              type="text"
              placeholder="Nama penerima atau toko"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metode Pembayaran
            </label>
            <select 
              value={paymentMethod}
              onChange={(e) => handlePaymentMethodChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option>Tunai</option>
              <option>Transfer Bank</option>
              <option>E-Wallet</option>
              <option>Kartu Kredit/Debit</option>
              <option>Tempo/Hutang</option>
            </select>
          </div>

          {/* Tempo Options - Show when payment method is Tempo/Hutang */}
          {paymentMethod === 'Tempo/Hutang' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-4">
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
                        ? 'bg-red-600 text-white'
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
                        ? 'bg-red-600 text-white'
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
                        ? 'bg-red-600 text-white'
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
                        ? 'bg-red-600 text-white'
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                />
                <p className="text-xs text-gray-600 mt-1">
                  💡 Tanggal otomatis dihitung berdasarkan jangka waktu tempo. Anda bisa edit manual jika perlu.
                </p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-orange-300">
                <div className="flex items-start gap-2">
                  <span className="text-orange-600 text-lg">⚠️</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Hutang Aktif</p>
                    <p className="text-xs text-gray-600">
                      Transaksi ini akan masuk ke daftar hutang dan sistem akan mengirim reminder mendekati jatuh tempo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi
            </label>
            <textarea
              rows={3}
              placeholder="Jelaskan pengeluaran ini..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Bukti (Opsional)
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Format: JPG, PNG, PDF (Max 5MB)</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 sm:flex-none px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Simpan Pengeluaran
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

      {/* Recent Expenses */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pengeluaran Terakhir</h2>
        <div className="text-center py-8 text-gray-500">
          <p>Belum ada pengeluaran hari ini</p>
          <p className="text-sm">Catat setiap pengeluaran untuk kontrol finansial yang lebih baik</p>
        </div>
      </div>
    </div>
  )
}
