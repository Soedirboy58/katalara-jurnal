'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useProducts } from '@/hooks/useProducts'
import type { Product, ProductFormData } from '@/types'
import { generateSKU } from '@/utils/helpers'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onSuccess: () => void
}

export function ProductModal({ isOpen, onClose, product, onSuccess }: ProductModalProps) {
  const { createProduct, updateProduct } = useProducts()
  const [loading, setLoading] = useState(false)
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
    }
  }, [product, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Auto-generate SKU if empty
      const sku = formData.sku || generateSKU(formData.name, formData.category)

      if (product) {
        const { error } = await updateProduct(product.id, { ...formData, sku })
        if (error) throw new Error(error)
      } else {
        const { error } = await createProduct({
          ...formData,
          sku,
          owner_id: '', // Will be set by RLS
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any)
        if (error) throw new Error(error)
      }

      onSuccess()
      onClose()
      alert(product ? 'Produk berhasil diupdate!' : 'Produk berhasil ditambahkan!')
    } catch (error: any) {
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
