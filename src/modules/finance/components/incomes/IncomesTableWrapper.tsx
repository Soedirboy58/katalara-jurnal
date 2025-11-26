/**
 * INCOMES TABLE WRAPPER
 * Wraps existing TransactionsTable with new interface
 */

'use client'

import { TransactionsTable } from '@/components/income/TransactionsTable'
import type { Income } from '@/modules/finance/types/financeTypes'

interface IncomesTableProps {
  transactions: Income[]
  loading?: boolean
  onDelete: (id: string) => void
  onRefresh: () => void
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
}

export function IncomesTable({
  transactions,
  loading = false,
  onDelete,
  onRefresh,
  currentPage = 1,
  totalPages = 1,
  onPageChange
}: IncomesTableProps) {
  // Convert Income[] to Transaction[] format expected by legacy component
  const legacyTransactions = transactions.map(income => ({
    id: income.id,
    income_date: income.income_date,
    income_type: income.income_type,
    category: income.income_category,
    amount: income.grand_total,
    payment_method: income.payment_method,
    payment_status: income.payment_status,
    payment_type: income.payment_method === 'tempo' ? 'tempo' : 'cash',
    due_date: income.due_date,
    customer_name: income.customer_name,
    customer_phone: undefined, // Not in new schema yet
    product_name: undefined, // Would need to join income_items
    quantity: undefined,
    price_per_unit: undefined,
    description: income.income_description
  }))

  // Handle delete with legacy Transaction object
  const handleDelete = (transaction: any) => {
    onDelete(transaction.id)
  }

  return (
    <TransactionsTable
      transactions={legacyTransactions}
      businessName="Katalara UMKM"
      onRefresh={onRefresh}
      onDelete={handleDelete}
    />
  )
}
