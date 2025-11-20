'use client'

import { useState } from 'react'
// import { ReceiptScanner } from '@/components/expenses/ReceiptScanner' // FUTURE: AI Receipt Scanner

export const dynamic = 'force-dynamic'

export default function InputExpensesPage() {
  const [paymentMethod, setPaymentMethod] = useState('Tunai')
  const [tempoType, setTempoType] = useState('7')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [showBatchPurchase, setShowBatchPurchase] = useState(false)
  const [batchOutputs, setBatchOutputs] = useState<Array<{productId: string, productName: string, portions: number}>>([])
  const [notes, setNotes] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

  const handleCategoryChange = (cat: string) => {
    setCategory(cat)
    setShowBatchPurchase(cat === 'raw_materials')
    if (cat !== 'raw_materials') {
      setBatchOutputs([])
    }
  }

  const addBatchOutput = () => {
    setBatchOutputs([...batchOutputs, { productId: '', productName: '', portions: 0 }])
  }

  const removeBatchOutput = (index: number) => {
    setBatchOutputs(batchOutputs.filter((_, i) => i !== index))
  }

  const updateBatchOutput = (index: number, field: string, value: string | number) => {
    const updated = [...batchOutputs]
    updated[index] = { ...updated[index], [field]: value }
    setBatchOutputs(updated)
  }

  const calculateCostPerPortion = () => {
    if (!amount || batchOutputs.length === 0) return 0
    const totalPortions = batchOutputs.reduce((sum, output) => sum + (output.portions || 0), 0)
    if (totalPortions === 0) return 0
    const numAmount = parseFloat(amount.replace(/\./g, ''))
    return Math.round(numAmount / totalPortions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || !category || !paymentMethod) {
      alert('Mohon lengkapi semua field yang wajib diisi')
      return
    }

    setSubmitting(true)

    try {
      const numAmount = parseFloat(amount.replace(/\./g, ''))
      
      // Determine payment type
      let paymentType = 'cash'
      if (paymentMethod === 'Tempo/Hutang') {
        paymentType = `tempo_${tempoType}`
      }

      const payload = {
        expense_date: transactionDate,
        amount: numAmount,
        category,
        description: description || null,
        notes: notes || null,
        payment_method: paymentMethod,
        payment_type: paymentType,
        payment_status: paymentMethod === 'Tempo/Hutang' ? 'Pending' : 'Lunas',
        due_date: paymentMethod === 'Tempo/Hutang' ? dueDate : null
      }

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        alert('✅ Pengeluaran berhasil disimpan!')
        
        // Reset form
        setAmount('')
        setCategory('')
        setDescription('')
        setNotes('')
        setBatchOutputs([])
        setShowBatchPurchase(false)
        setPaymentMethod('Tunai')
        setTransactionDate(new Date().toISOString().split('T')[0])
        
        // Reload page to show in recent expenses
        window.location.reload()
      } else {
        throw new Error(result.error || 'Failed to save expense')
      }
    } catch (error: any) {
      console.error('Submit error:', error)
      alert('❌ Gagal menyimpan: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setAmount('')
    setCategory('')
    setDescription('')
    setNotes('')
    setBatchOutputs([])
    setShowBatchPurchase(false)
    setPaymentMethod('Tunai')
    setTransactionDate(new Date().toISOString().split('T')[0])
    setDueDate('')
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
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <select 
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Pilih kategori...</option>
              <option value="raw_materials">🛒 Bahan Baku / Stok (Belanja Produksi)</option>
              <option value="salary">Gaji Karyawan</option>
              <option value="rent">Sewa Tempat</option>
              <option value="utilities">Listrik & Air</option>
              <option value="communication">Internet & Komunikasi</option>
              <option value="marketing">Marketing & Promosi</option>
              <option value="transportation">Transportasi</option>
              <option value="maintenance">Perawatan & Maintenance</option>
              <option value="tax">Pajak & Perizinan</option>
              <option value="other">Lain-lain</option>
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

          {/* FUTURE FEATURE: AI Receipt Scanner 
          {showBatchPurchase && (
            <div className="mb-6">
              <ReceiptScanner 
                onDataExtracted={(data) => {
                  setAmount(data.total.toLocaleString('id-ID'))
                  setNotes(data.notes)
                }}
              />
            </div>
          )}
          */}

          {/* Batch Purchase Section - Show when category is raw_materials */}
          {showBatchPurchase && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-2xl">🧠</span>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Smart Learning System</h3>
                  <p className="text-xs text-gray-600">
                    Belanjaan ini untuk produksi berapa porsi? Sistem akan belajar dan hitung cost otomatis!
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Catatan Belanjaan
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Beli beras 5kg, telur 2kg, mie 4 bungkus, bumbu-bumbu"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    🎯 Output Produksi
                  </label>
                  <button
                    type="button"
                    onClick={addBatchOutput}
                    className="text-xs px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    + Tambah Produk
                  </button>
                </div>

                {batchOutputs.length === 0 ? (
                  <div className="text-center py-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-sm text-gray-500">Klik "Tambah Produk" untuk mulai</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {batchOutputs.map((output, index) => (
                      <div key={index} className="bg-white p-3 rounded-lg border border-gray-200 flex gap-2 items-start">
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            placeholder="Nama produk (ex: Nasi Goreng)"
                            value={output.productName}
                            onChange={(e) => updateBatchOutput(index, 'productName', e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex gap-2 items-center">
                            <input
                              type="number"
                              inputMode="numeric"
                              placeholder="Jumlah porsi"
                              value={output.portions || ''}
                              onChange={(e) => updateBatchOutput(index, 'portions', parseInt(e.target.value) || 0)}
                              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-500">porsi</span>
                          </div>
                          {output.portions > 0 && amount && (
                            <p className="text-xs text-green-600 font-medium">
                              💰 Est. Cost/porsi: Rp {calculateCostPerPortion().toLocaleString('id-ID')}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeBatchOutput(index)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Hapus"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {batchOutputs.length > 0 && amount && (
                  <div className="mt-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 border border-green-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 text-xs">Total Belanja:</p>
                        <p className="font-bold text-gray-900">Rp {amount}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Total Produksi:</p>
                        <p className="font-bold text-gray-900">
                          {batchOutputs.reduce((sum, o) => sum + (o.portions || 0), 0)} porsi
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-600 text-xs">Rata-rata Cost/Porsi:</p>
                        <p className="font-bold text-green-600 text-lg">
                          Rp {calculateCostPerPortion().toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg p-3 border border-blue-300">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 text-lg">💡</span>
                  <div>
                    <p className="text-xs font-medium text-gray-900">Sistem akan otomatis:</p>
                    <ul className="text-xs text-gray-600 mt-1 space-y-0.5">
                      <li>✅ Update harga pokok produk</li>
                      <li>✅ Belajar pattern belanja Anda</li>
                      <li>✅ Suggest restock di belanja berikutnya</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

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

          {!showBatchPurchase && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi
              </label>
              <textarea
                rows={3}
                placeholder="Jelaskan pengeluaran ini..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          )}

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
              disabled={submitting}
              className="flex-1 sm:flex-none px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={submitting}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
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
