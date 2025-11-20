'use client'

import type { Product } from '@/types'
import { 
  PencilSquareIcon,
  AdjustmentsHorizontalIcon,
  TrashIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface ProductCardViewProps {
  products: Product[]
  loading: boolean
  selectedProducts: string[]
  onSelectProduct: (productId: string) => void
  onEdit: (product: Product) => void
  onAdjustStock: (product: Product) => void
  onDelete: (product: Product) => void
}

export function ProductCardView({
  products,
  loading,
  selectedProducts,
  onSelectProduct,
  onEdit,
  onAdjustStock,
  onDelete
}: ProductCardViewProps) {
  
  const formatCurrency = (value: number) => `Rp ${value.toLocaleString('id-ID')}`

  const getStockStatus = (product: Product) => {
    if (!product.track_inventory) return { label: 'Tidak dilacak', icon: '➖', color: 'bg-gray-100 text-gray-700' }
    if (product.stock_quantity === 0) return { label: 'Habis', icon: '❌', color: 'bg-red-100 text-red-700' }
    if (product.stock_quantity <= product.min_stock_alert * 0.5) 
      return { label: 'Kritis', icon: '🔴', color: 'bg-orange-100 text-orange-700' }
    if (product.stock_quantity <= product.min_stock_alert) 
      return { label: 'Rendah', icon: '⚠️', color: 'bg-yellow-100 text-yellow-700' }
    return { label: 'Sehat', icon: '✅', color: 'bg-green-100 text-green-700' }
  }

  const getMargin = (product: Product) => {
    if (product.buy_price === 0) return 0
    return ((product.sell_price - product.buy_price) / product.buy_price) * 100
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
            <div className="h-20 bg-gray-200 rounded mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada produk</h3>
        <p className="text-sm text-gray-600">Mulai dengan menambahkan produk pertama Anda</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {products.map((product) => {
        const status = getStockStatus(product)
        const margin = getMargin(product)
        const isSelected = selectedProducts.includes(product.id)

        return (
          <div
            key={product.id}
            className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
              isSelected 
                ? 'border-blue-500 shadow-md' 
                : 'border-gray-200 hover:shadow-md hover:border-gray-300'
            }`}
          >
            {/* Card Header with Checkbox */}
            <div className="p-2.5 sm:p-4 border-b border-gray-200">
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                  {/* Checkbox */}
                  <div className="flex-shrink-0 pt-0.5">
                    <div 
                      onClick={() => onSelectProduct(product.id)}
                      className="cursor-pointer"
                    >
                      <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected 
                          ? 'bg-blue-600 border-blue-600' 
                          : 'border-gray-300 hover:border-blue-500'
                      }`}>
                        {isSelected && <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />}
                      </div>
                    </div>
                  </div>

                  {/* Product Icon */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl sm:text-2xl">📦</span>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-xs sm:text-sm line-clamp-2 mb-0.5 sm:mb-1 leading-tight">
                      {product.name}
                    </h3>
                    {product.category && (
                      <span className="inline-flex px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                        {product.category}
                      </span>
                    )}
                    {product.sku && (
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 truncate">SKU: {product.sku}</p>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex-shrink-0">
                  <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full ${status.color} whitespace-nowrap`}>
                    <span className="hidden sm:inline">{status.icon} </span>{status.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-2.5 sm:p-4 space-y-2 sm:space-y-3">
              {/* Stock Info */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs text-gray-600">Stok</span>
                <div className="text-right">
                  <span className="text-xs sm:text-sm font-bold text-gray-900">
                    {product.stock_quantity.toLocaleString()} {product.stock_unit}
                  </span>
                  {product.min_stock_alert > 0 && (
                    <p className="text-[9px] sm:text-xs text-gray-500">Min: {product.min_stock_alert}</p>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs text-gray-600">Harga Beli</span>
                  <span className="text-xs sm:text-sm text-gray-700">{formatCurrency(product.buy_price)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs text-gray-600">Harga Jual</span>
                  <span className="text-xs sm:text-sm font-bold text-gray-900">{formatCurrency(product.sell_price)}</span>
                </div>
                <div className="flex items-center justify-between pt-1 sm:pt-2 border-t border-gray-100">
                  <span className="text-[10px] sm:text-xs text-gray-600">Margin</span>
                  <span className={`text-xs sm:text-sm font-bold ${margin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {margin > 0 ? '+' : ''}{margin.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Stock Value */}
              <div className="bg-blue-50 rounded-lg p-1.5 sm:p-2 flex items-center justify-between">
                <span className="text-[10px] sm:text-xs text-blue-700 font-medium">Nilai Stok</span>
                <span className="text-xs sm:text-sm font-bold text-blue-700">
                  {formatCurrency(product.stock_quantity * product.sell_price)}
                </span>
              </div>
            </div>

            {/* Card Footer - Actions */}
            <div className="px-2.5 sm:px-4 py-1.5 sm:py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <div className="grid grid-cols-3 gap-1 sm:gap-2">
                <button
                  onClick={() => onEdit(product)}
                  className="flex flex-col items-center justify-center py-1 sm:py-2 px-2 sm:px-3 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-colors group"
                >
                  <PencilSquareIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 group-hover:text-blue-600 mb-0.5 sm:mb-1" />
                  <span className="text-[10px] sm:text-xs font-medium text-gray-600 group-hover:text-blue-600">Edit</span>
                </button>
                
                <button
                  onClick={() => onAdjustStock(product)}
                  className="flex flex-col items-center justify-center py-1 sm:py-2 px-2 sm:px-3 bg-white border border-gray-300 rounded-lg hover:bg-green-50 hover:border-green-500 transition-colors group"
                >
                  <AdjustmentsHorizontalIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 group-hover:text-green-600 mb-0.5 sm:mb-1" />
                  <span className="text-[10px] sm:text-xs font-medium text-gray-600 group-hover:text-green-600">Stok</span>
                </button>
                
                <button
                  onClick={() => onDelete(product)}
                  className="flex flex-col items-center justify-center py-1 sm:py-2 px-2 sm:px-3 bg-white border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-500 transition-colors group"
                >
                  <TrashIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 group-hover:text-red-600 mb-0.5 sm:mb-1" />
                  <span className="text-[10px] sm:text-xs font-medium text-gray-600 group-hover:text-red-600">Hapus</span>
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
