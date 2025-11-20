import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/storefront/[slug]/analytics - Track analytics event (public)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { event_type, product_id, metadata } = body;

    const supabase = await createClient();

    // Get storefront by slug
    const { data: storefront, error: storefrontError } = await supabase
      .from('business_storefronts')
      .select('id')
      .eq('slug', slug)
      .single();

    if (storefrontError || !storefront) {
      return NextResponse.json(
        { error: 'Toko tidak ditemukan' },
        { status: 404 }
      );
    }

    // Insert analytics event
    const { error: analyticsError } = await supabase
      .from('storefront_analytics')
      .insert({
        storefront_id: storefront.id,
        event_type,
        product_id: product_id || null,
        session_id: request.headers.get('x-session-id') || undefined,
        metadata: metadata || null,
      });

    if (analyticsError) {
      console.error('Error tracking analytics:', analyticsError);
      return NextResponse.json(
        { error: 'Gagal melacak event' },
        { status: 500 }
      );
    }

    // Update counters based on event type
    if (event_type === 'product_click' && product_id) {
      supabase
        .from('storefront_products')
        .update({ click_count: supabase.rpc('increment_counter', { row_id: product_id, counter_name: 'click_count' }) })
        .eq('id', product_id)
        .then();
    } else if (event_type === 'cart_add' && product_id) {
      supabase
        .from('storefront_products')
        .update({ cart_add_count: supabase.rpc('increment_counter', { row_id: product_id, counter_name: 'cart_add_count' }) })
        .eq('id', product_id)
        .then();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
