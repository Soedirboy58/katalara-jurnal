'use client'

import { useState, useEffect } from 'react'
import { X, Search, Plus, UserCircle, Phone, Mail, MapPin, Loader2, TrendingUp } from 'lucide-react'

interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  total_transactions?: number
  total_purchases?: number
  is_active: boolean
}

interface CustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (customer: Customer | null) => void
  selectedCustomer: Customer | null
}

export default function CustomerModal({ isOpen, onClose, onSelect, selectedCustomer }: CustomerModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  
  // Quick Add Form
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch customers
  useEffect(() => {
    if (isOpen) {
      fetchCustomers()
    }
  }, [isOpen])

  // Filter customers
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCustomers(customers)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredCustomers(
        customers.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.phone?.toLowerCase().includes(query) ||
            c.email?.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, customers])

  const fetchCustomers = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/customers?active=true')
      const json = await res.json()
      if (json.success) {
        setCustomers(json.data)
        setFilteredCustomers(json.data)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAdd = async () => {
    if (!newCustomer.name.trim()) {
      alert('Nama pelanggan wajib diisi!')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer)
      })

      const json = await res.json()
      
      if (json.success) {
        // Refresh list & select new customer
        await fetchCustomers()
        onSelect(json.data)
        setShowQuickAdd(false)
        setNewCustomer({
          name: '',
          phone: '',
          email: '',
          address: ''
        })
      } else {
        alert(json.error || 'Gagal menambahkan pelanggan')
      }
    } catch (error) {
      console.error('Error adding customer:', error)
      alert('Terjadi kesalahan saat menambahkan pelanggan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectCustomer = (customer: Customer) => {
    onSelect(customer)
    onClose()
  }

  const handleSelectAnonymous = () => {
    onSelect(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCircle className="w-7 h-7" />
            <div>
              <h2 className="text-xl font-bold">Pilih Pelanggan</h2>
              <p className="text-blue-100 text-sm">Pilih dari daftar atau tambah pelanggan baru</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search & Quick Add */}
        <div className="p-4 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari pelanggan (nama, telepon, email)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900"
            />
          </div>

          <button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-green-300 rounded-lg text-green-600 hover:bg-green-50 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Tambah Pelanggan Baru
          </button>
        </div>

        {/* Quick Add Form */}
        {showQuickAdd && (
          <div className="p-4 bg-green-50 border-b space-y-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-600" />
              Pelanggan Baru
            </h3>

            <input
              type="text"
              placeholder="Nama Pelanggan *"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="No. Telepon"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              />
              <input
                type="email"
                placeholder="Email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              />
            </div>

            <textarea
              placeholder="Alamat"
              value={newCustomer.address}
              onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-gray-900"
            />

            <div className="flex gap-2">
              <button
                onClick={handleQuickAdd}
                disabled={isSubmitting}
                className="flex-1 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Simpan Pelanggan
                  </>
                )}
              </button>
              <button
                onClick={() => setShowQuickAdd(false)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-900"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-12 h-12 animate-spin mb-3" />
              <p>Memuat data pelanggan...</p>
            </div>
          ) : filteredCustomers.length === 0 && searchQuery === '' ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <UserCircle className="w-16 h-16 mb-3" />
              <p className="text-lg font-medium">Tidak ada pelanggan</p>
              <p className="text-sm">Klik "Tambah Pelanggan Baru" untuk memulai</p>
            </div>
          ) : filteredCustomers.length === 0 && searchQuery !== '' ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Search className="w-16 h-16 mb-3" />
              <p className="text-lg font-medium">Tidak ditemukan</p>
              <p className="text-sm">Coba kata kunci lain atau tambah pelanggan baru</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Anonymous Option */}
              <button
                onClick={handleSelectAnonymous}
                className={`w-full p-4 rounded-lg border-2 transition-all hover:border-gray-400 hover:shadow-md text-left ${
                  selectedCustomer === null
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl">
                    👤
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">Umum / Walk-in</p>
                    <p className="text-sm text-gray-500">Transaksi tidak tercatat ke pelanggan tertentu</p>
                  </div>
                  {selectedCustomer === null && (
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </button>

              {/* Customer List */}
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer)}
                  className={`w-full p-4 rounded-lg border-2 transition-all hover:border-blue-400 hover:shadow-md text-left ${
                    selectedCustomer?.id === customer.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-gray-800 truncate">{customer.name}</p>
                        {selectedCustomer?.id === customer.id && (
                          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        {customer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{customer.phone}</span>
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                        )}
                        {customer.address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{customer.address}</span>
                          </div>
                        )}
                      </div>
                      {(customer.total_transactions || customer.total_purchases) && (
                        <div className="mt-2 flex gap-3 text-xs">
                          {customer.total_transactions && customer.total_transactions > 0 && (
                            <span className="text-blue-600 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {customer.total_transactions} transaksi
                            </span>
                          )}
                          {customer.total_purchases && customer.total_purchases > 0 && (
                            <span className="text-green-600">
                              💰 Rp {customer.total_purchases.toLocaleString('id-ID')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {filteredCustomers.length} pelanggan tersedia
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
