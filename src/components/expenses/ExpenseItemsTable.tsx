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
import type { Product } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface ExpenseItemsTableProps {
  lineItems: LineItem[]
  products: Product[]
  loadingProducts?: boolean
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
  mode: 'inventory' | 'general'
  title?: string
  nameLabel?: string
  namePlaceholder?: string
  enableQuickCreateProduct?: boolean
}

export const ExpenseItemsTable: React.FC<ExpenseItemsTableProps> = ({
  lineItems,
  products,
  loadingProducts = false,
  currentItem,
  onAddItem,
  onRemoveItem,
  onCurrentItemChange,
  onShowProductModal,
  mode,
  title,
  nameLabel,
  namePlaceholder,
  enableQuickCreateProduct = true
}) => {
  const getProductStock = (p: any): number => {
    const raw = p?.stock_quantity ?? p?.stock ?? p?.current_stock ?? 0
    const n = Number(raw)
    return Number.isFinite(n) ? n : 0
  }

  // Product autocomplete state
  const [filteredProducts, setFilteredProducts] = useState<typeof products>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [unitOptions, setUnitOptions] = useState<{ value: string; label: string; isFavorite: boolean }[]>([])
  const [unitLoading, setUnitLoading] = useState(false)
  
  const formatQuantityInput = (input: string) => {
    const normalized = input.replace(/\s+/g, '').replace(/\./g, ',')
    if (normalized === '') return ''

    const sanitized = normalized.replace(/[^0-9,]/g, '')
    const commaIndex = sanitized.indexOf(',')

    if (commaIndex === -1) return sanitized

    const integerPart = sanitized.slice(0, commaIndex)
    const decimalPart = sanitized.slice(commaIndex + 1).replace(/,/g, '')
    if (sanitized.endsWith(',') && decimalPart === '') return `${integerPart},`
    return `${integerPart},${decimalPart}`
  }

  const parseQuantityInput = (input: string) => {
    const normalized = input.replace(/\s+/g, '').replace(/\./g, '').replace(',', '.')
    const n = Number(normalized)
    return Number.isFinite(n) ? n : 0
  }

  const formatPriceInput = (input: string) => {
    const digitsOnly = input.replace(/\D/g, '')
    if (digitsOnly === '') return ''
    return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  const parsePriceInput = (input: string) => {
    const digitsOnly = input.replace(/\D/g, '')
    const n = Number(digitsOnly)
    return Number.isFinite(n) ? n : 0
  }

  // Calculate current item subtotal
  const currentSubtotal =
    (parseQuantityInput(currentItem.quantity || '0') || 0) *
    (parsePriceInput(currentItem.price_per_unit || '0') || 0)

  // Format rupiah
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const categoryToBusinessType = (category?: string | null): 'dagang' | 'jasa' | 'produksi' => {
    const c = (category || '').toString().toLowerCase()
    if (c.includes('jasa')) return 'jasa'
    if (c.includes('trading') || c.includes('reseller')) return 'dagang'
    if (c.includes('produk') || c.includes('stok') || c.includes('hybrid')) return 'produksi'
    return 'dagang'
  }

  const matchesBusinessType = (types: string[] | null | undefined, type: 'dagang' | 'jasa' | 'produksi') => {
    if (!types || types.length === 0) return true
    return types.map((t) => t.toLowerCase()).includes(type)
  }
  
  // Update filtered products when products change
  useEffect(() => {
    if (mode === 'inventory') {
      // Inventory purchase should only show physical/stock-tracked items (exclude services).
      setFilteredProducts(products.filter((p) => (p as any).track_inventory !== false))
      return
    }
    setFilteredProducts(products)
  }, [products])

  useEffect(() => {
    const supabase = createClient()

    const loadUnits = async () => {
      try {
        setUnitLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: config } = await supabase
          .from('business_configurations')
          .select('business_category')
          .eq('user_id', user.id)
          .single()

        const businessType = categoryToBusinessType(config?.business_category)

        const { data: catalog, error: catalogError } = await supabase
          .from('unit_catalog')
          .select('id,name,symbol,business_types,is_default,is_active')
          .eq('is_active', true)

        if (catalogError) throw catalogError

        const { data: prefs, error: prefsError } = await supabase
          .from('business_unit_preferences')
          .select('unit_id,is_active,is_favorite')
          .eq('user_id', user.id)

        if (prefsError) throw prefsError

        const filtered = (catalog || []).filter((unit) => matchesBusinessType(unit.business_types, businessType))
        const options = filtered
          .filter((unit) => {
            const pref = (prefs || []).find((p) => p.unit_id === unit.id)
            if (pref && pref.is_active === false) return false
            return unit.is_active !== false
          })
          .map((unit) => {
            const pref = (prefs || []).find((p) => p.unit_id === unit.id)
            const value = (unit.symbol || unit.name || '').toString()
            return {
              value,
              label: `${unit.name}${unit.symbol ? ` (${unit.symbol})` : ''}`,
              isFavorite: pref?.is_favorite ?? false
            }
          })
          .filter((unit) => unit.value)
          .sort((a, b) => {
            if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1
            return a.label.localeCompare(b.label)
          })

        setUnitOptions(options)
      } catch (error) {
        console.error('Error loading unit options:', error)
      } finally {
        setUnitLoading(false)
      }
    }

    loadUnits()
  }, [])
  
  // Filter products based on input
  useEffect(() => {
    const baseProducts = mode === 'inventory'
      ? products.filter((p) => (p as any).track_inventory !== false)
      : products

    if (currentItem.product_name) {
      const query = currentItem.product_name.toLowerCase()
      const filtered = baseProducts.filter(p => 
        p.name.toLowerCase().includes(query)
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(baseProducts)
    }
  }, [currentItem.product_name, products, mode])
  
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

  // Ensure dropdown is closed for non-inventory mode
  useEffect(() => {
    if (mode !== 'inventory') setShowDropdown(false)
  }, [mode])
  
  // Handle product selection
  const handleProductSelect = (product: Product) => {
    const purchaseUnit = (product as any).purchase_unit || ''
    const purchaseConversionQty = Number((product as any).purchase_conversion_qty ?? 0)
    const baseCost = Number(product.cost_price || 0)
    const defaultPurchasePrice = purchaseUnit && purchaseConversionQty > 0
      ? Math.round(baseCost * purchaseConversionQty)
      : baseCost

    onCurrentItemChange({
      product_id: product.id,
      product_name: product.name,
      unit: purchaseUnit || product.unit || currentItem.unit || 'pcs',
      price_per_unit: defaultPurchasePrice.toString() || '0'
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
          {title || (mode === 'inventory' ? 'Daftar Item Pembelian' : 'Daftar Item Pengeluaran')}
        </h3>
        {mode === 'inventory' && enableQuickCreateProduct && (
          <button
            type="button"
            onClick={onShowProductModal}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 font-semibold text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Buat Produk Baru
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
          {/* Item / Deskripsi */}
          <div className="md:col-span-2 relative" ref={dropdownRef}>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {nameLabel || (mode === 'inventory' ? 'Produk' : 'Item / Deskripsi')}
            </label>

            {mode === 'inventory' ? (
              <div className="relative">
                <input
                  type="text"
                  value={currentItem.product_name || ''}
                  onChange={(e) => handleProductInputChange(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  placeholder={namePlaceholder || 'Ketik nama produk atau pilih dari daftar'}
                  className="w-full h-10 px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <input
                type="text"
                value={currentItem.product_name || ''}
                onChange={(e) => onCurrentItemChange({ product_id: '', product_name: e.target.value })}
                placeholder={namePlaceholder || 'Contoh: Gaji Karyawan, Biaya Iklan, dll'}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            )}
            
            {/* Dropdown List */}
            {mode === 'inventory' && showDropdown && (
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
                    {filteredProducts.map((product) => {
                      const displayStock = getProductStock(product as any)
                      return (
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
                                <span className={displayStock > 0 ? 'text-green-600' : 'text-red-600'}>
                                  Stok: {displayStock}
                                </span>
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
                      )
                    })}
                  </>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>Tidak ada produk yang cocok</p>
                    {enableQuickCreateProduct && (
                      <button
                        type="button"
                        onClick={() => {
                          onShowProductModal()
                          setShowDropdown(false)
                        }}
                        className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 font-semibold text-sm transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Buat Produk Baru
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Quantity */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Qty</label>
            <input
              type="text"
              value={currentItem.quantity || ''}
              onChange={(e) => onCurrentItemChange({ quantity: formatQuantityInput(e.target.value) })}
              placeholder="Qty"
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          
          {/* Unit */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Satuan</label>
            {(() => {
              const rawSelectedUnit = currentItem.unit
              const selectedUnit = rawSelectedUnit ?? 'pcs'
              const isSelectingCustom = rawSelectedUnit === ''
              const isCustomUnit = !!rawSelectedUnit && !unitOptions.some((opt) => opt.value === rawSelectedUnit)

              return (
                <>
                  <select
                    value={isSelectingCustom || isCustomUnit ? '__CUSTOM__' : selectedUnit}
                    onChange={(e) => {
                      if (e.target.value === '__CUSTOM__') {
                        onCurrentItemChange({ unit: '' })
                      } else {
                        onCurrentItemChange({ unit: e.target.value })
                      }
                    }}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    {unitLoading && <option value={selectedUnit}>Memuat satuan...</option>}
                    {!unitLoading && unitOptions.length === 0 && (
                      <>
                        <option value="pcs">Pcs</option>
                        <option value="kg">Kg</option>
                        <option value="liter">Liter</option>
                        <option value="pack">Pack</option>
                        <option value="box">Box</option>
                        <option value="__CUSTOM__">Custom...</option>
                      </>
                    )}
                    {!unitLoading &&
                      unitOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    {!unitLoading && <option value="__CUSTOM__">Custom...</option>}
                  </select>

                  {isSelectingCustom || isCustomUnit ? (
                    <input
                      type="text"
                      value={rawSelectedUnit || ''}
                      onChange={(e) => onCurrentItemChange({ unit: e.target.value })}
                      placeholder="Masukkan satuan custom"
                      className="mt-2 w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  ) : null}
                </>
              )
            })()}
          </div>
          
          {/* Price */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Harga/Unit</label>
            <input
              type="text"
              value={currentItem.price_per_unit || ''}
              onChange={(e) => onCurrentItemChange({ price_per_unit: formatPriceInput(e.target.value) })}
              placeholder="Harga satuan"
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          
          {/* Add Button */}
          <div>
            <div className="h-[1.25rem] mb-1" aria-hidden="true" />
            <button
              type="button"
              onClick={onAddItem}
              className="w-full h-10 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm"
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
          <p className="text-sm">
            Belum ada item. Tambahkan item {mode === 'inventory' ? 'pembelian' : 'pengeluaran'} di atas.
          </p>
        </div>
      )}
    </div>
  )
}
