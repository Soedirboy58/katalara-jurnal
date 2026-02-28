'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useConfirm } from '@/hooks/useConfirm'
import { showToast, ToastContainer } from '@/components/ui/Toast'
import { provinsiList, kabupatenList, kecamatanList } from '@/lib/data/wilayah-indonesia'

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  province_id?: string | null
  province_name?: string | null
  kabupaten_id?: string | null
  kabupaten_name?: string | null
  kecamatan_id?: string | null
  kecamatan_name?: string | null
  desa_id?: string | null
  desa_name?: string | null
  address_detail?: string | null
  rt_rw?: string | null
  landmark?: string | null
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
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [savingCustomer, setSavingCustomer] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [desaOptions, setDesaOptions] = useState<Array<{ id: string; nama: string }>>([])
  const [desaLoading, setDesaLoading] = useState(false)
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()
  const router = useRouter()

  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    province_id: '',
    province_name: '',
    kabupaten_id: '',
    kabupaten_name: '',
    kecamatan_id: '',
    kecamatan_name: '',
    desa_id: '',
    desa_name: '',
    address_detail: '',
    rt_rw: '',
    landmark: '',
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    const kecamatanId = customerForm.kecamatan_id
    if (!kecamatanId) {
      setDesaOptions([])
      return
    }

    const fetchDesa = async () => {
      setDesaLoading(true)
      try {
        const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${kecamatanId}.json`)
        const data = await res.json().catch(() => [])
        if (Array.isArray(data)) {
          setDesaOptions(data.map((row: any) => ({ id: String(row.id), nama: String(row.name) })))
        } else {
          setDesaOptions([])
        }
      } catch {
        setDesaOptions([])
      } finally {
        setDesaLoading(false)
      }
    }

    fetchDesa()
  }, [customerForm.kecamatan_id])

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

  const formatAddress = (customer: Customer) => {
    const detail = (customer.address_detail || '').trim()
    const rtRw = (customer.rt_rw || '').trim()
    const landmark = (customer.landmark || '').trim()
    const desa = (customer.desa_name || '').trim()
    const kecamatan = (customer.kecamatan_name || '').trim()
    const kabupaten = (customer.kabupaten_name || '').trim()
    const provinsi = (customer.province_name || '').trim()

    const parts = [detail]
    if (rtRw) parts.push(`RT/RW ${rtRw}`)
    if (landmark) parts.push(`Patokan: ${landmark}`)
    const region = [desa, kecamatan, kabupaten, provinsi].filter(Boolean)
    if (region.length) parts.push(region.join(', '))

    const combined = parts.filter(Boolean).join(', ')
    if (combined) return combined
    return (customer.address || '').trim()
  }

  const resetCustomerForm = () => {
    setCustomerForm({
      name: '',
      phone: '',
      email: '',
      province_id: '',
      province_name: '',
      kabupaten_id: '',
      kabupaten_name: '',
      kecamatan_id: '',
      kecamatan_name: '',
      desa_id: '',
      desa_name: '',
      address_detail: '',
      rt_rw: '',
      landmark: '',
    })
    setDesaOptions([])
  }

  const handleCreateCustomer = async () => {
    if (!customerForm.name.trim()) {
      showToast('Nama pelanggan wajib diisi.', 'warning')
      return
    }

    setSavingCustomer(true)
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerForm),
      })

      const json = await res.json().catch(() => null as any)
      if (!res.ok || !json?.success) {
        showToast(json?.error || 'Gagal menambahkan pelanggan', 'error')
        return
      }

      showToast('Pelanggan berhasil ditambahkan', 'success')
      setShowCustomerModal(false)
      resetCustomerForm()
      fetchCustomers()
    } catch (error) {
      console.error('Create customer error:', error)
      showToast('Terjadi kesalahan saat menambahkan pelanggan', 'error')
    } finally {
      setSavingCustomer(false)
    }
  }

  const handleDeleteCustomer = async (customerId: string, customerName: string) => {
    const ok = await confirm({
      title: 'Hapus pelanggan',
      message: `Hapus pelanggan ${customerName}? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Hapus',
      cancelText: 'Batal',
      type: 'danger',
    })

    if (!ok) return

    setDeletingId(customerId)
    try {
      const res = await fetch(`/api/customers?id=${encodeURIComponent(customerId)}`, {
        method: 'DELETE',
      })
      const json = await res.json().catch(() => null as any)
      if (!res.ok || !json?.success) {
        showToast(json?.error || 'Gagal menghapus pelanggan', 'error')
        return
      }
      showToast('Pelanggan berhasil dihapus', 'success')
      fetchCustomers()
    } catch (error) {
      console.error('Delete customer error:', error)
      showToast('Terjadi kesalahan saat menghapus pelanggan', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const kabupatenOptions = useMemo(() => {
    if (!customerForm.province_id) return []
    return kabupatenList.filter((row) => row.provinsi_id === customerForm.province_id)
  }, [customerForm.province_id])

  const kecamatanOptions = useMemo(() => {
    if (!customerForm.kabupaten_id) return []
    return kecamatanList.filter((row) => row.kabupaten_id === customerForm.kabupaten_id)
  }, [customerForm.kabupaten_id])

  const totalCustomers = customers.length
  const totalSpent = customers.reduce((sum, c) => sum + Number(c.total_purchase ?? c.total_purchases ?? 0), 0)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ToastContainer />
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pelanggan</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Kelola data pelanggan dan tracking transaksi
          </p>
        </div>

        <div>
          <button
            onClick={() => {
              resetCustomerForm()
              setShowCustomerModal(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
          >
            + Tambah Pelanggan
          </button>
        </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alamat</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaksi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Pembelian</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
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
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="max-w-xs line-clamp-2">{formatAddress(customer) || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {customer.total_transactions || 0}x
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(Number(customer.total_purchase ?? customer.total_purchases ?? 0))}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                        disabled={deletingId === customer.id}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-60"
                      >
                        {deletingId === customer.id ? 'Menghapus...' : 'Hapus'}
                      </button>
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
                  {formatAddress(customer) && (
                    <div className="flex items-start gap-2 text-gray-600">
                      <svg className="w-4 h-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 12.414a2 2 0 00-2.828 0l-4.243 4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-xs">{formatAddress(customer)}</span>
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
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                    disabled={deletingId === customer.id}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-60"
                  >
                    {deletingId === customer.id ? 'Menghapus...' : 'Hapus'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="Tambah Pelanggan"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama *</label>
              <input
                type="text"
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nama pelanggan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. WhatsApp</label>
              <input
                type="tel"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="email@domain.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Provinsi</label>
                <select
                  value={customerForm.province_id}
                  onChange={(e) => {
                    const value = e.target.value
                    const selected = provinsiList.find((row) => row.id === value)
                    setCustomerForm({
                      ...customerForm,
                      province_id: value,
                      province_name: selected?.nama || '',
                      kabupaten_id: '',
                      kabupaten_name: '',
                      kecamatan_id: '',
                      kecamatan_name: '',
                      desa_id: '',
                      desa_name: '',
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Pilih provinsi</option>
                  {provinsiList.map((prov) => (
                    <option key={prov.id} value={prov.id}>{prov.nama}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Kabupaten/Kota</label>
                <select
                  value={customerForm.kabupaten_id}
                  onChange={(e) => {
                    const value = e.target.value
                    const selected = kabupatenOptions.find((row) => row.id === value)
                    setCustomerForm({
                      ...customerForm,
                      kabupaten_id: value,
                      kabupaten_name: selected?.nama || '',
                      kecamatan_id: '',
                      kecamatan_name: '',
                      desa_id: '',
                      desa_name: '',
                    })
                  }}
                  disabled={!customerForm.province_id}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">Pilih kabupaten/kota</option>
                  {kabupatenOptions.map((kab) => (
                    <option key={kab.id} value={kab.id}>{kab.nama}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Kecamatan</label>
                <select
                  value={customerForm.kecamatan_id}
                  onChange={(e) => {
                    const value = e.target.value
                    const selected = kecamatanOptions.find((row) => row.id === value)
                    setCustomerForm({
                      ...customerForm,
                      kecamatan_id: value,
                      kecamatan_name: selected?.nama || '',
                      desa_id: '',
                      desa_name: '',
                    })
                  }}
                  disabled={!customerForm.kabupaten_id}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">Pilih kecamatan</option>
                  {kecamatanOptions.map((kec) => (
                    <option key={kec.id} value={kec.id}>{kec.nama}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Desa/Kelurahan</label>
                <select
                  value={customerForm.desa_id}
                  onChange={(e) => {
                    const value = e.target.value
                    const selected = desaOptions.find((row) => row.id === value)
                    setCustomerForm({
                      ...customerForm,
                      desa_id: value,
                      desa_name: selected?.nama || '',
                    })
                  }}
                  disabled={!customerForm.kecamatan_id || desaLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">{desaLoading ? 'Memuat desa...' : 'Pilih desa/kelurahan'}</option>
                  {desaOptions.map((desa) => (
                    <option key={desa.id} value={desa.id}>{desa.nama}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">RT/RW</label>
                <input
                  type="text"
                  value={customerForm.rt_rw}
                  onChange={(e) => setCustomerForm({ ...customerForm, rt_rw: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="001/002"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Patokan</label>
                <input
                  type="text"
                  value={customerForm.landmark}
                  onChange={(e) => setCustomerForm({ ...customerForm, landmark: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: dekat masjid"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Alamat Detail</label>
              <textarea
                value={customerForm.address_detail}
                onChange={(e) => setCustomerForm({ ...customerForm, address_detail: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nama jalan, nomor rumah, blok, dll."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowCustomerModal(false)}
              className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              onClick={handleCreateCustomer}
              disabled={savingCustomer}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {savingCustomer ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={confirmState.options.title}
        message={confirmState.options.message}
        confirmText={confirmState.options.confirmText}
        cancelText={confirmState.options.cancelText}
        type={confirmState.options.type}
      />
    </div>
  )
}
