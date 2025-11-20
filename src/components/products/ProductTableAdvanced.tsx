'use client'

import { useState } from 'react'
import type { Product } from '@/types'
import { 
  ChevronUpIcon, 
  ChevronDownIcon,
  PencilSquareIcon,
  AdjustmentsHorizontalIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

interface ProductTableAdvancedProps {
  products: Product[]
  loading: boolean
  selectedProducts: string[]
  onSelectProduct: (productId: string) => void
  onSelectAll: () => void
  onEdit: (product: Product) => void
  onAdjustStock: (product: Product) => void
  onDelete: (product: Product) => void
  currentPage: number
  totalPages: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (count: number) => void
}

type SortField = 'name' | 'stock_quantity' | 'buy_price' | 'sell_price' | 'category'
type SortDirection = 'asc' | 'desc'

export function ProductTableAdvanced({
  products,
  loading,
  selectedProducts,
  onSelectProduct,
  onSelectAll,
  onEdit,
  onAdjustStock,
  onDelete,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange
}: ProductTableAdvancedProps) {
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const formatCurrency = (value: number) => `Rp ${value.toLocaleString('id-ID')}`

  const getStockStatus = (product: Product) => {
    if (!product.track_inventory) return { label: '-', color: 'text-gray-500 bg-gray-100' }
    if (product.stock_quantity === 0) return { label: '❌ Habis', color: 'text-red-700 bg-red-100' }
    if (product.stock_quantity <= product.min_stock_alert * 0.5) 
      return { label: '🔴 Kritis', color: 'text-orange-700 bg-orange-100' }
    if (product.stock_quantity <= product.min_stock_alert) 
      return { label: '⚠️ Rendah', color: 'text-yellow-700 bg-yellow-100' }
    return { label: '✅ Sehat', color: 'text-green-700 bg-green-100' }
  }

  const getMargin = (product: Product) => {
    if (product.buy_price === 0) return 0
    return ((product.sell_price - product.buy_price) / product.buy_price) * 100
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUpIcon className="w-4 h-4 text-gray-400" />
    return sortDirection === 'asc' 
      ? <ChevronUpIcon className="w-4 h-4 text-blue-600" />
      : <ChevronDownIcon className="w-4 h-4 text-blue-600" />
  }

  const allSelected = products.length > 0 && products.every(p => selectedProducts.includes(p.id))
  const someSelected = selectedProducts.length > 0 && !allSelected

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Memuat data produk...</p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum ada produk</h3>
        <p className="text-gray-600 mb-6">Mulai dengan menambahkan produk pertama Anda</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={input => {
                    if (input) input.indeterminate = someSelected
                  }}
                  onChange={onSelectAll}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  <span>Produk</span>
                  <SortIcon field="name" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center gap-1">
                  <span>Kategori</span>
                  <SortIcon field="category" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('stock_quantity')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Stok</span>
                  <SortIcon field="stock_quantity" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('buy_price')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Harga Beli</span>
                  <SortIcon field="buy_price" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('sell_price')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Harga Jual</span>
                  <SortIcon field="sell_price" />
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => {
              const status = getStockStatus(product)
              const margin = getMargin(product)
              const isSelected = selectedProducts.includes(product.id)

              return (
                <tr 
                  key={product.id} 
                  className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-2 sm:px-4 py-2 sm:py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelectProduct(product.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-sm sm:text-lg">📦</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{product.name}</div>
                        {product.sku && (
                          <div className="text-[10px] sm:text-xs text-gray-500 truncate">SKU: {product.sku}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3">
                    {product.category ? (
                      <span className="inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {product.category}
                      </span>
                    ) : (
                      <span className="text-[10px] sm:text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                    <div className="text-xs sm:text-sm font-semibold text-gray-900">
                      {product.stock_quantity.toLocaleString()} {product.stock_unit}
                    </div>
                    {product.min_stock_alert > 0 && (
                      <div className="text-[9px] sm:text-xs text-gray-500">Min: {product.min_stock_alert}</div>
                    )}
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm text-gray-600">
                    {formatCurrency(product.buy_price)}
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                    <div className="text-xs sm:text-sm font-semibold text-gray-900">
                      {formatCurrency(product.sell_price)}
                    </div>
                    <div className={`text-[9px] sm:text-xs ${margin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {margin > 0 ? '+' : ''}{margin.toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3">
                    <div className="flex justify-center">
                      <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full whitespace-nowrap ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3">
                    <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                      <button
                        onClick={() => onEdit(product)}
                        className="p-1 sm:p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <PencilSquareIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => onAdjustStock(product)}
                        className="p-1 sm:p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Adjust Stock"
                      >
                        <AdjustmentsHorizontalIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(product)}
                        className="p-1 sm:p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile List View - No Horizontal Scroll */}
      <div className="md:hidden divide-y divide-gray-200">
        {products.map((product) => {
          const status = getStockStatus(product)
          const margin = getMargin(product)
          const isSelected = selectedProducts.includes(product.id)

          return (
            <div 
              key={product.id}
              className={`p-3 ${isSelected ? 'bg-blue-50' : 'bg-white'}`}
            >
              {/* Header Row - Checkbox + Name + Actions */}
              <div className="flex items-start gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onSelectProduct(product.id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mt-1"
                />
                <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">📦</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{product.name}</div>
                  {product.sku && (
                    <div className="text-[10px] text-gray-500">SKU: {product.sku}</div>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onEdit(product)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onAdjustStock(product)}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                    title="Stok"
                  >
                    <AdjustmentsHorizontalIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(product)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Hapus"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Info Grid - 2 Columns */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs ml-14">
                {/* Category */}
                {product.category && (
                  <div className="col-span-2">
                    <span className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-700">
                      {product.category}
                    </span>
                  </div>
                )}
                
                {/* Stock */}
                <div>
                  <span className="text-gray-500">Stok:</span>
                  <span className="font-semibold text-gray-900 ml-1">
                    {product.stock_quantity.toLocaleString()} {product.stock_unit}
                  </span>
                </div>

                {/* Status */}
                <div className="text-right">
                  <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                {/* Buy Price */}
                <div>
                  <span className="text-gray-500">Beli:</span>
                  <span className="text-gray-900 ml-1">{formatCurrency(product.buy_price)}</span>
                </div>

                {/* Sell Price */}
                <div className="text-right">
                  <span className="text-gray-500">Jual:</span>
                  <span className="font-semibold text-gray-900 ml-1">{formatCurrency(product.sell_price)}</span>
                </div>

                {/* Margin - Full Width */}
                <div className="col-span-2 pt-1 border-t border-gray-100">
                  <span className="text-gray-500">Margin:</span>
                  <span className={`font-semibold ml-1 ${margin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {margin > 0 ? '+' : ''}{margin.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      <div className="px-2 sm:px-4 py-2 sm:py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm text-gray-700">
            <span className="hidden sm:inline">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>items per page</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2 sm:px-3 py-0.5 sm:py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] sm:text-sm font-medium"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded text-[10px] sm:text-sm font-medium ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-2 sm:px-3 py-0.5 sm:py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] sm:text-sm font-medium"
            >
              Next
            </button>
          </div>

          <div className="text-[10px] sm:text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      </div>
    </div>
  )
}
