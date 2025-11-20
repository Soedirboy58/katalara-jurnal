import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/storefront/[slug] - Get storefront details by slug (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // Get storefront details
    const { data: storefront, error: storefrontError } = await supabase
      .from('business_storefronts')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (storefrontError || !storefront) {
      return NextResponse.json(
        { error: 'Toko tidak ditemukan' },
        { status: 404 }
      );
    }

    // Get products for this storefront
    const { data: products, error: productsError } = await supabase
      .from('storefront_products')
      .select('*')
      .eq('storefront_id', storefront.id)
      .eq('is_visible', true)
      .order('is_featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json(
        { error: 'Gagal memuat produk' },
        { status: 500 }
      );
    }

    // Increment view count (fire and forget)
    supabase
      .from('business_storefronts')
      .update({ total_views: (storefront.total_views || 0) + 1 })
      .eq('id', storefront.id)
      .then();

    // Track analytics event
    supabase
      .from('storefront_analytics')
      .insert({
        storefront_id: storefront.id,
        event_type: 'page_view',
        session_id: request.headers.get('x-session-id') || undefined,
      })
      .then();

    return NextResponse.json({
      storefront,
      products: products || [],
    });
  } catch (error) {
    console.error('Error in storefront API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
