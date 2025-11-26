/**
 * INCOMES FORM COMPONENT
 * Finance Module - Incomes
 * 
 * Main form for creating income transactions
 * Features:
 * - Customer selection/quick add
 * - Multi-item support (via LineItemsBuilder)
 * - Payment method & tempo support
 * - Tax & discount calculations
 * - Summary calculations
 */

'use client'

import { useState, useEffect } from 'react'
import { LineItemsBuilder, type LineItem } from './LineItemsBuilder'
import type { Product } from '@/modules/inventory/types/inventoryTypes'
import type { IncomeFormData, IncomeType, IncomeCategory, PaymentMethod } from '@/modules/finance/types/financeTypes'

interface IncomesFormProps {
  onSubmit: (data: IncomeFormData) => Promise<{ success: boolean; error?: string }>
  loading?: boolean
  products: Product[]
  loadingProducts?: boolean
  onAddProduct?: () => void
  onAddCustomer?: () => void
  initialValues?: Partial<IncomeFormData>
}

export function IncomesForm({
  onSubmit,
  loading = false,
  products,
  loadingProducts = false,
  onAddProduct,
  onAddCustomer,
  initialValues
}: IncomesFormProps) {
  // Form state
  const [incomeType, setIncomeType] = useState<IncomeType>(initialValues?.income_type || 'operating')
  const [category, setCategory] = useState<string>(initialValues?.income_category || 'product_sales')
  const [transactionDate, setTransactionDate] = useState(
    initialValues?.income_date || new Date().toISOString().split('T')[0]
  )
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initialValues?.payment_method || 'cash')
  const [paymentType, setPaymentType] = useState<'cash' | 'tempo'>(initialValues?.payment_type || 'cash')
  
  // Customer state
  const [customerName, setCustomerName] = useState(initialValues?.customer_name || '')
  const [isAnonymous, setIsAnonymous] = useState(false)
  
  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  
  // Summary calculations
  const [discountMode, setDiscountMode] = useState<'percent' | 'nominal'>('percent')
  const [discountPercent, setDiscountPercent] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [includeTax, setIncludeTax] = useState(false)
  const [taxPPN, setTaxPPN] = useState(11)
  
  // Notes
  const [notes, setNotes] = useState(initialValues?.notes || '')
  const [showNotes, setShowNotes] = useState(false)
  
  // Tempo payment fields
  const [tempoDays, setTempoDays] = useState(7)
  const [dueDate, setDueDate] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  // Calculations
  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + item.subtotal, 0)
  }

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal()
    if (discountMode === 'percent') {
      return (subtotal * discountPercent) / 100
    }
    return discountAmount
  }

  const calculatePPN = () => {
    if (!includeTax || !taxPPN) return 0
    const subtotal = calculateSubtotal()
    const afterDiscount = subtotal - calculateDiscount()
    return (afterDiscount * taxPPN) / 100
  }

  const calculateGrandTotal = () => {
    const subtotal = calculateSubtotal()
    const discount = calculateDiscount()
    const ppn = calculatePPN()
    return subtotal - discount + ppn
  }

  // Auto-calculate due date from tempo days
  useEffect(() => {
    if (paymentType === 'tempo' && tempoDays) {
      const date = new Date(transactionDate)
      date.setDate(date.getDate() + tempoDays)
      setDueDate(date.toISOString().split('T')[0])
    }
  }, [paymentType, tempoDays, transactionDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (lineItems.length === 0) {
      alert('⚠️ Mohon tambahkan minimal 1 item')
      return
    }

    if (!isAnonymous && !customerName.trim()) {
      alert('⚠️ Mohon masukkan nama pelanggan atau centang "Pelanggan Anonim"')
      return
    }

    if (paymentType === 'tempo') {
      if (!dueDate) {
        alert('⚠️ Mohon pilih tanggal jatuh tempo')
        return
      }
      if (!customerPhone) {
        alert('⚠️ Mohon masukkan nomor WhatsApp pelanggan untuk pengingat tempo')
        return
      }
    }

    // Prepare form data
    const formData: IncomeFormData = {
      income_type: incomeType,
      income_category: category as IncomeCategory,
      income_date: transactionDate,
      customer_name: isAnonymous ? 'Anonim' : customerName,
      payment_method: paymentMethod,
      payment_type: paymentType,
      notes: notes || undefined,
      lineItems: lineItems.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        qty: item.quantity,
        unit: item.unit,
        price_per_unit: item.price,
        buy_price: item.buy_price || 0
      }))
    }

    const result = await onSubmit(formData)

    if (result.success) {
      // Reset form
      setLineItems([])
      setCustomerName('')
      setIsAnonymous(false)
      setDiscountPercent(0)
      setDiscountAmount(0)
      setNotes('')
      setPaymentType('cash')
      setCustomerPhone('')
      setDueDate('')
    }
  }

  const formatNumber = (num: string) => {
    const cleaned = num.replace(/\D/g, '')
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📝 Input Pendapatan</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Transaction Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Transaksi
            </label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Income Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipe Pendapatan
            </label>
            <select
              value={incomeType}
              onChange={(e) => setIncomeType(e.target.value as IncomeType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="operating">Operating (Operasional)</option>
              <option value="investing">Investing (Investasi)</option>
              <option value="financing">Financing (Pendanaan)</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {incomeType === 'operating' && (
                <>
                  <option value="product_sales">Penjualan Produk</option>
                  <option value="service_income">Pendapatan Jasa</option>
                  <option value="retail_sales">Penjualan Retail</option>
                  <option value="wholesale_sales">Penjualan Grosir</option>
                </>
              )}
              {incomeType === 'investing' && (
                <>
                  <option value="asset_sale">Penjualan Aset</option>
                  <option value="dividend_income">Dividen</option>
                  <option value="interest_income">Bunga</option>
                </>
              )}
              {incomeType === 'financing' && (
                <>
                  <option value="loan_receipt">Penerimaan Pinjaman</option>
                  <option value="investor_funding">Dana Investor</option>
                  <option value="capital_injection">Modal Tambahan</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Customer Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-md font-semibold text-gray-900 mb-4">👤 Pelanggan</h3>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="anonymous" className="text-sm text-gray-700">
              Pelanggan Anonim (Walk-in customer)
            </label>
          </div>

          {!isAnonymous && (
            <div className="flex gap-2">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nama pelanggan"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required={!isAnonymous}
              />
              {onAddCustomer && (
                <button
                  type="button"
                  onClick={onAddCustomer}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap"
                >
                  + Pelanggan Baru
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-md font-semibold text-gray-900 mb-4">🛒 Item Penjualan</h3>
        
        <LineItemsBuilder
          items={lineItems}
          onChange={setLineItems}
          products={products}
          loadingProducts={loadingProducts}
          category={category}
          onAddProduct={onAddProduct}
        />
      </div>

      {/* Summary Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-md font-semibold text-gray-900 mb-4">💰 Ringkasan</h3>
        
        <div className="space-y-3">
          {/* Subtotal */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">Rp {new Intl.NumberFormat('id-ID').format(calculateSubtotal())}</span>
          </div>

          {/* Discount */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Diskon</span>
              <select
                value={discountMode}
                onChange={(e) => setDiscountMode(e.target.value as 'percent' | 'nominal')}
                className="px-2 py-1 text-xs border border-gray-300 rounded"
              >
                <option value="percent">%</option>
                <option value="nominal">Rp</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              {discountMode === 'percent' ? (
                <input
                  type="number"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-right"
                  min="0"
                  max="100"
                />
              ) : (
                <input
                  type="text"
                  value={formatNumber(discountAmount.toString())}
                  onChange={(e) => setDiscountAmount(parseInt(e.target.value.replace(/\./g, '')) || 0)}
                  placeholder="0"
                  className="w-32 px-2 py-1 text-sm border border-gray-300 rounded text-right"
                />
              )}
              <span className="text-sm font-medium text-red-600">
                -Rp {new Intl.NumberFormat('id-ID').format(calculateDiscount())}
              </span>
            </div>
          </div>

          {/* Tax */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeTax"
                checked={includeTax}
                onChange={(e) => setIncludeTax(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="includeTax" className="text-sm text-gray-600">
                PPN {taxPPN}%
              </label>
            </div>
            <span className="text-sm font-medium">
              +Rp {new Intl.NumberFormat('id-ID').format(calculatePPN())}
            </span>
          </div>

          <hr className="border-gray-200" />

          {/* Grand Total */}
          <div className="flex justify-between text-lg font-bold">
            <span className="text-gray-900">Total</span>
            <span className="text-blue-600">
              Rp {new Intl.NumberFormat('id-ID').format(calculateGrandTotal())}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-md font-semibold text-gray-900 mb-4">💳 Metode Pembayaran</h3>
        
        <div className="space-y-4">
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="cash"
                checked={paymentType === 'cash'}
                onChange={() => setPaymentType('cash')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm">Tunai/Transfer</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="tempo"
                checked={paymentType === 'tempo'}
                onChange={() => setPaymentType('tempo')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm">Tempo (Piutang)</span>
            </label>
          </div>

          {paymentType === 'tempo' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Jangka Waktu (hari)
                  </label>
                  <input
                    type="number"
                    value={tempoDays}
                    onChange={(e) => setTempoDays(parseInt(e.target.value) || 7)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Jatuh Tempo
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required={paymentType === 'tempo'}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  WhatsApp Pelanggan (untuk reminder)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="628123456789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required={paymentType === 'tempo'}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notes (Optional) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <button
          type="button"
          onClick={() => setShowNotes(!showNotes)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <span>{showNotes ? '▼' : '▶'}</span>
          <span>Catatan (opsional)</span>
        </button>
        
        {showNotes && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tambahkan catatan untuk transaksi ini..."
            rows={3}
            className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || lineItems.length === 0}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '⏳ Menyimpan...' : '💾 Simpan Transaksi'}
        </button>
      </div>
    </form>
  )
}
