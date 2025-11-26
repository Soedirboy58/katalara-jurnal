/**
 * INPUT INCOME PAGE (REFACTORED)
 * Finance Module - Incomes
 * 
 * Thin wrapper page using modular components
 * Original: 3140 lines → Refactored: < 200 lines
 */

'use client'

import { useState } from 'react'
import { useIncomes } from '@/modules/finance/hooks/useIncomes'
import { IncomesForm } from '@/modules/finance/components/incomes/IncomesForm'
import { IncomesTable } from '@/modules/finance/components/incomes/IncomesTableWrapper'
import { useProducts } from '@/hooks/useProducts'
import CustomerModal from '@/components/modals/CustomerModal'
import type { IncomeFormData } from '@/modules/finance/types/financeTypes'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export default function InputIncomePage() {
  const supabase = createClient()
  
  // Hooks
  const {
    incomes,
    loading: loadingIncomes,
    error,
    fetchIncomes,
    deleteIncome
  } = useIncomes({ autoFetch: true })

  const {
    products,
    loading: loadingProducts
  } = useProducts()

  // Modal state
  const [showCustomerModal, setShowCustomerModal] = useState(false)

  // Handle form submission
  const handleSubmit = async (data: IncomeFormData) => {
    try {
      // 1. Insert income record
      const { data: income, error: incomeError } = await supabase
        .from('incomes')
        .insert({
          income_type: data.income_type,
          income_category: data.income_category,
          income_date: data.income_date,
          customer_name: data.customer_name,
          payment_method: data.payment_method,
          payment_type: data.payment_type,
          notes: data.notes,
          total_amount: data.lineItems.reduce((sum, item) => 
            sum + (item.qty * item.price_per_unit), 0
          )
        })
        .select()
        .single()

      if (incomeError) throw incomeError

      // 2. Insert income items
      const itemsToInsert = data.lineItems.map(item => ({
        income_id: income.id,
        product_id: item.product_id,
        product_name: item.product_name,
        qty: item.qty,
        unit: item.unit,
        price_per_unit: item.price_per_unit,
        buy_price: item.buy_price
      }))

      const { error: itemsError } = await supabase
        .from('income_items')
        .insert(itemsToInsert)

      if (itemsError) throw itemsError

      // 3. Update stock for physical products
      for (const item of data.lineItems) {
        if (item.product_id) {
          // Reduce stock
          const { error: stockError } = await supabase.rpc(
            'update_product_stock',
            {
              product_id: item.product_id,
              qty_change: -item.qty
            }
          )

          if (stockError) {
            console.error('Stock update error:', stockError)
          }

          // Log stock movement
          await supabase.from('stock_movements').insert({
            product_id: item.product_id,
            movement_type: 'out',
            quantity: item.qty,
            reference_type: 'income',
            reference_id: income.id,
            movement_date: data.income_date,
            notes: `Penjualan kepada ${data.customer_name}`
          })
        }
      }

      // Success
      await fetchIncomes()
      return { success: true }
    } catch (error: any) {
      console.error('Submit error:', error)
      return {
        success: false,
        error: error.message || 'Gagal menyimpan transaksi'
      }
    }
  }

  // Handle delete
  const handleDelete = async (incomeId: string) => {
    const confirmed = confirm('⚠️ Yakin ingin menghapus transaksi ini?\n\nStok produk TIDAK akan dikembalikan.')
    if (!confirmed) return

    const result = await deleteIncome(incomeId)
    if (result.success) {
      alert('✅ Transaksi berhasil dihapus')
    } else {
      alert(`❌ Gagal menghapus: ${result.error}`)
    }
  }

  // Handle refresh
  const handleRefresh = async () => {
    await fetchIncomes()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            💰 Input Pendapatan
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Catat transaksi pendapatan dari penjualan produk, jasa, atau sumber lainnya
          </p>
        </div>

        {/* Income Form */}
        <IncomesForm
          onSubmit={handleSubmit}
          loading={loadingIncomes}
          products={products as any}
          loadingProducts={loadingProducts}
          onAddCustomer={() => setShowCustomerModal(true)}
        />

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                📊 Riwayat Transaksi
              </h2>
              <button
                onClick={handleRefresh}
                disabled={loadingIncomes}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          <IncomesTable
            transactions={incomes}
            loading={loadingIncomes}
            onDelete={handleDelete}
            onRefresh={fetchIncomes}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              ⚠️ Error: {error}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCustomerModal && (
        <CustomerModal
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          onSelect={() => {}}
          selectedCustomer={null}
        />
      )}
    </div>
  )
}
