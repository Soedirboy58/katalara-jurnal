'use client'

import { useState, useMemo } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { Button } from '@/components/ui/Button'
import { ProductKPICards } from './ProductKPICards'
import { ProductCategoryTabs } from './ProductCategoryTabs'
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
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

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
    
    // Calculate total stock value
    const totalStockValue = products.reduce((sum, p) => {
      if (p.track_inventory && p.stock) {
        return sum + (p.stock * p.cost_price)
      }
      return sum
    }, 0)
    
    // Count low stock products
    const lowStockCount = products.filter(p => {
      if (!p.track_inventory) return false
      const stock = p.stock || 0
      const minStock = p.min_stock_alert || 0
      return stock > 0 && stock <= minStock
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
          if (!p.track_inventory) return false
          const stock = p.stock || 0
          const minStock = p.min_stock_alert || 0
          return stock > 0 && stock <= minStock
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
    if (!confirm(`Hapus ${selectedProducts.length} produk yang dipilih?`)) return

    for (const id of selectedProducts) {
      await deleteProduct(id)
    }
    setSelectedProducts([])
    alert('Produk berhasil dihapus')
  }

  const handleBulkExport = () => {
    const selectedData = products.filter(p => selectedProducts.includes(p.id))
    const csv = [
      ['Nama', 'SKU', 'Kategori', 'Harga Beli', 'Harga Jual', 'Stok'].join(','),
      ...selectedData.map(p => 
        [p.name, p.sku, p.category, p.cost_price, p.selling_price, p.stock || 0].join(',')
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'produk-export.csv'
    a.click()
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

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedProducts.length}
        onClearSelection={() => setSelectedProducts([])}
        onBulkCategory={() => alert('Bulk category change coming soon!')}
        onBulkAdjustStock={() => alert('Bulk stock adjustment coming soon!')}
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

      {/* ⚠️ StockAdjustModal disabled - stock tracking not in schema */}
    </div>
  )
}
