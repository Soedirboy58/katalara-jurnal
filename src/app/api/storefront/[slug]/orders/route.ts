import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
}

const toNumber = (value: any) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const isMissingRpc = (error: any, fnName: string) => {
  const msg = String(error?.message || '').toLowerCase()
  return msg.includes(fnName) && (msg.includes('does not exist') || msg.includes('not found') || msg.includes('function'))
}

const isMissingColumnError = (error: any) => {
  const msg = String(error?.message || error?.details || '').toLowerCase()
  const code = String(error?.code || '').toUpperCase()
  return code === '42703' || msg.includes('column') || msg.includes('does not exist')
}

const buildCustomerAddress = (payload: {
  customer_address?: string
  customer_address_detail?: string
  customer_rt_rw?: string
  customer_landmark?: string
  customer_desa_name?: string
  customer_kecamatan_name?: string
  customer_kabupaten_name?: string
  customer_province_name?: string
}) => {
  const explicit = (payload.customer_address || '').trim()
  if (explicit) return explicit

  const detail = (payload.customer_address_detail || '').trim()
  const rtRw = (payload.customer_rt_rw || '').trim()
  const landmark = (payload.customer_landmark || '').trim()
  const desa = (payload.customer_desa_name || '').trim()
  const kecamatan = (payload.customer_kecamatan_name || '').trim()
  const kabupaten = (payload.customer_kabupaten_name || '').trim()
  const provinsi = (payload.customer_province_name || '').trim()

  const addressParts = [detail]
  if (rtRw) addressParts.push(`RT/RW ${rtRw}`)
  if (landmark) addressParts.push(`Patokan: ${landmark}`)

  const regionParts = [desa, kecamatan, kabupaten, provinsi].filter(Boolean)
  if (regionParts.length) addressParts.push(regionParts.join(', '))

  return addressParts.filter(Boolean).join(', ')
}

type CustomersUserColumn = 'owner_id' | 'user_id'

const getCustomersUserColumn = async (supabase: any): Promise<CustomersUserColumn> => {
  const isMissingColumn = (err: any, col: string) => {
    const code = (err?.code || err?.error_code || '').toString().toUpperCase()
    if (code === '42703') return true

    const msg = (err?.message || err?.details || '').toString().toLowerCase()
    const c = col.toLowerCase()

    if (code.startsWith('PGRST')) {
      if (msg.includes('schema cache') && msg.includes(c)) return true
      if (msg.includes('could not find') && msg.includes(c) && (msg.includes('column') || msg.includes('field'))) return true
      if (msg.includes('unknown field') && msg.includes(c)) return true
    }

    return (
      msg.includes('does not exist') &&
      (msg.includes(`customers.${c}`) ||
        msg.includes(`column customers.${c}`) ||
        msg.includes(`column "${c}"`) ||
        msg.includes(`"${c}" of relation "customers"`) ||
        msg.includes(` ${c} `))
    )
  }

  {
    const { error } = await supabase.from('customers').select('owner_id').limit(1)
    if (!error) return 'owner_id'
    if (!isMissingColumn(error, 'owner_id')) return 'owner_id'
  }

  {
    const { error } = await supabase.from('customers').select('user_id').limit(1)
    if (!error) return 'user_id'
    return 'user_id'
  }
}

