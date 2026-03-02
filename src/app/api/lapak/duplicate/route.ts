import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const isRlsError = (error: any) => {
  const msg = String(error?.message || error?.details || '').toLowerCase()
  return (
    error?.code === '42501' ||
    msg.includes('row-level security') ||
    msg.includes('violates row-level security policy')
  )
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

const buildSlugBase = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const ensureUniqueSlug = async (supabase: any, base: string) => {
  let slug = base || 'lapak'
  let counter = 1
  while (true) {
    const { data } = await supabase
      .from('business_storefronts')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle()
    if (!data) return slug
    slug = `${base}-${counter}`
    counter += 1
  }
}

const insertWithFallback = async (supabase: any, table: string, payload: Record<string, any>) => {
  let working = { ...payload }
  const missingColumns = new Set<string>()
  let lastError: any = null

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const result = await supabase.from(table).insert(working).select().maybeSingle()
    if (!result.error) {
      return { data: result.data, error: null, warning: missingColumns.size ? Array.from(missingColumns).join(', ') : null }
    }

    lastError = result.error
    if (!isMissingColumnError(result.error)) break

    const extracted = extractMissingColumns(result.error)
    if (!extracted.length) break

    let removed = false
    for (const col of extracted) {
      missingColumns.add(col)
      if (Object.prototype.hasOwnProperty.call(working, col)) {
        delete working[col]
        removed = true
      }
    }

    if (!removed) break
  }

  return { data: null, error: lastError, warning: missingColumns.size ? Array.from(missingColumns).join(', ') : null }
}

const insertProductsWithFallback = async (supabase: any, rows: Record<string, any>[]) => {
  let working = rows.map((row) => ({ ...row }))
  const missingColumns = new Set<string>()
  let lastError: any = null

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const result = await supabase.from('storefront_products').insert(working)
    if (!result.error) {
      return { ok: true, warning: missingColumns.size ? Array.from(missingColumns).join(', ') : null }
    }

    lastError = result.error
    if (!isMissingColumnError(result.error)) break

    const extracted = extractMissingColumns(result.error)
    if (!extracted.length) break

    let removed = false
    for (const col of extracted) {
      missingColumns.add(col)
      working = working.map((row) => {
        const next = { ...row }
        delete next[col]
        return next
      })
      removed = true
    }

    if (!removed) break
  }

  return { ok: false, warning: missingColumns.size ? Array.from(missingColumns).join(', ') : null, error: lastError }
}

