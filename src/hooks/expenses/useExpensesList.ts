/**
 * Custom hook for fetching and managing expenses list
 * Features:
 * - 500ms debouncing on search/filter changes
 * - Automatic refresh on data changes
 * - Loading and error states
 * 
 * @example
 * const { expenses, loading, error, refresh } = useExpensesList({
 *   searchQuery: 'bahan baku',
 *   dateRange: { start: '2024-01-01', end: '2024-01-31' },
 *   category: 'raw_materials'
 * })
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// ============================================
// TYPES
// ============================================

export interface Expense {
  id: string
  transaction_date: string
  po_number: string
  description: string
  supplier_id: string | null
  supplier_name?: string
  category: string
  expense_type: 'operating' | 'investing' | 'financing'
  payment_status: 'Lunas' | 'Tempo'
  payment_method: 'cash' | 'transfer' | 'tempo'
  subtotal: number
  discount_amount: number
  tax_amount: number
  pph_amount: number
  other_fees: number
  grand_total: number
  down_payment: number
  remaining_payment: number
  due_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ExpensesFilters {
  searchQuery?: string
  dateRange?: {
    start: string
    end: string
  }
  category?: string
  expenseType?: 'operating' | 'investing' | 'financing'
  paymentStatus?: 'Lunas' | 'Tempo'
  supplierId?: string
}

export interface UseExpensesListOptions {
  filters?: ExpensesFilters
  limit?: number
  orderBy?: {
    column: keyof Expense
    ascending: boolean
  }
  debounceMs?: number
}

// ============================================
// MAIN HOOK
// ============================================

export const useExpensesList = (options: UseExpensesListOptions = {}) => {
  const {
    filters = {},
    limit = 50,
    orderBy = { column: 'transaction_date', ascending: false },
    debounceMs = 500
  } = options
  
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debouncedFilters, setDebouncedFilters] = useState(filters)
  
  // Debounce filters to prevent excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters)
    }, debounceMs)
    
    return () => clearTimeout(timer)
  }, [filters, debounceMs])
  
  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      
      // Start query
      let query = supabase
        .from('expenses')
        .select(`
          *,
          suppliers (
            name
          )
        `)
      
      // Apply filters
      if (debouncedFilters.searchQuery) {
        query = query.or(`
          description.ilike.%${debouncedFilters.searchQuery}%,
          po_number.ilike.%${debouncedFilters.searchQuery}%,
          notes.ilike.%${debouncedFilters.searchQuery}%
        `)
      }
      
      if (debouncedFilters.dateRange) {
        query = query
          .gte('transaction_date', debouncedFilters.dateRange.start)
          .lte('transaction_date', debouncedFilters.dateRange.end)
      }
      
      if (debouncedFilters.category) {
        query = query.eq('category', debouncedFilters.category)
      }
      
      if (debouncedFilters.expenseType) {
        query = query.eq('expense_type', debouncedFilters.expenseType)
      }
      
      if (debouncedFilters.paymentStatus) {
        query = query.eq('payment_status', debouncedFilters.paymentStatus)
      }
      
      if (debouncedFilters.supplierId) {
        query = query.eq('supplier_id', debouncedFilters.supplierId)
      }
      
      // Apply ordering and limit
      query = query
        .order(orderBy.column, { ascending: orderBy.ascending })
        .limit(limit)
      
      const { data, error: fetchError } = await query
      
      if (fetchError) throw fetchError
      
      // Transform data to include supplier name
      const transformedData: Expense[] = (data || []).map((expense: any) => ({
        ...expense,
        supplier_name: expense.suppliers?.name || null
      }))
      
      setExpenses(transformedData)
    } catch (err) {
      console.error('Error fetching expenses:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch expenses')
    } finally {
      setLoading(false)
    }
  }, [debouncedFilters, limit, orderBy])
  
  // Fetch on mount and when filters change
  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])
  
  // Refresh function
  const refresh = useCallback(() => {
    fetchExpenses()
  }, [fetchExpenses])
  
  return {
    expenses,
    loading,
    error,
    refresh
  }
}

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Hook for fetching single expense by ID
 */
export const useExpense = (id: string | null) => {
  const [expense, setExpense] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!id) {
      setExpense(null)
      setLoading(false)
      return
    }
    
    const fetchExpense = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const supabase = createClient()
        const { data, error: fetchError } = await supabase
          .from('expenses')
          .select(`
            *,
            suppliers (
              name
            ),
            expense_items (
              id,
              product_id,
              product_name,
              quantity,
              unit,
              price_per_unit,
              subtotal,
              notes
            )
          `)
          .eq('id', id)
          .single()
        
        if (fetchError) throw fetchError
        
        setExpense({
          ...data,
          supplier_name: data.suppliers?.name || null
        })
      } catch (err) {
        console.error('Error fetching expense:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch expense')
      } finally {
        setLoading(false)
      }
    }
    
    fetchExpense()
  }, [id])
  
  return { expense, loading, error }
}

/**
 * Hook for calculating expenses statistics
 */
export const useExpensesStats = (filters?: ExpensesFilters) => {
  const { expenses, loading } = useExpensesList({ filters, limit: 1000 })
  
  const stats = {
    total: expenses.length,
    totalAmount: expenses.reduce((sum, exp) => sum + exp.grand_total, 0),
    paidAmount: expenses
      .filter(exp => exp.payment_status === 'Lunas')
      .reduce((sum, exp) => sum + exp.grand_total, 0),
    unpaidAmount: expenses
      .filter(exp => exp.payment_status === 'Tempo')
      .reduce((sum, exp) => sum + exp.remaining_payment, 0),
    byType: {
      operating: expenses.filter(exp => exp.expense_type === 'operating').length,
      investing: expenses.filter(exp => exp.expense_type === 'investing').length,
      financing: expenses.filter(exp => exp.expense_type === 'financing').length
    },
    formatted: {
      totalAmount: new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(expenses.reduce((sum, exp) => sum + exp.grand_total, 0)),
      paidAmount: new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(
        expenses
          .filter(exp => exp.payment_status === 'Lunas')
          .reduce((sum, exp) => sum + exp.grand_total, 0)
      ),
      unpaidAmount: new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(
        expenses
          .filter(exp => exp.payment_status === 'Tempo')
          .reduce((sum, exp) => sum + exp.remaining_payment, 0)
      )
    }
  }
  
  return { stats, loading }
}
