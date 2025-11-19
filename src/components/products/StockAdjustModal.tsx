'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useProducts } from '@/hooks/useProducts'
import type { Product } from '@/types'
import { formatNumber } from '@/utils/helpers'

interface StockAdjustModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onSuccess: () => void
}

export function StockAdjustModal({ isOpen, onClose, product, onSuccess }: StockAdjustModalProps) {
  const { adjustStock } = useProducts()
  const [loading, setLoading] = useState(false)
  const [quantityChange, setQuantityChange] = useState<string>('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    setLoading(true)
    try {
      const change = parseFloat(quantityChange)
      if (isNaN(change) || change === 0) {
        throw new Error('Masukkan jumlah perubahan yang valid')
      }

      const { data, error } = await adjustStock(product.id, change, notes)
      
      if (error) throw new Error(error)

      const result = typeof data === 'string' ? JSON.parse(data) : data
      
      if (result.success) {
        alert(`✅ Stok disesuaikan: ${result.previous_stock} → ${result.new_stock}`)
        onSuccess()
        onClose()
        setQuantityChange('')
        setNotes('')
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!product) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sesuaikan Stok Manual"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Produk:</p>
          <p className="text-lg font-semibold text-gray-900">{product.name}</p>
          <p className="text-sm text-gray-600 mt-2">
            Stok saat ini: <strong>{formatNumber(product.stock_quantity)} {product.stock_unit}</strong>
          </p>
        </div>

        <Input
          label="Perubahan Stok"
          type="number"
          value={quantityChange}
          onChange={(e) => setQuantityChange(e.target.value)}
          required
          step="1"
          placeholder="Contoh: +50 atau -20"
        />
        
        <p className="text-xs text-gray-500">
          Gunakan + untuk tambah, - untuk kurangi. Contoh: +50, -20
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Catatan
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Alasan penyesuaian stok..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Menyesuaikan...' : 'Sesuaikan Stok'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