export async function POST(request: NextRequest) {
  try {
    const authSupabase = await createClient()
    const { data: { user }, error: userError } = await authSupabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase =
      supabaseUrl && serviceKey
        ? createSupabaseJsClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
        : authSupabase

    const body = await request.json().catch(() => null as any)
    const sourceId = String(body?.storefront_id || '').trim()
    if (!sourceId) {
      return NextResponse.json({ error: 'Storefront ID is required' }, { status: 400 })
    }

    const { data: source, error: sourceError } = await supabase
      .from('business_storefronts')
      .select('*')
      .eq('id', sourceId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (sourceError || !source) {
      return NextResponse.json({ error: 'Lapak tidak ditemukan' }, { status: 404 })
    }

    const { data: existingNames } = await supabase
      .from('business_storefronts')
      .select('store_name')
      .eq('user_id', user.id)

    const baseLabel = String(source.store_name || 'Lapak').trim() || 'Lapak'
    const namePattern = new RegExp(`^${escapeRegex(baseLabel)}\\s+outlet\\s*\\((\\d+)\\)$`, 'i')

    let maxIndex = 0
    for (const row of existingNames || []) {
      const name = String((row as any)?.store_name || '').trim()
      const match = name.match(namePattern)
      if (match?.[1]) {
        const n = Number(match[1])
        if (Number.isFinite(n)) maxIndex = Math.max(maxIndex, n)
      }
    }

    const nextIndex = maxIndex + 1
    const baseName = `${baseLabel} outlet (${nextIndex})`
    const slugBase = buildSlugBase(baseName)
    const slug = await ensureUniqueSlug(supabase, slugBase)
    const outletCode = `OUTLET-${String(nextIndex).padStart(2, '0')}`

    const storefrontPayload = {
      user_id: user.id,
      slug,
      store_name: baseName,
      description: source.description || null,
      whatsapp_number: source.whatsapp_number,
      instagram_handle: source.instagram_handle || null,
      location_text: source.location_text || null,
      theme_color: source.theme_color || '#3B82F6',
      logo_url: source.logo_url || null,
      cover_image_url: source.cover_image_url || null,
      qris_image_url: source.qris_image_url || null,
      bank_name: source.bank_name || null,
      bank_account_number: source.bank_account_number || null,
      bank_account_holder: source.bank_account_holder || null,
      hero_title: source.hero_title || null,
      hero_subtitle: source.hero_subtitle || null,
      hero_cta_label: source.hero_cta_label || null,
      products_title: source.products_title || null,
      products_subtitle: source.products_subtitle || null,
      wa_status_templates: source.wa_status_templates || null,
      banner_image_urls: source.banner_image_urls || null,
      banner_autoplay_ms: source.banner_autoplay_ms || null,
      outlet_code: outletCode,
      outlet_manager_phone: source.outlet_manager_phone || null,
      commission_rate: source.commission_rate ?? null,
      parent_storefront_id: source.id,
      is_active: false,
      updated_at: new Date().toISOString(),
    }

    const createResult = await insertWithFallback(supabase, 'business_storefronts', storefrontPayload)
    if (createResult.error || !createResult.data) {
      const hasServiceRole = Boolean(serviceKey)
      if (isRlsError(createResult.error)) {
        return NextResponse.json(
          {
            error: hasServiceRole
              ? 'Gagal duplikat lapak karena kebijakan database (RLS). Jalankan migration RLS storefront terbaru.'
              : 'Gagal duplikat lapak karena konfigurasi server belum lengkap. Tambahkan SUPABASE_SERVICE_ROLE_KEY atau jalankan migration RLS storefront terbaru.',
            detail: String(createResult.error?.message || createResult.error?.details || ''),
            code: 'RLS_INSERT_DENIED',
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        {
          error: 'Gagal duplikat lapak',
          detail: String(createResult.error?.message || createResult.error?.details || ''),
        },
        { status: 500 }
      )
    }

    const newStorefront = createResult.data

    const { data: sourceProducts, error: productsError } = await supabase
      .from('storefront_products')
      .select('*')
      .eq('storefront_id', sourceId)
      .eq('user_id', user.id)

    if (productsError) {
      console.error('Duplicate storefront products fetch error:', productsError)
      return NextResponse.json({
        storefront: newStorefront,
        warning: 'Lapak berhasil diduplikat, tetapi produk gagal dimuat untuk disalin.',
      })
    }

    if (Array.isArray(sourceProducts) && sourceProducts.length > 0) {
      const productIds = sourceProducts
        .map((product: any) => String(product?.product_id || '').trim())
        .filter(Boolean)

      let validProductIds = new Set<string>()
      if (productIds.length > 0) {
        const { data: masterProducts, error: masterError } = await supabase
          .from('products')
          .select('id')
          .in('id', productIds)
          .eq('user_id', user.id)

        if (masterError) {
          console.error('Duplicate storefront master products check error:', masterError)
        } else {
          validProductIds = new Set((masterProducts || []).map((row: any) => String(row.id)))
        }
      }

      const productPayloads = sourceProducts.map((product: any) => {
        const rawId = String(product?.product_id || '').trim()
        const safeProductId = rawId && validProductIds.has(rawId) ? rawId : null
        return {
        user_id: user.id,
        storefront_id: newStorefront.id,
        product_id: safeProductId,
        name: product.name,
        description: product.description || null,
        product_type: product.product_type || 'barang',
        category: product.category || null,
        price: product.price || 0,
        compare_at_price: product.compare_at_price || null,
        stock_quantity: product.stock_quantity ?? 0,
        low_stock_threshold: product.low_stock_threshold ?? 0,
        track_inventory: product.track_inventory !== false,
        stock_status: product.stock_status || 'in_stock',
        image_url: product.image_url || null,
        image_urls: product.image_urls || null,
        variants: product.variants || null,
        is_visible: product.is_visible !== false,
        is_featured: product.is_featured === true,
        seo_title: product.seo_title || null,
        seo_description: product.seo_description || null,
        view_count: 0,
        click_count: 0,
        cart_add_count: 0,
        sort_order: product.sort_order ?? 0,
      }
      })

      const productInsert = await insertProductsWithFallback(supabase, productPayloads)
      if (!productInsert.ok) {
        console.error('Duplicate storefront products insert error:', productInsert.error)
        const warning = productInsert.warning
          ? `Lapak berhasil diduplikat, tetapi sebagian kolom produk belum tersedia (${productInsert.warning}).`
          : 'Lapak berhasil diduplikat, tetapi sebagian produk gagal disalin.'
        return NextResponse.json({ storefront: newStorefront, warning })
      }
    }

    return NextResponse.json({ storefront: newStorefront })
  } catch (error) {
    console.error('Duplicate storefront error:', error)
    return NextResponse.json(
      { error: 'Internal server error', detail: String((error as any)?.message || '') },
      { status: 500 }
    )
  }
}
