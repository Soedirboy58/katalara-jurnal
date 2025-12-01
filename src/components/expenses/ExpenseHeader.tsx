/**
 * ExpenseHeader Component
 * 
 * Displays:
 * - PO Number (auto-generated)
 * - Transaction Date picker
 * - Description field
 * - Notes toggle
 */

'use client'

import { Calendar, FileText, StickyNote } from 'lucide-react'
import type { ExpenseFormState } from '@/hooks/expenses/useExpenseForm'

interface ExpenseHeaderProps {
  poNumber: string
  transactionDate: string
  description: string
  notes: string
  showNotes: boolean
  onTransactionDateChange: (date: string) => void
  onDescriptionChange: (description: string) => void
  onNotesChange: (notes: string) => void
  onToggleNotes: (show: boolean) => void
}

export const ExpenseHeader: React.FC<ExpenseHeaderProps> = ({
  poNumber,
  transactionDate,
  description,
  notes,
  showNotes,
  onTransactionDateChange,
  onDescriptionChange,
  onNotesChange,
  onToggleNotes
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
      {/* Header Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Input Pengeluaran</h2>
          <p className="text-sm text-gray-500 mt-1">
            Catat pembelian bahan baku, barang jadi, atau pengeluaran operasional
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">No. PO</div>
          <div className="text-sm font-mono font-semibold text-blue-600">
            {poNumber}
          </div>
        </div>
      </div>
      
      {/* Transaction Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline-block w-4 h-4 mr-1" />
            Tanggal Transaksi
          </label>
          <input
            type="date"
            value={transactionDate}
            onChange={(e) => onTransactionDateChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="inline-block w-4 h-4 mr-1" />
            Deskripsi Transaksi
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Contoh: Pembelian bahan baku bulan Januari"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
      </div>
      
      {/* Notes Toggle Button */}
      <button
        type="button"
        onClick={() => onToggleNotes(!showNotes)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
      >
        <StickyNote className="w-4 h-4" />
        {showNotes ? 'Sembunyikan' : 'Tambahkan'} Catatan
      </button>
      
      {/* Notes Field */}
      {showNotes && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catatan Tambahan
          </label>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Tambahkan catatan atau informasi penting lainnya..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>
      )}
    </div>
  )
}
