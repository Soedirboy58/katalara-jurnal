/**
 * INVENTORY DOMAIN TYPES
 * Backend: Inventory Domain v1.0 (newly created)
 * Tables: products, product_stock_movements
 */

// ============================================
// PRODUCTS
// ============================================

export type ProductType = 'physical' | 'service' | 'digital'
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

export interface Product {
  id: string
  user_id: string
  
  // Basic Info
  name: string
  sku?: string // Auto-generated or manual
  description?: string
  category?: string
  
  // Product Type
  product_type: ProductType
  service_duration?: number // For services (in minutes)
  
  // Pricing
  cost_price: number // Harga modal/beli
  selling_price: number // Harga jual
  
  // Inventory Tracking
  track_inventory: boolean
  current_stock?: number // Calculated from stock_movements
  min_stock_level?: number // For low stock alerts
  max_stock_level?: number
  unit: string // 'pcs', 'kg', 'box', 'pack', etc.
  
  // Images & Media
  image_url?: string
  images?: string[] // Multiple images
  
  // Status
  is_active: boolean
  
  // Tags & Classification
  tags?: string[]
  barcode?: string
  
  // Metadata
  notes?: string
  created_at: string
  updated_at: string
}

// ============================================
// PRODUCT_STOCK_MOVEMENTS
// ============================================

export type MovementType = 'in' | 'out' | 'adjust'
export type ReferenceType = 
  | 'purchase' // From expense
  | 'sale' // From income
  | 'adjustment' // Manual adjustment
  | 'return' // Customer/supplier return
  | 'damage' // Damaged goods
  | 'transfer' // Transfer between locations
  | 'production' // Manufacturing

export interface ProductStockMovement {
  id: string
  product_id: string
  user_id: string
  
  // Movement Details
  movement_type: MovementType
  quantity: number // Positive for 'in', negative for 'out'
  unit: string
  
  // Reference to source transaction
  reference_type: ReferenceType
  reference_id?: string // FK to income_id, expense_id, etc.
  reference_number?: string // Invoice/PO number
  
  // Stock Balance
  stock_before: number
  stock_after: number
  
  // Cost Tracking (for COGS calculation)
  unit_cost?: number // Cost per unit for this movement
  total_value?: number // quantity * unit_cost
  
  // Metadata
  notes?: string
  movement_date: string
  created_at: string
  
  // Immutable - cannot be updated or deleted
  // Only create new entries for corrections
}

// ============================================
// STOCK SUMMARY & ANALYTICS
// ============================================

export interface StockSummary {
  product_id: string
  product_name: string
  current_stock: number
  min_stock_level?: number
  stock_status: StockStatus
  stock_value: number // current_stock * cost_price
  last_movement_date?: string
}

export interface StockMovementHistory {
  date: string
  movement_type: MovementType
  quantity: number
  reference_type: ReferenceType
  reference_number?: string
  stock_after: number
  notes?: string
}

// ============================================
// PROFIT MARGIN ANALYTICS
// ============================================

export interface ProductProfitMargin {
  product_id: string
  product_name: string
  cost_price: number
  selling_price: number
  margin_amount: number
  margin_percentage: number
}

// ============================================
// FORM STATE TYPES
// ============================================

export interface ProductFormData {
  name: string
  sku?: string
  description?: string
  category?: string
  product_type: ProductType
  service_duration?: number
  cost_price: number
  selling_price: number
  track_inventory: boolean
  min_stock_level?: number
  unit: string
  image_url?: string
  tags?: string[]
  barcode?: string
  notes?: string
}

export interface StockAdjustmentFormData {
  product_id: string
  movement_type: 'in' | 'out' | 'adjust'
  quantity: number
  reference_type: ReferenceType
  reference_number?: string
  unit_cost?: number
  notes?: string
}
