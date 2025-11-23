import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const sessionId = request.headers.get('x-session-id');
    const userAgent = request.headers.get('user-agent') || '';
    
    const body = await request.json();
    const { order_items, total_amount, payment_method } = body;

    const supabase = await createClient();

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
        order_items,
        total_amount,
        payment_method,
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

    return NextResponse.json({ success: true, order_id: order.id });
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
