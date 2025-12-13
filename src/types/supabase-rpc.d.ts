/**
 * TypeScript interfaces for Supabase RPC (Remote Procedure Call) functions
 */

/**
 * Parameters for adjust_stock RPC function
 */
export interface AdjustStockParams {
  p_product_id: string
  p_quantity_change: number
  p_notes?: string
}
