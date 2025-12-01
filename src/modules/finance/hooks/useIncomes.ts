/**
 * FINANCE MODULE - INCOMES HOOK
 * Backend: Finance Domain v1.0 - incomes & income_items tables
 * 
 * This hook provides:
 * - List incomes with filters & pagination
 * - Create income with multiple line items
 * - Update income
 * - Delete income
 * - Real-time subscriptions (optional)
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Income, IncomeItem, IncomeFormData } from '../types/financeTypes'

interface UseIncomesOptions {
  autoFetch?: boolean // Auto-fetch on mount
  startDate?: string // Filter by date range
  endDate?: string
  paymentStatus?: 'all' | 'paid' | 'unpaid' | 'partial'
  incomeType?: 'all' | 'operating' | 'investing' | 'financing'
}

interface UseIncomesReturn {
  // Data
  incomes: Income[]
  incomeItems: Map<string, IncomeItem[]> // Map<income_id, items[]>
  loading: boolean
  error: string | null
  
  // Pagination
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  
  // Actions
  fetchIncomes: () => Promise<void>
  fetchIncomeById: (id: string) => Promise<Income | null>
  fetchIncomeItems: (incomeId: string) => Promise<IncomeItem[]>
  createIncome: (data: IncomeFormData) => Promise<{ success: boolean; data?: Income; error?: string }>
  updateIncome: (id: string, data: Partial<Income>) => Promise<{ success: boolean; error?: string }>
  deleteIncome: (id: string) => Promise<{ success: boolean; error?: string }>
  
  // Pagination controls
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  
  // Filters
  setFilters: (filters: Partial<UseIncomesOptions>) => void
}

export function useIncomes(options: UseIncomesOptions = {}): UseIncomesReturn {
  const {
    autoFetch = true,
    startDate,
    endDate,
    paymentStatus = 'all',
    incomeType = 'all'
  } = options
  
  const supabase = createClient()
  
  // State
  const [incomes, setIncomes] = useState<Income[]>([])
  const [incomeItems, setIncomeItems] = useState<Map<string, IncomeItem[]>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  
  // Filters
  const [filters, setFilters] = useState<UseIncomesOptions>({
    startDate,
    endDate,
    paymentStatus,
    incomeType
  })
  
  // Calculated
  const totalPages = Math.ceil(totalCount / pageSize)
  
  /**
   * Fetch incomes with filters & pagination
   */
  const fetchIncomes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        throw new Error('No authenticated user')
      }
      
      // Build query
      let query = supabase
        .from('incomes')
        .select('*', { count: 'exact' })
        .eq('user_id', session.user.id)
      
      // Apply filters
      if (filters.startDate) {
        query = query.gte('income_date', filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte('income_date', filters.endDate)
      }
      if (filters.paymentStatus && filters.paymentStatus !== 'all') {
        query = query.eq('payment_status', filters.paymentStatus)
      }
      if (filters.incomeType && filters.incomeType !== 'all') {
        query = query.eq('income_type', filters.incomeType)
      }
      
      // Apply pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)
      
      // Order by date (newest first)
      query = query.order('income_date', { ascending: false })
      
      // Execute query
      const { data, error: fetchError, count } = await query
      
      if (fetchError) throw fetchError
      
      setIncomes(data || [])
      setTotalCount(count || 0)
      
    } catch (err: any) {
      console.error('Error fetching incomes:', err)
      setError(err.message || 'Failed to fetch incomes')
    } finally {
      setLoading(false)
    }
  }, [supabase, page, pageSize, filters])
  
  /**
   * Fetch single income by ID
   */
  const fetchIncomeById = useCallback(async (id: string): Promise<Income | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('incomes')
        .select('*')
        .eq('id', id)
        .single()
      
      if (fetchError) throw fetchError
      return data
      
    } catch (err: any) {
      console.error('Error fetching income:', err)
      return null
    }
  }, [supabase])
  
  /**
   * Fetch income items for specific income
   */
  const fetchIncomeItems = useCallback(async (incomeId: string): Promise<IncomeItem[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('income_items')
        .select('*')
        .eq('income_id', incomeId)
        .order('created_at', { ascending: true })
      
      if (fetchError) throw fetchError
      
      // Cache in map
      setIncomeItems(prev => {
        const newMap = new Map(prev)
        newMap.set(incomeId, data || [])
        return newMap
      })
      
      return data || []
      
    } catch (err: any) {
      console.error('Error fetching income items:', err)
      return []
    }
  }, [supabase])
  
  /**
   * Create new income with line items
   */
  const createIncome = useCallback(async (
    formData: IncomeFormData
  ): Promise<{ success: boolean; data?: Income; error?: string }> => {
    try {
      // Get session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        return { success: false, error: 'No authenticated user' }
      }
      
      // Calculate totals from line items
      const subtotal = formData.lineItems.reduce((sum, item) => {
        return sum + (item.qty * item.price_per_unit)
      }, 0)
      
      const totalProfit = formData.lineItems.reduce((sum, item) => {
        return sum + (item.qty * (item.price_per_unit - item.buy_price))
      }, 0)
      
      // Prepare income data
      const incomeData: any = {
        user_id: session.user.id,
        income_type: formData.income_type,
        income_category: formData.income_category,
        income_date: formData.income_date,
        customer_id: formData.customer_id || null,
        customer_name: formData.customer_name || null,
        payment_method: formData.payment_method,
        subtotal,
        grand_total: subtotal, // Before taxes/discounts
        notes: formData.notes || null,
        payment_status: formData.payment_type === 'cash' ? 'paid' : 'unpaid',
        paid_amount: formData.payment_type === 'cash' ? subtotal : 0,
        remaining_payment: formData.payment_type === 'cash' ? 0 : subtotal,
      }
      
      // Insert income
      const { data: newIncome, error: incomeError } = await supabase
        .from('incomes')
        .insert(incomeData)
        .select()
        .single()
      
      if (incomeError) throw incomeError
      
      // Insert line items
      const itemsData = formData.lineItems.map(item => ({
        income_id: newIncome.id,
        user_id: session.user.id,
        product_id: item.product_id || null,
        product_name: item.product_name,
        qty: item.qty,
        unit: item.unit,
        price_per_unit: item.price_per_unit,
        buy_price: item.buy_price,
        profit_per_unit: item.price_per_unit - item.buy_price,
        subtotal: item.qty * item.price_per_unit,
        total_profit: item.qty * (item.price_per_unit - item.buy_price),
      }))
      
      const { error: itemsError } = await supabase
        .from('income_items')
        .insert(itemsData)
      
      if (itemsError) throw itemsError
      
      // Refresh list
      await fetchIncomes()
      
      return { success: true, data: newIncome }
      
    } catch (err: any) {
      console.error('Error creating income:', err)
      return { 
        success: false, 
        error: err.message || 'Failed to create income' 
      }
    }
  }, [supabase, fetchIncomes])
  
  /**
   * Update existing income
   */
  const updateIncome = useCallback(async (
    id: string,
    updates: Partial<Income>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error: updateError } = await supabase
        .from('incomes')
        .update(updates)
        .eq('id', id)
      
      if (updateError) throw updateError
      
      // Refresh list
      await fetchIncomes()
      
      return { success: true }
      
    } catch (err: any) {
      console.error('Error updating income:', err)
      return { 
        success: false, 
        error: err.message || 'Failed to update income' 
      }
    }
  }, [supabase, fetchIncomes])
  
  /**
   * Delete income (cascade deletes income_items)
   */
  const deleteIncome = useCallback(async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error: deleteError } = await supabase
        .from('incomes')
        .delete()
        .eq('id', id)
      
      if (deleteError) throw deleteError
      
      // Refresh list
      await fetchIncomes()
      
      return { success: true }
      
    } catch (err: any) {
      console.error('Error deleting income:', err)
      return { 
        success: false, 
        error: err.message || 'Failed to delete income' 
      }
    }
  }, [supabase, fetchIncomes])
  
  // Auto-fetch on mount or when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchIncomes()
    }
  }, [autoFetch, fetchIncomes])
  
  return {
    // Data
    incomes,
    incomeItems,
    loading,
    error,
    
    // Pagination
    page,
    pageSize,
    totalCount,
    totalPages,
    
    // Actions
    fetchIncomes,
    fetchIncomeById,
    fetchIncomeItems,
    createIncome,
    updateIncome,
    deleteIncome,
    
    // Controls
    setPage,
    setPageSize,
    setFilters,
  }
}
