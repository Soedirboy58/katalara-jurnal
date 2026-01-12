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
import type { Income, IncomeItem, IncomeFormData } from '../types/financeTypes'

const isTransactionsSchemaMismatch = (message: string) => {
  const m = (message || '').toLowerCase()
  if (!m) return false
  // RLS policy missing / denies insert on unified transactions table
  if (m.includes('row-level security') && m.includes('transactions')) return true
  if (m.includes('violates row-level security policy') && m.includes('transactions')) return true
  if (m.includes('code') && m.includes('42501') && m.includes('transactions')) return true
  // Postgres undefined column
  if (m.includes('column transactions.owner_id does not exist')) return true
  if (m.includes('column transactions.user_id does not exist')) return true
  // PostgREST schema cache variants
  if (m.includes('schema cache') && m.includes('transactions') && (m.includes('owner_id') || m.includes('user_id'))) return true
  if (m.includes('could not find') && m.includes('transactions') && (m.includes('owner_id') || m.includes('user_id'))) return true
  return false
}

const computeTotals = (formData: IncomeFormData) => {
  const subtotal = (formData.lineItems || []).reduce((sum, it) => sum + Number(it.qty || 0) * Number(it.price_per_unit || 0), 0)
  const discountMode = formData.discount_mode || 'percent'
  const discountValue = Number(formData.discount_value || 0)
  const discountAmount =
    discountMode === 'nominal'
      ? Math.max(0, discountValue)
      : Math.max(0, (subtotal * Math.max(0, discountValue)) / 100)
  const afterDiscount = Math.max(0, subtotal - discountAmount)
  const ppnEnabled = Boolean(formData.ppn_enabled)
  const ppnRate = Number(formData.ppn_rate || 11)
  const ppnAmount = ppnEnabled ? Math.max(0, (afterDiscount * Math.max(0, ppnRate)) / 100) : 0
  const otherFees = 0
  const total = Math.max(0, afterDiscount + ppnAmount + otherFees)
  const downPayment = Math.max(0, Number(formData.down_payment || 0))
  const remaining = Math.max(0, total - downPayment)
  return { subtotal, discountAmount, afterDiscount, ppnAmount, total, downPayment, remaining }
}

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
  createIncome: (data: IncomeFormData) => Promise<{ success: boolean; data?: Income; error?: string; warning?: string }>
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

      const params = new URLSearchParams()
      const from = (page - 1) * pageSize
      params.set('limit', String(pageSize))
      params.set('offset', String(from))
      if (filters.startDate) params.set('start_date', filters.startDate)
      if (filters.endDate) params.set('end_date', filters.endDate)
      if (filters.paymentStatus && filters.paymentStatus !== 'all') {
        params.set('payment_status', filters.paymentStatus)
      }

      // Prefer new transactions endpoint; fall back to legacy incomes endpoint
      const txRes = await fetch(`/api/transactions?${params.toString()}`)
      const txJson = await txRes.json().catch(() => null)
      if (txRes.ok && txJson?.success) {
        setIncomes((txJson.data || []) as any)
        setTotalCount(txJson.count || 0)
        return
      }

      const txErrMsg = (txJson?.error || `HTTP ${txRes.status}` || '').toString()
      if (!isTransactionsSchemaMismatch(txErrMsg)) {
        throw new Error(txErrMsg || 'Failed to fetch transactions')
      }

      const incRes = await fetch(`/api/income?${params.toString()}`)
      const incJson = await incRes.json().catch(() => null)
      if (!incRes.ok || !incJson?.success) {
        throw new Error((incJson?.error || 'Failed to fetch incomes').toString())
      }

      setIncomes((incJson.data || []) as any)
      setTotalCount(incJson.count || 0)
      
    } catch (err: any) {
      console.error('Error fetching incomes:', err)
      setError(err.message || 'Failed to fetch incomes')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, filters])
  
  /**
   * Fetch single income by ID
   */
  const fetchIncomeById = useCallback(async (id: string): Promise<Income | null> => {
    try {
      const res = await fetch(`/api/transactions/${id}`)
      const json = await res.json()
      if (!res.ok || !json?.success) return null
      return (json.data?.transaction || null) as any
      
    } catch (err: any) {
      console.error('Error fetching income:', err)
      return null
    }
  }, [])
  
  /**
   * Fetch income items for specific income
   */
  const fetchIncomeItems = useCallback(async (incomeId: string): Promise<IncomeItem[]> => {
    try {
      const res = await fetch(`/api/transactions/${incomeId}`)
      const json = await res.json()
      if (!res.ok || !json?.success) return []
      const data = (json.data?.items || []) as any[]
      
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
  }, [])
  
  /**
   * Create new income with line items
   */
  const createIncome = useCallback(async (
    formData: IncomeFormData
  ): Promise<{ success: boolean; data?: Income; error?: string; warning?: string }> => {
    try {
      const payload = {
        transaction_date: formData.income_date,
        income_type: formData.income_type,
        category: formData.income_category,
        customer_id: formData.customer_id,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_address: formData.customer_address,
        payment_type: formData.payment_type,
        tempo_days: formData.tempo_days,
        due_date: formData.due_date,
        down_payment: formData.down_payment,
        discount_mode: formData.discount_mode,
        discount_value: formData.discount_value,
        ppn_enabled: formData.ppn_enabled,
        ppn_rate: formData.ppn_rate,
        notes: formData.notes,
        items: (formData.lineItems || []).map((it) => ({
          product_id: it.product_id,
          product_name: it.product_name,
          qty: it.qty,
          unit: it.unit,
          price_per_unit: it.price_per_unit
        }))
      }

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(() => null)
      if (res.ok && json?.success) {
        let warning: string | undefined
        const transaction = (json.data?.transaction || null) as any

        // Best-effort: if this income is a loan receipt, also create a Loan record and link it.
        // This should NOT block saving the transaction (UMKM-first UX).
        const cat = (formData.income_category || '').toString()
        const isLoanCategory = cat === 'loan_received' || cat === 'loan_receipt'
        if (transaction?.id && isLoanCategory && formData.loan_details) {
          try {
            const loanPayload = {
              ...formData.loan_details,
              income_transaction_id: transaction.id,
              // Keep any additional context in loan notes as well.
              notes: formData.notes || null
            }

            const loanRes = await fetch('/api/loans', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(loanPayload)
            })
            const loanJson = await loanRes.json().catch(() => null)
            if (!loanRes.ok) {
              console.error('Create loan failed (non-blocking)', {
                status: loanRes.status,
                error: loanJson?.error,
                raw: loanJson
              })
              warning = '⚠️ Transaksi tersimpan, tapi gagal membuat data pinjaman otomatis. Kamu bisa buat pinjaman manual di menu Pinjaman.'
            }
          } catch (e: any) {
            console.error('Create loan error (non-blocking):', e)
            warning = '⚠️ Transaksi tersimpan, tapi gagal membuat data pinjaman otomatis. Kamu bisa buat pinjaman manual di menu Pinjaman.'
          }
        }

        await fetchIncomes()
        return { success: true, data: (json.data?.transaction || null) as any, warning }
      }

      // Surface details in browser DevTools as well (toast still shows user-facing message).
      console.error('Create transaction failed', {
        status: res.status,
        error: json?.error,
        meta: json?.meta,
        raw: json
      })

      const txErrMsg = (json?.error || `HTTP ${res.status}` || '').toString()
      if (!isTransactionsSchemaMismatch(txErrMsg)) {
        const meta = json?.meta ? `\n${JSON.stringify(json.meta)}` : ''
        return { success: false, error: (txErrMsg || 'Failed to create transaction') + meta }
      }

      const fallbackWarning =
        txErrMsg.toLowerCase().includes('row-level security') || txErrMsg.toLowerCase().includes('42501')
          ? '⚠️ Transaksi disimpan via mode kompatibilitas (incomes lama) karena policy RLS untuk tabel transactions belum aktif.'
          : '⚠️ Transaksi disimpan via mode kompatibilitas (incomes lama) karena schema transactions belum sesuai.'

      // Fallback to legacy incomes endpoint
      const totals = computeTotals(formData)
      const dp = totals.downPayment
      const total = totals.total
      const paymentStatus =
        formData.payment_type === 'tempo'
          ? 'Tempo'
          : dp > 0 && dp < total
            ? 'partial'
            : 'Lunas'

      const legacyPayload: any = {
        income_date: formData.income_date,
        income_type: formData.income_type,
        category: formData.income_category,
        amount: total,
        description: formData.notes || null,
        notes: formData.notes || null,
        payment_method: formData.payment_method,
        payment_type: formData.payment_type,
        payment_status: paymentStatus,
        due_date: formData.payment_type === 'tempo' ? formData.due_date || null : null,
        customer_id: formData.customer_id || null,
        down_payment: dp,
        remaining: totals.remaining,
        subtotal: totals.subtotal,
        discount: totals.discountAmount,
        tax_ppn: totals.ppnAmount,
        line_items: formData.lineItems.map((it) => ({
          product_id: it.product_id || null,
          product_name: it.product_name,
          quantity: it.qty,
          unit: it.unit,
          price_per_unit: it.price_per_unit,
          subtotal: Number(it.qty || 0) * Number(it.price_per_unit || 0)
        }))
      }

      const incRes = await fetch('/api/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(legacyPayload)
      })
      const incJson = await incRes.json().catch(() => null)
      if (!incRes.ok || !incJson?.success) {
        return { success: false, error: (incJson?.error || 'Failed to create income').toString() }
      }

      await fetchIncomes()
      return { success: true, data: (incJson.data || null) as any, warning: fallbackWarning }
      
    } catch (err: any) {
      console.error('Error creating income:', err)
      return { 
        success: false, 
        error: err.message || 'Failed to create income' 
      }
    }
  }, [fetchIncomes])
  
  /**
   * Update existing income
   */
  const updateIncome = useCallback(async (
    id: string,
    updates: Partial<Income>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Not implemented for migration-style transactions yet
      console.warn('updateIncome not implemented for transactions:', id, updates)
      return { success: false, error: 'Edit belum tersedia untuk transaksi ini' }
      
    } catch (err: any) {
      console.error('Error updating income:', err)
      return { 
        success: false, 
        error: err.message || 'Failed to update income' 
      }
    }
  }, [])
  
  /**
   * Delete income (cascade deletes income_items)
   */
  const deleteIncome = useCallback(async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => null)
      if (res.ok && json?.success) {
        await fetchIncomes()
        return { success: true }
      }

      const txErrMsg = (json?.error || `HTTP ${res.status}` || '').toString()
      if (!isTransactionsSchemaMismatch(txErrMsg)) {
        return { success: false, error: txErrMsg || 'Failed to delete transaction' }
      }

      // Fallback to legacy incomes deletion
      const incRes = await fetch(`/api/income/${id}`, { method: 'DELETE' })
      const incJson = await incRes.json().catch(() => null)
      if (!incRes.ok || !incJson?.success) {
        return { success: false, error: (incJson?.error || 'Failed to delete income').toString() }
      }

      await fetchIncomes()
      return { success: true }
      
    } catch (err: any) {
      console.error('Error deleting income:', err)
      return { 
        success: false, 
        error: err.message || 'Failed to delete income' 
      }
    }
  }, [fetchIncomes])
  
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
