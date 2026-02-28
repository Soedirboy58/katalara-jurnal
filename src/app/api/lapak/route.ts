import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'

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
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const { data: analytics } = await supabase
      .from('storefront_analytics')
      .select('event_type, created_at, session_id')
      .eq('storefront_id', storefront.id)
      .gte('created_at', thirtyDaysAgo.toISOString());

    const isAfter = (dateString: string, pivot: Date) => {
      const ts = new Date(dateString).getTime()
      return Number.isFinite(ts) && ts >= pivot.getTime()
    }

    const pageViews = (analytics || []).filter((a) => a.event_type === 'page_view')
    const cartAdds = (analytics || []).filter((a) => a.event_type === 'cart_add')
    const whatsappClicks = (analytics || []).filter((a) => a.event_type === 'whatsapp_click')

    const uniqueVisitorsSet = new Set(
      pageViews
        .map((a: any) => String(a?.session_id || '').trim())
        .filter(Boolean)
    )

    const analyticsSummary = {
      page_views: pageViews.length || 0,
      page_views_today: pageViews.filter((a: any) => isAfter(a.created_at, startOfToday)).length || 0,
      page_views_7d: pageViews.filter((a: any) => isAfter(a.created_at, sevenDaysAgo)).length || 0,
      unique_visitors_30d: uniqueVisitorsSet.size || pageViews.length || 0,
      product_clicks: analytics?.filter(a => a.event_type === 'product_click').length || 0,
      cart_adds: cartAdds.length || 0,
      cart_adds_today: cartAdds.filter((a: any) => isAfter(a.created_at, startOfToday)).length || 0,
      checkouts: analytics?.filter(a => a.event_type === 'checkout_start').length || 0,
      whatsapp_clicks: whatsappClicks.length || 0,
      whatsapp_clicks_today: whatsappClicks.filter((a: any) => isAfter(a.created_at, startOfToday)).length || 0,
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
    const authSupabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await authSupabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase =
      supabaseUrl && serviceKey
        ? createSupabaseJsClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
        : authSupabase

    const body = await request.json();
    const {
      store_name,
      description,
      whatsapp_number,
      wa_status_templates,
      banner_image_urls,
      banner_autoplay_ms,
      instagram_handle,
      location_text,
      theme_color,
      logo_url,
      cover_image_url,
      qris_image_url,
      bank_name,
      bank_account_number,
      bank_account_holder,
      hero_title,
      hero_subtitle,
      hero_cta_label,
      products_title,
      products_subtitle,
      is_active,
      storefront_id,
      create_new,
    } = body;

    const sanitizeBannerUrls = (raw: any): string[] => {
      if (!Array.isArray(raw)) return []
      return raw
        .map((item) => String(item || '').trim())
        .filter(Boolean)
        .slice(0, 6)
    }

    const normalizeAutoplayMs = (raw: any) => {
      const n = Number(raw)
      if (!Number.isFinite(n)) return 3500
      return Math.max(1200, Math.min(10000, Math.round(n)))
    }

    const normalizedBannerUrls = sanitizeBannerUrls(banner_image_urls)
    const normalizedBannerAutoplayMs = normalizeAutoplayMs(banner_autoplay_ms)
    const normalizeImageValue = (raw: any) => {
      const val = String(raw || '').trim()
      // Treat empty string same as null/undefined for comparison
      return val === '' ? null : val
    }
    const sameString = (left: any, right: any) => {
      const l = normalizeImageValue(left)
      const r = normalizeImageValue(right)
      // Both null/empty = same
      if (l === null && r === null) return true
      // One null, one has value = different
      if (l === null || r === null) return false
      // Both have value = compare
      return l === r
    }
    const sameBannerUrls = (left: string[], right: string[]) => {
      // Empty array same as null/undefined
      if (left.length === 0 && right.length === 0) return true
      return left.length === right.length && left.every((url, idx) => url === right[idx])
    }

    const isMissingColumnError = (error: any) => {
      const msg = String(error?.message || error?.details || '')
      const code = String(error?.code || error?.error_code || '').toUpperCase()
      return (
        code === '42703' ||
        code.startsWith('PGRST') ||
        /schema cache|does not exist|could not find the '.*' column|column .* does not exist/i.test(msg)
      )
    }

    const extractMissingColumns = (error: any): string[] => {
      const text = `${String(error?.message || '')} ${String(error?.details || '')}`
      const regexes = [
        /'([a-zA-Z0-9_]+)'\s+column/gi,
        /column\s+['\"]?([a-zA-Z0-9_]+)['\"]?\s+does not exist/gi,
        /Could not find the ['\"]?([a-zA-Z0-9_]+)['\"]? column/gi,
      ]

      const found = new Set<string>()
      for (const regex of regexes) {
        let match: RegExpExecArray | null
        while ((match = regex.exec(text)) !== null) {
          if (match[1]) found.add(match[1])
        }
      }

      return Array.from(found)
    }

    const buildStorefrontPayload = () => {
      return {
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
        hero_title,
        hero_subtitle,
        hero_cta_label,
        products_title,
        products_subtitle,
        is_active,
        wa_status_templates,
        banner_image_urls: normalizedBannerUrls,
        banner_autoplay_ms: normalizedBannerAutoplayMs,
        updated_at: new Date().toISOString(),
      }
    }

    const runMutationWithFallback = async <T>(
      execute: (payload: Record<string, any>) => Promise<{ data: T | null; error: any }>
    ) => {
      const payload = buildStorefrontPayload()
      const missingColumns = new Set<string>()
      let lastError: any = null

      for (let attempt = 0; attempt < 12; attempt++) {
        const result = await execute(payload)

        if (!result.error) {
          const warning =
            missingColumns.size > 0
              ? `Sebagian kolom belum tersedia di database (${Array.from(missingColumns).join(', ')}), jadi bagian itu tidak ikut tersimpan.`
              : undefined

          return {
            data: result.data,
            error: null,
            warning,
          }
        }

        lastError = result.error

        if (!isMissingColumnError(result.error)) {
          break
        }

        const extracted = extractMissingColumns(result.error)
        if (!extracted.length) {
          break
        }

        let removedAny = false
        for (const col of extracted) {
          missingColumns.add(col)
          if (Object.prototype.hasOwnProperty.call(payload, col)) {
            delete payload[col]
            removedAny = true
          }
        }

        if (!removedAny) {
          break
        }
      }

      return {
        data: null as T | null,
        error: lastError,
        warning: undefined as string | undefined,
      }
    }

    const finalizeStorefrontMediaPersistence = async (storefrontId: string, baseWarning?: string) => {
      const warnings: string[] = []
      if (baseWarning) warnings.push(baseWarning)

      const readStorefront = async () =>
        supabase
          .from('business_storefronts')
          .select('*')
          .eq('id', storefrontId)
          .eq('user_id', user.id)
          .maybeSingle()

      const initialRead = await readStorefront()
      if (initialRead.error || !initialRead.data) {
        return {
          storefront: null as any,
          warning: warnings.join(' ').trim() || undefined,
          error: initialRead.error,
        }
      }

      const desiredLogo = normalizeImageValue(logo_url)
      const desiredQris = normalizeImageValue(qris_image_url)
      const desiredBanners = normalizedBannerUrls

      const currentRow = initialRead.data as any
      const patch: Record<string, any> = {}

      if (!sameString(currentRow.logo_url, desiredLogo)) {
        patch.logo_url = desiredLogo
      }

      if (!sameString(currentRow.qris_image_url, desiredQris)) {
        patch.qris_image_url = desiredQris
      }

      const currentBanners = sanitizeBannerUrls(currentRow.banner_image_urls)
      if (!sameBannerUrls(currentBanners, desiredBanners)) {
        patch.banner_image_urls = desiredBanners
      }

      if (Object.keys(patch).length > 0) {
        patch.updated_at = new Date().toISOString()
        
        console.log('[Media Sync] Attempting to update:', {
          storefrontId,
          patch: {
            logo_url: patch.logo_url || '(not in patch)',
            qris_image_url: patch.qris_image_url || '(not in patch)',
            banner_image_urls: patch.banner_image_urls || '(not in patch)'
          }
        })
        
        const fullPatchAttempt = await supabase
          .from('business_storefronts')
          .update(patch)
          .eq('id', storefrontId)
          .eq('user_id', user.id)

        // Increased delay from 100ms to 300ms to ensure database commit completes
        await new Promise(resolve => setTimeout(resolve, 300))

        if (fullPatchAttempt.error) {
          if (isMissingColumnError(fullPatchAttempt.error) && Object.prototype.hasOwnProperty.call(patch, 'banner_image_urls')) {
            warnings.push('Kolom banner_image_urls belum tersedia di database, data banner carousel belum bisa disimpan.')
            const { banner_image_urls: _ignoredBanner, ...retryPatch } = patch
            if (Object.keys(retryPatch).length > 1) {
              const retryWithoutBanner = await supabase
                .from('business_storefronts')
                .update(retryPatch)
                .eq('id', storefrontId)
                .eq('user_id', user.id)

              if (retryWithoutBanner.error) {
                warnings.push(`Sinkronisasi logo/qris gagal: ${String(retryWithoutBanner.error?.message || retryWithoutBanner.error?.details || 'unknown error')}`)
              }
            }
          } else {
            warnings.push(`Sinkronisasi media gagal: ${String(fullPatchAttempt.error?.message || fullPatchAttempt.error?.details || 'unknown error')}`)
          }
        }
      }

      const finalRead = await readStorefront()
      const finalRow = finalRead.data as any
      if (!finalRow) {
        return {
          storefront: initialRead.data,
          warning: warnings.join(' ').trim() || undefined,
          error: finalRead.error,
        }
      }

      const unsynced: string[] = []
      
      const logoMatch = sameString(finalRow.logo_url, desiredLogo)
      const qrisMatch = sameString(finalRow.qris_image_url, desiredQris)
      const bannerMatch = sameBannerUrls(sanitizeBannerUrls(finalRow.banner_image_urls), desiredBanners)
      
      console.log('[Persistence Check] Verification:', {
        logo: { 
          desired: desiredLogo, 
          actual: finalRow.logo_url,
          desiredNorm: normalizeImageValue(desiredLogo),
          actualNorm: normalizeImageValue(finalRow.logo_url),
          match: logoMatch
        },
        qris: {
          desired: desiredQris,
          actual: finalRow.qris_image_url,
          match: qrisMatch
        },
        banner: {
          desired: desiredBanners,
          actual: sanitizeBannerUrls(finalRow.banner_image_urls),
          match: bannerMatch
        }
      })
      
      if (!logoMatch) unsynced.push('logo_url')
      if (!qrisMatch) unsynced.push('qris_image_url')
      if (!bannerMatch) unsynced.push('banner_image_urls')
      
      if (unsynced.length > 0) {
        warnings.push(`⚠️ Sebagian field belum sinkron: ${unsynced.join(', ')}. Jika upload sudah selesai, coba refresh halaman (F5) untuk melihat data terbaru.`)
      }

      return {
        storefront: finalRow,
        warning: warnings.join(' ').trim() || undefined,
        error: null,
      }
    }

    // Validate required fields
    if (!store_name || !whatsapp_number) {
      return NextResponse.json(
        { error: 'Nama toko dan nomor WhatsApp wajib diisi' },
        { status: 400 }
      );
    }

    // Update specific storefront if id provided
    if (storefront_id) {
      const updateResult = await runMutationWithFallback((payload) =>
        supabase
          .from('business_storefronts')
          .update(payload)
          .eq('id', storefront_id)
          .eq('user_id', user.id)
          .select()
          .maybeSingle()
      )

      if (updateResult.error) {
        console.error('Error updating storefront:', updateResult.error);
        return NextResponse.json(
          {
            error: 'Gagal memperbarui lapak',
            detail: String(updateResult.error?.message || updateResult.error?.details || ''),
          },
          { status: 500 }
        );
      }

      if (!updateResult.data) {
        const { data: fallbackStorefront, error: fallbackFindError } = await supabase
          .from('business_storefronts')
          .select('id')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (fallbackFindError || !fallbackStorefront?.id) {
          return NextResponse.json(
            { error: 'Lapak tidak ditemukan atau tidak memiliki akses untuk memperbarui lapak ini' },
            { status: 404 }
          )
        }

        const fallbackUpdateResult = await runMutationWithFallback((payload) =>
          supabase
            .from('business_storefronts')
            .update(payload)
            .eq('id', fallbackStorefront.id)
            .eq('user_id', user.id)
            .select()
            .maybeSingle()
        )

        if (fallbackUpdateResult.error) {
          return NextResponse.json(
            {
              error: 'Gagal memperbarui lapak',
              detail: String(
                fallbackUpdateResult.error?.message || fallbackUpdateResult.error?.details || ''
              ),
            },
            { status: 500 }
          )
        }

        const resolvedFallbackStorefront = fallbackUpdateResult.data || (
          await supabase
            .from('business_storefronts')
            .select('*')
            .eq('id', fallbackStorefront.id)
            .eq('user_id', user.id)
            .maybeSingle()
        ).data

        if (!resolvedFallbackStorefront) {
          return NextResponse.json(
            { error: 'Lapak tidak ditemukan atau tidak memiliki akses untuk memperbarui lapak ini' },
            { status: 404 }
          )
        }

        const finalized = await finalizeStorefrontMediaPersistence(
          resolvedFallbackStorefront.id,
          fallbackUpdateResult.warning
        )

        return NextResponse.json({
          storefront: finalized.storefront || resolvedFallbackStorefront,
          warning: finalized.warning,
        })
      }

      const finalized = await finalizeStorefrontMediaPersistence(updateResult.data.id, updateResult.warning)

      return NextResponse.json({
        storefront: finalized.storefront || updateResult.data,
        warning: finalized.warning,
      });
    }

    // If not explicitly creating new, try to update the most recent storefront
    if (!create_new) {
      const { data: existingStorefront } = await supabase
        .from('business_storefronts')
        .select('id, slug')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingStorefront) {
      // Update existing storefront
      const updateResult = await runMutationWithFallback((payload) =>
        supabase
          .from('business_storefronts')
          .update(payload)
          .eq('id', existingStorefront.id)
          .select()
          .maybeSingle()
      )

      if (updateResult.error) {
        console.error('Error updating storefront:', updateResult.error);
        return NextResponse.json(
          {
            error: 'Gagal memperbarui lapak',
            detail: String(updateResult.error?.message || updateResult.error?.details || ''),
          },
          { status: 500 }
        );
      }

        const resolvedStorefront = updateResult.data || (
          await supabase
            .from('business_storefronts')
            .select('*')
            .eq('id', existingStorefront.id)
            .eq('user_id', user.id)
            .maybeSingle()
        ).data

        if (!resolvedStorefront) {
          return NextResponse.json(
            { error: 'Lapak tidak ditemukan atau tidak memiliki akses untuk memperbarui lapak ini' },
            { status: 404 }
          )
        }

        const finalized = await finalizeStorefrontMediaPersistence(resolvedStorefront.id, updateResult.warning)

        return NextResponse.json({
          storefront: finalized.storefront || resolvedStorefront,
          warning: finalized.warning,
        });
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
          .maybeSingle();

        if (!existingSlug) {
          isUnique = true;
        } else {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
      }

      // Create new storefront
      const createResult = await runMutationWithFallback((payload) =>
        supabase
          .from('business_storefronts')
          .insert({
            user_id: user.id,
            slug,
            ...payload,
            theme_color: payload.theme_color || '#3B82F6',
            is_active: payload.is_active !== undefined ? payload.is_active : true,
          })
          .select()
          .maybeSingle()
      )

      if (createResult.error) {
        console.error('Error creating storefront:', createResult.error);
        return NextResponse.json(
          {
            error: 'Gagal membuat lapak',
            detail: String(createResult.error?.message || createResult.error?.details || ''),
          },
          { status: 500 }
        );
      }

      const resolvedCreatedStorefront = createResult.data || (
        await supabase
          .from('business_storefronts')
          .select('*')
          .eq('user_id', user.id)
          .eq('slug', slug)
          .maybeSingle()
      ).data || (
        await supabase
          .from('business_storefronts')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ).data

      if (!resolvedCreatedStorefront) {
        return NextResponse.json(
          {
            error: 'Lapak berhasil dibuat namun belum bisa dimuat, silakan refresh halaman',
            detail: 'Storefront row not returned after insert',
          },
          { status: 500 }
        )
      }

      const finalized = await finalizeStorefrontMediaPersistence(resolvedCreatedStorefront.id, createResult.warning)

      return NextResponse.json({
        storefront: finalized.storefront || resolvedCreatedStorefront,
        warning: finalized.warning,
      });
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
    const authSupabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await authSupabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase =
      supabaseUrl && serviceKey
        ? createSupabaseJsClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
        : authSupabase

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
