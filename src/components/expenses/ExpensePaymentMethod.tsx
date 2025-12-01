/**
 * ExpensePaymentMethod Component
 * 
 * Handles:
 * - Payment status (Lunas/Tempo)
 * - Payment method selection
 * - Down payment for tempo
 * - Due date calculation
 */

'use client'

import { Wallet, CreditCard, Clock, Calendar } from 'lucide-react'

interface ExpensePaymentMethodProps {
  paymentStatus: 'Lunas' | 'Tempo'
  paymentMethod: 'cash' | 'transfer' | 'tempo'
  downPayment: number
  dueDate: string
  tempoDays: number
  grandTotal: number
  onPaymentStatusChange: (status: 'Lunas' | 'Tempo') => void
  onPaymentMethodChange: (method: 'cash' | 'transfer' | 'tempo') => void
  onDownPaymentChange: (amount: number) => void
  onDueDateChange: (date: string) => void
  onTempoDaysChange: (days: number) => void
  validationErrors?: string[]
}

export const ExpensePaymentMethod: React.FC<ExpensePaymentMethodProps> = ({
  paymentStatus,
  paymentMethod,
  downPayment,
  dueDate,
  tempoDays,
  grandTotal,
  onPaymentStatusChange,
  onPaymentMethodChange,
  onDownPaymentChange,
  onDueDateChange,
  onTempoDaysChange,
  validationErrors = []
}) => {
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }
  
  const remainingPayment = grandTotal - downPayment
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Wallet className="w-5 h-5" />
        Metode Pembayaran
      </h3>
      
      <div className="space-y-4">
        {/* Payment Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status Pembayaran
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onPaymentStatusChange('Lunas')}
              className={`px-4 py-3 rounded-lg border-2 transition-all ${
                paymentStatus === 'Lunas'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="font-semibold">Lunas</div>
              <div className="text-xs mt-1">Dibayar penuh</div>
            </button>
            
            <button
              type="button"
              onClick={() => onPaymentStatusChange('Tempo')}
              className={`px-4 py-3 rounded-lg border-2 transition-all ${
                paymentStatus === 'Tempo'
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="font-semibold">Tempo</div>
              <div className="text-xs mt-1">Bayar nanti</div>
            </button>
          </div>
        </div>
        
        {/* Payment Method (only for Lunas) */}
        {paymentStatus === 'Lunas' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cara Pembayaran
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onPaymentMethodChange('cash')}
                className={`px-4 py-2 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span className="font-medium">Cash</span>
              </button>
              
              <button
                type="button"
                onClick={() => onPaymentMethodChange('transfer')}
                className={`px-4 py-2 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'transfer'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span className="font-medium">Transfer</span>
              </button>
            </div>
          </div>
        )}
        
        {/* Tempo Details */}
        {paymentStatus === 'Tempo' && (
          <div className="space-y-4 bg-orange-50 p-4 rounded-lg">
            {/* Down Payment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DP / Uang Muka (opsional)
              </label>
              <input
                type="number"
                value={downPayment}
                onChange={(e) => onDownPaymentChange(parseFloat(e.target.value) || 0)}
                placeholder="0"
                min="0"
                max={grandTotal}
                step="1000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
              
              {downPayment > 0 && (
                <div className="mt-2 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">DP:</span>
                    <span className="font-medium text-green-600">
                      {formatRupiah(downPayment)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sisa:</span>
                    <span className="font-medium text-orange-600">
                      {formatRupiah(remainingPayment)}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Tempo Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline-block w-4 h-4 mr-1" />
                Jatuh Tempo
              </label>
              <select
                value={tempoDays}
                onChange={(e) => onTempoDaysChange(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value={7}>7 hari</option>
                <option value={14}>14 hari</option>
                <option value={30}>30 hari (1 bulan)</option>
                <option value={60}>60 hari (2 bulan)</option>
                <option value={90}>90 hari (3 bulan)</option>
              </select>
            </div>
            
            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline-block w-4 h-4 mr-1" />
                Tanggal Jatuh Tempo
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => onDueDateChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        )}
        
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <ul className="text-sm text-red-600 space-y-1">
              {validationErrors.map((error, idx) => (
                <li key={idx}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
