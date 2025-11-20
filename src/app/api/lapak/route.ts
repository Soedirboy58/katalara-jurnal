import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// GET /api/lapak - Get user's storefront
export async function GET() {
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

    // Get user's storefront
    const { data: storefront, error: storefrontError } = await supabase
      .from('business_storefronts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (storefrontError && storefrontError.code !== 'PGRST116') {
      console.error('Error fetching storefront:', storefrontError);
      return NextResponse.json(
        { error: 'Gagal memuat data lapak' },
        { status: 500 }
      );
    }

    // If no storefront exists, return null
    if (!storefront) {
      return NextResponse.json({ storefront: null });
    }

    // Get products count
    const { count: productsCount } = await supabase
      .from('storefront_products')
      .select('*', { count: 'exact', head: true })
      .eq('storefront_id', storefront.id);

    // Get analytics summary (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: analytics } = await supabase
      .from('storefront_analytics')
      .select('event_type')
      .eq('storefront_id', storefront.id)
      .gte('created_at', thirtyDaysAgo.toISOString());

    const analyticsSummary = {
      page_views: analytics?.filter(a => a.event_type === 'page_view').length || 0,
      product_clicks: analytics?.filter(a => a.event_type === 'product_click').length || 0,
      cart_adds: analytics?.filter(a => a.event_type === 'cart_add').length || 0,
      checkouts: analytics?.filter(a => a.event_type === 'checkout_start').length || 0,
      whatsapp_clicks: analytics?.filter(a => a.event_type === 'whatsapp_click').length || 0,
    };

    return NextResponse.json({
      storefront,
      products_count: productsCount || 0,
      analytics: analyticsSummary,
    });
  } catch (error) {
    console.error('Error in lapak API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/lapak - Create or update storefront
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
    const {
      store_name,
      description,
      whatsapp_number,
      instagram_handle,
      location_text,
      theme_color,
      logo_url,
      cover_image_url,
      qris_image_url,
      bank_name,
      bank_account_number,
      bank_account_holder,
      is_active,
    } = body;

    // Validate required fields
    if (!store_name || !whatsapp_number) {
      return NextResponse.json(
        { error: 'Nama toko dan nomor WhatsApp wajib diisi' },
        { status: 400 }
      );
    }

    // Check if storefront exists
    const { data: existingStorefront } = await supabase
      .from('business_storefronts')
      .select('id, slug')
      .eq('user_id', user.id)
      .single();

    if (existingStorefront) {
      // Update existing storefront
      const { data: updatedStorefront, error: updateError } = await supabase
        .from('business_storefronts')
        .update({
          store_name,
          description,
          whatsapp_number,
          instagram_handle,
          location_text,
          theme_color,
          logo_url,
          cover_image_url,
          qris_image_url,
          bank_name,
          bank_account_number,
          bank_account_holder,
          is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingStorefront.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating storefront:', updateError);
        return NextResponse.json(
          { error: 'Gagal memperbarui lapak' },
          { status: 500 }
        );
      }

      return NextResponse.json({ storefront: updatedStorefront });
    } else {
      // Generate slug from store name
      const baseSlug = store_name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      // Check if slug is unique, add number if not
      let slug = baseSlug;
      let counter = 1;
      let isUnique = false;

      while (!isUnique) {
        const { data: existingSlug } = await supabase
          .from('business_storefronts')
          .select('slug')
          .eq('slug', slug)
          .single();

        if (!existingSlug) {
          isUnique = true;
        } else {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
      }

      // Create new storefront
      const { data: newStorefront, error: createError } = await supabase
        .from('business_storefronts')
        .insert({
          user_id: user.id,
          slug,
          store_name,
          description,
          whatsapp_number,
          instagram_handle,
          location_text,
          theme_color: theme_color || '#3B82F6',
          logo_url,
          cover_image_url,
          qris_image_url,
          bank_name,
          bank_account_number,
          bank_account_holder,
          is_active: is_active !== undefined ? is_active : true,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating storefront:', createError);
        return NextResponse.json(
          { error: 'Gagal membuat lapak' },
          { status: 500 }
        );
      }

      return NextResponse.json({ storefront: newStorefront });
    }
  } catch (error) {
    console.error('Error in lapak API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/lapak - Delete storefront and all related data
export async function DELETE() {
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

    // Get storefront ID
    const { data: storefront } = await supabase
      .from('business_storefronts')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!storefront) {
      return NextResponse.json(
        { error: 'Storefront not found' },
        { status: 404 }
      );
    }

    // Delete storefront (CASCADE will delete products, analytics, cart_sessions)
    const { error: deleteError } = await supabase
      .from('business_storefronts')
      .delete()
      .eq('id', storefront.id);

    if (deleteError) {
      console.error('Error deleting storefront:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete storefront' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE lapak API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
