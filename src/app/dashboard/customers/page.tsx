'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  customer_number?: string
  total_transactions?: number
  // API/DB uses total_purchase (singular)
  total_purchase?: number
  // Keep legacy alias
  total_purchases?: number
  created_at: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)

      const res = await fetch('/api/customers?active=true&with_stats=true')
      if (res.status === 401) {
        router.push('/login')
        return
      }

      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) {
        console.error('Error fetching customers:', json?.error || `HTTP ${res.status}`)
        setCustomers([])
        return
      }

      setCustomers(json.data || [])
    } catch (error) {
      console.error('Error in fetchCustomers:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalCustomers = customers.length
  const totalSpent = customers.reduce((sum, c) => sum + Number(c.total_purchase ?? c.total_purchases ?? 0), 0)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pelanggan</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Kelola data pelanggan dan tracking transaksi
          </p>
        </div>
        
        {/* Panggil Ranger Button - Coming Soon */}
        <button
          disabled
          className="relative px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium opacity-60 cursor-not-allowed flex items-center justify-center gap-2"
          title="Fitur segera hadir! Rangers bisa membantu input data pelanggan massal."
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-sm">📞 Panggil Ranger</span>
          <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full shadow-lg animate-pulse">
            SOON
          </span>
        </button>
      </div>

      {/* Sync Banner - Show when no customers */}
      {!loading && customers.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-900">Data Pelanggan Kosong</h3>
              <p className="text-sm text-yellow-800 mt-1">
                Belum ada data pelanggan. Jalankan sinkronisasi untuk mengekstrak data pelanggan dari transaksi yang sudah ada.
              </p>
              <a 
                href="/dashboard/sync-data"
                className="inline-block mt-3 px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
              >
                🔄 Sinkronkan Data
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Pelanggan</p>
              <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Pembelian</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Transaksi</p>
              <p className="text-2xl font-bold text-gray-900">
                {customers.reduce((sum, c) => sum + (c.total_transactions || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Top Customer by Value */}
        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-amber-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                </div>
                <p className="text-sm text-gray-500 font-medium">Top Customer (Nominal)</p>
              </div>
              {(() => {
                const top = [...customers].sort(
                  (a, b) => Number(b.total_purchase ?? b.total_purchases ?? 0) - Number(a.total_purchase ?? a.total_purchases ?? 0)
                )[0]
                return top ? (
                  <>
                    <p className="text-base font-bold text-gray-900 truncate">{top.name}</p>
                    <p className="text-lg text-amber-600 font-bold mt-1">{formatCurrency(Number(top.total_purchase ?? top.total_purchases ?? 0))}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Belum ada data</p>
                )
              })()}
            </div>
          </div>
        </div>

        {/* Top Customer by Frequency */}
        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-indigo-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 font-medium">Top Repeat Order</p>
              </div>
              {(() => {
                const top = [...customers].sort((a, b) => (Number(b.total_transactions || 0) - Number(a.total_transactions || 0)))[0]
                return top ? (
                  <>
                    <p className="text-base font-bold text-gray-900 truncate">{top.name}</p>
                    <p className="text-lg text-indigo-600 font-bold mt-1">{top.total_transactions || 0}x transaksi</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Belum ada data</p>
                )
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <input
          type="text"
          placeholder="🔍 Cari nama, telepon, atau email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Memuat data pelanggan...</p>
          </div>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-lg font-medium">
              {searchTerm ? 'Tidak ada hasil pencarian' : 'Belum ada data pelanggan'}
            </p>
            <p className="text-sm mt-1">
              {searchTerm ? 'Coba kata kunci lain' : 'Jalankan sinkronisasi untuk mengekstrak data dari transaksi'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pelanggan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontak</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaksi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Pembelian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers.map((customer, index) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      <div className="text-xs text-gray-500">{customer.customer_number}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>{customer.phone || '-'}</div>
                      <div className="text-xs text-gray-500">{customer.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {customer.total_transactions || 0}x
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(Number(customer.total_purchase ?? customer.total_purchases ?? 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredCustomers.map((customer, index) => (
              <div key={customer.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{customer.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{customer.customer_number}</div>
                  </div>
                  <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    #{index + 1}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{customer.phone || 'Tidak ada telepon'}</span>
                  </div>
                  
                  {customer.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Total Transaksi</div>
                    <div className="font-semibold text-gray-900">{customer.total_transactions || 0}x</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Total Pembelian</div>
                    <div className="font-semibold text-green-600">{formatCurrency(Number(customer.total_purchase ?? customer.total_purchases ?? 0))}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
