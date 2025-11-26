/**
 * LINE ITEMS BUILDER COMPONENT
 * Finance Module - Incomes
 * 
 * Manages multi-item input for product sales & service income
 * Features:
 * - Add/remove items
 * - Real-time subtotal calculation
 * - Product selection with autocomplete
 * - Custom units support
 */

'use client'

import { useState, useEffect } from 'react'
import type { Product } from '@/modules/inventory/types/inventoryTypes'

export interface LineItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  unit: string
  price: number
  subtotal: number
  buy_price?: number // For profit calculation
  service_duration?: number // For services
}

interface LineItemsBuilderProps {
  items: LineItem[]
  onChange: (items: LineItem[]) => void
  products: Product[]
  loadingProducts?: boolean
  category?: string // 'product_sales' or 'service_income'
  onAddProduct?: () => void // Callback to open quick add product modal
}

export function LineItemsBuilder({
  items,
  onChange,
  products,
  loadingProducts = false,
  category = 'product_sales',
  onAddProduct
}: LineItemsBuilderProps) {
  // Current item being added
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState(category === 'product_sales' ? 'pcs' : 'jam')
  const [price, setPrice] = useState('')
  const [showCustomUnit, setShowCustomUnit] = useState(false)
  const [customUnit, setCustomUnit] = useState('')

  // Auto-fill price when product selected
  useEffect(() => {
    if (selectedProductId) {
      const product = products.find(p => p.id === selectedProductId)
      if (product) {
        setPrice(product.selling_price?.toString() || '0')
      }
    }
  }, [selectedProductId, products])

  const formatNumber = (num: string) => {
    const cleaned = num.replace(/\D/g, '')
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  const parseNumber = (str: string) => {
    return parseInt(str.replace(/\./g, '')) || 0
  }

  const handleAddItem = () => {
    if (!selectedProductId || !quantity || !price) {
      alert('⚠️ Mohon lengkapi produk, jumlah, dan harga')
      return
    }

    const product = products.find(p => p.id === selectedProductId)
    if (!product) return

    const finalUnit = unit === '__CUSTOM__' ? customUnit : unit
    if (!finalUnit) {
      alert('⚠️ Mohon pilih atau masukkan satuan')
      return
    }

    const qty = parseNumber(quantity)
    const priceNum = parseNumber(price)
    const subtotal = qty * priceNum

    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      product_id: selectedProductId,
      product_name: product.name,
      quantity: qty,
      unit: finalUnit,
      price: priceNum,
      subtotal: subtotal,
      buy_price: product.cost_price || 0,
      service_duration: (product as any).service_duration
    }

    onChange([...items, newItem])

    // Reset form
    setSelectedProductId('')
    setQuantity('')
    setPrice('')
    setUnit(category === 'product_sales' ? 'pcs' : 'jam')
    setShowCustomUnit(false)
    setCustomUnit('')
  }

  const handleRemoveItem = (id: string) => {
    onChange(items.filter(item => item.id !== id))
  }

  const handleQuantityChange = (value: string) => {
    setQuantity(formatNumber(value))
  }

  const handlePriceChange = (value: string) => {
    setPrice(formatNumber(value))
  }

  const totalSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0)

  return (
    <div className="space-y-4">
      {/* Add Item Form */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">
          ➕ Tambah Item
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Product Selection */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Produk/Layanan
            </label>
            <div className="flex gap-2">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loadingProducts}
              >
                <option value="">Pilih {category === 'service_income' ? 'Layanan' : 'Produk'}...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - Rp {new Intl.NumberFormat('id-ID').format(p.selling_price || 0)}
                  </option>
                ))}
              </select>
              {onAddProduct && (
                <button
                  type="button"
                  onClick={onAddProduct}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 whitespace-nowrap"
                >
                  + Baru
                </button>
              )}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Jumlah
            </label>
            <input
              type="text"
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Unit */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Satuan
            </label>
            {!showCustomUnit ? (
              <select
                value={unit}
                onChange={(e) => {
                  if (e.target.value === '__CUSTOM__') {
                    setShowCustomUnit(true)
                  } else {
                    setUnit(e.target.value)
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {category === 'product_sales' ? (
                  <>
                    <option value="pcs">Pcs</option>
                    <option value="box">Box</option>
                    <option value="pack">Pack</option>
                    <option value="kg">Kg</option>
                    <option value="liter">Liter</option>
                    <option value="meter">Meter</option>
                    <option value="__CUSTOM__">Custom...</option>
                  </>
                ) : (
                  <>
                    <option value="jam">Jam</option>
                    <option value="hari">Hari</option>
                    <option value="sesi">Sesi</option>
                    <option value="bulan">Bulan</option>
                    <option value="__CUSTOM__">Custom...</option>
                  </>
                )}
              </select>
            ) : (
              <div className="flex gap-1">
                <input
                  type="text"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  placeholder="Satuan custom"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomUnit(false)
                    setCustomUnit('')
                    setUnit('pcs')
                  }}
                  className="px-2 py-1 text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Harga Satuan (Rp)
            </label>
            <input
              type="text"
              value={price}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Subtotal Preview */}
          <div className="lg:col-span-1 flex items-end">
            <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
              <div className="text-xs text-gray-500 mb-1">Subtotal</div>
              <div className="font-semibold">
                Rp {new Intl.NumberFormat('id-ID').format(
                  parseNumber(quantity) * parseNumber(price)
                )}
              </div>
            </div>
          </div>

          {/* Add Button */}
          <div className="lg:col-span-1 flex items-end">
            <button
              type="button"
              onClick={handleAddItem}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              ➕ Tambah
            </button>
          </div>
        </div>
      </div>

      {/* Items List */}
      {items.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Harga</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{item.product_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {new Intl.NumberFormat('id-ID').format(item.quantity)} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      Rp {new Intl.NumberFormat('id-ID').format(item.price)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      Rp {new Intl.NumberFormat('id-ID').format(item.subtotal)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">
                    Total
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-blue-600 text-right">
                    Rp {new Intl.NumberFormat('id-ID').format(totalSubtotal)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-400 text-4xl mb-2">📦</div>
          <p className="text-sm text-gray-500">Belum ada item. Tambahkan produk/layanan di atas.</p>
        </div>
      )}
    </div>
  )
}
