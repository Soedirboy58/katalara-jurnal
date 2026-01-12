'use client'

import { useState, useEffect } from 'react'
import { X, Search, Plus, Building2, Phone, Mail, MapPin, Loader2 } from 'lucide-react'

interface Supplier {
  id: string
  name: string
  supplier_type: 'raw_materials' | 'finished_goods' | 'both' | 'services'
  phone?: string
  email?: string
  address?: string
  total_purchases?: number
  total_payables?: number
  is_active: boolean
}

interface SupplierModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (supplier: Supplier | null) => void
  selectedSupplier: Supplier | null
}

export default function SupplierModal({ isOpen, onClose, onSelect, selectedSupplier }: SupplierModalProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  
  // Quick Add Form
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    supplier_type: 'finished_goods' as 'raw_materials' | 'finished_goods' | 'both' | 'services',
    phone: '',
    email: '',
    address: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fetch suppliers
  useEffect(() => {
    if (isOpen) {
      fetchSuppliers()
      setErrorMessage(null)
    }
  }, [isOpen])

  // Filter suppliers
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSuppliers(suppliers)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredSuppliers(
        suppliers.filter(
          (s) =>
            s.name.toLowerCase().includes(query) ||
            s.phone?.toLowerCase().includes(query) ||
            s.email?.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, suppliers])

  const fetchSuppliers = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/suppliers?active=true')
      const json = await res.json()
      if (json.success) {
        setSuppliers(json.data)
        setFilteredSuppliers(json.data)
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAdd = async () => {
    // Clear previous error
    setErrorMessage(null)

    if (!newSupplier.name.trim()) {
      setErrorMessage('Nama supplier wajib diisi')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSupplier)
      })
      const json = await res.json().catch(() => ({} as any))

      if (res.ok && json.success) {
        // Refresh list & select new supplier
        await fetchSuppliers()
        onSelect(json.data)
        setShowQuickAdd(false)
        setErrorMessage(null)
        setNewSupplier({
          name: '',
          supplier_type: 'finished_goods',
          phone: '',
          email: '',
          address: ''
        })
      } else {
        setErrorMessage(json.error || 'Gagal menambahkan supplier')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat menambahkan supplier'
      console.error('Error adding supplier:', err)
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectSupplier = (supplier: Supplier) => {
    onSelect(supplier)
    onClose()
  }

  const handleSelectAnonymous = () => {
    onSelect(null)
    onClose()
  }

  const getSupplierTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      raw_materials: '🌾 Bahan Baku',
      finished_goods: '📦 Barang Jadi',
      both: '🔄 Keduanya',
      services: '🛠️ Jasa'
    }
    return labels[type] || type
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-500 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-7 h-7" />
            <div>
              <h2 className="text-xl font-bold">Pilih Supplier</h2>
              <p className="text-red-100 text-sm">Vendor pembelian barang/jasa</p>
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
              placeholder="Cari supplier (nama, telepon, email)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none"
            />
          </div>

          <button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Tambah Supplier Baru
          </button>
        </div>

        {/* Quick Add Form */}
        {showQuickAdd && (
          <div className="p-4 bg-red-50 border-b space-y-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Plus className="w-5 h-5 text-red-600" />
              Supplier Baru
            </h3>

            <input
              type="text"
              placeholder="Nama Supplier *"
              value={newSupplier.name}
              onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />

            <select
              value={newSupplier.supplier_type}
              onChange={(e) => setNewSupplier({ ...newSupplier, supplier_type: e.target.value as 'raw_materials' | 'finished_goods' | 'both' | 'services' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="finished_goods">📦 Barang Jadi (Reseller)</option>
              <option value="raw_materials">🌾 Bahan Baku (Produksi)</option>
              <option value="both">🔄 Keduanya</option>
              <option value="services">🛠️ Jasa</option>
            </select>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="No. Telepon"
                value={newSupplier.phone}
                onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <input
                type="email"
                placeholder="Email"
                value={newSupplier.email}
                onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <textarea
              placeholder="Alamat"
              value={newSupplier.address}
              onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />

            {/* Error Message Display */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-700 font-medium">{errorMessage}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleQuickAdd}
                disabled={isSubmitting}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Simpan Supplier
                  </>
                )}
              </button>
              <button
                onClick={() => setShowQuickAdd(false)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Supplier List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-12 h-12 animate-spin mb-3" />
              <p>Memuat data supplier...</p>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Building2 className="w-16 h-16 mb-3" />
              <p className="text-lg font-medium">Tidak ada supplier</p>
              <p className="text-sm">Klik "Tambah Supplier Baru" untuk memulai</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Anonymous Option */}
              <button
                onClick={handleSelectAnonymous}
                className={`w-full p-4 rounded-lg border-2 transition-all hover:border-gray-400 hover:shadow-md text-left ${
                  selectedSupplier === null
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl">
                    👤
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">Tanpa Supplier</p>
                    <p className="text-sm text-gray-500">Pengeluaran umum/tanpa vendor</p>
                  </div>
                  {selectedSupplier === null && (
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </button>

              {/* Supplier List */}
              {filteredSuppliers.map((supplier) => (
                <button
                  key={supplier.id}
                  onClick={() => handleSelectSupplier(supplier)}
                  className={`w-full p-4 rounded-lg border-2 transition-all hover:border-red-400 hover:shadow-md text-left ${
                    selectedSupplier?.id === supplier.id
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {supplier.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-gray-800 truncate">{supplier.name}</p>
                        {selectedSupplier?.id === supplier.id && (
                          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-red-600 mb-2">{getSupplierTypeLabel(supplier.supplier_type)}</p>
                      <div className="space-y-1 text-sm text-gray-600">
                        {supplier.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{supplier.phone}</span>
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{supplier.email}</span>
                          </div>
                        )}
                        {supplier.address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{supplier.address}</span>
                          </div>
                        )}
                      </div>
                      {(supplier.total_purchases || supplier.total_payables) && (
                        <div className="mt-2 flex gap-3 text-xs">
                          {supplier.total_purchases && (
                            <span className="text-green-600">
                              💰 Rp {supplier.total_purchases.toLocaleString('id-ID')}
                            </span>
                          )}
                          {supplier.total_payables && supplier.total_payables > 0 && (
                            <span className="text-orange-600">
                              ⏳ Hutang: Rp {supplier.total_payables.toLocaleString('id-ID')}
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
            {filteredSuppliers.length} supplier tersedia
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
