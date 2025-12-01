/**
 * Custom hook for calculating expense financial totals
 * Replaces 5 cascading useEffect with single useMemo
 * 
 * Performance: Single calculation pass instead of multiple re-renders
 * 
 * @example
 * const totals = useExpenseCalculations({
 *   lineItems,
 *   discount: { mode: 'percent', percent: 10 },
 *   taxEnabled: true,
 *   pphPercent: 2,
 *   otherFees: []
 * })
 * 
 * console.log(totals.grandTotal) // Final amount to pay
 */

'use client'

import { useMemo } from 'react'
import type { LineItem } from './useExpenseForm'

// ============================================
// TYPES
// ============================================

export interface DiscountConfig {
  mode: 'percent' | 'nominal'
  percent: number
  fixedAmount: number
}

export interface CalculationInputs {
  lineItems: LineItem[]
  discount: DiscountConfig
  taxEnabled: boolean
  pphPercent: number
  otherFees: Array<{ id: string; label: string; amount: number }>
}

export interface CalculationResult {
  // Line items total
  subtotal: number
  
  // Discount
  discountAmount: number
  afterDiscount: number
  
  // Tax (PPN 11%)
  taxAmount: number
  afterTax: number
  
  // PPh (tax withholding)
  pphAmount: number
  afterPph: number
  
  // Other fees
  otherFeesTotal: number
  
  // Final total
  grandTotal: number
  
  // Formatted strings for display
  formatted: {
    subtotal: string
    discountAmount: string
    afterDiscount: string
    taxAmount: string
    afterTax: string
    pphAmount: string
    afterPph: string
    otherFeesTotal: string
    grandTotal: string
  }
}

// ============================================
// CONSTANTS
// ============================================

const TAX_RATE = 0.11 // PPN 11%

// ============================================
// HELPERS
// ============================================

/**
 * Format number to Indonesian Rupiah
 */
const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Calculate discount amount based on mode
 */
const calculateDiscount = (
  subtotal: number,
  discount: DiscountConfig
): number => {
  if (discount.mode === 'percent') {
    return (subtotal * discount.percent) / 100
  }
  return discount.fixedAmount
}

// ============================================
// MAIN HOOK
// ============================================

export const useExpenseCalculations = (
  inputs: CalculationInputs
): CalculationResult => {
  const result = useMemo(() => {
    // Step 1: Calculate subtotal from line items
    const subtotal = inputs.lineItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    )
    
    // Step 2: Calculate discount
    const discountAmount = calculateDiscount(subtotal, inputs.discount)
    const afterDiscount = subtotal - discountAmount
    
    // Step 3: Calculate tax (PPN)
    const taxAmount = inputs.taxEnabled ? afterDiscount * TAX_RATE : 0
    const afterTax = afterDiscount + taxAmount
    
    // Step 4: Calculate PPh (tax withholding - reduces amount)
    const pphAmount = (afterTax * inputs.pphPercent) / 100
    const afterPph = afterTax - pphAmount
    
    // Step 5: Add other fees
    const otherFeesTotal = inputs.otherFees.reduce(
      (sum, fee) => sum + fee.amount,
      0
    )
    
    // Step 6: Calculate grand total
    const grandTotal = afterPph + otherFeesTotal
    
    // Return all calculations
    return {
      subtotal,
      discountAmount,
      afterDiscount,
      taxAmount,
      afterTax,
      pphAmount,
      afterPph,
      otherFeesTotal,
      grandTotal,
      formatted: {
        subtotal: formatRupiah(subtotal),
        discountAmount: formatRupiah(discountAmount),
        afterDiscount: formatRupiah(afterDiscount),
        taxAmount: formatRupiah(taxAmount),
        afterTax: formatRupiah(afterTax),
        pphAmount: formatRupiah(pphAmount),
        afterPph: formatRupiah(afterPph),
        otherFeesTotal: formatRupiah(otherFeesTotal),
        grandTotal: formatRupiah(grandTotal)
      }
    }
  }, [
    inputs.lineItems,
    inputs.discount,
    inputs.taxEnabled,
    inputs.pphPercent,
    inputs.otherFees
  ])
  
  return result
}

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Hook for calculating tempo payment details
 */
export const useTempoCalculations = (
  grandTotal: number,
  downPayment: number,
  tempoDays: number,
  transactionDate: string
) => {
  return useMemo(() => {
    const remaining = grandTotal - downPayment
    
    // Calculate due date
    const date = new Date(transactionDate)
    date.setDate(date.getDate() + tempoDays)
    const dueDate = date.toISOString().split('T')[0]
    
    return {
      downPayment,
      remaining,
      dueDate,
      formatted: {
        downPayment: formatRupiah(downPayment),
        remaining: formatRupiah(remaining)
      }
    }
  }, [grandTotal, downPayment, tempoDays, transactionDate])
}

/**
 * Hook for validating payment amounts
 */
export const usePaymentValidation = (
  grandTotal: number,
  paymentStatus: 'Lunas' | 'Tempo',
  downPayment: number
) => {
  return useMemo(() => {
    const errors: string[] = []
    
    if (paymentStatus === 'Tempo') {
      if (downPayment < 0) {
        errors.push('DP tidak boleh negatif')
      }
      
      if (downPayment > grandTotal) {
        errors.push('DP tidak boleh lebih besar dari total')
      }
      
      const remaining = grandTotal - downPayment
      if (remaining <= 0) {
        errors.push('Sisa pembayaran harus lebih dari 0. Gunakan status "Lunas" jika sudah dibayar penuh.')
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }, [grandTotal, paymentStatus, downPayment])
}
