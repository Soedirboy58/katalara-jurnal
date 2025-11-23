'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SyncDataPage() {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleSync = async () => {
    setSyncing(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/sync-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.report)
      } else {
        setError(data.error || 'Sinkronisasi gagal')
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sinkronisasi Data</h1>
              <p className="text-gray-600 mt-2">
                Sinkronkan data Pelanggan dan Produk dari transaksi Input Pendapatan
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
            >
              Kembali
            </button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Pelanggan</h3>
                <p className="text-xs text-gray-600">Customer Management</p>
              </div>
            </div>
            <p className="text-sm text-gray-700">
              Ekstrak data pelanggan unik dari field <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">customer_name</code> dan <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">customer_phone</code> di tabel incomes
            </p>
            <ul className="mt-3 space-y-1 text-xs text-gray-600">
              <li>• Auto-generate customer number (CUST-001)</li>
              <li>• Deduplikasi berdasarkan phone/name</li>
              <li>• Skip pelanggan yang sudah ada</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Produk</h3>
                <p className="text-xs text-gray-600">Product Catalog</p>
              </div>
            </div>
            <p className="text-sm text-gray-700">
              Ekstrak produk dari <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">line_items</code> (JSON) dan <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">product_name</code>
            </p>
            <ul className="mt-3 space-y-1 text-xs text-gray-600">
              <li>• Parse multi-items dari line_items</li>
              <li>• Simpan harga jual dari transaksi</li>
              <li>• Skip produk yang sudah ada</li>
            </ul>
          </div>
        </div>

        {/* Sync Button */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center mb-6">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Mulai Sinkronisasi</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Proses ini akan mengekstrak data pelanggan dan produk dari transaksi yang sudah ada, 
              kemudian menyimpannya ke tabel customers dan products untuk kemudahan pengelolaan.
            </p>
          </div>
          
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-3 mx-auto"
          >
            {syncing ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                Menyinkronkan...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Jalankan Sinkronisasi
              </>
            )}
          </button>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Hasil Sinkronisasi
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customers Result */}
              <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-blue-900 text-lg">Pelanggan</h4>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-700">Berhasil disinkronkan:</span>
                    <span className="text-2xl font-bold text-blue-900">{result.customers.synced}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-700">Sudah ada (dilewati):</span>
                    <span className="text-lg font-semibold text-blue-800">{result.customers.skipped}</span>
                  </div>
                  {result.customers.errors.length > 0 && (
                    <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded">
                      <p className="text-xs font-semibold text-red-800 mb-1">Errors:</p>
                      {result.customers.errors.map((err: string, idx: number) => (
                        <p key={idx} className="text-xs text-red-700">• {err}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Products Result */}
              <div className="border border-green-200 rounded-lg p-6 bg-green-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-green-900 text-lg">Produk</h4>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-700">Berhasil disinkronkan:</span>
                    <span className="text-2xl font-bold text-green-900">{result.products.synced}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-700">Sudah ada (dilewati):</span>
                    <span className="text-lg font-semibold text-green-800">{result.products.skipped}</span>
                  </div>
                  {result.products.errors.length > 0 && (
                    <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded">
                      <p className="text-xs font-semibold text-red-800 mb-1">Errors:</p>
                      {result.products.errors.map((err: string, idx: number) => (
                        <p key={idx} className="text-xs text-red-700">• {err}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg flex items-start gap-3">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-green-900">Sinkronisasi Selesai</p>
                <p className="text-xs text-green-700 mt-1">
                  Data pelanggan dan produk telah berhasil disinkronkan. Sekarang Anda dapat mengelola customer dan product catalog dengan lebih mudah di menu Product Management dan Customer Database.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Note */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mt-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-amber-900 mb-2">Catatan Penting:</p>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• Sinkronisasi aman dijalankan berkali-kali (data duplikat akan dilewati)</li>
                <li>• Data produk dari sync tidak memiliki <code className="bg-amber-100 px-1 rounded">buy_price</code> dan <code className="bg-amber-100 px-1 rounded">stock</code> - perlu diisi manual</li>
                <li>• Customer stats (total_transactions, total_spent) akan dihitung ulang saat ada transaksi baru</li>
                <li>• Proses ini hanya ekstraksi data, tidak mengubah tabel incomes yang sudah ada</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
