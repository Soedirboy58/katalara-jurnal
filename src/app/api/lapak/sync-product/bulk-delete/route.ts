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

    const chunkSize = 50
    const deleteByIds = async (ids: string[]) => {
      for (let i = 0; i < ids.length; i += chunkSize) {
        let query = supabase
          .from('storefront_products')
          .delete()
          .eq('user_id', user.id)
          .in('product_id', ids.slice(i, i + chunkSize))

        if (storefrontId) {
          query = query.eq('storefront_id', storefrontId)
        }

        const { error } = await query
        if (error) return error
      }
      return null
    }

    const deleteByNames = async (names: string[]) => {
      for (let i = 0; i < names.length; i += chunkSize) {
        let query = supabase
          .from('storefront_products')
          .delete()
          .eq('user_id', user.id)
          .in('name', names.slice(i, i + chunkSize))

        if (storefrontId) {
          query = query.eq('storefront_id', storefrontId)
        }

        const { error } = await query
        if (error) return error
      }
      return null
    }

    let deleteError: any = null

    if (productIds.length) {
      deleteError = await deleteByIds(productIds)
    } else if (productNames.length) {
      deleteError = await deleteByNames(productNames)
    }

    if (deleteError) {
      console.error('Error deleting products:', deleteError)
      return NextResponse.json(
        { error: `Gagal menghapus produk dari Lapak: ${deleteError.message || 'Unknown error'}` },
        { status: 500 }
      )
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
