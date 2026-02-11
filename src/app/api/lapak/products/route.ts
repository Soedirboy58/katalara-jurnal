import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/lapak/products - Get user's products
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const storefrontId = searchParams.get('storefrontId');

    let query = supabase
      .from('storefront_products')
      .select('*')
      .eq('user_id', user.id);

    if (storefrontId) {
      query = query.eq('storefront_id', storefrontId);
    }

    const { data: products, error: productsError } = await query
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json(
        { error: 'Gagal memuat produk' },
        { status: 500 }
      );
    }

    let cleanedProducts = products || [];

    const linkedIds = cleanedProducts
      .map((p: any) => p.product_id)
      .filter((id: string | null) => !!id);

    if (linkedIds.length > 0) {
      const { data: activeProducts, error: activeError } = await supabase
        .from('products')
        .select('id, is_active')
        .in('id', linkedIds);

      if (!activeError) {
        const activeIdSet = new Set(
          (activeProducts || []).filter((p: any) => p.is_active).map((p: any) => p.id)
        );

        const orphaned = cleanedProducts.filter(
          (p: any) => p.product_id && !activeIdSet.has(p.product_id)
        );

        if (orphaned.length > 0) {
          const orphanIds = orphaned.map((p: any) => p.id);
          await supabase
            .from('storefront_products')
            .delete()
            .in('id', orphanIds)
            .eq('user_id', user.id);

          cleanedProducts = cleanedProducts.filter((p: any) => !orphanIds.includes(p.id));
        }
      }
    }

    return NextResponse.json({ products: cleanedProducts });
  } catch (error) {
    console.error('Error in products API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/lapak/products - Create product
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { storefront_id } = body;

    let storefrontId = storefront_id as string | undefined;
    if (!storefrontId) {
      const { data: storefront } = await supabase
        .from('business_storefronts')
        .select('id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      storefrontId = storefront?.id;
    }

    if (!storefrontId) {
      return NextResponse.json(
        { error: 'Buat lapak terlebih dahulu' },
        { status: 400 }
      );
    }

    // Create product
    const { data: product, error: createError } = await supabase
      .from('storefront_products')
      .insert({
        ...body,
        user_id: user.id,
        storefront_id: storefrontId,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating product:', createError);
      return NextResponse.json(
        { error: 'Gagal membuat produk' },
        { status: 500 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error in products API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
