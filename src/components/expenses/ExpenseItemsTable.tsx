/**
 * ExpenseItemsTable Component
 * 
 * Features:
 * - Add/remove line items
 * - Product search & selection
 * - Quick product creation modal
 * - Auto-calculate subtotals
 */

'use client'

import { Trash2, Plus, Package } from 'lucide-react'
import type { LineItem } from '@/hooks/expenses/useExpenseForm'

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
          {/* Product Name */}
          <div className="md:col-span-2">
            <input
              type="text"
              value={currentItem.product_name || ''}
              onChange={(e) => onCurrentItemChange({ product_name: e.target.value })}
              placeholder="Nama produk/item"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              required
            />
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
              required
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
              required
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
