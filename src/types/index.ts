// Application-level types
import type { Database } from './database'

// Product types
export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

// Recipe types (manual types until DB migration runs)
export interface ProductRecipe {
  id: string
  user_id: string
  finished_product_id: string
  ingredient_product_id: string
  quantity_needed: number
  unit: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface RecipeIngredient {
  id: string
  ingredient_product_id: string
  ingredient_name: string
  ingredient_unit: string
  quantity_needed: number
  unit: string
  notes?: string
}

export interface ProductWithRecipe extends Product {
  recipe: RecipeIngredient[]
  total_ingredient_cost: number
  profit_margin: number
}

export type StockStatus = 
  | 'OUT_OF_STOCK' 
  | 'CRITICAL' 
  | 'LOW' 
  | 'HEALTHY' 
  | 'OVERSTOCKED'

export interface ProductWithStatus extends Product {
  stock_status: StockStatus
  stock_value_cost: number
  stock_value_selling: number
  sold_last_30_days: number
  revenue_last_30_days: number
}

// Transaction types
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type TransactionItem = Database['public']['Tables']['transaction_items']['Row']

// Expense types
export type Expense = Database['public']['Tables']['expenses']['Row']
export type ExpenseInsert = Database['public']['Tables']['expenses']['Insert']

// Customer types
export type Customer = Database['public']['Tables']['customers']['Row']

// Stock movement types
export type StockMovement = Database['public']['Tables']['stock_movements']['Row']
export type MovementType = 'sale' | 'restock' | 'adjustment' | 'return'

// Filter types
export interface ProductFilters {
  status?: StockStatus | ''
  category?: string
  search?: string
}

export interface TransactionFilters {
  dateStart?: string
  dateEnd?: string
  status?: string
  customer?: string
}

export interface ExpenseFilters {
  dateStart?: string
  dateEnd?: string
  category?: string
}

// Form types
export interface ProductFormData {
  name: string
  sku?: string
  category?: string
  buy_price: number
  sell_price: number
  stock_quantity: number
  stock_unit: string
  min_stock_alert: number
  track_inventory: boolean
}

export interface StockAdjustmentData {
  product_id: string
  quantity_change: number
  notes?: string
}
