'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Product } from '@/types'
import type { ProductLegacy } from '@/types/legacy'
import { getCostPrice, getSellingPrice } from '@/types/product-schema'
import { generateSKU } from '@/utils/helpers'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah, parseRupiahInput } from '@/lib/numberFormat'
import { uploadProductImage, PRODUCT_IMAGE_BUCKET, getBucketInfo, validateImageFile, MAX_FILE_SIZE, preprocessProductImage, isAllowedImageType } from '@/lib/storage/productImages'
import { showToast, ToastContainer } from '@/components/ui/Toast'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onSuccess: () => void
  onCreated?: (product: { id: string; name: string; unit?: string; cost_price?: number; purchase_unit?: string | null; purchase_conversion_qty?: number | null }) => void
}

interface ImagePreview {
  file: File
  preview: string
  isPrimary?: boolean
}

export function ProductModal({ isOpen, onClose, product, onSuccess, onCreated }: ProductModalProps) {
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<ImagePreview[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    category: '',
    product_type: 'physical' as 'physical' | 'service',
    unit: 'pcs',
    purchase_unit: '',
    purchase_conversion_qty: 1,
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
      const legacy = product as ProductLegacy
      setFormData({
        name: product.name,
        description: (product as any).description || '',
        sku: product.sku || '',
        category: product.category || '',
        product_type: inferredType,
        product_type: inferredType,
        unit: legacy.unit || (product as any).unit || 'pcs',
        purchase_unit: (product as any).purchase_unit || '',
        purchase_conversion_qty: Number((product as any).purchase_conversion_qty ?? 1) || 1,
        cost_price: getCostPrice(product),
        selling_price: getSellingPrice(product),
        min_stock_alert: (legacy as any).min_stock_alert || (product as any).min_stock_alert || 0,
        track_inventory: product.track_inventory ?? true,
      })
      setImages([])
    } else {
      setFormData({
        name: '',
        description: '',
        sku: '',
        category: '',
        product_type: 'physical',
        unit: 'pcs',
        purchase_unit: '',
        purchase_conversion_qty: 1,
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return

    const availableSlots = 3 - images.length
    if (availableSlots <= 0) {
      setErrorMessage('Maksimal 3 gambar. Hapus gambar lain terlebih dahulu.')
      e.target.value = ''
      return
    }

    const files = selectedFiles.slice(0, availableSlots)
    if (selectedFiles.length > files.length) {
      setErrorMessage('Maksimal 3 gambar. Hanya sebagian gambar yang ditambahkan.')
    } else {
      setErrorMessage(null)
    }

    const nextImages: ImagePreview[] = []

    try {
      for (const file of files) {
        if (!isAllowedImageType(file)) {
          throw new Error(`${file.name}: Format file tidak didukung. Gunakan JPG, PNG, atau WebP`)
        }

        const processedFile = await preprocessProductImage(file)
        const validationError = validateImageFile(processedFile)
        if (validationError) {
          throw new Error(`${file.name}: ${validationError}`)
        }

        const preview = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = () => reject(new Error(`Gagal memuat preview untuk ${file.name}`))
          reader.readAsDataURL(processedFile)
        })

        nextImages.push({
          file: processedFile,
          preview,
        })
      }

      setImages((prev) => {
        const baseLength = prev.length
        return [
          ...prev,
          ...nextImages.map((item, index) => ({
            ...item,
            isPrimary: baseLength === 0 && index === 0,
          })),
        ]
      })
    } catch (error: any) {
      setErrorMessage(error?.message || 'Gagal memproses gambar. Silakan coba lagi.')
    } finally {
      e.target.value = ''
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
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
        description: formData.description || null,
        sku,
        category: formData.category || null,
        product_type: formData.product_type,
        unit: formData.unit,
        purchase_unit: formData.product_type === 'service' ? null : (formData.purchase_unit || null),
        purchase_conversion_qty:
          formData.product_type === 'service' || !formData.purchase_unit
            ? null
            : Math.max(0, Number(formData.purchase_conversion_qty || 0)),
        cost_price: formData.cost_price,
        selling_price: formData.selling_price,
        min_stock_alert: formData.min_stock_alert,
        track_inventory: formData.product_type === 'service' ? false : formData.track_inventory,
        is_active: true
      }

      const stripMissingColumnAndRetry = async (mode: 'insert' | 'update', productId?: string) => {
        let payload = { ...productData }

        for (let attempt = 0; attempt < 6; attempt++) {
          const query = mode === 'update'
            ? supabase.from('products').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', productId!).select('id').single()
            : supabase.from('products').insert({ ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }).select('id').single()

          const result = await query
          if (!result.error) return result

          const message = result.error.message || ''
          const missingMatch = message.match(/Could not find the '([^']+)' column/i)
          const missingColumn = missingMatch?.[1]

          if (!missingColumn || !Object.prototype.hasOwnProperty.call(payload, missingColumn)) {
            return result
          }

          delete payload[missingColumn]
        }

        return {
          data: null,
          error: new Error('Failed to save product after compatibility retries')
        } as any
      }

      console.log('💾 Saving product data:', productData)

      let productId: string

      if (product) {
        const updateResult = await stripMissingColumnAndRetry('update', product.id)

        if (updateResult.error) throw new Error(updateResult.error.message)
        productId = product.id
        console.log('✅ Product updated successfully')
      } else {
        const insertResult = await stripMissingColumnAndRetry('insert')

        if (insertResult.error) throw new Error(insertResult.error.message)
        if (!insertResult.data) throw new Error('Failed to get product ID after insert')
        
        productId = insertResult.data.id
        console.log('✅ Product created with ID:', productId)
      }

      onCreated?.({
        id: productId,
        name: formData.name,
        unit: formData.unit,
        cost_price: formData.cost_price,
        purchase_unit: formData.purchase_unit || null,
        purchase_conversion_qty: formData.purchase_conversion_qty || null,
      })

      // STEP 2: Upload image to Supabase Storage (only first image, sesuai schema)
      if (images.length > 0) {
        console.log('🖼️ Uploading product images...', {
          bucket: PRODUCT_IMAGE_BUCKET,
          config: getBucketInfo()
        })

        const uploadResults = await Promise.all(
          images.slice(0, 3).map((imageData, index) =>
            uploadProductImage(supabase, user.id, productId, imageData.file, index)
          )
        )

        const successUrls = uploadResults
          .filter((r) => r.success && r.publicUrl)
          .map((r) => r.publicUrl as string)

        if (successUrls.length === 0) {
          const firstError = uploadResults.find((r) => r.error)?.error
          showToast(
            `Produk berhasil disimpan, tetapi gambar gagal diupload. ${firstError || ''}`.trim(),
            'warning'
          )
        } else {
          const updatePayload: any = {
            image_url: successUrls[0],
            image_urls: successUrls,
          }

          const { error: updateError } = await supabase
            .from('products')
            .update(updatePayload)
            .eq('id', productId)

          if (updateError) {
            console.error('❌ Failed to update image_url(s):', updateError)
            showToast(
              'Produk berhasil disimpan, tetapi gagal menyimpan URL gambar. Silakan edit produk dan upload ulang gambar.',
              'warning'
            )
          } else {
            showToast('Gambar produk berhasil diupload', 'success')
          }

          const failedCount = uploadResults.filter((r) => !r.success).length
          if (failedCount > 0) {
            showToast(`${failedCount} gambar gagal diupload`, 'warning')
          }
        }
      } else {
        console.log('ℹ️ No image to upload, product created without image')
      }

      // Success!
      onSuccess(productId)
      onClose()
      
      showToast(product ? 'Produk berhasil diupdate!' : 'Produk berhasil ditambahkan!', 'success')
      
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Produk</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Contoh: Kue nastar homemade, renyah dan lembut di mulut"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Multi Image Upload (max 3) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gambar Produk (Opsional)
          </label>
          
          {/* Image Previews */}
          {images.length > 0 && (
            <div className="mb-3 grid grid-cols-3 gap-3">
              {images.map((img, index) => (
                <div key={`${img.preview}-${index}`} className="relative group rounded-lg overflow-hidden border border-gray-300">
                  <div className="aspect-square">
                    <img
                      src={img.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Hapus gambar"
                  >
                    ×
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded">
                      Utama
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Upload Button */}
          <div>
            <input
              type="file"
              accept="image/*"
              multiple
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
                {images.length === 0 ? 'Upload Gambar' : 'Tambah/Ganti Gambar'}
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              JPG/PNG/WebP • Max {Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB • Maks 3 gambar
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
              Satuan Dasar Stok/Jual
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

        {formData.product_type === 'physical' && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-amber-900">Konversi Satuan Pembelian</p>
              <p className="text-xs text-amber-800 mt-1">
                Gunakan ini jika produk dibeli dari supplier dengan satuan berbeda dari satuan stok/jual. Contoh: stok dan jual dalam kg, tetapi beli dalam dus.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Satuan Beli Default
                </label>
                <select
                  value={formData.purchase_unit}
                  onChange={(e) => setFormData({ ...formData, purchase_unit: e.target.value })}
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sama dengan satuan dasar</option>
                  <option value="pcs">pcs</option>
                  <option value="kg">kg</option>
                  <option value="gram">gram</option>
                  <option value="liter">liter</option>
                  <option value="ml">ml</option>
                  <option value="box">box</option>
                  <option value="pak">pak</option>
                  <option value="lusin">lusin</option>
                  <option value="dus">dus</option>
                  <option value="karung">karung</option>
                  <option value="ikat">ikat</option>
                </select>
              </div>

              <Input
                label={`1 ${formData.purchase_unit || 'satuan beli'} = berapa ${formData.unit}?`}
                type="number"
                value={formData.purchase_conversion_qty || ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : Number(e.target.value)
                  setFormData({ ...formData, purchase_conversion_qty: Number.isFinite(val) ? val : 0 })
                }}
                min="0"
                step="0.001"
                placeholder="Contoh: 20"
              />
            </div>

            <p className="text-xs text-gray-600">
              Contoh: jika produk dijual per kg dan dibeli per dus isi 20 kg, set satuan dasar = kg, satuan beli = dus, dan faktor konversi = 20.
            </p>
          </div>
        )}

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
      <ToastContainer />
    </Modal>
  )
}
