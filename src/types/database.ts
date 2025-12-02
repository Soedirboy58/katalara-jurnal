// TypeScript types for database tables
// Generated from Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // ⚠️ CRITICAL: Field names MUST match database schema
      // See: sql/domain/inventory/products.schema.sql
      // See: types/product-schema.ts for detailed documentation
      products: {
        Row: {
          id: string
          user_id: string
          name: string
          sku: string | null
          category: string | null
          unit: string
          description: string | null
          cost_price: number
          selling_price: number
          stock: number | null
          min_stock_alert: number
          track_inventory: boolean
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          sku?: string | null
          category?: string | null
          unit?: string
          description?: string | null
          cost_price?: number
          selling_price?: number
          stock?: number | null
          min_stock_alert?: number
          track_inventory?: boolean
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          sku?: string | null
          category?: string | null
          unit?: string
          description?: string | null
          cost_price?: number
          selling_price?: number
          stock?: number | null
          min_stock_alert?: number
          track_inventory?: boolean
          image_url?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          owner_id: string
          invoice_number: string
          transaction_date: string
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          customer_address: string | null
          payment_type: string
          due_date: string | null
          subtotal: number
          discount_type: string
          discount_value: number
          discount_amount: number
          ppn_rate: number
          ppn_amount: number
          pph_rate: number
          pph_amount: number
          total: number
          paid_amount: number
          remaining_amount: number
          payment_status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          invoice_number: string
          transaction_date?: string
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          customer_address?: string | null
          payment_type?: string
          due_date?: string | null
          subtotal?: number
          discount_type?: string
          discount_value?: number
          discount_amount?: number
          ppn_rate?: number
          ppn_amount?: number
          pph_rate?: number
          pph_amount?: number
          total?: number
          paid_amount?: number
          remaining_amount?: number
          payment_status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          invoice_number?: string
          transaction_date?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          customer_address?: string | null
          payment_type?: string
          due_date?: string | null
          subtotal?: number
          discount_type?: string
          discount_value?: number
          discount_amount?: number
          ppn_rate?: number
          ppn_amount?: number
          pph_rate?: number
          pph_amount?: number
          total?: number
          paid_amount?: number
          remaining_amount?: number
          payment_status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transaction_items: {
        Row: {
          id: string
          transaction_id: string
          product_id: string | null
          product_name: string
          qty: number
          unit: string
          price: number
          subtotal: number
          stock_deducted: boolean
          created_at: string
        }
        Insert: {
          id?: string
          transaction_id: string
          product_id?: string | null
          product_name: string
          qty: number
          unit: string
          price: number
          subtotal: number
          stock_deducted?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          transaction_id?: string
          product_id?: string | null
          product_name?: string
          qty?: number
          unit?: string
          price?: number
          subtotal?: number
          stock_deducted?: boolean
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          user_id: string          // ✅ ACTUAL: uses user_id not owner_id
          expense_date: string
          category: string
          description: string | null
          grand_total: number      // ✅ ACTUAL: uses grand_total not amount
          payment_method: string | null
          payment_status: string
          receipt_url: string | null
          receipt_filename: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          expense_date: string
          category: string
          description?: string | null
          grand_total: number
          payment_method?: string | null
          payment_status?: string
          receipt_url?: string | null
          receipt_filename?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          expense_date?: string
          category?: string
          description?: string | null
          grand_total?: number
          payment_method?: string | null
          payment_status?: string
          receipt_url?: string | null
          receipt_filename?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      expense_items: {
        Row: {
          id: string
          expense_id: string
          owner_id: string
          product_id: string | null
          product_name: string
          description: string | null
          qty: number
          unit: string
          price_per_unit: number
          subtotal: number
          is_restock: boolean
          quantity_added: number
          stock_deducted: boolean
          created_at: string
        }
        Insert: {
          id?: string
          expense_id: string
          owner_id: string
          product_id?: string | null
          product_name: string
          description?: string | null
          qty: number
          unit?: string
          price_per_unit: number
          subtotal: number
          is_restock?: boolean
          quantity_added?: number
          stock_deducted?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          expense_id?: string
          owner_id?: string
          product_id?: string | null
          product_name?: string
          description?: string | null
          qty?: number
          unit?: string
          price_per_unit?: number
          subtotal?: number
          is_restock?: boolean
          quantity_added?: number
          stock_deducted?: boolean
          created_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          owner_id: string
          name: string
          phone: string | null
          address: string | null
          total_transactions: number
          total_purchase: number
          last_transaction_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          phone?: string | null
          address?: string | null
          total_transactions?: number
          total_purchase?: number
          last_transaction_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          phone?: string | null
          address?: string | null
          total_transactions?: number
          total_purchase?: number
          last_transaction_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stock_movements: {
        Row: {
          id: string
          product_id: string
          owner_id: string
          movement_type: string
          quantity_change: number
          stock_before: number
          stock_after: number
          reference_type: string | null
          reference_id: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          owner_id: string
          movement_type: string
          quantity_change: number
          stock_before: number
          stock_after: number
          reference_type?: string | null
          reference_id?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          owner_id?: string
          movement_type?: string
          quantity_change?: number
          stock_before?: number
          stock_after?: number
          reference_type?: string | null
          reference_id?: string | null
          notes?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_stock: {
        Args: {
          p_product_id: string
          p_quantity_change: number
          p_notes?: string
        }
        Returns: Json
      }
      generate_invoice_number: {
        Args: {
          user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
