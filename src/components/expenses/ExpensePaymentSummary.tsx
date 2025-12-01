/**
 * ExpensePaymentSummary Component
 * 
 * Displays financial calculation summary:
 * - Subtotal
 * - Discount
 * - Tax (PPN)
 * - PPh withholding
 * - Other fees
 * - Grand total
 */

'use client'

import { Calculator, Percent, Receipt, Banknote, Plus, X } from 'lucide-react'
import type { CalculationResult } from '@/hooks/expenses/useExpenseCalculations'

interface ExpensePaymentSummaryProps {
  calculations: CalculationResult
  discount: {
    mode: 'percent' | 'nominal'
    percent: number
    fixedAmount: number
  }
  taxEnabled: boolean
  pph: {
    preset: '0' | '1' | '2' | '3' | 'custom'
    percent: number
  }
  otherFees: Array<{ id: string; label: string; amount: number }>
  showOtherFees: boolean
  onDiscountModeChange: (mode: 'percent' | 'nominal') => void
  onDiscountPercentChange: (percent: number) => void
  onDiscountAmountChange: (amount: number) => void
  onTaxEnabledChange: (enabled: boolean) => void
  onPphPresetChange: (preset: '0' | '1' | '2' | '3' | 'custom') => void
  onPphPercentChange: (percent: number) => void
  onAddOtherFee: () => void
  onRemoveOtherFee: (id: string) => void
  onUpdateOtherFee: (id: string, updates: { label?: string; amount?: number }) => void
  onToggleOtherFees: (show: boolean) => void
}

export const ExpensePaymentSummary: React.FC<ExpensePaymentSummaryProps> = ({
  calculations,
  discount,
  taxEnabled,
  pph,
  otherFees,
  showOtherFees,
  onDiscountModeChange,
  onDiscountPercentChange,
  onDiscountAmountChange,
  onTaxEnabledChange,
  onPphPresetChange,
  onPphPercentChange,
  onAddOtherFee,
  onRemoveOtherFee,
  onUpdateOtherFee,
  onToggleOtherFees
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Calculator className="w-5 h-5" />
        Ringkasan Pembayaran
      </h3>
      
      <div className="space-y-4">
        {/* Subtotal */}
        <div className="flex justify-between items-center pb-3 border-b">
          <span className="text-gray-600">Subtotal Item</span>
          <span className="font-semibold text-lg">
            {calculations.formatted.subtotal}
          </span>
        </div>
        
        {/* Discount */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-gray-700">
              <Percent className="w-4 h-4" />
              Diskon
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onDiscountModeChange('percent')}
                className={`px-3 py-1 rounded text-sm ${
                  discount.mode === 'percent'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                %
              </button>
              <button
                type="button"
                onClick={() => onDiscountModeChange('nominal')}
                className={`px-3 py-1 rounded text-sm ${
                  discount.mode === 'nominal'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                Rp
              </button>
            </div>
          </div>
          
          {discount.mode === 'percent' ? (
            <input
              type="number"
              value={discount.percent}
              onChange={(e) => onDiscountPercentChange(parseFloat(e.target.value) || 0)}
              placeholder="0"
              min="0"
              max="100"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          ) : (
            <input
              type="number"
              value={discount.fixedAmount}
              onChange={(e) => onDiscountAmountChange(parseFloat(e.target.value) || 0)}
              placeholder="0"
              min="0"
              step="1000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          )}
          
          {calculations.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>Potongan Diskon</span>
              <span>- {calculations.formatted.discountAmount}</span>
            </div>
          )}
        </div>
        
        {/* After Discount */}
        {calculations.discountAmount > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Setelah Diskon</span>
            <span className="font-medium">{calculations.formatted.afterDiscount}</span>
          </div>
        )}
        
        {/* Tax (PPN) */}
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={taxEnabled}
              onChange={(e) => onTaxEnabledChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <Receipt className="w-4 h-4 text-gray-700" />
            <span className="text-gray-700">PPN 11%</span>
          </label>
          
          {taxEnabled && calculations.taxAmount > 0 && (
            <div className="flex justify-between text-sm text-blue-600">
              <span>Pajak PPN</span>
              <span>+ {calculations.formatted.taxAmount}</span>
            </div>
          )}
        </div>
        
        {/* PPh (Tax Withholding) */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-gray-700">
            <Banknote className="w-4 h-4" />
            PPh (Potongan)
          </label>
          
          <div className="grid grid-cols-2 gap-2">
            <select
              value={pph.preset}
              onChange={(e) => onPphPresetChange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="0">Tidak ada</option>
              <option value="1">PPh 22 (1.5%)</option>
              <option value="2">PPh 23 (2%)</option>
              <option value="3">PPh 4(2) (10%)</option>
              <option value="custom">Custom</option>
            </select>
            
            {pph.preset === 'custom' && (
              <input
                type="number"
                value={pph.percent}
                onChange={(e) => onPphPercentChange(parseFloat(e.target.value) || 0)}
                placeholder="0"
                min="0"
                max="100"
                step="0.1"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            )}
          </div>
          
          {calculations.pphAmount > 0 && (
            <div className="flex justify-between text-sm text-orange-600">
              <span>PPh Dipotong</span>
              <span>- {calculations.formatted.pphAmount}</span>
            </div>
          )}
        </div>
        
        {/* Other Fees */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onToggleOtherFees(!showOtherFees)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
          >
            <Plus className="w-4 h-4" />
            {showOtherFees ? 'Sembunyikan' : 'Tambahkan'} Biaya Lain
          </button>
          
          {showOtherFees && (
            <div className="space-y-2 pl-6">
              {otherFees.map((fee) => (
                <div key={fee.id} className="flex gap-2">
                  <input
                    type="text"
                    value={fee.label}
                    onChange={(e) => onUpdateOtherFee(fee.id, { label: e.target.value })}
                    placeholder="Nama biaya"
                    className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="number"
                    value={fee.amount}
                    onChange={(e) => onUpdateOtherFee(fee.id, { amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                    className="w-32 px-3 py-1 border border-gray-300 rounded text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveOtherFee(fee.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={onAddOtherFee}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Tambah Biaya
              </button>
            </div>
          )}
          
          {calculations.otherFeesTotal > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Biaya Lain</span>
              <span>+ {calculations.formatted.otherFeesTotal}</span>
            </div>
          )}
        </div>
        
        {/* Grand Total */}
        <div className="flex justify-between items-center pt-4 border-t-2 border-gray-300">
          <span className="text-lg font-semibold text-gray-800">
            Total Pembayaran
          </span>
          <span className="text-2xl font-bold text-blue-600">
            {calculations.formatted.grandTotal}
          </span>
        </div>
      </div>
    </div>
  )
}
