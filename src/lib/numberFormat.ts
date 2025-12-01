/**
 * Number formatting utilities for Indonesian currency format
 * Provides helpers for formatting numbers with thousand separators
 * and parsing formatted strings back to numbers
 */

/**
 * Format number as Indonesian currency (no Rp symbol, just number with thousand separator)
 * @param value - Number to format (can be null or undefined)
 * @returns Formatted string with thousand separator (e.g., "1.000.000")
 * 
 * @example
 * formatRupiah(1000) // "1.000"
 * formatRupiah(1000000) // "1.000.000"
 * formatRupiah(null) // ""
 * formatRupiah(0) // "0"
 */
export function formatRupiah(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return ''
  }
  
  // Use Intl.NumberFormat for Indonesian locale (dot as thousand separator)
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Parse formatted rupiah input string to number
 * Strips all non-digit characters and converts to number
 * @param value - Formatted string (e.g., "1.000.000" or "1000000")
 * @returns Parsed number or null if empty/invalid
 * 
 * @example
 * parseRupiahInput("1.000") // 1000
 * parseRupiahInput("1.000.000") // 1000000
 * parseRupiahInput("") // null
 * parseRupiahInput("abc") // null
 */
export function parseRupiahInput(value: string): number | null {
  // Remove all non-digit characters (dots, spaces, etc.)
  const cleaned = value.replace(/\D/g, '')
  
  // Return null for empty string
  if (cleaned === '') {
    return null
  }
  
  // Convert to number
  const parsed = parseInt(cleaned, 10)
  
  // Return null if NaN
  if (isNaN(parsed)) {
    return null
  }
  
  return parsed
}

/**
 * Format number as full rupiah currency with Rp symbol
 * @param value - Number to format
 * @returns Formatted string with Rp prefix (e.g., "Rp 1.000.000")
 * 
 * @example
 * formatCurrency(1000000) // "Rp 1.000.000"
 * formatCurrency(0) // "Rp 0"
 * formatCurrency(null) // "Rp 0"
 */
export function formatCurrency(value: number | null | undefined): string {
  const amount = value ?? 0
  return `Rp ${formatRupiah(amount)}`
}
