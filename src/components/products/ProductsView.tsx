'use client'

import { useState, useMemo, useEffect } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { showToast, ToastContainer } from '@/components/ui/Toast'
import { useConfirm } from '@/hooks/useConfirm'
import { ProductKPICards } from './ProductKPICards'
import { ProductCategoryTabs } from './ProductCategoryTabs'
// import { ProductTableAdvanced } from './ProductTableAdvanced' // ⚠️ Disabled - uses old schema fields
import { ProductTable } from './ProductTable'
import { ProductCardView } from './ProductCardView'
import { BulkActionsBar } from './BulkActionsBar'
import { ProductModal } from './ProductModal'
// import { StockAdjustModal } from './StockAdjustModal' // ⚠️ Disabled - uses stock_quantity field
import { 
  MagnifyingGlassIcon,
  Squares2X2Icon,
  TableCellsIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import type { Product, ProductFilters } from '@/types'

type ViewMode = 'table' | 'card'
type CategoryFilter = 'all' | 'best-seller' | 'low-stock' | 'high-value' | 'new'

export function ProductsView() {
  const [filters, setFilters] = useState<ProductFilters>({})
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [stockProduct, setStockProduct] = useState<Product | null>(null)
  const [stockChange, setStockChange] = useState('')
  const [stockNotes, setStockNotes] = useState('Penyesuaian stok manual')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

  const { 
    products, 
    loading, 
    error, 
    refresh,
    deleteProduct,
    adjustStock,
    getStockStatus
  } = useProducts(filters)

  // Computed values for KPIs  
  const kpiData = useMemo(() => {
    const totalProducts = products.length

    const getStockQty = (p: Product) => {
      const qty = (p as any).stock_quantity ?? (p as any).stock ?? (p as any).quantity ?? 0
      const asNum = typeof qty === 'string' ? Number(qty) : qty
      return Number.isFinite(asNum) ? asNum : 0
    }

    const getCost = (p: Product) => {
      const cost = (p as any).cost_price ?? (p as any).buy_price ?? 0
      const asNum = typeof cost === 'string' ? Number(cost) : cost
      return Number.isFinite(asNum) ? asNum : 0
    }

    // Compute only if schema supports stock_quantity/stock
    const totalStockValue = products.reduce((sum, p) => sum + (getCost(p) * getStockQty(p)), 0)

    const lowStockCount = products.filter(p => {
      const st = getStockStatus(p)
      return st === 'LOW' || st === 'CRITICAL' || st === 'OUT_OF_STOCK'
    }).length

    // Best seller (placeholder - would need sales data)
    const bestSeller = products[0]?.name || 'N/A'
    const topRevenueProduct = products[0]?.name || 'N/A'
    const topRevenue = 0 // Would calculate from sales data

    return {
      totalProducts,
      totalStockValue,
      bestSellerName: bestSeller,
      lowStockCount,
      topRevenueProduct,
      topRevenueAmount: topRevenue
    }
  }, [products])

  // Filter products based on category and search
  const filteredProducts = useMemo(() => {
    let filtered = [...products]

    // Apply category filter
    switch (categoryFilter) {
      case 'low-stock':
        filtered = filtered.filter(p => {
          const st = getStockStatus(p)
          return st === 'LOW' || st === 'CRITICAL' || st === 'OUT_OF_STOCK'
        })
        break
      case 'high-value':
        filtered = filtered.filter(p => p.selling_price >= 50000)
        break
      case 'best-seller':
        // Would filter based on sales data
        filtered = filtered.slice(0, 10)
        break
      case 'new':
        // Would filter based on created_at
        filtered = filtered.slice(0, 20)
        break
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [products, categoryFilter, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredProducts.slice(start, start + itemsPerPage)
  }, [filteredProducts, currentPage, itemsPerPage])

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages])

  // Category tabs
  const categoryTabs = [
    {
      id: 'all' as CategoryFilter,
      label: 'Semua',
      icon: '📦',
      count: products.length,
      color: 'bg-blue-600'
    },
    {
      id: 'best-seller' as CategoryFilter,
      label: 'Best Seller',
      icon: '🔥',
      count: Math.min(10, products.length),
      color: 'bg-red-600'
    },
    {
      id: 'low-stock' as CategoryFilter,
      label: 'Stok Rendah',
      icon: '⚠️',
      count: kpiData.lowStockCount,
      color: 'bg-yellow-600'
    },
    {
      id: 'high-value' as CategoryFilter,
      label: 'High Value',
      icon: '💰',
      count: products.filter(p => p.selling_price >= 50000).length,
      color: 'bg-purple-600'
    },
    {
      id: 'new' as CategoryFilter,
      label: 'Baru',
      icon: '🆕',
      count: Math.min(20, products.length),
      color: 'bg-green-600'
    }
  ]

  // Handlers
  const handleEdit = (product: Product) => {
    setSelectedProduct(product)
    setIsProductModalOpen(true)
  }

  const handleAdjustStock = (product: Product) => {
    setStockProduct(product)
    setStockChange('')
    setStockNotes('Penyesuaian stok manual')
    setIsStockModalOpen(true)
  }

  const handleSubmitStockAdjust = async () => {
    if (!stockProduct) return
    const qtyChange = Number(stockChange)
    if (!Number.isFinite(qtyChange) || qtyChange === 0) {
      showToast('Perubahan stok tidak valid atau 0', 'warning')
      return
    }

    const notes = stockNotes?.trim() || undefined
    const { error } = await adjustStock(stockProduct.id, qtyChange, notes)
    if (error) {
      showToast(`Gagal menyesuaikan stok: ${error}`, 'error')
      return
    }

    showToast('Stok berhasil disesuaikan', 'success')
    setIsStockModalOpen(false)
    setStockProduct(null)
    setStockChange('')
  }

  const handleDelete = async (product: Product) => {
    const ok = await confirm({
      title: 'Hapus produk?',
      message: `Hapus produk "${product.name}"?`,
      confirmText: 'Hapus',
      cancelText: 'Batal',
      type: 'danger'
    })
    if (!ok) return

    const { error } = await deleteProduct(product.id)
    if (error) {
      showToast('Gagal menghapus: ' + error, 'error')
    } else {
      showToast('Produk berhasil dihapus', 'success')
      setSelectedProducts(prev => prev.filter(id => id !== product.id))
    }
  }

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleSelectAll = () => {
    if (selectedProducts.length === paginatedProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(paginatedProducts.map(p => p.id))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      showToast('Pilih produk terlebih dulu', 'warning')
      return
    }

    const ok = await confirm({
      title: 'Hapus banyak produk?',
      message: `Hapus ${selectedProducts.length} produk yang dipilih?`,
      confirmText: 'Hapus Semua',
      cancelText: 'Batal',
      type: 'danger'
    })
    if (!ok) return

    for (const id of selectedProducts) {
      await deleteProduct(id)
    }
    setSelectedProducts([])
    showToast('Produk berhasil dihapus', 'success')
  }

  const handleBulkExport = () => {
    const selectedData = products.filter(p => selectedProducts.includes(p.id))

    const getStockQty = (p: Product) => {
      const qty = (p as any).stock_quantity ?? (p as any).current_stock ?? (p as any).stock ?? (p as any).quantity ?? 0
      const asNum = typeof qty === 'string' ? Number(qty) : qty
      return Number.isFinite(asNum) ? asNum : 0
    }

    const csv = [
      ['Nama', 'SKU', 'Kategori', 'Harga Beli', 'Harga Jual', 'Stok'].join(','),
      ...selectedData.map(p => 
        [
          p.name,
          p.sku,
          p.category,
          (p as any).cost_price ?? (p as any).buy_price ?? 0,
          (p as any).selling_price ?? (p as any).sell_price ?? 0,
          getStockQty(p)
        ].join(',')
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'produk-export.csv'
    a.click()
    showToast('Export berhasil', 'success')
  }

  return (
    <div className="space-y-3 sm:space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Produk Saya</h1>
          <p className="text-xs sm:text-base text-gray-600 mt-0.5 sm:mt-1">
            Kelola katalog produk dan inventory bisnis Anda
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Add Product Button */}
          <Button 
            onClick={() => {
              setSelectedProduct(null)
              setIsProductModalOpen(true)
            }}
            className="w-full sm:w-auto py-2 sm:py-3"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm sm:text-base">Tambah Produk</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <ProductKPICards {...kpiData} />

      {/* Search and View Controls */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            type="search"
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-center sm:justify-start">
          <div className="flex gap-1 bg-gray-100 p-0.5 sm:p-1 rounded-lg w-fit">
            <button
            onClick={() => setViewMode('table')}
            className={`flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md font-medium text-xs sm:text-sm transition-colors ${
              viewMode === 'table'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <TableCellsIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Table</span>
          </button>
          <button
            onClick={() => setViewMode('card')}
            className={`flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md font-medium text-xs sm:text-sm transition-colors ${
              viewMode === 'card'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Squares2X2Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Cards</span>
          </button>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <ProductCategoryTabs
        tabs={categoryTabs}
        activeTab={categoryFilter}
        onTabChange={(tabId) => {
          setCategoryFilter(tabId as CategoryFilter)
          setCurrentPage(1)
        }}
      />

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-semibold">Error:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Results Info */}
      {!loading && filteredProducts.length > 0 && (
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 px-1">
          <span className="truncate">
            {paginatedProducts.length} dari {filteredProducts.length} produk
          </span>
          {selectedProducts.length > 0 && (
            <span className="font-semibold text-blue-600 ml-2 whitespace-nowrap">
              {selectedProducts.length} dipilih
            </span>
          )}
        </div>
      )}

      {/* Product Display */}
      {viewMode === 'table' ? (
        <ProductTable
          products={paginatedProducts}
          loading={loading}
          onEdit={handleEdit}
          onAdjustStock={handleAdjustStock}
          onDelete={handleDelete}
        />
      ) : (
        <ProductCardView
          products={paginatedProducts}
          loading={loading}
          selectedProducts={selectedProducts}
          onSelectProduct={handleSelectProduct}
          onEdit={handleEdit}
          onAdjustStock={handleAdjustStock}
          onDelete={handleDelete}
        />
      )}

      {/* Pagination */}
      {!loading && filteredProducts.length > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
            <span>Halaman</span>
            <span className="font-semibold text-gray-900">{currentPage}</span>
            <span>dari {totalPages}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 text-xs sm:text-sm rounded-md border border-gray-300 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              «
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 text-xs sm:text-sm rounded-md border border-gray-300 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Prev
            </button>

            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page =>
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1
                )
                .map((page, idx, arr) => {
                  const prevPage = arr[idx - 1]
                  const showEllipsis = prevPage && page - prevPage > 1
                  return (
                    <div key={page} className="flex items-center gap-1">
                      {showEllipsis && <span className="px-1 text-gray-400">…</span>}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`px-2.5 py-1.5 text-xs sm:text-sm rounded-md border transition-colors ${
                          page === currentPage
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  )
                })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1.5 text-xs sm:text-sm rounded-md border border-gray-300 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1.5 text-xs sm:text-sm rounded-md border border-gray-300 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              »
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
            <span>Tampilkan</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md bg-white"
            >
              {[10, 20, 30, 50].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span>per halaman</span>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedProducts.length}
        onClearSelection={() => setSelectedProducts([])}
        onBulkCategory={() => showToast('Bulk category change segera hadir', 'info')}
        onBulkAdjustStock={() => showToast('Bulk stock adjustment segera hadir', 'info')}
        onBulkExport={handleBulkExport}
        onBulkDelete={handleBulkDelete}
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

      <Modal
        isOpen={isStockModalOpen}
        onClose={() => {
          setIsStockModalOpen(false)
          setStockProduct(null)
          setStockChange('')
        }}
        title="Penyesuaian Stok"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Produk</p>
            <p className="text-base font-semibold text-gray-900">
              {stockProduct?.name || '-'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Perubahan stok
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={stockChange}
              onChange={(event) => setStockChange(event.target.value)}
              placeholder="Contoh: 5 atau -3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Gunakan nilai negatif untuk mengurangi stok.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
            <textarea
              value={stockNotes}
              onChange={(event) => setStockNotes(event.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsStockModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmitStockAdjust}>
              Simpan
            </Button>
          </div>
        </div>
      </Modal>

      <ToastContainer />
    </div>
  )
}
