'use client'

import { useEffect, useState } from 'react'
import type { Product } from '@/types'
import { formatCurrency, formatNumber } from '@/utils/helpers'
import { Button } from '@/components/ui/Button'

interface ProductTableProps {
  products: Product[]
  loading: boolean
  onEdit: (product: Product) => void
  onAdjustStock: (product: Product) => void
  onDelete: (product: Product) => void
}

export function ProductTable({ products, loading, onEdit, onAdjustStock, onDelete }: ProductTableProps) {
  const [syncedProducts, setSyncedProducts] = useState<Record<string, boolean>>({})
  const [syncingProducts, setSyncingProducts] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const checkSyncStatus = async () => {
      const statusMap: Record<string, boolean> = {}

      for (const product of products) {
        try {
          const response = await fetch(`/api/lapak/sync-product?productName=${encodeURIComponent(product.name)}`)
          const data = await response.json()
          statusMap[product.id] = data.synced || false
        } catch {
          statusMap[product.id] = false
        }
      }

      setSyncedProducts(statusMap)
    }

    if (products.length > 0) {
      checkSyncStatus()
    }
  }, [products])

  const handleSyncToLapak = async (product: Product) => {
    setSyncingProducts(prev => ({ ...prev, [product.id]: true }))
    try {
      const response = await fetch('/api/lapak/sync-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      })
      const data = await response.json()
      if (!response.ok) {
        alert(data.error || 'Gagal sync ke Lapak')
        return
      }
      setSyncedProducts(prev => ({ ...prev, [product.id]: true }))
      alert(data.message || '✅ Berhasil sync ke Lapak')
    } catch {
      alert('Terjadi kesalahan saat sync ke Lapak')
    } finally {
      setSyncingProducts(prev => ({ ...prev, [product.id]: false }))
    }
  }

  const handleUnsyncFromLapak = async (product: Product) => {
    setSyncingProducts(prev => ({ ...prev, [product.id]: true }))
    try {
      const response = await fetch(`/api/lapak/sync-product?productName=${encodeURIComponent(product.name)}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (!response.ok) {
        alert(data.error || 'Gagal hapus dari Lapak')
        return
      }
      setSyncedProducts(prev => ({ ...prev, [product.id]: false }))
      alert(data.message || '✅ Produk dihapus dari Lapak')
    } catch {
      alert('Terjadi kesalahan saat hapus dari Lapak')
    } finally {
      setSyncingProducts(prev => ({ ...prev, [product.id]: false }))
    }
  }

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
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama Produk
              </th>
              <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kategori
              </th>
              <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stok
              </th>
              <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Harga Beli
              </th>
              <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Harga Jual
              </th>
              <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
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
              const costPrice = (product as any).cost_price ?? (product as any).buy_price ?? 0
              const sellingPrice = (product as any).selling_price ?? (product as any).sell_price ?? (product as any).price ?? 0

              return (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.sku || '-'}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  </td>
                  <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
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
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
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
                          onClick={() => handleUnsyncFromLapak(product)}
                          disabled={!!syncingProducts[product.id]}
                          title="Hapus dari Lapak"
                        >
                          🧺
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSyncToLapak(product)}
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
