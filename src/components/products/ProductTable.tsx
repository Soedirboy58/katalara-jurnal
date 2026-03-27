'use client'

import type { Product } from '@/types'
import { formatCurrency, formatNumber } from '@/utils/helpers'
import { Button } from '@/components/ui/Button'

interface ProductTableProps {
  products: Product[]
  loading: boolean
  selectedProducts: string[]
  onSelectProduct: (productId: string) => void
  onSelectAll: () => void
  onEdit: (product: Product) => void
  onAdjustStock: (product: Product) => void
  onDelete: (product: Product) => void
  syncedProducts: Record<string, boolean>
  syncingProducts: Record<string, boolean>
  onSync: (productId: string) => void
  onUnsync: (productId: string) => void
}

export function ProductTable({
  products,
  loading,
  selectedProducts,
  onSelectProduct,
  onSelectAll,
  onEdit,
  onAdjustStock,
  onDelete,
  syncedProducts,
  syncingProducts,
  onSync,
  onUnsync
}: ProductTableProps) {
  const allSelected = products.length > 0 && products.every((p) => selectedProducts.includes(p.id))

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
      return {
        label: 'Sehat',
        badgeClass: 'bg-green-100 text-green-800'
      }
    }
    const stockQty = getStockQty(product)
    const minStock = getMinStock(product)
    if (stockQty <= 0) {
      return { label: 'Habis', badgeClass: 'bg-red-100 text-red-800' }
    }
    if (minStock > 0 && stockQty <= minStock) {
      return { label: 'Rendah', badgeClass: 'bg-yellow-100 text-yellow-800' }
    }
    return { label: 'Sehat', badgeClass: 'bg-green-100 text-green-800' }
  }

  const getMargin = (product: Product) => {
    const cost = (product as any).cost_price ?? (product as any).buy_price ?? 0
    const selling = (product as any).selling_price ?? (product as any).sell_price ?? (product as any).price ?? 0
    const costNum = typeof cost === 'string' ? Number(cost) : cost
    const sellNum = typeof selling === 'string' ? Number(selling) : selling
    if (!Number.isFinite(costNum) || costNum <= 0) return null
    if (!Number.isFinite(sellNum)) return null
    return ((sellNum - costNum) / costNum) * 100
  }

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
        <Button onClick={() => {}}>+ Tambah Produk</Button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-hidden">
        <table className="w-full table-fixed">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-8 px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  type="button"
                  onClick={onSelectAll}
                  className="h-4 w-4 rounded border border-gray-300 flex items-center justify-center"
                  title="Pilih semua di halaman ini"
                >
                  {allSelected && (
                    <span className="text-[10px] text-blue-600">✓</span>
                  )}
                </button>
              </th>
              <th className="hidden sm:table-cell w-40 px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="w-56 px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama Produk
              </th>
              <th className="hidden sm:table-cell w-28 px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kategori
              </th>
              <th className="w-24 px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stok
              </th>
              <th className="hidden md:table-cell w-28 px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Harga Beli
              </th>
              <th className="w-28 px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Harga Jual
              </th>
              <th className="w-28 px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="w-28 px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => {
              const status = getStockStatus(product)
              const margin = getMargin(product)
              const stockQty = getStockQty(product)
              const unit = (product as any).unit || ''
              const purchaseUnit = (product as any).purchase_unit || ''
              const purchaseConversionQty = Number((product as any).purchase_conversion_qty ?? 0)
              const costPrice = (product as any).cost_price ?? (product as any).buy_price ?? 0
              const sellingPrice = (product as any).selling_price ?? (product as any).sell_price ?? (product as any).price ?? 0
              const isSelected = selectedProducts.includes(product.id)

              return (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onSelectProduct(product.id)}
                      className={`h-4 w-4 rounded border flex items-center justify-center ${
                        isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
                      }`}
                      title="Pilih produk"
                    >
                      {isSelected ? '✓' : ''}
                    </button>
                  </td>
                  <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.sku || '-'}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-normal break-words">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    {purchaseUnit && purchaseConversionQty > 0 && (
                      <div className="mt-1 text-xs text-amber-700">
                        Beli: 1 {purchaseUnit} = {formatNumber(purchaseConversionQty)} {unit}
                      </div>
                    )}
                  </td>
                  <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-normal break-words text-sm text-gray-600">
                    {product.category || '-'}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatNumber(stockQty)} {unit}
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                    {formatCurrency(costPrice || 0)}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(sellingPrice || 0)}
                    </div>
                    {margin !== null && (
                      <div className={`text-xs ${margin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Margin: {margin.toFixed(1)}%
                      </div>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-normal text-center">
                    <div className="flex flex-wrap items-center justify-center gap-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.badgeClass}`}>
                        {status.label}
                      </span>
                      {syncedProducts[product.id] && (
                        <span className="inline-flex px-2 py-1 text-[10px] font-semibold rounded-full bg-purple-100 text-purple-700">
                          🛒 Lapak
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(product)}
                        title="Edit"
                      >
                        ✏️
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onAdjustStock(product)}
                        title="Sesuaikan Stok"
                      >
                        📊
                      </Button>
                      {syncedProducts[product.id] ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onUnsync(product.id)}
                          disabled={!!syncingProducts[product.id]}
                          title="Hapus dari Lapak"
                        >
                          🧺
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onSync(product.id)}
                          disabled={!!syncingProducts[product.id]}
                          title="Sync ke Lapak"
                        >
                          🛒
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(product)}
                        title="Hapus"
                      >
                        🗑️
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
