'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ProductWithStock {
  id: string
  name: string
  sku: string | null
  category: string | null
  unit: string
  cost_price: number
  selling_price: number
  current_stock: number
  min_stock_alert: number
  stock_status: 'not_tracked' | 'out_of_stock' | 'low_stock' | 'sufficient'
  is_active: boolean
  track_inventory: boolean
}

export function useProductsWithStock() {
  const [products, setProducts] = useState<ProductWithStock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Call RPC function to get products with stock
      const { data, error: fetchError } = await supabase
        .rpc('get_products_with_stock', { p_user_id: user.id })

      if (fetchError) throw fetchError

      setProducts(data || [])
    } catch (err: any) {
      setError(err.message)
      console.error('Error loading products with stock:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  return {
    products,
    loading,
    error,
    refresh: loadProducts
  }
}
