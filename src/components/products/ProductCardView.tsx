'use client'

import type { Product } from '@/types'
import type { ProductLegacy } from '@/types/legacy'
import { 
  PencilSquareIcon,
  AdjustmentsHorizontalIcon,
  TrashIcon,
  CheckCircleIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline'

interface ProductCardViewProps {
  products: Product[]
  loading: boolean
  selectedProducts: string[]
  onSelectProduct: (productId: string) => void
  onEdit: (product: Product) => void
  onAdjustStock: (product: Product) => void
  onDelete: (product: Product) => void
  syncedProducts: Record<string, boolean>
  syncingProducts: Record<string, boolean>
  onSync: (productId: string) => void
  onUnsync: (productId: string) => void
}

export function ProductCardView({
  products,
  loading,
  selectedProducts,
  onSelectProduct,
  onEdit,
  onAdjustStock,
  onDelete,
  syncedProducts,
  syncingProducts,
  onSync,
  onUnsync
}: ProductCardViewProps) {
  const formatCurrency = (value: number) => `Rp ${value.toLocaleString('id-ID')}`

  const getStockQty = (product: Product) => {
    const qty = (product as any).stock_quantity ?? (product as any).stock ?? (product as any).quantity ?? 0
    const asNum = typeof qty === 'string' ? Number(qty) : qty
    return Number.isFinite(asNum) ? asNum : 0
  }

  const getMinStock = (product: Product) => {
    const min = (product as any).min_stock_alert ?? (product as any).min_stock ?? (product as any).low_stock_threshold ?? 0
    const asNum = typeof min === 'string' ? Number(min) : min
    return Number.isFinite(asNum) ? asNum : 0
  }

  const getStockStatus = (product: Product) => {
    if (!(product as any).track_inventory) {
      return { label: 'Sehat', icon: '✅', color: 'bg-green-100 text-green-800' }
    }
    const stockQty = getStockQty(product)
    const minStock = getMinStock(product)
    if (stockQty <= 0) return { label: 'Habis', icon: '⛔', color: 'bg-red-100 text-red-800' }
    if (minStock > 0 && stockQty <= minStock) return { label: 'Rendah', icon: '⚠️', color: 'bg-yellow-100 text-yellow-800' }
    return { label: 'Sehat', icon: '✅', color: 'bg-green-100 text-green-800' }
  }

  const getMargin = (product: Product) => {
    const legacy = product as ProductLegacy
    const costPrice = legacy.cost_price ?? legacy.buy_price ?? 0
    const sellingPrice = legacy.selling_price ?? legacy.sell_price ?? 0
    if (costPrice === 0) return 0
    return ((sellingPrice - costPrice) / costPrice) * 100
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
        const stockQty = getStockQty(product)
        const legacy = product as ProductLegacy
        const purchaseUnit = (product as any).purchase_unit || ''
        const purchaseConversionQty = Number((product as any).purchase_conversion_qty ?? 0)
        const costPrice = legacy.cost_price ?? legacy.buy_price ?? 0
        const costNum = typeof costPrice === 'string' ? Number(costPrice) : costPrice
        const stockValue = Number.isFinite(costNum) ? costNum * stockQty : 0

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
                  <div
                    onClick={() => onSelectProduct(product.id)}
                    className="cursor-pointer"
                  >
                    <div
                      className={`w-4 h-4 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300 hover:border-blue-500'
                      }`}
                    />
                  </div>

                  {/* Product Image/Icon */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {(() => {
                      const legacy = product as ProductLegacy
                      return legacy.image_url ? (
                        <img
                          src={legacy.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('🖼️ Image load error for:', product.name, legacy.image_url)
                            e.currentTarget.style.display = 'none'
                            const parent = e.currentTarget.parentElement
                            if (parent) {
                              parent.innerHTML = '<span class="text-xl sm:text-2xl">📦</span>'
                            }
                          }}
                          onLoad={() => console.log('✅ Image loaded:', product.name)}
                        />
                      ) : (
                        <span className="text-xl sm:text-2xl">📦</span>
                      )
                    })()}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-0.5 sm:mb-1">
                      <h3 className="font-semibold text-gray-900 text-xs sm:text-sm line-clamp-2 leading-tight">
                        {product.name}
                      </h3>
                      {syncedProducts[product.id] && (
                        <span className="inline-flex px-1.5 py-0.5 text-[8px] sm:text-[9px] font-semibold rounded bg-purple-100 text-purple-700 whitespace-nowrap">
                          🛒 Lapak
                        </span>
                      )}
                    </div>
                    {product.category && (
                      <span className="inline-flex px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                        {product.category}
                      </span>
                    )}
                    {product.sku && (
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 truncate">SKU: {product.sku}</p>
                    )}
                    {purchaseUnit && purchaseConversionQty > 0 && (
                      <p className="text-[10px] sm:text-xs text-amber-700 mt-0.5 sm:mt-1 truncate">
                        Beli: 1 {purchaseUnit} = {purchaseConversionQty.toLocaleString('id-ID')} {(product as any).unit || ''}
                      </p>
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
                  <span className="text-xs sm:text-sm font-bold text-gray-900">{stockQty}</span>
                  <span className="text-[10px] sm:text-xs text-gray-500 ml-1">{(product as any).unit || ''}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                  {status.icon} {status.label}
                </span>
              </div>

              {/* Pricing */}
              <div className="space-y-1 sm:space-y-2">
                {(() => {
                  const legacy = product as ProductLegacy
                  const costPrice = legacy.cost_price ?? legacy.buy_price ?? 0
                  const sellingPrice = legacy.selling_price ?? legacy.sell_price ?? 0
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] sm:text-xs text-gray-600">Harga Beli</span>
                        <span className="text-xs sm:text-sm text-gray-700">{formatCurrency(costPrice)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] sm:text-xs text-gray-600">Harga Jual</span>
                        <span className="text-xs sm:text-sm font-bold text-gray-900">{formatCurrency(sellingPrice)}</span>
                      </div>
                    </>
                  )
                })()}
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
                  {formatCurrency(stockValue)}
                </span>
              </div>
            </div>

            {/* Card Footer - Actions */}
            <div className="px-2.5 sm:px-4 py-1.5 sm:py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <div className="grid grid-cols-4 gap-1 sm:gap-2">
                <button
                  onClick={() => onEdit(product)}
                  className="flex flex-col items-center justify-center py-1 sm:py-2 px-1 sm:px-2 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-colors group"
                >
                  <PencilSquareIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 group-hover:text-blue-600 mb-0.5 sm:mb-1" />
                  <span className="text-[9px] sm:text-xs font-medium text-gray-600 group-hover:text-blue-600">Edit</span>
                </button>
                
                <button
                  onClick={() => onAdjustStock(product)}
                  className="flex flex-col items-center justify-center py-1 sm:py-2 px-1 sm:px-2 bg-white border border-gray-300 rounded-lg hover:bg-green-50 hover:border-green-500 transition-colors group"
                >
                  <AdjustmentsHorizontalIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 group-hover:text-green-600 mb-0.5 sm:mb-1" />
                  <span className="text-[9px] sm:text-xs font-medium text-gray-600 group-hover:text-green-600">Stok</span>
                </button>

                {syncedProducts[product.id] ? (
                  <button
                    onClick={() => onUnsync(product.id)}
                    disabled={syncingProducts[product.id]}
                    className="flex flex-col items-center justify-center py-1 sm:py-2 px-1 sm:px-2 bg-green-50 border border-green-500 rounded-lg hover:bg-green-100 transition-colors group disabled:opacity-50"
                  >
                    {syncingProducts[product.id] ? (
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent mb-0.5 sm:mb-1"></div>
                    ) : (
                      <ShoppingBagIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 mb-0.5 sm:mb-1" />
                    )}
                    <span className="text-[9px] sm:text-xs font-medium text-green-600">Lapak</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onSync(product.id)}
                    disabled={syncingProducts[product.id]}
                    className="flex flex-col items-center justify-center py-1 sm:py-2 px-1 sm:px-2 bg-white border border-gray-300 rounded-lg hover:bg-purple-50 hover:border-purple-500 transition-colors group disabled:opacity-50"
                  >
                    {syncingProducts[product.id] ? (
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent mb-0.5 sm:mb-1"></div>
                    ) : (
                      <ShoppingBagIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 group-hover:text-purple-600 mb-0.5 sm:mb-1" />
                    )}
                    <span className="text-[9px] sm:text-xs font-medium text-gray-600 group-hover:text-purple-600">+ Lapak</span>
                  </button>
                )}
                
                <button
                  onClick={() => onDelete(product)}
                  className="flex flex-col items-center justify-center py-1 sm:py-2 px-1 sm:px-2 bg-white border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-500 transition-colors group"
                >
                  <TrashIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 group-hover:text-red-600 mb-0.5 sm:mb-1" />
                  <span className="text-[9px] sm:text-xs font-medium text-gray-600 group-hover:text-red-600">Hapus</span>
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
