import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase =
      supabaseUrl && serviceKey
        ? createSupabaseJsClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
        : await createClient();

    const { data: storefront, error: storefrontError } = await supabase
      .from('business_storefronts')
      .select('id, store_name')
      .eq('slug', slug)
      .single()

    if (storefrontError || !storefront) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: order, error: orderError } = await supabase
      .from('storefront_orders')
      .select('order_code,status,customer_name,total_amount,payment_method,order_items,created_at,updated_at,public_tracking_code')
      .eq('storefront_id', storefront.id)
      .eq('public_tracking_code', code)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const parseOrderItems = (raw: any): any[] => {
      if (!raw) return []
      if (Array.isArray(raw)) return raw
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw)
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return []
        }
      }
      return []
    }

    return NextResponse.json({
      success: true,
      data: {
        storefront_name: storefront.store_name,
        order_code: (order as any).order_code,
        status: (order as any).status,
        customer_name: (order as any).customer_name,
        total_amount: (order as any).total_amount,
        payment_method: (order as any).payment_method,
        order_items: parseOrderItems((order as any).order_items),
        created_at: (order as any).created_at,
        updated_at: (order as any).updated_at,
        public_tracking_code: (order as any).public_tracking_code,
      },
    })
  } catch (error) {
    console.error('Public order status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
