'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useProducts } from '@/hooks/useProducts'
import type { Product, ProductFormData } from '@/types'
import { generateSKU } from '@/utils/helpers'
import { createClient } from '@/lib/supabase/client'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onSuccess: () => void
}

export function ProductModal({ isOpen, onClose, product, onSuccess }: ProductModalProps) {
  const { createProduct, updateProduct } = useProducts()
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    sku: '',
    category: '',
    buy_price: 0,
    sell_price: 0,
    stock_quantity: 0,
    stock_unit: 'pcs',
    min_stock_alert: 10,
    track_inventory: true,
  })

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        sku: product.sku || '',
        category: product.category || '',
        buy_price: product.buy_price,
        sell_price: product.sell_price,
        stock_quantity: product.stock_quantity,
        stock_unit: product.stock_unit,
        min_stock_alert: product.min_stock_alert,
        track_inventory: product.track_inventory,
      })
      // Load existing image if available
      if ((product as any).image_url) {
        setImagePreview((product as any).image_url)
      }
    } else {
      setFormData({
        name: '',
        sku: '',
        category: '',
        buy_price: 0,
        sell_price: 0,
        stock_quantity: 0,
        stock_unit: 'pcs',
        min_stock_alert: 10,
        track_inventory: true,
      })
      setImagePreview('')
      setImageFile(null)
    }
  }, [product, isOpen])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      let imageUrl: string | undefined = undefined

      // Upload image to Supabase Storage if new file selected
      if (imageFile) {
        console.log('🖼️ Uploading new image...')
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        // Generate unique filename in products folder
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `products/${user.id}/${Date.now()}.${fileExt}`
        console.log('📁 File path:', fileName)

        // Upload to lapak-images bucket
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('lapak-images')
          .upload(fileName, imageFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('❌ Upload error:', uploadError)
          throw new Error('Gagal upload gambar: ' + uploadError.message)
        }

        console.log('✅ Upload success:', uploadData)

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('lapak-images')
          .getPublicUrl(fileName)
        
        imageUrl = urlData.publicUrl
        console.log('🔗 Public URL:', imageUrl)

        // Delete old image if updating product
        if (product && (product as any).image_url) {
          const oldPath = (product as any).image_url.split('/lapak-images/').pop()
          if (oldPath) {
            console.log('🗑️ Deleting old image:', oldPath)
            await supabase.storage.from('lapak-images').remove([oldPath])
          }
        }
      } else if (product && (product as any).image_url) {
        // Keep existing image URL when editing without changing image
        imageUrl = (product as any).image_url
        console.log('📌 Keeping existing image:', imageUrl)
      }

      // Auto-generate SKU if empty
      const sku = formData.sku || generateSKU(formData.name, formData.category)

      // Prepare data with image_url
      const productData = {
        ...formData,
        sku,
        ...(imageUrl && { image_url: imageUrl })
      }

      console.log('💾 Saving product data:', productData)

      if (product) {
        const { error } = await updateProduct(product.id, productData)
        if (error) throw new Error(error)
        console.log('✅ Product updated successfully')
      } else {
        const { error } = await createProduct({
          ...productData,
          owner_id: '', // Will be set by RLS
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any)
        if (error) throw new Error(error)
        console.log('✅ Product created successfully')
      }

      onSuccess()
      onClose()
      alert(product ? 'Produk berhasil diupdate!' : 'Produk berhasil ditambahkan!')
    } catch (error: any) {
      console.error('❌ Submit error:', error)
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Produk' : 'Tambah Produk Baru'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nama Produk"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Contoh: Kaos Polos Hitam"
        />

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gambar Produk
          </label>
          <div className="flex items-start gap-4">
            {/* Preview */}
            {imagePreview && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-300">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview('')
                    setImageFile(null)
                  }}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            {/* Upload Button */}
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="product-image"
              />
              <label
                htmlFor="product-image"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-gray-700">Pilih Gambar</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Format: JPG, PNG, max 5MB
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="SKU (Kode)"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            placeholder="Auto-generate jika kosong"
          />
          <Input
            label="Kategori"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="Contoh: Pakaian"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Harga Beli"
            type="number"
            value={formData.buy_price}
            onChange={(e) => setFormData({ ...formData, buy_price: parseFloat(e.target.value) })}
            required
            min="0"
            step="1"
          />
          <Input
            label="Harga Jual"
            type="number"
            value={formData.sell_price}
            onChange={(e) => setFormData({ ...formData, sell_price: parseFloat(e.target.value) })}
            required
            min="0"
            step="1"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Stok Awal"
            type="number"
            value={formData.stock_quantity}
            onChange={(e) => setFormData({ ...formData, stock_quantity: parseFloat(e.target.value) })}
            required
            min="0"
            step="1"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Satuan
            </label>
            <select
              value={formData.stock_unit}
              onChange={(e) => setFormData({ ...formData, stock_unit: e.target.value })}
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="pcs">pcs</option>
              <option value="kg">kg</option>
              <option value="gram">gram</option>
              <option value="liter">liter</option>
              <option value="ml">ml</option>
              <option value="box">box</option>
              <option value="pak">pak</option>
              <option value="lusin">lusin</option>
              <option value="meter">meter</option>
            </select>
          </div>
          <Input
            label="Min. Alert"
            type="number"
            value={formData.min_stock_alert}
            onChange={(e) => setFormData({ ...formData, min_stock_alert: parseFloat(e.target.value) })}
            min="0"
            step="1"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="track_inventory"
            checked={formData.track_inventory}
            onChange={(e) => setFormData({ ...formData, track_inventory: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="track_inventory" className="text-sm font-medium text-gray-700">
            Track inventory (auto-kurangi stok saat penjualan)
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan Produk'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
