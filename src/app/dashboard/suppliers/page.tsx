'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Supplier {
  id: string
  name: string
  supplier_type: 'raw_materials' | 'finished_goods' | 'both' | 'services'
  phone: string | null
  email: string | null
  address: string | null
  total_purchases: number
  total_payables: number
  is_active: boolean
  created_at: string
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    supplier_type: 'raw_materials' as 'raw_materials' | 'finished_goods' | 'both' | 'services',
    phone: '',
    email: '',
    address: '',
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        console.error('No session found, redirecting to login')
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching suppliers:', error)
        throw error
      }
      
      setSuppliers(data || [])
    } catch (error) {
      console.error('Error in fetchSuppliers:', error)
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

  const getSupplierTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'raw_materials': 'Bahan Baku',
      'finished_goods': 'Barang Jadi',
      'both': 'Bahan & Barang',
      'services': 'Jasa'
    }
    return labels[type] || type
  }

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone?.includes(searchTerm) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalSuppliers = suppliers.length
  const totalPurchases = suppliers.reduce((sum, s) => sum + (s.total_purchases || 0), 0)
  const totalPayables = suppliers.reduce((sum, s) => sum + (s.total_payables || 0), 0)
  const activeSuppliers = suppliers.filter(s => s.is_active).length
  
  // Calculate this month purchases
  const [monthlyPurchases, setMonthlyPurchases] = useState(0)
  const [overduePayables, setOverduePayables] = useState(0)
  
  useEffect(() => {
    const calculateMonthlyStats = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return
        
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)
        
        // Monthly purchases
        const { data: expenses } = await supabase
          .from('expenses')
          .select('grand_total, amount')
          .eq('owner_id', session.user.id)
          .gte('expense_date', startOfMonth.toISOString())
        
        const monthTotal = expenses?.reduce((sum, e) => sum + (e.grand_total || e.amount || 0), 0) || 0
        setMonthlyPurchases(monthTotal)
        
        // Overdue payables
        const today = new Date().toISOString().split('T')[0]
        const { data: overdueExpenses } = await supabase
          .from('expenses')
          .select('remaining_payment, grand_total, amount')
          .eq('owner_id', session.user.id)
          .eq('payment_status', 'Tempo')
          .lt('due_date', today)
        
        const overdueTotal = overdueExpenses?.reduce((sum, e) => {
          return sum + (e.remaining_payment || e.grand_total || e.amount || 0)
        }, 0) || 0
        setOverduePayables(overdueTotal)
      } catch (error) {
        console.error('Error calculating monthly stats:', error)
      }
    }
    
    if (!loading) {
      calculateMonthlyStats()
    }
  }, [loading, supabase])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Supplier</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Kelola data supplier dan tracking pembelian
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg whitespace-nowrap"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Tambah Supplier</span>
          <span className="sm:hidden">Tambah</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Supplier</p>
              <p className="text-2xl font-bold text-gray-900">{totalSuppliers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pembelian Bulan Ini</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(monthlyPurchases)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Hutang Jatuh Tempo</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(overduePayables)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-50 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Hutang</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalPayables)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <input
          type="text"
          placeholder="🔍 Cari nama, telepon, atau email supplier..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
            <p className="text-gray-600">Memuat data supplier...</p>
          </div>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-lg font-medium">
              {searchTerm ? 'Tidak ada hasil pencarian' : 'Belum ada data supplier'}
            </p>
            <p className="text-sm mt-1">
              {searchTerm ? 'Coba kata kunci lain' : 'Tambahkan supplier melalui halaman Input Pengeluaran'}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontak</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Pembelian</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hutang</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSuppliers.map((supplier, index) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{supplier.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                        {getSupplierTypeLabel(supplier.supplier_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>{supplier.phone || '-'}</div>
                      <div className="text-xs text-gray-500">{supplier.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(supplier.total_purchases || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-orange-600">
                      {formatCurrency(supplier.total_payables || 0)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        supplier.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {supplier.is_active ? 'Aktif' : 'Non-Aktif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredSuppliers.map((supplier, index) => (
              <div key={supplier.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{supplier.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        {getSupplierTypeLabel(supplier.supplier_type)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      #{index + 1}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      supplier.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {supplier.is_active ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{supplier.phone || 'Tidak ada telepon'}</span>
                  </div>
                  
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{supplier.email}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Total Pembelian</div>
                    <div className="font-semibold text-gray-900">{formatCurrency(supplier.total_purchases || 0)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Hutang</div>
                    <div className="font-semibold text-orange-600">{formatCurrency(supplier.total_payables || 0)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 z-40"
              onClick={() => setShowAddModal(false)}
            ></div>

            {/* Modal panel */}
            <div className="relative z-50 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={async (e) => {
                e.preventDefault()
                setSubmitting(true)
                
                try {
                  const { data: { session } } = await supabase.auth.getSession()
                  if (!session?.user) {
                    alert('Sesi berakhir, silakan login kembali')
                    return
                  }

                  const { error } = await supabase.from('suppliers').insert({
                    owner_id: session.user.id,
                    name: formData.name,
                    supplier_type: formData.supplier_type,
                    phone: formData.phone || null,
                    email: formData.email || null,
                    address: formData.address || null,
                    is_active: true,
                    total_purchases: 0,
                    total_payables: 0,
                  })

                  if (error) throw error

                  alert('Supplier berhasil ditambahkan!')
                  setShowAddModal(false)
                  setFormData({
                    name: '',
                    supplier_type: 'raw_materials',
                    phone: '',
                    email: '',
                    address: '',
                  })
                  fetchSuppliers()
                } catch (error) {
                  console.error('Error adding supplier:', error)
                  alert('Gagal menambahkan supplier')
                } finally {
                  setSubmitting(false)
                }
              }}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                      <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="ml-3 text-lg leading-6 font-medium text-gray-900">
                      Tambah Supplier Baru
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {/* Nama Supplier */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Supplier <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="PT Supplier Jaya"
                      />
                    </div>

                    {/* Tipe Supplier */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipe Supplier <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.supplier_type}
                        onChange={(e) => setFormData({ ...formData, supplier_type: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="raw_materials">Bahan Baku</option>
                        <option value="finished_goods">Barang Jadi</option>
                        <option value="both">Bahan & Barang</option>
                        <option value="services">Jasa</option>
                      </select>
                    </div>

                    {/* Telepon */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telepon
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="08123456789"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="supplier@example.com"
                      />
                    </div>

                    {/* Alamat */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alamat
                      </label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Jl. Contoh No. 123, Jakarta"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Menyimpan...' : 'Simpan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    disabled={submitting}
                    className="mt-3 w-full sm:mt-0 sm:w-auto inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
