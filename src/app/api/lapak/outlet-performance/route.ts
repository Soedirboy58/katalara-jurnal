import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const toNumber = (value: any) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: storefronts, error: storefrontError } = await supabase
      .from('business_storefronts')
      .select('id, store_name, slug, is_active, outlet_code, outlet_manager_phone, commission_rate')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (storefrontError) {
      return NextResponse.json({ error: 'Gagal memuat data lapak' }, { status: 500 })
    }

    if (!storefronts || storefronts.length === 0) {
      return NextResponse.json({ outlets: [] })
    }

    const ids = storefronts.map((s) => s.id)
    const { data: orders, error: ordersError } = await supabase
      .from('storefront_orders')
      .select('storefront_id, total_amount, status')
      .in('storefront_id', ids)

    if (ordersError) {
      return NextResponse.json({ error: 'Gagal memuat data order' }, { status: 500 })
    }

    const statsByStorefront = new Map<string, any>()
    for (const row of orders || []) {
      const id = String((row as any).storefront_id || '')
      if (!id) continue
      const current = statsByStorefront.get(id) || {
        total_orders: 0,
        total_revenue: 0,
        pending_orders: 0,
        confirmed_orders: 0,
        preparing_orders: 0,
        shipped_orders: 0,
        completed_orders: 0,
        canceled_orders: 0,
      }

      current.total_orders += 1
      current.total_revenue += toNumber((row as any).total_amount)

      const status = String((row as any).status || '').toLowerCase()
      if (status === 'pending') current.pending_orders += 1
      else if (status === 'confirmed') current.confirmed_orders += 1
      else if (status === 'preparing') current.preparing_orders += 1
      else if (status === 'shipped') current.shipped_orders += 1
      else if (status === 'completed') current.completed_orders += 1
      else if (status === 'canceled') current.canceled_orders += 1

      statsByStorefront.set(id, current)
    }

    const outlets = storefronts.map((storefront: any) => {
      const stats = statsByStorefront.get(storefront.id) || {
        total_orders: 0,
        total_revenue: 0,
        pending_orders: 0,
        confirmed_orders: 0,
        preparing_orders: 0,
        shipped_orders: 0,
        completed_orders: 0,
        canceled_orders: 0,
      }

      return {
        ...storefront,
        ...stats,
      }
    })

    return NextResponse.json({ outlets })
  } catch (error) {
    console.error('GET /api/lapak/outlet-performance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