const runCustomerMutationWithFallback = async <T>(
  supabase: any,
  execute: (payload: Record<string, any>) => Promise<{ data: T | null; error: any }>,
  payload: Record<string, any>
) => {
  const working = { ...payload }
  const missingColumns = new Set<string>()
  let lastError: any = null

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const result = await execute(working)
    if (!result.error) {
      return { data: result.data, error: null, missingColumns }
    }

    lastError = result.error
    if (!isMissingColumnError(result.error)) break

    const text = `${String(result.error?.message || '')} ${String(result.error?.details || '')}`
    const match = text.match(/'([a-zA-Z0-9_]+)'\s+column|column\s+['"]?([a-zA-Z0-9_]+)['"]?\s+does not exist|Could not find the ['"]?([a-zA-Z0-9_]+)['"]? column/i)
    const col = match?.[1] || match?.[2] || match?.[3]
    if (!col) break
    missingColumns.add(col)
    if (Object.prototype.hasOwnProperty.call(working, col)) {
      delete working[col]
      continue
    }
    break
  }

  return { data: null as T | null, error: lastError, missingColumns }
}

const upsertCustomerFromOrder = async (
  supabase: any,
  userId: string,
  payload: {
    customer_name?: string
    customer_phone?: string
    customer_address?: string
    customer_province_id?: string
    customer_province_name?: string
    customer_kabupaten_id?: string
    customer_kabupaten_name?: string
    customer_kecamatan_id?: string
    customer_kecamatan_name?: string
    customer_desa_id?: string
    customer_desa_name?: string
    customer_address_detail?: string
    customer_rt_rw?: string
    customer_landmark?: string
  }
) => {
  const name = (payload.customer_name || '').trim()
  if (!name) return

  const phone = (payload.customer_phone || '').trim()
  const fullAddress = (payload.customer_address || '').trim()
  const userCol = await getCustomersUserColumn(supabase)

  let existing: any = null
  if (phone) {
    const { data } = await supabase
      .from('customers')
      .select('id')
      .eq(userCol, userId)
      .eq('phone', phone)
      .maybeSingle()
    existing = data
  }

  if (!existing) {
    const { data } = await supabase
      .from('customers')
      .select('id')
      .eq(userCol, userId)
      .ilike('name', name)
      .maybeSingle()
    existing = data
  }

  const basePayload: Record<string, any> = {
    name,
    phone: phone || null,
    address: fullAddress || null,
    province_id: payload.customer_province_id || null,
    province_name: payload.customer_province_name || null,
    kabupaten_id: payload.customer_kabupaten_id || null,
    kabupaten_name: payload.customer_kabupaten_name || null,
    kecamatan_id: payload.customer_kecamatan_id || null,
    kecamatan_name: payload.customer_kecamatan_name || null,
    desa_id: payload.customer_desa_id || null,
    desa_name: payload.customer_desa_name || null,
    address_detail: payload.customer_address_detail || null,
    rt_rw: payload.customer_rt_rw || null,
    landmark: payload.customer_landmark || null,
    updated_at: new Date().toISOString(),
  }

  if (existing?.id) {
    await runCustomerMutationWithFallback(
      supabase,
      (data) => supabase.from('customers').update(data).eq('id', existing.id).select().maybeSingle(),
      basePayload
    )
    return
  }

  const insertPayload = {
    ...basePayload,
    [userCol]: userId,
    created_at: new Date().toISOString(),
  }

  await runCustomerMutationWithFallback(
    supabase,
    (data) => supabase.from('customers').insert(data).select().maybeSingle(),
    insertPayload
  )
}

const getCanonicalStock = (row: any) => {
  const stockQty = toNumber(row?.stock_quantity)
  const stockLegacy = toNumber(row?.stock)
  let canonical = stockQty
  if (stockQty <= 0 && stockLegacy > 0) canonical = stockLegacy
  if (stockQty > 0 && stockLegacy <= 0) canonical = stockQty
  if (stockQty > 0 && stockLegacy > 0) canonical = stockQty
  if (canonical < 0) canonical = 0
  return canonical
}

const adjustStockSafe = async (supabase: any, productId: string, quantityChange: number, notes: string) => {
  try {
    const { data, error } = await supabase.rpc('adjust_stock', {
      p_product_id: productId,
      p_quantity_change: quantityChange,
      p_notes: notes,
    })
    if (error) throw error

    if (data && typeof data === 'object' && (data as any).new_stock !== undefined) {
      const next = toNumber((data as any).new_stock)
      if (Number.isFinite(next)) {
        try {
          await supabase.from('products').update({ stock: next, stock_quantity: next }).eq('id', productId)
        } catch {
          // ignore
        }
      }
    }

    return { ok: true }
  } catch (error: any) {
    if (!isMissingRpc(error, 'adjust_stock')) {
      return { ok: false, error: error?.message || 'Failed to adjust stock' }
    }
  }

  try {
    const stockResult = await supabase
      .from('products')
      .select('stock_quantity, stock')
      .eq('id', productId)
      .maybeSingle()

    if (stockResult.error) throw stockResult.error

    const current = getCanonicalStock(stockResult.data)
    const next = Math.max(0, current + quantityChange)

    const updateResult = await supabase
      .from('products')
      .update({ stock: next, stock_quantity: next })
      .eq('id', productId)

    if (updateResult.error && isMissingColumnError(updateResult.error)) {
      await supabase.from('products').update({ stock: next }).eq('id', productId)
    }

    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error?.message || 'Failed to adjust stock' }
  }
}

