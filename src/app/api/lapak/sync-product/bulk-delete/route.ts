import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null as any);
    const productIds = Array.isArray(body?.productIds) ? body.productIds : [];
    const productNames = Array.isArray(body?.productNames) ? body.productNames : [];
    const storefrontId = typeof body?.storefrontId === 'string' ? body.storefrontId : '';

    if (productIds.length === 0 && productNames.length === 0) {
      return NextResponse.json(
        { error: 'Product ids or names are required' },
        { status: 400 }
      );
    }

    let deleteQuery = supabase
      .from('storefront_products')
      .delete()
      .eq('user_id', user.id);

    if (productIds.length) {
      deleteQuery = deleteQuery.in('product_id', productIds);
    } else if (productNames.length) {
      deleteQuery = deleteQuery.in('name', productNames);
    }

    if (storefrontId) {
      deleteQuery = deleteQuery.eq('storefront_id', storefrontId);
    }

    const { data: deletedRows, error: deleteError } = await deleteQuery.select('id');

    if (deleteError) {
      console.error('Error deleting products:', deleteError);
      return NextResponse.json(
        { error: 'Gagal menghapus produk dari Lapak' },
        { status: 500 }
      );
    }

    if ((!deletedRows || deletedRows.length === 0) && productNames.length) {
      let fallback = supabase
        .from('storefront_products')
        .delete()
        .eq('user_id', user.id)
        .in('name', productNames);

      if (storefrontId) {
        fallback = fallback.eq('storefront_id', storefrontId);
      }

      const { error: fallbackError } = await fallback;
      if (fallbackError) {
        console.error('Error deleting products by name:', fallbackError);
        return NextResponse.json(
          { error: 'Gagal menghapus produk dari Lapak' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: 'Produk berhasil dihapus dari Lapak Online',
    });
  } catch (error) {
    console.error('Error in bulk-delete:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
