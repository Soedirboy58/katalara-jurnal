'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Product, ProductFilters, StockStatus } from '@/types'
import type { AdjustStockParams } from '@/types/supabase-rpc'

export function useProducts(filters?: ProductFilters & { productType?: 'physical' | 'service' }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Serialize filters to prevent infinite re-renders
  const filtersKey = JSON.stringify(filters || {})

  useEffect(() => {
    loadProducts()
  }, [filtersKey])

  async function loadProducts() {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }

      // Filter by product_type (physical or service)
      // Only apply if column exists (skip if migration not run yet)
      if (filters?.productType) {
        try {
          query = query.eq('product_type', filters.productType)
        } catch (e) {
          console.warn('product_type column not found, skipping filter')
        }
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        // If column doesn't exist, try without product_type filter
        if (fetchError.message?.includes('product_type')) {
          console.warn('product_type column not found, fetching all products')
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true })
          
          if (fallbackError) throw fallbackError
          return setProducts(fallbackData || [])
        }
        throw fetchError
      }

      let filteredData = data || []

      // Client-side status filter (because it's calculated)
      if (filters?.status) {
        filteredData = filteredData.filter(p => getStockStatus(p) === filters.status)
      }

      setProducts(filteredData)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error loading products:', err)
    } finally {
      setLoading(false)
    }
  }

  function getStockStatus(product: Product): StockStatus {
    if ((product as any).track_inventory === false) return 'HEALTHY'

    const minStock = Number((product as any).min_stock_alert ?? (product as any).min_stock ?? 0) || 0
    const rawStock = (product as any).current_stock ?? (product as any).stock ?? (product as any).stock_quantity ?? 0
    const stockQty = Number(rawStock) || 0
    if (stockQty === 0) return 'OUT_OF_STOCK'
    if (stockQty <= minStock * 0.5) return 'CRITICAL'
    if (stockQty <= minStock) return 'LOW'
    if (stockQty > minStock * 3) return 'OVERSTOCKED'
    return 'HEALTHY'
  }

  async function createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single()

      if (error) throw error

      await loadProducts()
      return { data, error: null }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      return { data: null, error: errorMessage }
    }
  }

  async function updateProduct(id: string, updates: Partial<Product>) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      await loadProducts()
      return { data, error: null }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      return { data: null, error: errorMessage }
    }
  }

  async function deleteProduct(id: string) {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      await loadProducts()
      return { error: null }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      return { error: errorMessage }
    }
  }

  async function adjustStock(productId: string, quantityChange: number, notes?: string) {
    try {
      const params: AdjustStockParams = {
        p_product_id: productId,
        p_quantity_change: quantityChange,
        p_notes: notes
      }
      const { data, error } = await supabase.rpc('adjust_stock', params)

      if (error) throw error

      await loadProducts()
      return { data, error: null }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      return { data: null, error: errorMessage }
    }
  }

  return {
    products,
    loading,
    error,
    refresh: loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    getStockStatus
  }
}
