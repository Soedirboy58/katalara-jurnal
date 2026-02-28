import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch order and ensure the storefront belongs to this user
    const { data, error } = await supabase
      .from('storefront_orders')
      .select(`
        *,
        business_storefronts!inner(
          id,
          user_id,
          slug,
          store_name,
          whatsapp_number
        )
      `)
      .eq('id', id)
      .eq('business_storefronts.user_id', user.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const parseOrderItems = (raw: any): any[] => {
      if (!raw) return []
      if (Array.isArray(raw)) return raw
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw)
          return parseOrderItems(parsed)
        } catch {
          return []
        }
      }
      if (typeof raw === 'object') {
        if (Array.isArray((raw as any).items)) return (raw as any).items
        if (Array.isArray((raw as any).order_items)) return (raw as any).order_items
      }
      return []
    }

    const { business_storefronts, ...order } = data as any

    const rawItems = parseOrderItems((order as any)?.order_items)
    const rawIds = Array.from(
      new Set(
        rawItems
          .map((it: any) => (it?.product_id || '').toString())
          .filter(Boolean)
      )
    )

    const storefrontIdToProductId = new Map<string, string>()
    if (rawIds.length > 0) {
      const { data: sfProducts } = await supabase
        .from('storefront_products')
        .select('id, product_id')
        .in('id', rawIds)

      for (const row of sfProducts || []) {
        const storefrontProductId = ((row as any)?.id || '').toString()
        const productId = ((row as any)?.product_id || '').toString()
        if (storefrontProductId && productId) storefrontIdToProductId.set(storefrontProductId, productId)
      }
    }

    const normalizedOrderItems = rawItems.map((it: any) => {
      const rawProductId = (it?.product_id || '').toString()
      const mappedProductId = rawProductId ? storefrontIdToProductId.get(rawProductId) : ''
      const qtyRaw = Number(it?.quantity ?? it?.qty ?? 1)
      const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? qtyRaw : 1

      return {
        ...it,
        product_id: mappedProductId || rawProductId || '',
        quantity: qty,
      }
    })

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        order_items: normalizedOrderItems,
      },
      storefront: business_storefronts,
    })
  } catch (error) {
    console.error('GET /api/lapak/orders/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
