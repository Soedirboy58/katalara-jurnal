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
  expense_date: string
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
    orderBy = { column: 'expense_date', ascending: false },
    debounceMs = 500
  } = options
  
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Serialize filters to prevent infinite loops
  const filtersKey = JSON.stringify(filters)
  
  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('User not authenticated')
        setExpenses([])
        setLoading(false)
        return
      }
      
      // Start query with user filter
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
      
      // Apply filters
      if (filters.searchQuery) {
        const searchTerm = filters.searchQuery.trim()
        query = query.or(`description.ilike.%${searchTerm}%,po_number.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`)
      }
      
      if (filters.dateRange) {
        query = query
          .gte('expense_date', filters.dateRange.start)
          .lte('expense_date', filters.dateRange.end)
      }
      
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      
      if (filters.expenseType) {
        query = query.eq('expense_type', filters.expenseType)
      }
      
      if (filters.paymentStatus) {
        query = query.eq('payment_status', filters.paymentStatus)
      }
      
      if (filters.supplierId) {
        query = query.eq('supplier_id', filters.supplierId)
      }
      
      // Apply ordering and limit
      query = query
        .order(orderBy.column, { ascending: orderBy.ascending })
        .limit(limit)
      
      const { data, error: fetchError } = await query
      
      if (fetchError) throw fetchError
      
      // Normalize expenses with fallback for legacy columns
      const normalizedExpenses = (data || []).map((exp: any) => ({
        id: exp.id,
        expense_date: exp.expense_date || exp.created_at,
        po_number: exp.po_number || exp.invoice_number || '',
        description: exp.description || exp.notes || 'Pengeluaran',
        supplier_id: exp.supplier_id || null,
        supplier_name: exp.supplier_name || null,
        category: exp.category || 'operational',
        expense_type: exp.expense_type || 'operating',
        payment_status: exp.payment_status || 'Lunas',
        payment_method: exp.payment_method || 'cash',
        subtotal: Number(exp.subtotal || exp.amount || exp.grand_total || 0),
        discount_amount: Number(exp.discount_amount || 0),
        tax_amount: Number(exp.tax_amount || 0),
        pph_amount: Number(exp.pph_amount || 0),
        other_fees: Number(exp.other_fees || 0),
        grand_total: Number(exp.grand_total || exp.amount || exp.total_amount || exp.subtotal || 0),
        down_payment: Number(exp.down_payment || exp.paid_amount || 0),
        remaining_payment: Number(exp.remaining_payment || 0),
        due_date: exp.due_date || null,
        notes: exp.notes || exp.description || null,
        created_at: exp.created_at,
        updated_at: exp.updated_at || exp.created_at
      }))
      
      // If we have expenses with supplier_id, fetch supplier names separately
      if (normalizedExpenses.length > 0) {
        const supplierIds = normalizedExpenses
          .map((e: any) => e.supplier_id)
          .filter((id: any) => id !== null)
        
        if (supplierIds.length > 0) {
          try {
            const { data: suppliers } = await supabase
              .from('suppliers')
              .select('id, name')
              .in('id', supplierIds)
            
            const supplierMap = new Map(suppliers?.map(s => [s.id, s.name]) || [])
            
            const enrichedExpenses = normalizedExpenses.map((expense: any) => ({
              ...expense,
              supplier_name: expense.supplier_id ? supplierMap.get(expense.supplier_id) || 'Unknown' : null
            }))
            
            setExpenses(enrichedExpenses)
          } catch (supplierError) {
            // If suppliers table doesn't exist, just use normalized expenses
            console.warn('Could not fetch supplier names:', supplierError)
            setExpenses(normalizedExpenses)
          }
        } else {
          setExpenses(normalizedExpenses)
        }
      } else {
        setExpenses([])
      }
    } catch (err) {
      console.error('Error fetching expenses:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch expenses')
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }, [filtersKey, limit, orderBy.column, orderBy.ascending])
  
  // Fetch on mount and when filters change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExpenses()
    }, debounceMs)
    
    return () => clearTimeout(timer)
  }, [fetchExpenses, debounceMs])
  
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
