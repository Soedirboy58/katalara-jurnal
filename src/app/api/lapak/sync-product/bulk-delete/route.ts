import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const admin =
      supabaseUrl && serviceKey
        ? createSupabaseJsClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
        : supabase;

    if (productIds.length === 0 && productNames.length === 0) {
      return NextResponse.json(
        { error: 'Product ids or names are required' },
        { status: 400 }
      );
    }

    if (storefrontId) {
      const { data: storefront, error: storefrontError } = await supabase
        .from('business_storefronts')
        .select('id')
        .eq('id', storefrontId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (storefrontError || !storefront) {
        return NextResponse.json(
          { error: 'Lapak tidak ditemukan' },
          { status: 404 }
        );
      }
    }

    const chunkSize = 50
    const fetchStorefrontProductIds = async (ids: string[], names: string[]) => {
      const collected: string[] = []
      if (ids.length) {
        for (let i = 0; i < ids.length; i += chunkSize) {
          let query = admin
            .from('storefront_products')
            .select('id')
            .eq('user_id', user.id)
            .in('product_id', ids.slice(i, i + chunkSize))

          if (storefrontId) {
            query = query.eq('storefront_id', storefrontId)
          }

          const { data, error } = await query
          if (error) return { ids: collected, error }
          for (const row of data || []) collected.push(String(row.id))
        }
      }

      if (names.length) {
        for (let i = 0; i < names.length; i += chunkSize) {
          let query = admin
            .from('storefront_products')
            .select('id')
            .eq('user_id', user.id)
            .in('name', names.slice(i, i + chunkSize))

          if (storefrontId) {
            query = query.eq('storefront_id', storefrontId)
          }

          const { data, error } = await query
          if (error) return { ids: collected, error }
          for (const row of data || []) collected.push(String(row.id))
        }
      }

      return { ids: collected, error: null }
    }

    const deleteAnalyticsByIds = async (ids: string[]) => {
      if (!ids.length) return null
      for (let i = 0; i < ids.length; i += chunkSize) {
        const { error } = await admin
          .from('storefront_analytics')
          .delete()
          .in('product_id', ids.slice(i, i + chunkSize))

        if (error) return error
      }
      return null
    }

    const deleteByIds = async (ids: string[]) => {
      for (let i = 0; i < ids.length; i += chunkSize) {
        let query = admin
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
        let query = admin
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

    const { ids: storefrontProductIds, error: collectError } = await fetchStorefrontProductIds(productIds, productNames)
    if (collectError) {
      console.error('Error collecting storefront products:', collectError)
      return NextResponse.json(
        { error: `Gagal mengambil data Lapak: ${collectError.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    const analyticsError = await deleteAnalyticsByIds(storefrontProductIds)
    if (analyticsError) {
      console.error('Error deleting analytics:', analyticsError)
      return NextResponse.json(
        { error: `Gagal menghapus analytics Lapak: ${analyticsError.message || 'Unknown error'}` },
        { status: 500 }
      )
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
