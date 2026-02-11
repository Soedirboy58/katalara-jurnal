import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// GET /api/lapak - Get user's storefront(s)
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

    // Get all storefronts for user (for multi-lapak support)
    const { data: storefronts, error: storefrontsError } = await supabase
      .from('business_storefronts')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (storefrontsError) {
      console.error('Error fetching storefronts:', storefrontsError);
      return NextResponse.json(
        { error: 'Gagal memuat data lapak' },
        { status: 500 }
      );
    }

    if (!storefronts || storefronts.length === 0) {
      return NextResponse.json({ storefront: null, storefronts: [] });
    }

    let storefront = storefronts[0];
    if (storefrontId) {
      const selected = storefronts.find((s) => s.id === storefrontId);
      if (selected) storefront = selected;
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
      storefronts,
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
      storefront_id,
      create_new,
    } = body;

    // Validate required fields
    if (!store_name || !whatsapp_number) {
      return NextResponse.json(
        { error: 'Nama toko dan nomor WhatsApp wajib diisi' },
        { status: 400 }
      );
    }

    // Update specific storefront if id provided
    if (storefront_id) {
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
        .eq('id', storefront_id)
        .eq('user_id', user.id)
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
    }

    // If not explicitly creating new, try to update the most recent storefront
    if (!create_new) {
      const { data: existingStorefront } = await supabase
        .from('business_storefronts')
        .select('id, slug')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
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
      }
    }

    {
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
export async function DELETE(request: NextRequest) {
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

    let targetId = storefrontId || '';
    if (!targetId) {
      const { data: storefronts } = await supabase
        .from('business_storefronts')
        .select('id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (!storefronts || storefronts.length === 0) {
        return NextResponse.json(
          { error: 'Storefront not found' },
          { status: 404 }
        );
      }

      if (storefronts.length > 1) {
        return NextResponse.json(
          { error: 'Pilih lapak yang ingin dihapus' },
          { status: 400 }
        );
      }

      targetId = storefronts[0].id;
    }

    // Delete storefront (CASCADE will delete products, analytics, cart_sessions)
    const { error: deleteError } = await supabase
      .from('business_storefronts')
      .delete()
      .eq('id', targetId)
      .eq('user_id', user.id);

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
