'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Product, ProductFilters, StockStatus } from '@/types'

export function useProducts(filters?: ProductFilters) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadProducts()
  }, [filters])

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

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      let filteredData = data || []

      // Client-side status filter (because it's calculated)
      if (filters?.status) {
        filteredData = filteredData.filter(p => getStockStatus(p) === filters.status)
      }

      setProducts(filteredData)
    } catch (err: any) {
      setError(err.message)
      console.error('Error loading products:', err)
    } finally {
      setLoading(false)
    }
  }

  function getStockStatus(product: Product): StockStatus {
    if (!product.track_inventory) return 'HEALTHY'
    if (product.stock_quantity === 0) return 'OUT_OF_STOCK'
    if (product.stock_quantity <= product.min_stock_alert * 0.5) return 'CRITICAL'
    if (product.stock_quantity <= product.min_stock_alert) return 'LOW'
    if (product.stock_quantity > product.min_stock_alert * 3) return 'OVERSTOCKED'
    return 'HEALTHY'
  }

  async function createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await (supabase
        .from('products')
        .insert(productData as any)
        .select()
        .single() as any)

      if (error) throw error

      await loadProducts()
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }

  async function updateProduct(id: string, updates: Partial<Product>) {
    try {
      const { data, error } = await (supabase
        .from('products')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single() as any)

      if (error) throw error

      await loadProducts()
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
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
    } catch (err: any) {
      return { error: err.message }
    }
  }

  async function adjustStock(productId: string, quantityChange: number, notes?: string) {
    try {
      const { data, error } = await (supabase.rpc('adjust_stock', {
        p_product_id: productId,
        p_quantity_change: quantityChange,
        p_notes: notes
      } as any) as any)

      if (error) throw error

      await loadProducts()
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
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
