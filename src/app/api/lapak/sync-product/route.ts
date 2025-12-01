import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/lapak/sync-product - Sync a product from products table to storefront_products
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
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get the product from products table
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', user.id)
      .single();

    if (productError || !product) {
      console.error('Error fetching product:', productError);
      return NextResponse.json(
        { error: 'Produk tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if user has a storefront
    const { data: storefront, error: storefrontError } = await supabase
      .from('business_storefronts')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (storefrontError || !storefront) {
      return NextResponse.json(
        { error: 'Buat Lapak Online terlebih dahulu di menu Lapak' },
        { status: 400 }
      );
    }

    // Check if product already exists in storefront_products
    const { data: existingProduct } = await supabase
      .from('storefront_products')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', product.name)
      .single();

    if (existingProduct) {
      // Update existing product
      const { error: updateError } = await supabase
        .from('storefront_products')
        .update({
          description: product.description || `${product.name} - Produk berkualitas`,
          product_type: 'barang', // Default to barang
          category: product.category || 'Lainnya',
          price: product.price,
          compare_at_price: null,
          // ⚠️ stock_quantity removed - doesn't exist in products table
          // Stock will be managed separately in stock_movements
          track_inventory: product.track_inventory !== false,
          is_visible: true,
          is_featured: false,
          image_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProduct.id);

      if (updateError) {
        console.error('Error updating product:', updateError);
        return NextResponse.json(
          { error: 'Gagal memperbarui produk di Lapak' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Produk berhasil diperbarui di Lapak Online',
        productId: existingProduct.id,
        action: 'updated',
      });
    } else {
      // Create new product in storefront_products
      const { data: newProduct, error: insertError } = await supabase
        .from('storefront_products')
        .insert({
          user_id: user.id,
          storefront_id: storefront.id,
          name: product.name,
          description: product.description || `${product.name} - Produk berkualitas`,
          product_type: 'barang', // Default to barang
          category: product.category || 'Lainnya',
          price: product.price,
          compare_at_price: null,
          // ⚠️ stock_quantity removed - doesn't exist in products table
          // Stock will be managed separately in stock_movements
          track_inventory: product.track_inventory !== false,
          is_visible: true,
          is_featured: false,
          image_url: null,
          sort_order: 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating product:', insertError);
        return NextResponse.json(
          { error: 'Gagal menambahkan produk ke Lapak' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Produk berhasil ditambahkan ke Lapak Online',
        productId: newProduct.id,
        action: 'created',
      });
    }
  } catch (error) {
    console.error('Error in sync-product API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/lapak/sync-product - Remove product from Lapak Online
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const productName = searchParams.get('productName');

    if (!productName) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    // Find and delete the product from storefront_products
    const { error: deleteError } = await supabase
      .from('storefront_products')
      .delete()
      .eq('user_id', user.id)
      .eq('name', productName);

    if (deleteError) {
      console.error('Error deleting product:', deleteError);
      return NextResponse.json(
        { error: 'Gagal menghapus produk dari Lapak' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Produk berhasil dihapus dari Lapak Online',
    });
  } catch (error) {
    console.error('Error in sync-product DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/lapak/sync-product - Check if product is synced to Lapak
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const productName = searchParams.get('productName');

    if (!productName) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    // Check if product exists in storefront_products
    const { data: product } = await supabase
      .from('storefront_products')
      .select('id, is_visible, is_featured')
      .eq('user_id', user.id)
      .eq('name', productName)
      .single();

    return NextResponse.json({
      synced: !!product,
      storefrontProductId: product?.id,
      isVisible: product?.is_visible,
      isFeatured: product?.is_featured,
    });
  } catch (error) {
    console.error('Error in sync-product GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
