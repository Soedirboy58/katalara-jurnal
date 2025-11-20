'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  MapPinIcon, 
  ClockIcon, 
  PhoneIcon,
  ShoppingBagIcon 
} from '@heroicons/react/24/outline'

interface Product {
  id: string
  name: string
  sell_price: number
  stock_quantity: number
  stock_unit: string
  category?: string
  track_inventory: boolean
  is_active: boolean
}

interface StoreInfo {
  business_name: string
  phone_number?: string
  store_location?: string
  store_hours?: string
  whatsapp_number?: string
}

export default function StorefrontPage() {
  const params = useParams()
  const userId = params?.userId as string
  const supabase = createClient()

  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    loadStorefront()
  }, [userId])

  const loadStorefront = async () => {
    try {
      setLoading(true)

      // Load store info
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('business_name')
        .eq('user_id', userId)
        .single()

      // Load store config
      const { data: config } = await supabase
        .from('business_configurations')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (profile) {
        setStoreInfo({
          business_name: profile.business_name,
          phone_number: config?.phone_number,
          store_location: config?.store_location,
          store_hours: config?.store_hours,
          whatsapp_number: config?.whatsapp_number
        })
      }

      // Load products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (productsData) {
        setProducts(productsData)
      }
    } catch (error) {
      console.error('Error loading storefront:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[]]

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory)

  const formatCurrency = (value: number) => {
    return `Rp ${value.toLocaleString('id-ID')}`
  }

  const handleOrder = (product: Product) => {
    const message = `Halo, saya tertarik dengan produk:\n\n` +
      `📦 *${product.name}*\n` +
      `💰 ${formatCurrency(product.sell_price)}\n\n` +
      `Apakah masih tersedia?`
    
    const phone = storeInfo?.whatsapp_number || storeInfo?.phone_number || ''
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodedMessage}`, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat lapak...</p>
        </div>
      </div>
    )
  }

  if (!storeInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Lapak Tidak Ditemukan</h1>
          <p className="text-gray-600">Lapak online ini tidak tersedia</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBagIcon className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              {storeInfo.business_name}
            </h1>
            <p className="text-blue-100 text-lg">
              🛒 Lapak Online
            </p>
          </div>

          {/* Store Info */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {storeInfo.store_location && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <MapPinIcon className="w-5 h-5 mx-auto mb-2" />
                <p className="text-sm">{storeInfo.store_location}</p>
              </div>
            )}
            {storeInfo.store_hours && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <ClockIcon className="w-5 h-5 mx-auto mb-2" />
                <p className="text-sm">{storeInfo.store_hours}</p>
              </div>
            )}
            {(storeInfo.whatsapp_number || storeInfo.phone_number) && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <PhoneIcon className="w-5 h-5 mx-auto mb-2" />
                <p className="text-sm">{storeInfo.whatsapp_number || storeInfo.phone_number}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {cat === 'all' ? '📦 Semua Produk' : cat}
              </button>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Belum ada produk tersedia</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.track_inventory && product.stock_quantity === 0
              
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Product Image Placeholder */}
                  <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <ShoppingBagIcon className="w-12 h-12 text-gray-400" />
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm sm:text-base">
                      {product.name}
                    </h3>
                    
                    {product.category && (
                      <p className="text-xs text-gray-500 mb-2">{product.category}</p>
                    )}

                    <div className="mb-3">
                      <p className="text-lg sm:text-xl font-bold text-blue-600">
                        {formatCurrency(product.sell_price)}
                      </p>
                      {product.track_inventory && (
                        <p className={`text-xs mt-1 ${isOutOfStock ? 'text-red-600' : 'text-gray-500'}`}>
                          {isOutOfStock ? 'Stok habis' : `Stok: ${product.stock_quantity} ${product.stock_unit}`}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleOrder(product)}
                      disabled={isOutOfStock}
                      className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                        isOutOfStock
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {isOutOfStock ? '❌ Habis' : '📲 Pesan'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            Powered by <span className="font-bold text-blue-400">Katalara</span> 🚀
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Platform Business Intelligence untuk UMKM Indonesia
          </p>
        </div>
      </div>
    </div>
  )
}
