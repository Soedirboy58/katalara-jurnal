'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Product } from '@/types'
import { generateSKU } from '@/utils/helpers'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah, parseRupiahInput } from '@/lib/numberFormat'
import { uploadProductImage, PRODUCT_IMAGE_BUCKET, getBucketInfo } from '@/lib/storage/productImages'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onSuccess: () => void
  onCreated?: (product: { id: string; name: string; unit?: string; cost_price?: number }) => void
}

interface ImagePreview {
  file: File
  preview: string
}

export function ProductModal({ isOpen, onClose, product, onSuccess, onCreated }: ProductModalProps) {
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<ImagePreview[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    product_type: 'physical' as 'physical' | 'service',
    unit: 'pcs',
    cost_price: 0,
    selling_price: 0,
    min_stock_alert: 0,
    track_inventory: true,
  })

  useEffect(() => {
    if (product) {
      const inferredType =
        ((product as any).product_type as string | undefined) === 'service'
          ? 'service'
          : ((product as any).product_type as string | undefined) === 'physical'
            ? 'physical'
            : (product.track_inventory === false ? 'service' : 'physical')

      setFormData({
        name: product.name,
        sku: product.sku || '',
        category: product.category || '',
        product_type: inferredType,
        unit: (product as any).unit || 'pcs',
        cost_price: (product as any).cost_price || 0,
        selling_price: (product as any).selling_price || 0,
        min_stock_alert: (product as any).min_stock_alert || 0,
        track_inventory: product.track_inventory ?? true,
      })
      setImages([])
    } else {
      setFormData({
        name: '',
        sku: '',
        category: '',
        product_type: 'physical',
        unit: 'pcs',
        cost_price: 0,
        selling_price: 0,
        min_stock_alert: 0,
        track_inventory: true,
      })
      setImages([])
    }
    setErrorMessage(null)
  }, [product, isOpen])

  // Auto-sync inventory tracking based on item type.
  // Services should not track inventory.
  useEffect(() => {
    if (formData.product_type === 'service' && formData.track_inventory) {
      setFormData((prev) => ({ ...prev, track_inventory: false }))
    }
    if (formData.product_type === 'physical' && product == null) {
      // For new physical products, default to tracking inventory.
      // (User can still turn it off manually if needed.)
      setFormData((prev) => ({ ...prev, track_inventory: prev.track_inventory ?? true }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.product_type])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Validation: Maximum 5 images
    if (images.length + files.length > 5) {
      setErrorMessage('Maksimal 5 gambar. Hapus gambar lain terlebih dahulu.')
      return
    }

    // Validation: File size (max 5MB each)
    const invalidFiles = files.filter(file => file.size > 5 * 1024 * 1024)
    if (invalidFiles.length > 0) {
      setErrorMessage('Beberapa file melebihi 5MB. Pilih file yang lebih kecil.')
      return
    }

    // Create previews for new files
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImages(prev => [
          ...prev,
          {
            file,
            preview: reader.result as string,
            isPrimary: prev.length === 0 // First image is primary by default
          }
        ])
      }
      reader.readAsDataURL(file)
    })

    setErrorMessage(null)
    // Reset input to allow selecting same file again
    e.target.value = ''
  }

  const handleRemoveImage = () => {
    setImages([]) // Clear single image
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // Validation: Minimum 1 image required (can be skipped for quick add from expenses)
    // Comment out strict validation to allow product creation without images
    // if (images.length === 0) {
    //   setErrorMessage('Minimal 1 gambar produk wajib diupload')
    //   return
    // }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Auto-generate SKU if empty
      const sku = formData.sku || generateSKU(formData.name, formData.category)

      // STEP 1: Insert product data
      const productData: any = {
        user_id: user.id,
        name: formData.name,
        sku,
        category: formData.category || null,
        product_type: formData.product_type,
        unit: formData.unit,
        cost_price: formData.cost_price,
        selling_price: formData.selling_price,
        min_stock_alert: formData.min_stock_alert,
        track_inventory: formData.product_type === 'service' ? false : formData.track_inventory,
        is_active: true
      }

      console.log('💾 Saving product data:', productData)

      let productId: string

      if (product) {
        // Update existing product
        let updateResult = await supabase
          .from('products')
          .update({
            ...productData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', product.id)
          .select('id')
          .single()

        if (updateResult.error && updateResult.error.message?.includes('product_type')) {
          const { product_type, ...fallback } = productData
          updateResult = await supabase
            .from('products')
            .update({
              ...fallback,
              updated_at: new Date().toISOString(),
            })
            .eq('id', product.id)
            .select('id')
            .single()
        }

        if (updateResult.error) throw new Error(updateResult.error.message)
        productId = product.id
        console.log('✅ Product updated successfully')
      } else {
        // Create new product - need to get the ID back
        let insertResult = await supabase
          .from('products')
          .insert({
            ...productData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single()

        // Backward compatibility: older schemas may not have `product_type`.
        if (insertResult.error && insertResult.error.message?.includes('product_type')) {
          const { product_type, ...fallback } = productData
          insertResult = await supabase
            .from('products')
            .insert({
              ...fallback,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select('id')
            .single()
        }

        if (insertResult.error) throw new Error(insertResult.error.message)
        if (!insertResult.data) throw new Error('Failed to get product ID after insert')
        
        productId = insertResult.data.id
        console.log('✅ Product created with ID:', productId)
      }

      onCreated?.({
        id: productId,
        name: formData.name,
        unit: formData.unit,
        cost_price: formData.cost_price
      })

      // STEP 2: Upload image to Supabase Storage (only first image, sesuai schema)
      if (images.length > 0) {
        console.log('🖼️ Uploading product image...', {
          bucket: PRODUCT_IMAGE_BUCKET,
          config: getBucketInfo()
        })

        const imageData = images[0] // Hanya ambil gambar pertama
        
        console.log('📁 Uploading image...')

        // Use helper function for upload
        const uploadResult = await uploadProductImage(
          supabase,
          user.id,
          productId,
          imageData.file,
          0
        )

        if (!uploadResult.success || !uploadResult.publicUrl) {
          console.error('❌ Upload error:', uploadResult.error)
          // Produk sudah tersimpan, tapi gambar gagal - tidak perlu throw error
          alert(
            `⚠️ Produk berhasil disimpan, tetapi gambar gagal diupload.\n\n` +
            `Error: ${uploadResult.error}\n\n` +
            `Silakan edit produk dan upload ulang gambar.`
          )
        } else {
          console.log('✅ Image uploaded:', uploadResult.publicUrl)

          // STEP 3: Update products.image_url
          const { error: updateError } = await supabase
            .from('products')
            .update({ image_url: uploadResult.publicUrl })
            .eq('id', productId)

          if (updateError) {
            console.error('❌ Failed to update image_url:', updateError)
            alert(
              `⚠️ Produk berhasil disimpan, tetapi gagal menyimpan URL gambar.\n\n` +
              `Silakan edit produk dan upload ulang gambar.`
            )
          } else {
            console.log('✅ Product image_url updated successfully')
          }
        }
      } else {
        console.log('ℹ️ No image to upload, product created without image')
      }

      // Success!
      onSuccess()
      onClose()
      
      // Show success toast (assuming toast utility exists in project)
      // If not, we'll just log it
      console.log('🎉 Success:', product ? 'Produk berhasil diupdate!' : 'Produk berhasil ditambahkan!')
      
    } catch (error: any) {
      console.error('❌ Submit error:', error)
      setErrorMessage(error.message || 'Gagal menyimpan produk. Silakan coba lagi.')
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

        {/* Single Image Upload (sesuai schema products.image_url) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gambar Produk (Opsional)
          </label>
          
          {/* Image Preview (single image only) */}
          {images.length > 0 && (
            <div className="mb-3 max-w-xs">
              <div className="relative group rounded-lg overflow-hidden border-2 border-gray-300">
                {/* Image Preview */}
                <div className="aspect-square">
                  <img 
                    src={images[0].preview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Remove Button (show on hover) */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors flex items-center gap-2"
                    title="Hapus gambar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-sm font-medium">Hapus</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Upload Button */}
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="product-image"
            />
            <label
              htmlFor="product-image"
              className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg transition-colors border-blue-300 bg-blue-50 text-blue-700 cursor-pointer hover:bg-blue-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium">
                {images.length === 0 ? 'Upload Gambar' : 'Ganti Gambar'}
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              JPG/PNG • Max 5MB • Opsional (1 gambar)
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700 font-medium">{errorMessage}</p>
            </div>
          )}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jenis Item
          </label>
          <select
            value={formData.product_type}
            onChange={(e) => {
              const nextType = e.target.value as 'physical' | 'service'
              setFormData((prev) => ({
                ...prev,
                product_type: nextType,
                // Services should not track inventory.
                track_inventory: nextType === 'service' ? false : prev.track_inventory,
                // Nice default unit for services.
                unit: nextType === 'service' && (!prev.unit || prev.unit === 'pcs') ? 'jam' : prev.unit,
              }))
            }}
            className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="physical">Produk (Barang)</option>
            <option value="service">Jasa (Layanan)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Untuk Jasa, stok tidak akan dilacak.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Harga Beli"
            type="text"
            inputMode="numeric"
            value={formatRupiah(formData.cost_price)}
            onChange={(e) => {
              const parsed = parseRupiahInput(e.target.value)
              setFormData({ ...formData, cost_price: parsed ?? 0 })
            }}
            required
            placeholder="0"
          />
          <Input
            label="Harga Jual"
            type="text"
            inputMode="numeric"
            value={formatRupiah(formData.selling_price)}
            onChange={(e) => {
              const parsed = parseRupiahInput(e.target.value)
              setFormData({ ...formData, selling_price: parsed ?? 0 })
            }}
            required
            placeholder="0"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Satuan
            </label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
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
            value={formData.min_stock_alert || ''}
            onChange={(e) => {
              const val = e.target.value === '' ? 0 : parseFloat(e.target.value)
              setFormData({ ...formData, min_stock_alert: isNaN(val) ? 0 : val })
            }}
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
            disabled={formData.product_type === 'service'}
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
