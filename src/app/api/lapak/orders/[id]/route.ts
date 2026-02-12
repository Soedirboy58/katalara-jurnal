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

    const { business_storefronts, ...order } = data as any

    return NextResponse.json({
      success: true,
      order,
      storefront: business_storefronts,
    })
  } catch (error) {
    console.error('GET /api/lapak/orders/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
