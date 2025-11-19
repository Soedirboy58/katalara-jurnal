'use client'

import { useState } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { Button } from '@/components/ui/Button'
import { ProductTable } from './ProductTable'
import { ProductModal } from './ProductModal'
import { StockAdjustModal } from './StockAdjustModal'
import type { Product, ProductFilters } from '@/types'

export function ProductsView() {
  const [filters, setFilters] = useState<ProductFilters>({})
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const { 
    products, 
    loading, 
    error, 
    refresh,
    deleteProduct,
    adjustStock 
  } = useProducts(filters)

  const handleEdit = (product: Product) => {
    setSelectedProduct(product)
    setIsProductModalOpen(true)
  }

  const handleAdjustStock = (product: Product) => {
    setSelectedProduct(product)
    setIsStockModalOpen(true)
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`Hapus produk "${product.name}"?`)) return

    const { error } = await deleteProduct(product.id)
    if (error) {
      alert('Gagal menghapus: ' + error)
    } else {
      alert('Produk berhasil dihapus')
    }
  }

  const lowStockCount = products.filter(p => {
    if (!p.track_inventory) return false
    return p.stock_quantity <= p.min_stock_alert
  }).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produk</h1>
          <p className="text-gray-600 mt-1">Kelola katalog produk dan inventory</p>
        </div>
        <Button onClick={() => {
          setSelectedProduct(null)
          setIsProductModalOpen(true)
        }}>
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Produk
        </Button>
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold text-red-900">Peringatan Stok!</p>
              <p className="text-sm text-red-700">
                {lowStockCount} produk memiliki stok rendah atau habis. Segera restock!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={filters.status || ''}
          onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Semua Status</option>
          <option value="HEALTHY">✅ Stok Sehat</option>
          <option value="LOW">⚠️ Stok Rendah</option>
          <option value="CRITICAL">🔴 Stok Kritis</option>
          <option value="OUT_OF_STOCK">❌ Habis</option>
        </select>

        <input
          type="search"
          placeholder="Cari produk..."
          value={filters.search || ''}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">
          Error: {error}
        </div>
      )}

      <ProductTable
        products={products}
        loading={loading}
        onEdit={handleEdit}
        onAdjustStock={handleAdjustStock}
        onDelete={handleDelete}
      />

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false)
          setSelectedProduct(null)
        }}
        product={selectedProduct}
        onSuccess={refresh}
      />

      <StockAdjustModal
        isOpen={isStockModalOpen}
        onClose={() => {
          setIsStockModalOpen(false)
          setSelectedProduct(null)
        }}
        product={selectedProduct}
        onSuccess={refresh}
      />
    </div>
  )
}
