/**
 * ExpenseItemsTable Component
 * 
 * Features:
 * - Add/remove line items
 * - Product search & selection with autocomplete
 * - Quick product creation modal
 * - Auto-calculate subtotals
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Trash2, Plus, Package, Search, ChevronDown } from 'lucide-react'
import type { LineItem } from '@/hooks/expenses/useExpenseForm'
import { useProducts } from '@/hooks/useProducts'

interface ExpenseItemsTableProps {
  lineItems: LineItem[]
  currentItem: {
    product_id?: string
    product_name?: string
    quantity?: string
    unit?: string
    price_per_unit?: string
    notes?: string
  }
  onAddItem: () => void
  onRemoveItem: (id: string) => void
  onCurrentItemChange: (updates: any) => void
  onShowProductModal: () => void
  categoryType: 'raw_materials' | 'finished_goods' | 'services' | ''
}

export const ExpenseItemsTable: React.FC<ExpenseItemsTableProps> = ({
  lineItems,
  currentItem,
  onAddItem,
  onRemoveItem,
  onCurrentItemChange,
  onShowProductModal,
  categoryType
}) => {
  // Use products hook
  const { products, loading: loadingProducts } = useProducts()
  
  // Product autocomplete state
  const [filteredProducts, setFilteredProducts] = useState<typeof products>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Calculate current item subtotal
  const currentSubtotal = 
    (parseFloat(currentItem.quantity || '0') || 0) * 
    (parseFloat(currentItem.price_per_unit || '0') || 0)
  
  // Format rupiah
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }
  
  // Update filtered products when products change
  useEffect(() => {
    setFilteredProducts(products)
  }, [products])
  
  // Filter products based on input
  useEffect(() => {
    if (currentItem.product_name) {
      const query = currentItem.product_name.toLowerCase()
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(query)
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(products)
    }
  }, [currentItem.product_name, products])
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Handle product selection
  const handleProductSelect = (product: typeof products[0]) => {
    onCurrentItemChange({
      product_id: product.id,
      product_name: product.name,
      unit: product.unit || currentItem.unit || 'pcs',
      price_per_unit: (product as any).cost_price?.toString() || '0'
    })
    setShowDropdown(false)
  }
  
  const handleProductInputChange = (value: string) => {
    onCurrentItemChange({ product_name: value })
    if (value.trim()) {
      setShowDropdown(true)
    }
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          <Package className="inline-block w-5 h-5 mr-2" />
          Item Pembelian
        </h3>
        {categoryType && (
          <button
            type="button"
            onClick={onShowProductModal}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Buat Produk Baru
          </button>
        )}
      </div>
      
      {/* Line Items Table */}
      {lineItems.length > 0 && (
        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-gray-600 font-medium">Produk</th>
                <th className="px-4 py-2 text-right text-gray-600 font-medium">Qty</th>
                <th className="px-4 py-2 text-left text-gray-600 font-medium">Satuan</th>
                <th className="px-4 py-2 text-right text-gray-600 font-medium">Harga</th>
                <th className="px-4 py-2 text-right text-gray-600 font-medium">Subtotal</th>
                <th className="px-4 py-2 text-center text-gray-600 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lineItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{item.product_name}</div>
                    {item.notes && (
                      <div className="text-xs text-gray-500 mt-1">{item.notes}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {item.quantity.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.unit}</td>
                  <td className="px-4 py-3 text-right">
                    {formatRupiah(item.price_per_unit)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">
                    {formatRupiah(item.subtotal)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="Hapus item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Add Item Form */}
      <div className="border-t pt-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {/* Product Name with Autocomplete */}
          <div className="md:col-span-2 relative" ref={dropdownRef}>
            <div className="relative">
              <input
                type="text"
                value={currentItem.product_name || ''}
                onChange={(e) => handleProductInputChange(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                placeholder="Ketik nama produk atau pilih dari daftar"
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            
            {/* Dropdown List */}
            {showDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {loadingProducts ? (
                  <div className="p-3 text-center text-sm text-gray-500">
                    <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-2">Memuat produk...</p>
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <>
                    <div className="sticky top-0 bg-gray-50 px-3 py-2 border-b text-xs text-gray-600 font-medium flex items-center gap-2">
                      <Search className="w-3 h-3" />
                      {filteredProducts.length} produk ditemukan
                    </div>
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleProductSelect(product)}
                        className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-800 text-sm truncate">
                              {product.name}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              {product.unit && (
                                <span className="flex items-center gap-1">
                                  <Package className="w-3 h-3" />
                                  {product.unit}
                                </span>
                              )}
                              {product.stock !== undefined && product.stock !== null && (
                                <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                                  Stok: {product.stock}
                                </span>
                              )}
                            </div>
                          </div>
                          {product.cost_price && product.cost_price > 0 && (
                            <div className="ml-3 text-right flex-shrink-0">
                              <div className="text-xs text-gray-500">Harga beli</div>
                              <div className="font-semibold text-sm text-blue-600">
                                {formatRupiah(product.cost_price)}
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>Tidak ada produk yang cocok</p>
                    <button
                      type="button"
                      onClick={() => {
                        onShowProductModal()
                        setShowDropdown(false)
                      }}
                      className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Buat Produk Baru
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Quantity */}
          <div>
            <input
              type="number"
              value={currentItem.quantity || ''}
              onChange={(e) => onCurrentItemChange({ quantity: e.target.value })}
              placeholder="Qty"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          
          {/* Unit */}
          <div>
            <select
              value={currentItem.unit || 'pcs'}
              onChange={(e) => onCurrentItemChange({ unit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="pcs">Pcs</option>
              <option value="kg">Kg</option>
              <option value="gram">Gram</option>
              <option value="liter">Liter</option>
              <option value="ml">ML</option>
              <option value="meter">Meter</option>
              <option value="box">Box</option>
              <option value="karton">Karton</option>
              <option value="lusin">Lusin</option>
              <option value="pack">Pack</option>
            </select>
          </div>
          
          {/* Price */}
          <div>
            <input
              type="number"
              value={currentItem.price_per_unit || ''}
              onChange={(e) => onCurrentItemChange({ price_per_unit: e.target.value })}
              placeholder="Harga satuan"
              min="0"
              step="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          
          {/* Add Button */}
          <div>
            <button
              type="button"
              onClick={onAddItem}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm"
              disabled={
                !currentItem.product_name ||
                !currentItem.quantity ||
                !currentItem.price_per_unit
              }
            >
              <Plus className="w-4 h-4" />
              Tambah
            </button>
          </div>
        </div>
        
        {/* Current Subtotal Preview */}
        {currentSubtotal > 0 && (
          <div className="text-right text-sm text-gray-600">
            Subtotal: <span className="font-semibold">{formatRupiah(currentSubtotal)}</span>
          </div>
        )}
        
        {/* Notes for current item */}
        <div>
          <input
            type="text"
            value={currentItem.notes || ''}
            onChange={(e) => onCurrentItemChange({ notes: e.target.value })}
            placeholder="Catatan untuk item ini (opsional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>
      
      {/* Empty State */}
      {lineItems.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Belum ada item. Tambahkan item pembelian di atas.</p>
        </div>
      )}
    </div>
  )
}
