/**
 * PRODUCT SCHEMA - SINGLE SOURCE OF TRUTH
 * 
 * ⚠️ CRITICAL: Field names MUST match database schema exactly!
 * Database table: products (see sql/domain/inventory/products.schema.sql)
 * 
 * ========== DATABASE COLUMNS ==========
 * id               UUID PRIMARY KEY
 * user_id          UUID (FK to auth.users)
 * name             TEXT NOT NULL
 * sku              TEXT (auto-generated if empty)
 * category         TEXT (kategori produk)
 * unit             TEXT DEFAULT 'pcs'
 * description      TEXT
 * cost_price       NUMERIC(15,2) DEFAULT 0  ← Harga beli/modal
 * selling_price    NUMERIC(15,2) DEFAULT 0  ← Harga jual
 * image_url        TEXT (URL gambar utama)
 * track_inventory  BOOLEAN DEFAULT TRUE
 * min_stock_alert  INTEGER DEFAULT 0
 * is_active        BOOLEAN DEFAULT TRUE
 * created_at       TIMESTAMPTZ
 * updated_at       TIMESTAMPTZ
 * ======================================
 * 
 * ⛔ COLUMNS THAT DO NOT EXIST IN DATABASE:
 * - stock_quantity  ❌ Stock is managed separately (NOT in products table)
 * - initial_stock   ❌ Stock is managed separately
 * - current_stock   ❌ Stock is managed separately
 * - stock           ❌ Stock is managed separately
 * 
 * ⛔ DO NOT USE THESE OLD/WRONG NAMES:
 * - buy_price (use cost_price)
 * - sell_price (WRONG - use selling_price)
 * - owner_id (use user_id)
 * - stock_unit (use unit)
 * - min_stock (use min_stock_alert)
 * - min_alert (use min_stock_alert)
 */

/**
 * Product row from database (read operations)
 * Matches database schema exactly
 */
export interface ProductRow {
  id: string
  user_id: string
  name: string
  sku: string | null
  category: string | null
  unit: string
  description: string | null
  cost_price: number
  selling_price: number
  image_url: string | null
  track_inventory: boolean
  min_stock_alert: number
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Product insert payload (create operations)
 * All fields optional except user_id and name
 */
export interface ProductInsert {
  id?: string
  user_id: string
  name: string
  sku?: string | null
  category?: string | null
  unit?: string
  description?: string | null
  cost_price?: number
  selling_price?: number
  image_url?: string | null
  track_inventory?: boolean
  min_stock_alert?: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

/**
 * Product update payload (update operations)
 * All fields optional
 */
export interface ProductUpdate {
  id?: string
  user_id?: string
  name?: string
  sku?: string | null
  category?: string | null
  unit?: string
  description?: string | null
  cost_price?: number
  selling_price?: number
  image_url?: string | null
  track_inventory?: boolean
  min_stock_alert?: number
  is_active?: boolean
  updated_at?: string
}

/**
 * Product form data (UI layer)
 * Uses user-friendly names that get mapped to DB fields
 */
export interface ProductFormData {
  name: string
  sku?: string
  category?: string
  unit: string
  description?: string
  cost_price: number       // Harga Beli
  selling_price: number    // Harga Jual
  track_inventory: boolean
  min_stock_alert: number  // Min. Stock Alert
}

/**
 * Helper: Map form data to database insert payload
 */
export function mapFormToInsert(formData: ProductFormData, userId: string): ProductInsert {
  return {
    user_id: userId,
    name: formData.name,
    sku: formData.sku || null,
    category: formData.category || null,
    unit: formData.unit || 'pcs',
    description: formData.description || null,
    cost_price: formData.cost_price || 0,
    selling_price: formData.selling_price || 0,
    track_inventory: formData.track_inventory ?? true,
    min_stock_alert: formData.min_stock_alert || 0,
    is_active: true,
  }
}

/**
 * Helper: Map form data to database update payload
 */
export function mapFormToUpdate(formData: Partial<ProductFormData>): ProductUpdate {
  const update: ProductUpdate = {
    updated_at: new Date().toISOString(),
  }
  
  if (formData.name !== undefined) update.name = formData.name
  if (formData.sku !== undefined) update.sku = formData.sku || null
  if (formData.category !== undefined) update.category = formData.category || null
  if (formData.unit !== undefined) update.unit = formData.unit
  if (formData.description !== undefined) update.description = formData.description || null
  if (formData.cost_price !== undefined) update.cost_price = formData.cost_price
  if (formData.selling_price !== undefined) update.selling_price = formData.selling_price
  if (formData.track_inventory !== undefined) update.track_inventory = formData.track_inventory
  if (formData.min_stock_alert !== undefined) update.min_stock_alert = formData.min_stock_alert
  
  return update
}

/**
 * Helper: Get display prices (backward compatibility)
 */
export function getCostPrice(product: any): number {
  return product.cost_price ?? product.buy_price ?? 0
}

export function getSellingPrice(product: any): number {
  return product.selling_price ?? product.sell_price ?? 0
}
