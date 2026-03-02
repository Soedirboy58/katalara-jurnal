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
    const storefrontId = typeof body?.storefrontId === 'string' ? body.storefrontId : '';

    if (productIds.length === 0) {
      return NextResponse.json(
        { error: 'Product ids are required' },
        { status: 400 }
      );
    }

    let storefrontIds: string[] = [];
    if (storefrontId) {
      storefrontIds = [storefrontId];
    } else {
      const { data: storefronts, error: storefrontsError } = await supabase
        .from('business_storefronts')
        .select('id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (storefrontsError) {
        return NextResponse.json(
          { error: 'Gagal memuat lapak' },
          { status: 500 }
        );
      }

      storefrontIds = (storefronts || []).map((row: any) => String(row.id));
    }

    if (storefrontIds.length === 0) {
      return NextResponse.json(
        { error: 'Buat lapak terlebih dahulu' },
        { status: 400 }
      );
    }

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .in('id', productIds);

    if (productsError) {
      return NextResponse.json(
        { error: 'Gagal memuat produk' },
        { status: 500 }
      );
    }

    const byId = new Map<string, any>();
    for (const p of products || []) {
      byId.set(String(p.id), p);
    }

    const { data: existing } = await supabase
      .from('storefront_products')
      .select('id, product_id, storefront_id')
      .eq('user_id', user.id)
      .in('product_id', productIds)
      .in('storefront_id', storefrontIds);

    const existingMap = new Map<string, string>();
    for (const row of existing || []) {
      existingMap.set(`${row.storefront_id}:${row.product_id}`, row.id);
    }

    const chunkSize = 50;
    for (const storefront of storefrontIds) {
      for (const productId of productIds) {
        const product = byId.get(String(productId));
        if (!product) continue;

        const resolvedPrice =
          (product as any).selling_price ??
          (product as any).sell_price ??
          (product as any).price ??
          0;
        const resolvedImage = (product as any).image_url ?? null;
        const resolvedImageUrls = Array.isArray((product as any).image_urls)
          ? (product as any).image_urls
          : resolvedImage
            ? [resolvedImage]
            : [];
        const resolvedStockRaw =
          (product as any).stock_quantity ??
          (product as any).stock ??
          (product as any).quantity ??
          0;
        const resolvedStock = Number.isFinite(Number(resolvedStockRaw)) ? Number(resolvedStockRaw) : 0;
        const resolvedLowStock =
          (product as any).min_stock_alert ??
          (product as any).low_stock_threshold ??
          5;

        const payload = {
          user_id: user.id,
          storefront_id: storefront,
          product_id: product.id,
          name: product.name,
          description: product.description || `${product.name} - Produk berkualitas`,
          product_type: 'barang',
          category: product.category || 'Lainnya',
          price: resolvedPrice,
          compare_at_price: null,
          stock_quantity: resolvedStock,
          low_stock_threshold: resolvedLowStock,
          track_inventory: product.track_inventory !== false,
          stock_status: 'in_stock',
          is_visible: true,
          is_featured: false,
          image_url: resolvedImage,
          image_urls: resolvedImageUrls,
          sort_order: 0,
          updated_at: new Date().toISOString(),
        };

        const key = `${storefront}:${product.id}`;
        const existingId = existingMap.get(key);
        if (existingId) {
          const { error: updateError } = await supabase
            .from('storefront_products')
            .update(payload)
            .eq('id', existingId);

          if (updateError) {
            return NextResponse.json(
              { error: 'Gagal memperbarui produk Lapak' },
              { status: 500 }
            );
          }
        } else {
          const { error: insertError } = await supabase
            .from('storefront_products')
            .insert(payload);

          if (insertError) {
            return NextResponse.json(
              { error: 'Gagal menambahkan produk ke Lapak' },
              { status: 500 }
            );
          }
        }
      }
    }

    return NextResponse.json({ message: 'Produk berhasil disinkronkan ke semua Lapak' });
  } catch (error) {
    console.error('Error in bulk-sync:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
