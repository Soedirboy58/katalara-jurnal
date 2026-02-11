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

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Package, Search } from 'lucide-react'
import type { Product } from '@/modules/inventory/types/inventoryTypes'
import { createClient } from '@/lib/supabase/client'

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
  const supabase = createClient()
  // Current item being added
  const [selectedProductId, setSelectedProductId] = useState('')
  const [productQuery, setProductQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerQuery, setPickerQuery] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState(category === 'product_sales' ? 'pcs' : 'jam')
  const [price, setPrice] = useState('')
  const [showCustomUnit, setShowCustomUnit] = useState(false)
  const [customUnit, setCustomUnit] = useState('')
  const [unitOptions, setUnitOptions] = useState<{ value: string; label: string; isFavorite: boolean }[]>([])
  const [unitLoading, setUnitLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 640px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener?.('change', update)
    return () => mq.removeEventListener?.('change', update)
  }, [])

  useEffect(() => {
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
  }, [supabase])

  const openPicker = () => {
    setPickerQuery('')
    setPickerOpen(true)
  }

  const closePicker = () => {
    setPickerOpen(false)
  }

  const getProductStockQty = (product: any): number | null => {
    if (!product) return null
    if (product.track_inventory === false) return null

    // Support multiple schemas:
    // - stock_quantity (patched schema)
    // - stock (legacy UI/schema)
    // - current_stock (calculated)
    // - quantity (some legacy exports)
    const raw =
      product.stock ??
      product.stock_quantity ??
      product.current_stock ??
      product.quantity
    const n = typeof raw === 'number' ? raw : Number(raw)
    return Number.isFinite(n) ? n : 0
  }

  const formatStockLabel = (product: any): string => {
    const stockQty = getProductStockQty(product)
    if (stockQty === null) return '—'
    return new Intl.NumberFormat('id-ID').format(stockQty)
  }

  const selectedProduct = selectedProductId ? products.find((p) => p.id === selectedProductId) : undefined
  const selectedStockQty = selectedProduct ? getProductStockQty(selectedProduct as any) : null
  const selectedStockDisplay = selectedProduct
    ? selectedStockQty === null
      ? 'Tidak dilacak'
      : `${new Intl.NumberFormat('id-ID').format(selectedStockQty)} ${(selectedProduct as any).unit || 'pcs'}`
    : '—'

  const getSellingPrice = (product: any): number => {
    const raw =
      product?.selling_price ??
      product?.sell_price ??
      product?.price ??
      0
    const n = typeof raw === 'number' ? raw : Number(raw)
    return Number.isFinite(n) ? n : 0
  }

  const bumpProductPickCount = (productId: string) => {
    try {
      const key = 'katalara.productPickCounts.v1'
      const raw = localStorage.getItem(key)
      const counts: Record<string, number> = raw ? JSON.parse(raw) : {}
      counts[productId] = (counts[productId] || 0) + 1
      localStorage.setItem(key, JSON.stringify(counts))
    } catch {
      // ignore
    }
  }

  const getTopPickedProducts = (source: Product[]) => {
    try {
      const raw = localStorage.getItem('katalara.productPickCounts.v1')
      const counts: Record<string, number> = raw ? JSON.parse(raw) : {}
      return [...source]
        .map((p) => ({ p, c: Number(counts[p.id] || 0) }))
        .filter((x) => x.c > 0)
        .sort((a, b) => b.c - a.c)
        .slice(0, 5)
        .map((x) => x.p)
    } catch {
      return []
    }
  }

  const selectProduct = (p: any) => {
    setSelectedProductId(p.id)
    setProductQuery(p.name || '')
    setShowDropdown(false)
    if (p.unit) setUnit(p.unit)
    const sellPrice = getSellingPrice(p) || 0
    setPrice(new Intl.NumberFormat('id-ID').format(sellPrice))
    bumpProductPickCount(p.id)
    closePicker()
  }

  const filteredProducts = useMemo(() => {
    // Category-based filtering (match legacy behavior):
    // - product_sales => show only physical products
    // - service_income => show only services
    // - other_income => no items
    const desiredType: 'physical' | 'service' | null =
      category === 'service_income'
        ? 'service'
        : category === 'product_sales'
          ? 'physical'
          : null

    if (category === 'other_income') return []

    const productsByType = desiredType
      ? products.filter((p: any) => {
          const t = (p as any).product_type
          if (t === 'physical' || t === 'service') return t === desiredType

          // Backward compatibility when `product_type` is missing:
          // - services usually have `track_inventory = false`
          if (desiredType === 'service') return p.track_inventory === false
          return p.track_inventory !== false
        })
      : products

    const q = productQuery.trim().toLowerCase()
    if (!q) return productsByType
    return productsByType.filter((p) => (p.name || '').toLowerCase().includes(q))
  }, [productQuery, products, category])

  const pickerProducts = useMemo(() => {
    const desiredType: 'physical' | 'service' | null =
      category === 'service_income'
        ? 'service'
        : category === 'product_sales'
          ? 'physical'
          : null

    if (category === 'other_income') return []

    const productsByType = desiredType
      ? products.filter((p: any) => {
          const t = (p as any).product_type
          if (t === 'physical' || t === 'service') return t === desiredType
          if (desiredType === 'service') return (p as any).track_inventory === false
          return (p as any).track_inventory !== false
        })
      : products

    const q = pickerQuery.trim().toLowerCase()
    const matched = q
      ? productsByType.filter((p) => (p.name || '').toLowerCase().includes(q))
      : productsByType

    return [...matched].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }, [products, pickerQuery, category])

  const topPickedForPicker = useMemo(() => {
    if (!isMobile) return [] as Product[]
    const top = getTopPickedProducts(pickerProducts)
    if (top.length > 0) return top
    return pickerProducts.slice(0, 5)
  }, [pickerProducts, isMobile])

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

  // Auto-fill price and unit when product selected
  useEffect(() => {
    if (selectedProductId) {
      const product = products.find(p => p.id === selectedProductId)
      if (product) {
        const sellPrice = getSellingPrice(product as any) || 0
        setPrice(new Intl.NumberFormat('id-ID').format(sellPrice))
        setProductQuery(product.name || '')
        if ((product as any).unit) setUnit((product as any).unit)
      }
    }
  }, [selectedProductId, products])

  // Keep unit default in sync with category
  useEffect(() => {
    if (unitOptions.length > 0) {
      const hasUnit = unitOptions.some((opt) => opt.value === unit)
      if (!hasUnit) {
        setUnit(unitOptions[0].value)
      }
    } else {
      setUnit(category === 'product_sales' ? 'pcs' : 'jam')
    }
    setShowCustomUnit(false)
    setCustomUnit('')
  }, [category, unitOptions])

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
    
    // Check for duplicate products
    const isDuplicate = items.some(item => item.product_id === selectedProductId)
    if (isDuplicate) {
      alert(`⚠️ Produk "${product.name}" sudah ada dalam daftar!\n\nHapus item sebelumnya atau edit jumlahnya.`)
      return
    }

    const finalUnit = unit === '__CUSTOM__' ? customUnit : unit
    if (!finalUnit) {
      alert('⚠️ Mohon pilih atau masukkan satuan')
      return
    }

    const qty = parseNumber(quantity)
    const priceNum = parseNumber(price)
    const buyPrice = (product as any).cost_price || 0
    
    // Validate quantity
    if (qty <= 0) {
      alert('⚠️ Jumlah harus lebih dari 0')
      return
    }
    
    // Validate price
    if (priceNum <= 0) {
      alert('⚠️ Harga harus lebih dari 0')
      return
    }
    
    // Check stock availability for tracked products
    if ((product as any).track_inventory && (product as any).current_stock !== undefined) {
      const currentStock = (product as any).current_stock || 0
      if (currentStock < qty) {
        alert(`⚠️ Stok tidak cukup!\n\nStok tersedia: ${currentStock} ${finalUnit}\nYang diminta: ${qty} ${finalUnit}`)
        return
      }
    }
    
    // Warn if selling below cost price
    if (buyPrice > 0 && priceNum < buyPrice) {
      const confirmed = confirm(
        `⚠️ PERINGATAN: Harga Jual Lebih Rendah dari Harga Beli!\n\n` +
        `Harga Beli: Rp ${buyPrice.toLocaleString('id-ID')}\n` +
        `Harga Jual: Rp ${priceNum.toLocaleString('id-ID')}\n` +
        `Rugi per unit: Rp ${(buyPrice - priceNum).toLocaleString('id-ID')}\n\n` +
        `Apakah Anda yakin ingin melanjutkan?`
      )
      if (!confirmed) return
    }
    
    const subtotal = qty * priceNum

    const legacy = product as ProductLegacy
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      product_id: selectedProductId,
      product_name: product.name,
      quantity: qty,
      unit: finalUnit,
      price: priceNum,
      subtotal: subtotal,
      buy_price: buyPrice,
      service_duration: (product as any).service_duration
    }

    onChange([...items, newItem])

    // Reset form
    setSelectedProductId('')
    setProductQuery('')
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

  // Helper function for profit calculation
  const calculateTotalProfit = (items: LineItem[]) => {
    return items.reduce((sum, item) => 
      sum + ((item.price - (item.buy_price || 0)) * item.quantity), 0
    )
  }

  const totalSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  const totalProfit = calculateTotalProfit(items)

  return (
    <div className="space-y-4">
      {/* Add Item Form */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">
          ➕ Tambah Item
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Product Selection */}
          <div className="lg:col-span-2 relative" ref={dropdownRef}>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Produk/Layanan
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={productQuery}
                  onChange={(e) => {
                    if (isMobile) return
                    const v = e.target.value
                    setProductQuery(v)
                    setShowDropdown(true)
                    // Clear selection when user edits text to avoid stale product_id
                    setSelectedProductId('')
                    setPrice('')
                  }}
                  onFocus={() => {
                    if (isMobile) {
                      openPicker()
                      return
                    }
                    setShowDropdown(true)
                  }}
                  onClick={() => {
                    if (isMobile) openPicker()
                  }}
                  placeholder={`Ketik nama ${category === 'service_income' ? 'layanan' : 'produk'} atau pilih dari daftar`}
                  className="w-full px-3 py-2.5 pr-9 border border-gray-300 rounded-xl bg-white text-sm sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  disabled={loadingProducts}
                  readOnly={isMobile}
                />
                <button
                  type="button"
                  onClick={() => {
                      </div>
                    ) : filteredProducts.length > 0 ? (
                      <>
                        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur px-4 py-2 border-b border-gray-100 text-xs text-gray-600 font-medium flex items-center gap-2">
                          <Search className="w-3 h-3" />
                          {filteredProducts.length} {category === 'service_income' ? 'layanan' : 'produk'} ditemukan
                        </div>
                        {filteredProducts.map((p) => {
                          const stockQty = getProductStockQty(p as any)
                          const sellPrice = getSellingPrice(p as any)
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                selectProduct(p as any)
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-blue-50/60 focus:bg-blue-50/60 transition-colors border-b border-gray-100 last:border-0"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-gray-900 text-sm truncate">
                                    {p.name}
                                  </div>

                                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                                    {(p as any).unit && (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                                        <Package className="w-3 h-3" />
                                        {(p as any).unit}
                                      </span>
                                    )}

                                    {stockQty !== null && (
                                      <span
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${
                                          stockQty > 0
                                            ? 'bg-green-50 text-green-700'
                                            : 'bg-red-50 text-red-700'
                                        }`}
                                      >
                                        Stok: {new Intl.NumberFormat('id-ID').format(stockQty)}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex-shrink-0">
                                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                    Rp {new Intl.NumberFormat('id-ID').format(sellPrice)}
                                  </span>
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </>
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500">
                        <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>Tidak ada produk yang cocok</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
=======
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loadingProducts}
              >
                <option value="">Pilih {category === 'service_income' ? 'Layanan' : 'Produk'}...</option>
                {products.map((p) => {
                  const legacy = p as ProductLegacy
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} - Rp {new Intl.NumberFormat('id-ID').format(legacy.selling_price || legacy.sell_price || 0)}
                    </option>
                  )
                })}
              </select>
>>>>>>> 11f62bb (Fix additional TypeScript ESLint errors in dashboard and component files)
              {onAddProduct && (
                <button
                  type="button"
                  onClick={onAddProduct}
                  className="px-3 py-2.5 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 whitespace-nowrap shadow-sm"
                >
                  + Baru
                </button>
              )}
            </div>

            {/* Mobile picker (bottom sheet) */}
            {isMobile && pickerOpen && (
              <div className="fixed inset-0 z-[60] sm:hidden">
                <button
                  className="absolute inset-0 bg-black/10 backdrop-blur-sm"
                  onClick={closePicker}
                  aria-label="Tutup pilih produk"
                  type="button"
                />

                <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl border-t border-gray-200 max-h-[80vh] overflow-hidden">
                  <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">Pilih {category === 'service_income' ? 'Layanan' : 'Produk'}</p>
                        <p className="text-xs text-gray-500 truncate">Tap item untuk menambahkan ke transaksi</p>
                      </div>
                      <button
                        type="button"
                        onClick={closePicker}
                        className="h-9 w-9 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                        aria-label="Tutup"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="mt-3 relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        value={pickerQuery}
                        onChange={(e) => setPickerQuery(e.target.value)}
                        placeholder={`Cari ${category === 'service_income' ? 'layanan' : 'produk'}...`}
                        className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="px-4 py-3 overflow-y-auto max-h-[calc(80vh-104px)]">
                    {loadingProducts ? (
                      <div className="py-8 text-center text-sm text-gray-500">Memuat produk...</div>
                    ) : (
                      <>
                        {topPickedForPicker.length > 0 && pickerQuery.trim() === '' && (
                          <div className="mb-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Terlaris</p>
                            <div className="mt-2 space-y-2">
                              {topPickedForPicker.map((p: any) => (
                                <MobileProductRow
                                  key={p.id}
                                  p={p}
                                  getSellingPrice={getSellingPrice}
                                  getProductStockQty={getProductStockQty}
                                  onSelect={() => selectProduct(p)}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {pickerQuery.trim() ? 'Hasil pencarian' : 'Semua'}
                        </p>
                        <div className="mt-2 space-y-2">
                          {pickerProducts.length === 0 ? (
                            <div className="py-8 text-center text-sm text-gray-500">Tidak ada item</div>
                          ) : (
                            pickerProducts.slice(0, 50).map((p: any) => (
                              <MobileProductRow
                                key={p.id}
                                p={p}
                                getSellingPrice={getSellingPrice}
                                getProductStockQty={getProductStockQty}
                                onSelect={() => selectProduct(p)}
                              />
                            ))
                          )}
                        </div>
                        {pickerProducts.length > 50 && (
                          <p className="mt-3 text-center text-xs text-gray-500">Perkecil pencarian untuk melihat lebih banyak</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
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
                {unitLoading && <option value={unit}>Memuat satuan...</option>}
                {!unitLoading && unitOptions.length === 0 && (
                  <option value={unit}>Satuan default</option>
                )}
                {!unitLoading &&
                  unitOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                <option value="__CUSTOM__">Custom...</option>
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
          <div className="lg:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Harga (Rp)
            </label>
            <input
              type="text"
              value={price}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Stock (read-only) */}
          <div className="lg:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Stok
            </label>
            <input
              type="text"
              value={selectedStockDisplay}
              readOnly
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700"
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
          {/* Mobile: cards (no horizontal scroll) */}
          <div className="sm:hidden p-3 space-y-2">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.product_name}</p>
                    <p className="mt-1 text-xs text-gray-600">
                      {new Intl.NumberFormat('id-ID').format(item.quantity)} {item.unit} × Rp {new Intl.NumberFormat('id-ID').format(item.price)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 text-red-600 hover:bg-red-50"
                    aria-label="Hapus item"
                  >
                    🗑️
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Subtotal</span>
                  <span className="text-sm font-bold text-gray-900">Rp {new Intl.NumberFormat('id-ID').format(item.subtotal)}</span>
                </div>
              </div>
            ))}

            <div className="pt-1 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Total</span>
              <span className="text-sm font-bold text-blue-600">Rp {new Intl.NumberFormat('id-ID').format(totalSubtotal)}</span>
            </div>
          </div>

          {/* Desktop/tablet: table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Harga Jual</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Harga Beli</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Profit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => {
                  const profitPerUnit = item.price - (item.buy_price || 0)
                  const totalProfit = profitPerUnit * item.quantity
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{item.product_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">
                        {new Intl.NumberFormat('id-ID').format(item.quantity)} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">
                        Rp {new Intl.NumberFormat('id-ID').format(item.price)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-right">
                        Rp {new Intl.NumberFormat('id-ID').format(item.buy_price || 0)}
                      </td>
                      <td className={`px-4 py-3 text-sm font-medium text-right ${
                        totalProfit < 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {totalProfit < 0 && '-'}
                        Rp {new Intl.NumberFormat('id-ID').format(Math.abs(totalProfit))}
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
                  )
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">
                    Total Profit
                  </td>
                  <td className={`px-4 py-3 text-sm font-bold text-right ${
                    totalProfit < 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    Rp {new Intl.NumberFormat('id-ID').format(Math.abs(totalProfit))}
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

function MobileProductRow({
  p,
  getSellingPrice,
  getProductStockQty,
  onSelect
}: {
  p: any
  getSellingPrice: (product: any) => number
  getProductStockQty: (product: any) => number | null
  onSelect: () => void
}) {
  const stockQty = getProductStockQty(p)
  const sellPrice = getSellingPrice(p)

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm hover:shadow-md active:scale-[0.995] transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-gray-900 truncate">{p.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
            {p.unit && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                <Package className="w-3 h-3" />
                {p.unit}
              </span>
            )}
            {stockQty !== null && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${
                  stockQty > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
              >
                Stok: {new Intl.NumberFormat('id-ID').format(stockQty)}
              </span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            Rp {new Intl.NumberFormat('id-ID').format(sellPrice)}
          </span>
        </div>
      </div>
    </button>
  )
}