const normalizeOrderItems = (raw: any) => {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

const syncStockAfterOrder = async (supabase: any, rawItems: any, orderLabel: string) => {
  const orderItems = normalizeOrderItems(rawItems)
  if (orderItems.length === 0) return

  const qtyByStorefrontId = new Map<string, number>()
  for (const item of orderItems) {
    const id = String(item?.product_id || '').trim()
    if (!id) continue
    const qty = toNumber(item?.quantity ?? item?.qty ?? 0)
    if (qty <= 0) continue
    qtyByStorefrontId.set(id, (qtyByStorefrontId.get(id) || 0) + qty)
  }

  if (qtyByStorefrontId.size === 0) return

  const storefrontIds = Array.from(qtyByStorefrontId.keys())
  const { data: storefrontProducts, error: storefrontError } = await supabase
    .from('storefront_products')
    .select('id, product_id, stock_quantity, track_inventory')
    .in('id', storefrontIds)

  if (storefrontError || !storefrontProducts) return

  const qtyByMasterId = new Map<string, number>()
  const localUpdates: Array<{ id: string; nextStock: number }> = []

  for (const product of storefrontProducts) {
    const requested = qtyByStorefrontId.get(product.id) || 0
    if (!requested) continue
    if (product.track_inventory === false) continue

    const current = toNumber((product as any).stock_quantity)
    const next = Math.max(0, current - requested)
    localUpdates.push({ id: product.id, nextStock: next })

    const masterId = String((product as any).product_id || '').trim()
    if (masterId) {
      qtyByMasterId.set(masterId, (qtyByMasterId.get(masterId) || 0) + requested)
    }
  }

  for (const update of localUpdates) {
    await supabase
      .from('storefront_products')
      .update({ stock_quantity: update.nextStock, updated_at: new Date().toISOString() })
      .eq('id', update.id)
  }

  const masterIds = Array.from(qtyByMasterId.keys())
  if (masterIds.length === 0) return

  for (const productId of masterIds) {
    const qty = qtyByMasterId.get(productId) || 0
    if (!qty) continue
    await adjustStockSafe(supabase, productId, -qty, `Lapak order ${orderLabel}`)
  }

  const masterFetch = await supabase
    .from('products')
    .select('id, stock_quantity, stock, track_inventory')
    .in('id', masterIds)

  if (!masterFetch.error && Array.isArray(masterFetch.data)) {
    for (const row of masterFetch.data) {
      if (row?.track_inventory === false) continue
      const canonical = getCanonicalStock(row)
      if (!Number.isFinite(canonical)) continue
      await supabase
        .from('storefront_products')
        .update({ stock_quantity: canonical, updated_at: new Date().toISOString() })
        .eq('product_id', row.id)
    }
    return
  }

  if (masterFetch.error && !isMissingColumnError(masterFetch.error)) return

  const linked = await supabase
    .from('storefront_products')
    .select('id, product_id, stock_quantity, track_inventory')
    .in('product_id', masterIds)

  if (linked.error || !linked.data) return

  for (const row of linked.data) {
    if (row.track_inventory === false) continue
    const masterId = String(row.product_id || '').trim()
    if (!masterId) continue
    const qty = qtyByMasterId.get(masterId) || 0
    if (!qty) continue
    const next = Math.max(0, toNumber(row.stock_quantity) - qty)
    await supabase
      .from('storefront_products')
      .update({ stock_quantity: next, updated_at: new Date().toISOString() })
      .eq('id', row.id)
  }
}

const restoreStockAfterCancel = async (supabase: any, rawItems: any, orderLabel: string) => {
  const orderItems = normalizeOrderItems(rawItems)
  if (orderItems.length === 0) return

  const qtyByStorefrontId = new Map<string, number>()
  for (const item of orderItems) {
    const id = String(item?.product_id || '').trim()
    if (!id) continue
    const qty = toNumber(item?.quantity ?? item?.qty ?? 0)
    if (qty <= 0) continue
    qtyByStorefrontId.set(id, (qtyByStorefrontId.get(id) || 0) + qty)
  }

  if (qtyByStorefrontId.size === 0) return

  const storefrontIds = Array.from(qtyByStorefrontId.keys())
  const { data: storefrontProducts, error: storefrontError } = await supabase
    .from('storefront_products')
    .select('id, product_id, stock_quantity, track_inventory')
    .in('id', storefrontIds)

  if (storefrontError || !storefrontProducts) return

  const qtyByMasterId = new Map<string, number>()
  const localUpdates: Array<{ id: string; nextStock: number }> = []

  for (const product of storefrontProducts) {
    const requested = qtyByStorefrontId.get(product.id) || 0
    if (!requested) continue
    if (product.track_inventory === false) continue

    const current = toNumber((product as any).stock_quantity)
    const next = Math.max(0, current + requested)
    localUpdates.push({ id: product.id, nextStock: next })

    const masterId = String((product as any).product_id || '').trim()
    if (masterId) {
      qtyByMasterId.set(masterId, (qtyByMasterId.get(masterId) || 0) + requested)
    }
  }

  for (const update of localUpdates) {
    await supabase
      .from('storefront_products')
      .update({ stock_quantity: update.nextStock, updated_at: new Date().toISOString() })
      .eq('id', update.id)
  }

  const masterIds = Array.from(qtyByMasterId.keys())
  if (masterIds.length === 0) return

  for (const productId of masterIds) {
    const qty = qtyByMasterId.get(productId) || 0
    if (!qty) continue
    await adjustStockSafe(supabase, productId, qty, `Lapak order canceled ${orderLabel}`)
  }

  const masterFetch = await supabase
    .from('products')
    .select('id, stock_quantity, stock, track_inventory')
    .in('id', masterIds)

  if (!masterFetch.error && Array.isArray(masterFetch.data)) {
    for (const row of masterFetch.data) {
      if (row?.track_inventory === false) continue
      const canonical = getCanonicalStock(row)
      if (!Number.isFinite(canonical)) continue
      await supabase
        .from('storefront_products')
        .update({ stock_quantity: canonical, updated_at: new Date().toISOString() })
        .eq('product_id', row.id)
    }
    return
  }

  if (masterFetch.error && !isMissingColumnError(masterFetch.error)) return

  const linked = await supabase
    .from('storefront_products')
    .select('id, product_id, stock_quantity, track_inventory')
    .in('product_id', masterIds)

  if (linked.error || !linked.data) return

  for (const row of linked.data) {
    if (row.track_inventory === false) continue
    const masterId = String(row.product_id || '').trim()
    if (!masterId) continue
    const qty = qtyByMasterId.get(masterId) || 0
    if (!qty) continue
    const next = Math.max(0, toNumber(row.stock_quantity) + qty)
    await supabase
      .from('storefront_products')
      .update({ stock_quantity: next, updated_at: new Date().toISOString() })
      .eq('id', row.id)
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const sessionId = request.headers.get('x-session-id');
    const userAgent = request.headers.get('user-agent') || '';
    
    const body = await request.json();
    const {
      order_items,
      total_amount,
      payment_method,
      customer_name,
      customer_phone,
      customer_address,
      customer_province_id,
      customer_province_name,
      customer_kabupaten_id,
      customer_kabupaten_name,
      customer_kecamatan_id,
      customer_kecamatan_name,
      customer_desa_id,
      customer_desa_name,
      customer_address_detail,
      customer_rt_rw,
      customer_landmark,
      delivery_method,
      notes,
      payment_proof_url,
      order_code,
      public_tracking_code,
      affiliate_code,
    } = body;

    if (!Array.isArray(order_items) || order_items.length === 0) {
      return NextResponse.json({ error: 'Order items wajib diisi' }, { status: 400 })
    }

    const totalAmount = Number(total_amount)
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return NextResponse.json({ error: 'Total amount tidak valid' }, { status: 400 })
    }

    if (!customer_name || !customer_phone) {
      return NextResponse.json({ error: 'Nama dan nomor HP wajib diisi' }, { status: 400 })
    }

    const randomToken = () => {
      try {
        return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      } catch {
        // Fallback if crypto.randomUUID is unavailable (should be rare)
        return Math.random().toString(36).slice(2, 14)
      }
    }

    const trackingCode = public_tracking_code || `${order_code || 'ORD'}-${randomToken()}`

    const extractMissingColumn = (err: any) => {
      const msg = ((err as any)?.message || (err as any)?.details || '').toString()
      let m = msg.match(/Could not find the '([^']+)' column/i)
      if (m?.[1]) return m[1]
      m = msg.match(/column\s+[^.]+\.([^\s]+)\s+does not exist/i)
      if (m?.[1]) return m[1].replace(/"/g, '')
      m = msg.match(/column\s+"([^"]+)"\s+does not exist/i)
      if (m?.[1]) return m[1]
      return ''
    }

    const isSchemaMismatch = (err: any) => {
      const msg = ((err as any)?.message || '').toString().toLowerCase()
      const code = (err as any)?.code || ''
      return code === '42703' || msg.includes('column') || msg.includes('could not find')
    }

    // Prefer service-role for public order tracking to avoid RLS issues.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase =
      supabaseUrl && serviceKey
        ? createSupabaseJsClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
        : await createClient();

    // Get storefront ID from slug
    const { data: storefront, error: storefrontError } = await supabase
      .from('business_storefronts')
      .select('id, user_id')
      .eq('slug', slug)
      .single();

    if (storefrontError || !storefront) {
      return NextResponse.json(
        { error: 'Storefront not found' },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    // Insert order tracking with schema-compatible fallback
    const resolvedAddress = delivery_method === 'delivery'
      ? buildCustomerAddress({
          customer_address,
          customer_address_detail,
          customer_rt_rw,
          customer_landmark,
          customer_desa_name,
          customer_kecamatan_name,
          customer_kabupaten_name,
          customer_province_name,
        })
      : ''
    let insertPayload: Record<string, any> = {
      storefront_id: storefront.id,
      customer_name,
      customer_phone,
      customer_address: resolvedAddress,
      order_items,
      total_amount: totalAmount,
      payment_method,
      delivery_method,
      notes,
      payment_proof_url,
      order_code,
      public_tracking_code: trackingCode,
      affiliate_code: affiliate_code || null,
      session_id: sessionId,
      user_agent: userAgent,
      status: 'pending',
    }

    let order: any = null
    let orderError: any = null

    for (let i = 0; i < 10; i++) {
      const result = await supabase
        .from('storefront_orders')
        .insert(insertPayload)
        .select()
        .single()

      order = result.data
      orderError = result.error

      if (!orderError) break
      if (!isSchemaMismatch(orderError)) break

      const missing = extractMissingColumn(orderError)
      if (missing && Object.prototype.hasOwnProperty.call(insertPayload, missing)) {
        delete insertPayload[missing]
        continue
      }

      // If we cannot detect the column, stop retrying to avoid endless loops.
      break
    }

    if (orderError || !order) {
      console.error('Error creating order:', orderError)

      const message = (orderError?.message || '').toString().toLowerCase()
      const isRlsError =
        orderError?.code === '42501' ||
        message.includes('row-level security') ||
        message.includes('violates row-level security policy')

      if (isRlsError) {
        const hasServiceRole = Boolean(serviceKey)
        return NextResponse.json(
          {
            error: hasServiceRole
              ? 'Checkout ditolak kebijakan database (RLS). Jalankan migration RLS storefront terbaru.'
              : 'Checkout sementara gagal karena konfigurasi server belum lengkap. Tambahkan SUPABASE_SERVICE_ROLE_KEY atau jalankan migration RLS storefront terbaru.',
            code: 'RLS_INSERT_DENIED',
          },
          { status: 500, headers: NO_STORE_HEADERS }
        )
      }

      return NextResponse.json(
        { error: orderError?.message || 'Failed to track order' },
        { status: 500, headers: NO_STORE_HEADERS }
      )
    }

    const responseTrackingCode = (order as any).public_tracking_code || (order as any).order_code || trackingCode

    try {
      await upsertCustomerFromOrder(supabase, storefront.user_id, {
        customer_name,
        customer_phone,
        customer_address: resolvedAddress,
        customer_province_id,
        customer_province_name,
        customer_kabupaten_id,
        customer_kabupaten_name,
        customer_kecamatan_id,
        customer_kecamatan_name,
        customer_desa_id,
        customer_desa_name,
        customer_address_detail,
        customer_rt_rw,
        customer_landmark,
      })
    } catch (error) {
      console.error('Customer upsert error:', error)
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_code: order.order_code,
      public_tracking_code: responseTrackingCode,
    }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Order tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

// GET orders for storefront owner dashboard
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
    }

    // Get storefront and verify ownership
    const { data: storefront, error: storefrontError } = await supabase
      .from('business_storefronts')
      .select('id')
      .eq('slug', slug)
      .eq('user_id', user.id)
      .single();

    if (storefrontError || !storefront) {
      return NextResponse.json(
        { error: 'Storefront not found or unauthorized' },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    // Get orders with stats
    const { data: orders, error: ordersError } = await supabase
      .from('storefront_orders')
      .select('*')
      .eq('storefront_id', storefront.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500, headers: NO_STORE_HEADERS }
      );
    }

    // Calculate summary stats
    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.reduce((sum, o) => sum + parseFloat(o.total_amount), 0) || 0;
    const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;

    return NextResponse.json({
      orders: orders || [],
      stats: {
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        pending_orders: pendingOrders,
      },
    }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

// PATCH - update order status (owner only)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
    }

    const body = await request.json();
    const { order_id, status, transaction_id } = body || {};

    if (!order_id || !status) {
      return NextResponse.json({ error: 'order_id dan status wajib diisi' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const normalizeStatus = (raw: string) => {
      const value = String(raw || '').toLowerCase()
      if (value === 'cancelled') return 'canceled'
      return value
    }

    const normalizedStatus = normalizeStatus(status)
    const allowed = ['pending', 'confirmed', 'preparing', 'shipped', 'completed', 'canceled'];
    if (!allowed.includes(normalizedStatus)) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    // Verify ownership
    const { data: storefront, error: storefrontError } = await supabase
      .from('business_storefronts')
      .select('id')
      .eq('slug', slug)
      .eq('user_id', user.id)
      .single();

    if (storefrontError || !storefront) {
      return NextResponse.json(
        { error: 'Storefront not found or unauthorized' },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    const { data: currentOrder } = await supabase
      .from('storefront_orders')
      .select('status, order_items, order_code, payment_method, payment_proof_url, total_amount, transaction_id')
      .eq('id', order_id)
      .eq('storefront_id', storefront.id)
      .maybeSingle()

    const updatePayload: any = {
      status: normalizedStatus,
      updated_at: new Date().toISOString(),
    };

    if (transaction_id) {
      updatePayload.transaction_id = transaction_id;
    }

    const extractMissingColumn = (err: any) => {
      const msg = ((err as any)?.message || (err as any)?.details || '').toString()
      let m = msg.match(/Could not find the '([^']+)' column/i)
      if (m?.[1]) return m[1]
      m = msg.match(/column\s+[^.]+\.([^\s]+)\s+does not exist/i)
      if (m?.[1]) return m[1].replace(/"/g, '')
      m = msg.match(/column\s+"([^"]+)"\s+does not exist/i)
      if (m?.[1]) return m[1]
      return ''
    }

    const isSchemaMismatch = (err: any) => {
      const msg = ((err as any)?.message || '').toString().toLowerCase()
      const code = (err as any)?.code || ''
      return code === '42703' || msg.includes('column') || msg.includes('could not find')
    }

    let payload: Record<string, any> = { ...updatePayload }
    let updatedOrder: any = null
    let updateError: any = null

    for (let i = 0; i < 6; i++) {
      const result = await supabase
        .from('storefront_orders')
        .update(payload)
        .eq('id', order_id)
        .eq('storefront_id', storefront.id)
        .select()
        .single();

      updatedOrder = result.data
      updateError = result.error

      if (!updateError) break
      if (!isSchemaMismatch(updateError)) break

      const missing = extractMissingColumn(updateError)
      if (missing && Object.prototype.hasOwnProperty.call(payload, missing)) {
        delete payload[missing]
        continue
      }

      break
    }

    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json(
        { error: 'Gagal memperbarui order' },
        { status: 500, headers: NO_STORE_HEADERS }
      );
    }

    if (normalizedStatus === 'confirmed' && currentOrder?.status !== 'confirmed') {
      try {
        await syncStockAfterOrder(
          supabase,
          currentOrder?.order_items,
          currentOrder?.order_code || order_id
        )
      } catch (error) {
        console.error('Stock sync error:', error)
      }
    }

    const normalizeMethod = (value?: string | null) => String(value || '').toLowerCase()
    const paymentMethod = normalizeMethod(currentOrder?.payment_method)
    const hasPaymentProof = Boolean(currentOrder?.payment_proof_url)
    const isTransfer = paymentMethod === 'transfer' || paymentMethod === 'qris'
    const isCash = paymentMethod === 'cash'

    const shouldMarkPaid =
      Boolean(currentOrder?.transaction_id) &&
      ((isCash && normalizedStatus === 'completed') || (isTransfer && hasPaymentProof && normalizedStatus === 'confirmed'))

    if (shouldMarkPaid) {
      try {
        const total = Math.max(0, toNumber(currentOrder?.total_amount))
        await supabase
          .from('transactions')
          .update({
            payment_status: 'paid',
            paid_amount: total,
            remaining_amount: 0,
            payment_type: 'cash',
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentOrder.transaction_id)
      } catch (error) {
        console.error('Transaction payment update error:', error)
      }
    }

    const shouldRestore =
      normalizedStatus === 'canceled' &&
      currentOrder?.status !== 'canceled' &&
      currentOrder?.status !== 'pending'

    if (shouldRestore) {
      try {
        await restoreStockAfterCancel(
          supabase,
          currentOrder?.order_items,
          currentOrder?.order_code || order_id
        )
      } catch (error) {
        console.error('Stock restore error:', error)
      }
    }

    return NextResponse.json({ success: true, order: updatedOrder }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
