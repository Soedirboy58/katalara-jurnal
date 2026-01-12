import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type ProductionComponentInput = {
  product_id: string
  qty: number
  unit?: string
}

type ProductionRequestBody = {
  finished_product_id: string
  output_qty: number
  output_unit?: string
  components: ProductionComponentInput[]
  notes?: string
}

const toNumber = (v: any): number => {
  const n = typeof v === 'number' ? v : Number((v ?? '').toString().replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

function extractMissingColumn(err: any): { table?: string; column?: string } | null {
  const msg = (err?.message || err?.details || '').toString().toLowerCase()

  const tableMatch = msg.match(/relation \"([a-z0-9_]+)\"/i) || msg.match(/table\s+([a-z0-9_]+)/i)
  const colMatch = msg.match(/column\s+\"([a-z0-9_]+)\"/i) || msg.match(/could not find.*\"([a-z0-9_]+)\"/i)

  if (!msg.includes('does not exist') && !msg.includes('could not find') && !msg.includes('schema cache')) return null

  return {
    table: tableMatch?.[1],
    column: colMatch?.[1]
  }
}

function isMissingRpcFunction(err: any, fnName: string): boolean {
  const msg = (err?.message || err?.details || '').toString().toLowerCase()
  if (!msg) return false
  if (msg.includes('could not find the function')) return true
  if (msg.includes('function') && msg.includes(fnName.toLowerCase()) && msg.includes('does not exist')) return true
  return false
}

async function fetchProductsSafe(supabase: any, ids: string[]) {
  const selects = [
    'id, name, track_inventory, stock, stock_quantity, unit, stock_unit',
    'id, name, track_inventory, stock_quantity, unit, stock_unit',
    'id, name, track_inventory, stock, unit',
    'id, name, track_inventory, unit'
  ]

  let lastError: any = null
  for (const sel of selects) {
    const res = await supabase.from('products').select(sel).in('id', ids)
    if (!res.error) return { ok: true as const, data: res.data as any[] }

    lastError = res.error
    const missing = extractMissingColumn(res.error)
    if (missing?.table === 'products' && (missing.column === 'stock' || missing.column === 'stock_quantity' || missing.column === 'stock_unit')) {
      continue
    }

    break
  }

  return { ok: false as const, error: lastError }
}

async function updateProductStockBestEffort(supabase: any, productId: string, nextStock: number) {
  // Try to update both columns, then fall back if schema doesn't have one of them.
  const attempts: Array<Record<string, any>> = [
    { stock: nextStock, stock_quantity: nextStock },
    { stock: nextStock },
    { stock_quantity: nextStock }
  ]

  let lastError: any = null
  for (const payload of attempts) {
    const res = await supabase.from('products').update(payload).eq('id', productId)
    if (!res.error) return { ok: true as const }

    lastError = res.error
    const missing = extractMissingColumn(res.error)
    if (missing?.table === 'products' && (missing.column === 'stock' || missing.column === 'stock_quantity')) {
      continue
    }

    break
  }

  return { ok: false as const, error: lastError }
}

async function adjustStockSafe(
  supabase: any,
  productId: string,
  quantityChange: number,
  notes: string,
  currentStock?: number
): Promise<{ ok: boolean; error?: string; newStock?: number }> {
  try {
    const { data, error } = await supabase.rpc('adjust_stock', {
      p_product_id: productId,
      p_quantity_change: quantityChange,
      p_notes: notes
    })

    if (error) throw error

    if (data && typeof data === 'object' && (data as any).success === false) {
      return { ok: false, error: ((data as any).message || 'Stock adjustment rejected').toString() }
    }

    const newStock = data && typeof data === 'object' ? Number((data as any).new_stock) : undefined

    // Best-effort: keep legacy `products.stock` in sync if DB still uses it.
    if (Number.isFinite(newStock)) {
      try {
        await supabase.from('products').update({ stock: newStock }).eq('id', productId)
      } catch {
        // ignore
      }
    }

    return { ok: true, newStock: Number.isFinite(newStock) ? newStock : undefined }
  } catch (e: any) {
    // Fallback if RPC is missing (older DBs)
    if (!isMissingRpcFunction(e, 'adjust_stock')) {
      return { ok: false, error: e?.message || 'Failed to adjust stock' }
    }

    if (typeof currentStock !== 'number') {
      return { ok: false, error: 'Stock adjustment RPC tidak tersedia dan stok saat ini tidak bisa dibaca.' }
    }

    const nextStock = currentStock + quantityChange
    if (nextStock < 0) {
      return { ok: false, error: 'Stok tidak cukup' }
    }

    const upd = await updateProductStockBestEffort(supabase, productId, nextStock)
    if (!upd.ok) {
      return { ok: false, error: upd.error?.message || 'Gagal update stok produk' }
    }

    return { ok: true, newStock: nextStock }
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as Partial<ProductionRequestBody>

    const finishedProductId = (body?.finished_product_id || '').toString()
    const outputQty = toNumber(body?.output_qty)
    const outputUnit = (body?.output_unit || '').toString() || undefined
    const notes = (body?.notes || '').toString()

    const componentsRaw = Array.isArray(body?.components) ? body?.components : []
    const componentsNormalized: ProductionComponentInput[] = componentsRaw
      .map((c: any) => ({
        product_id: (c?.product_id || '').toString(),
        qty: toNumber(c?.qty),
        unit: (c?.unit || '').toString() || undefined
      }))
      .filter((c) => c.product_id && c.qty > 0)

    if (!finishedProductId) {
      return NextResponse.json({ success: false, error: 'Produk jadi wajib dipilih' }, { status: 400 })
    }

    if (!outputQty || outputQty <= 0) {
      return NextResponse.json({ success: false, error: 'Jumlah produksi harus lebih dari 0' }, { status: 400 })
    }

    if (!componentsNormalized.length) {
      return NextResponse.json({ success: false, error: 'Komponen/bahan wajib diisi minimal 1 item' }, { status: 400 })
    }

    if (componentsNormalized.some((c) => c.product_id === finishedProductId)) {
      return NextResponse.json({ success: false, error: 'Produk jadi tidak boleh menjadi komponen/bahan' }, { status: 400 })
    }

    // Sum quantities by product
    const qtyNeededByProduct = new Map<string, number>()
    for (const c of componentsNormalized) {
      qtyNeededByProduct.set(c.product_id, (qtyNeededByProduct.get(c.product_id) || 0) + c.qty)
    }

    const ids = Array.from(new Set([finishedProductId, ...Array.from(qtyNeededByProduct.keys())]))

    const fetchRes = await fetchProductsSafe(supabase, ids)
    if (!fetchRes.ok) {
      return NextResponse.json(
        { success: false, error: fetchRes.error?.message || 'Gagal mengambil data produk' },
        { status: 500 }
      )
    }

    const products = fetchRes.data || []
    const productById = new Map<string, any>()
    for (const p of products) productById.set((p.id || '').toString(), p)

    const finished = productById.get(finishedProductId)
    if (!finished) {
      return NextResponse.json({ success: false, error: 'Produk jadi tidak ditemukan' }, { status: 404 })
    }

    if (finished.track_inventory === false) {
      return NextResponse.json(
        { success: false, error: 'Produk jadi tidak mengaktifkan tracking stok. Aktifkan dulu di Produk Saya.' },
        { status: 400 }
      )
    }

    const missingComponents = Array.from(qtyNeededByProduct.keys()).filter((id) => !productById.get(id))
    if (missingComponents.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'Beberapa komponen/bahan tidak ditemukan',
          meta: { missing_product_ids: missingComponents }
        },
        { status: 400 }
      )
    }

    // Pre-check stock to prevent negative values (only if we can read stock).
    const insufficient: Array<{ product_id: string; name?: string; available?: number; requested: number }> = []
    for (const [pid, requested] of qtyNeededByProduct.entries()) {
      const p = productById.get(pid)
      if (!p || p.track_inventory === false) continue
      const availableRaw = p.stock ?? p.stock_quantity
      const available =
        availableRaw === null || availableRaw === undefined ? undefined : Number(toNumber(availableRaw))
      if (typeof available !== 'number') continue
      if (available < requested) {
        insufficient.push({ product_id: pid, name: (p.name || '').toString(), available, requested })
      }
    }

    if (insufficient.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stok bahan/komponen tidak cukup. Produksi dibatalkan.',
          meta: { insufficient }
        },
        { status: 400 }
      )
    }

    const batchNotes = notes ? `Production: ${notes}` : `Production: ${outputQty}${outputUnit ? ' ' + outputUnit : ''}`

    // Apply stock changes with rollback on failure.
    const applied: Array<{ product_id: string; delta: number; previousStock?: number }> = []

    for (const [pid, requested] of qtyNeededByProduct.entries()) {
      const p = productById.get(pid)
      if (!p || p.track_inventory === false) continue

      const prev = toNumber(p.stock ?? p.stock_quantity)
      const res = await adjustStockSafe(supabase, pid, -requested, `${batchNotes} (consume)`, prev)
      if (!res.ok) {
        // rollback
        for (let i = applied.length - 1; i >= 0; i--) {
          const a = applied[i]
          await adjustStockSafe(supabase, a.product_id, -a.delta, `${batchNotes} (rollback)`, a.previousStock)
        }
        return NextResponse.json(
          { success: false, error: res.error || 'Gagal mengurangi stok bahan/komponen. Produksi dibatalkan.' },
          { status: 400 }
        )
      }

      applied.push({ product_id: pid, delta: -requested, previousStock: prev })

      // Update local snapshot for subsequent fallback calculations.
      if (typeof res.newStock === 'number') {
        p.stock = res.newStock
        p.stock_quantity = res.newStock
      } else {
        p.stock = prev - requested
        p.stock_quantity = prev - requested
      }
    }

    {
      const prevFinished = toNumber(finished.stock ?? finished.stock_quantity)
      const res = await adjustStockSafe(
        supabase,
        finishedProductId,
        +outputQty,
        `${batchNotes} (output)`,
        prevFinished
      )
      if (!res.ok) {
        // rollback components
        for (let i = applied.length - 1; i >= 0; i--) {
          const a = applied[i]
          await adjustStockSafe(supabase, a.product_id, -a.delta, `${batchNotes} (rollback)`, a.previousStock)
        }
        return NextResponse.json(
          { success: false, error: res.error || 'Gagal menambah stok produk jadi. Produksi dibatalkan.' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        finished_product_id: finishedProductId,
        finished_product_name: (finished.name || '').toString(),
        output_qty: outputQty,
        output_unit: outputUnit,
        components_count: qtyNeededByProduct.size
      }
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Internal server error' }, { status: 500 })
  }
}
