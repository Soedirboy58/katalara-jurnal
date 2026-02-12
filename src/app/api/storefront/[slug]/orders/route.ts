import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const sessionId = request.headers.get('x-session-id');
    const userAgent = request.headers.get('user-agent') || '';
    
    const body = await request.json();
    const {
      order_items,
      total_amount,
      payment_method,
      customer_name,
      customer_phone,
      customer_address,
      delivery_method,
      notes,
      payment_proof_url,
      order_code,
      public_tracking_code,
    } = body;

    if (!Array.isArray(order_items) || order_items.length === 0) {
      return NextResponse.json({ error: 'Order items wajib diisi' }, { status: 400 })
    }

    const totalAmount = Number(total_amount)
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return NextResponse.json({ error: 'Total amount tidak valid' }, { status: 400 })
    }

    if (!customer_name || !customer_phone) {
      return NextResponse.json({ error: 'Nama dan nomor HP wajib diisi' }, { status: 400 })
    }

    const randomToken = () => {
      try {
        return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      } catch {
        // Fallback if crypto.randomUUID is unavailable (should be rare)
        return Math.random().toString(36).slice(2, 14)
      }
    }

    const trackingCode = public_tracking_code || `${order_code || 'ORD'}-${randomToken()}`

    // Prefer service-role for public order tracking to avoid RLS issues.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase =
      supabaseUrl && serviceKey
        ? createSupabaseJsClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
        : await createClient();

    // Get storefront ID from slug
    const { data: storefront, error: storefrontError } = await supabase
      .from('business_storefronts')
      .select('id')
      .eq('slug', slug)
      .single();

    if (storefrontError || !storefront) {
      return NextResponse.json(
        { error: 'Storefront not found' },
        { status: 404 }
      );
    }

    // Insert order tracking
    const { data: order, error: orderError } = await supabase
      .from('storefront_orders')
      .insert({
        storefront_id: storefront.id,
        customer_name,
        customer_phone,
        customer_address,
        order_items,
        total_amount: totalAmount,
        payment_method,
        delivery_method,
        notes,
        payment_proof_url,
        order_code,
        public_tracking_code: trackingCode,
        session_id: sessionId,
        user_agent: userAgent,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { error: 'Failed to track order' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_code: order.order_code,
      public_tracking_code: order.public_tracking_code,
    });
  } catch (error) {
    console.error('Order tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET orders for storefront owner dashboard
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get storefront and verify ownership
    const { data: storefront, error: storefrontError } = await supabase
      .from('business_storefronts')
      .select('id')
      .eq('slug', slug)
      .eq('user_id', user.id)
      .single();

    if (storefrontError || !storefront) {
      return NextResponse.json(
        { error: 'Storefront not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get orders with stats
    const { data: orders, error: ordersError } = await supabase
      .from('storefront_orders')
      .select('*')
      .eq('storefront_id', storefront.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    // Calculate summary stats
    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.reduce((sum, o) => sum + parseFloat(o.total_amount), 0) || 0;
    const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;

    return NextResponse.json({
      orders: orders || [],
      stats: {
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        pending_orders: pendingOrders,
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - update order status (owner only)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { order_id, status, transaction_id } = body || {};

    if (!order_id || !status) {
      return NextResponse.json({ error: 'order_id dan status wajib diisi' }, { status: 400 });
    }

    const allowed = ['pending', 'confirmed', 'preparing', 'shipped', 'completed', 'canceled'];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
    }

    // Verify ownership
    const { data: storefront, error: storefrontError } = await supabase
      .from('business_storefronts')
      .select('id')
      .eq('slug', slug)
      .eq('user_id', user.id)
      .single();

    if (storefrontError || !storefront) {
      return NextResponse.json(
        { error: 'Storefront not found or unauthorized' },
        { status: 404 }
      );
    }

    const updatePayload: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (transaction_id) {
      updatePayload.transaction_id = transaction_id;
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('storefront_orders')
      .update(updatePayload)
      .eq('id', order_id)
      .eq('storefront_id', storefront.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json(
        { error: 'Gagal memperbarui order' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
