/**
 * Legacy type definitions for backward compatibility
 * These types support old field names that may exist in the database
 */

import type { Product } from './index'

/**
 * Product type with legacy field names for backward compatibility
 * Supports both old (buy_price/sell_price) and new (cost_price/selling_price) field names
 */
export interface ProductLegacy extends Product {
  /** @deprecated Use cost_price instead */
  buy_price?: number
  /** @deprecated Use selling_price instead */
  sell_price?: number
  /** Legacy field for image URL */
  image_url?: string
  /** Legacy field for stock quantity */
  stock_quantity?: number
  /** Service duration field for service products */
  service_duration?: string | null
  /** Business category field for product categorization */
  business_category?: 'raw_materials' | 'finished_goods' | 'services' | string
}

/**
 * Helper type for expense records with grand_total field
 */
export interface ExpenseRecord {
  grand_total: number | string | null
  [key: string]: unknown
}
