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
  const parseNumber = (value: unknown): number => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : 0
    }
    return 0
  }

  const normalizeCategory = (income: Income): string => {
    return (
      (income.income_category as string) ||
      (income.category as string) ||
      'other_income'
    )
  }

  const normalizeDescription = (income: Income): string | undefined => {
    return income.income_description || income.description || income.notes || undefined
  }

  const normalizePaymentStatus = (income: Income): string => {
    const status = (income.payment_status || 'Lunas').toString()
    if (status.toLowerCase() === 'paid') return 'Lunas'
    if (status.toLowerCase() === 'unpaid' || status.toLowerCase() === 'pending') return 'Pending'
    return status
  }

  const normalizePaymentType = (income: Income): string => {
    if (income.payment_type) return income.payment_type
    const method = (income.payment_method || '').toString().toLowerCase()
    return method.includes('tempo') ? 'tempo' : 'cash'
  }

  const normalizeAmount = (income: Income): number => {
    const candidates = [
      income.grand_total,
      (income as any).total_amount,
      income.amount,
      income.subtotal,
      income.paid_amount
    ]
    for (const candidate of candidates) {
      const parsed = parseNumber(candidate)
      if (parsed > 0) return parsed
    }
    return 0
  }

  // Convert Income[] to Transaction[] format expected by legacy component
  const legacyTransactions = transactions.map(income => ({
    id: income.id,
    income_date: income.income_date,
    income_type: (income.income_type as string) || 'operating',
    category: normalizeCategory(income),
    amount: normalizeAmount(income),
    payment_method: income.payment_method || 'cash',
    payment_status: normalizePaymentStatus(income),
    payment_type: normalizePaymentType(income),
    due_date: income.due_date,
    customer_name: income.customer_name,
    customer_phone: undefined, // Not in new schema yet
    product_name: undefined, // Would need to join income_items
    quantity: undefined,
    price_per_unit: undefined,
    description: normalizeDescription(income)
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
