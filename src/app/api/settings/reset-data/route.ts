import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'

type ResetScope =
  | 'customers'
  | 'suppliers'
  | 'transactions'
  | 'products'
  | 'incomes'
  | 'expenses'
  | 'lapak_orders'
  | 'full_platform'

const BASE_RESET_SCOPES: Array<Exclude<ResetScope, 'full_platform'>> = [
  'customers',
  'suppliers',
  'transactions',
  'products',
  'incomes',
  'expenses',
  'lapak_orders',
]

const ALLOWED_SCOPES: ResetScope[] = [...BASE_RESET_SCOPES, 'full_platform']

const hasMissingColumnError = (error: any) => {
  const code = String(error?.code || '')
  const msg = String(error?.message || error?.details || '')
  return code === '42703' || /column .* does not exist/i.test(msg)
}

async function selectIdsByUserColumns(supabase: any, table: string, userId: string, columns = ['user_id', 'owner_id']) {
  for (const col of columns) {
    const { data, error } = await supabase.from(table).select('id').eq(col, userId)
    if (!error) {
      return { ids: (data || []).map((row: any) => row.id), column: col, error: null }
    }
    if (hasMissingColumnError(error)) continue
    return { ids: [] as string[], column: col, error }
  }

  return { ids: [] as string[], column: null, error: null }
}

async function deleteByUserColumns(supabase: any, table: string, userId: string, columns = ['user_id', 'owner_id']) {
  for (const col of columns) {
    const { error } = await supabase.from(table).delete().eq(col, userId)
    if (!error) return { ok: true, column: col }
    if (hasMissingColumnError(error)) continue
    return { ok: false, column: col, error }
  }

  return { ok: true, column: null }
}

async function deleteByInIds(supabase: any, table: string, idColumn: string, ids: string[]) {
  if (!ids.length) return { ok: true }
  const { error } = await supabase.from(table).delete().in(idColumn, ids)
  if (error) return { ok: false, error }
  return { ok: true }
}

async function countByUserColumns(supabase: any, table: string, userId: string, columns = ['user_id', 'owner_id']) {
  for (const col of columns) {
    const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true }).eq(col, userId)
    if (!error) {
      return { count: count || 0, column: col, error: null }
    }
    if (hasMissingColumnError(error)) continue
    return { count: 0, column: col, error }
  }

  return { count: 0, column: null, error: null }
}

async function countByInIds(supabase: any, table: string, idColumn: string, ids: string[]) {
  if (!ids.length) return { count: 0, error: null }
  const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true }).in(idColumn, ids)
  if (error) return { count: 0, error }
  return { count: count || 0, error: null }
}

export async function POST(request: NextRequest) {
  try {
    const authSupabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await authSupabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const scopes = Array.isArray(body?.scopes) ? (body.scopes as string[]) : []
    const confirmation = String(body?.confirmation || '')
    const mode = String(body?.mode || 'delete').toLowerCase()
    const isPreview = mode === 'preview'

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey && !isPreview) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY belum diset. Reset data harus memakai service-role.' },
        { status: 500 }
      )
    }
    const supabase =
      supabaseUrl && serviceKey
        ? createSupabaseJsClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
        : authSupabase

    const sanitizedScopes = scopes.filter((scope): scope is ResetScope => ALLOWED_SCOPES.includes(scope as ResetScope))
    if (!sanitizedScopes.length) {
      return NextResponse.json({ error: 'Pilih minimal satu jenis data yang ingin dihapus.' }, { status: 400 })
    }

    const wantsFullPlatformReset = sanitizedScopes.includes('full_platform')
    if (!isPreview) {
      if (wantsFullPlatformReset) {
        if (confirmation !== 'RESET SEMUA') {
          return NextResponse.json({ error: 'Tulis RESET SEMUA untuk konfirmasi reset total platform.' }, { status: 400 })
        }
      } else if (confirmation !== 'HAPUS') {
        return NextResponse.json({ error: 'Tulis HAPUS untuk konfirmasi reset data.' }, { status: 400 })
      }
    }

    const effectiveScopes: Array<Exclude<ResetScope, 'full_platform'>> = wantsFullPlatformReset
      ? BASE_RESET_SCOPES
      : (sanitizedScopes.filter((scope): scope is Exclude<ResetScope, 'full_platform'> => scope !== 'full_platform'))

    const report: Array<{ scope: ResetScope; ok: boolean; detail?: string }> = []

    for (const scope of effectiveScopes) {
      if (scope === 'customers') {
        if (isPreview) {
          const counted = await countByUserColumns(supabase, 'customers', user.id)
          if (counted.error) {
            report.push({ scope, ok: false, detail: String(counted.error?.message || 'Gagal menghitung customers') })
          } else {
            report.push({ scope, ok: true, detail: `${counted.count || 0} data akan dihapus` })
          }
          continue
        }

        const result = await deleteByUserColumns(supabase, 'customers', user.id)
        report.push({ scope, ok: result.ok, detail: result.ok ? undefined : String(result.error?.message || 'Gagal menghapus customers') })
        continue
      }

      if (scope === 'suppliers') {
        if (isPreview) {
          const counted = await countByUserColumns(supabase, 'suppliers', user.id)
          if (counted.error) {
            report.push({ scope, ok: false, detail: String(counted.error?.message || 'Gagal menghitung suppliers') })
          } else {
            report.push({ scope, ok: true, detail: `${counted.count || 0} data akan dihapus` })
          }
          continue
        }

        const result = await deleteByUserColumns(supabase, 'suppliers', user.id)
        report.push({ scope, ok: result.ok, detail: result.ok ? undefined : String(result.error?.message || 'Gagal menghapus suppliers') })
        continue
      }

      if (scope === 'transactions') {
        const txRows = await selectIdsByUserColumns(supabase, 'transactions', user.id)
        if (txRows.error) {
          report.push({ scope, ok: false, detail: String(txRows.error.message || 'Gagal membaca transactions') })
          continue
        }

        if (isPreview) {
          const transactionIds = txRows.ids
          const txCount = transactionIds.length
          const itemCount = await countByInIds(supabase, 'transaction_items', 'transaction_id', transactionIds)
          if (itemCount.error) {
            report.push({ scope, ok: false, detail: String(itemCount.error?.message || 'Gagal menghitung transaction_items') })
          } else {
            report.push({
              scope,
              ok: true,
              detail: `${txCount} transaksi + ${itemCount.count || 0} item transaksi akan dihapus`,
            })
          }
          continue
        }

        const transactionIds = txRows.ids
        const delItems = await deleteByInIds(supabase, 'transaction_items', 'transaction_id', transactionIds)
        if (!delItems.ok) {
          report.push({ scope, ok: false, detail: String(delItems.error?.message || 'Gagal menghapus transaction_items') })
          continue
        }

        const delTx = await deleteByInIds(supabase, 'transactions', 'id', transactionIds)
        report.push({ scope, ok: delTx.ok, detail: delTx.ok ? undefined : String(delTx.error?.message || 'Gagal menghapus transactions') })
        continue
      }

      if (scope === 'incomes') {
        if (isPreview) {
          const counted = await countByUserColumns(supabase, 'incomes', user.id)
          if (counted.error) {
            report.push({ scope, ok: false, detail: String(counted.error?.message || 'Gagal menghitung incomes') })
          } else {
            report.push({ scope, ok: true, detail: `${counted.count || 0} data akan dihapus` })
          }
          continue
        }

        const result = await deleteByUserColumns(supabase, 'incomes', user.id)
        report.push({ scope, ok: result.ok, detail: result.ok ? undefined : String(result.error?.message || 'Gagal menghapus incomes') })
        continue
      }

      if (scope === 'expenses') {
        const expRows = await selectIdsByUserColumns(supabase, 'expenses', user.id)
        if (expRows.error) {
          report.push({ scope, ok: false, detail: String(expRows.error.message || 'Gagal membaca expenses') })
          continue
        }

        if (isPreview) {
          const expenseIds = expRows.ids
          const expenseCount = expenseIds.length
          const itemCount = await countByInIds(supabase, 'expense_items', 'expense_id', expenseIds)
          if (itemCount.error) {
            report.push({ scope, ok: false, detail: String(itemCount.error?.message || 'Gagal menghitung expense_items') })
          } else {
            report.push({
              scope,
              ok: true,
              detail: `${expenseCount} pengeluaran + ${itemCount.count || 0} item pengeluaran akan dihapus`,
            })
          }
          continue
        }

        const expenseIds = expRows.ids
        const delItems = await deleteByInIds(supabase, 'expense_items', 'expense_id', expenseIds)
        if (!delItems.ok) {
          report.push({ scope, ok: false, detail: String(delItems.error?.message || 'Gagal menghapus expense_items') })
          continue
        }

        const delExpenses = await deleteByInIds(supabase, 'expenses', 'id', expenseIds)
        report.push({ scope, ok: delExpenses.ok, detail: delExpenses.ok ? undefined : String(delExpenses.error?.message || 'Gagal menghapus expenses') })
        continue
      }

      if (scope === 'products') {
        const storefrontRows = await supabase
          .from('business_storefronts')
          .select('id')
          .eq('user_id', user.id)

        if (storefrontRows.error) {
          report.push({ scope, ok: false, detail: String(storefrontRows.error.message || 'Gagal membaca lapak') })
          continue
        }

        const storefrontIds = (storefrontRows.data || []).map((row: any) => row.id)

        if (isPreview) {
          const storefrontProductCount = await countByInIds(supabase, 'storefront_products', 'storefront_id', storefrontIds)
          if (storefrontProductCount.error) {
            report.push({ scope, ok: false, detail: String(storefrontProductCount.error?.message || 'Gagal menghitung storefront_products') })
            continue
          }

          const productCount = await countByUserColumns(supabase, 'products', user.id)
          if (productCount.error) {
            report.push({ scope, ok: false, detail: String(productCount.error?.message || 'Gagal menghitung products') })
            continue
          }

          report.push({
            scope,
            ok: true,
            detail: `${productCount.count || 0} produk + ${storefrontProductCount.count || 0} produk lapak akan dihapus`,
          })
          continue
        }

        const delStorefrontProducts = await deleteByInIds(supabase, 'storefront_products', 'storefront_id', storefrontIds)
        if (!delStorefrontProducts.ok) {
          report.push({ scope, ok: false, detail: String(delStorefrontProducts.error?.message || 'Gagal menghapus storefront_products') })
          continue
        }

        const delProducts = await deleteByUserColumns(supabase, 'products', user.id)
        report.push({ scope, ok: delProducts.ok, detail: delProducts.ok ? undefined : String(delProducts.error?.message || 'Gagal menghapus products') })
        continue
      }

      if (scope === 'lapak_orders') {
        const storefrontRows = await supabase
          .from('business_storefronts')
          .select('id')
          .eq('user_id', user.id)

        if (storefrontRows.error) {
          report.push({ scope, ok: false, detail: String(storefrontRows.error.message || 'Gagal membaca lapak') })
          continue
        }

        const storefrontIds = (storefrontRows.data || []).map((row: any) => row.id)

        if (isPreview) {
          const orderCount = await countByInIds(supabase, 'storefront_orders', 'storefront_id', storefrontIds)
          const analyticsCount = await countByInIds(supabase, 'storefront_analytics', 'storefront_id', storefrontIds)
          if (analyticsCount.error) {
            report.push({
              scope,
              ok: false,
              detail: String(analyticsCount.error?.message || 'Gagal menghitung storefront_analytics'),
            })
            continue
          }

          report.push({
            scope,
            ok: !orderCount.error,
            detail: orderCount.error
              ? String(orderCount.error?.message || 'Gagal menghitung storefront_orders')
              : `${orderCount.count || 0} order lapak + ${analyticsCount.count || 0} data analytics akan dihapus`,
          })
          continue
        }

        const beforeOrderCount = await countByInIds(supabase, 'storefront_orders', 'storefront_id', storefrontIds)
        const beforeAnalyticsCount = await countByInIds(supabase, 'storefront_analytics', 'storefront_id', storefrontIds)
        if (beforeOrderCount.error) {
          report.push({ scope, ok: false, detail: String(beforeOrderCount.error?.message || 'Gagal menghitung storefront_orders sebelum reset') })
          continue
        }
        if (beforeAnalyticsCount.error) {
          report.push({ scope, ok: false, detail: String(beforeAnalyticsCount.error?.message || 'Gagal menghitung storefront_analytics sebelum reset') })
          continue
        }

        const delAnalytics = await deleteByInIds(supabase, 'storefront_analytics', 'storefront_id', storefrontIds)
        if (!delAnalytics.ok) {
          report.push({ scope, ok: false, detail: String(delAnalytics.error?.message || 'Gagal menghapus storefront_analytics') })
          continue
        }

        const delOrders = await deleteByInIds(supabase, 'storefront_orders', 'storefront_id', storefrontIds)
        if (!delOrders.ok) {
          console.error('[Reset Orders] Delete failed:', delOrders.error)
          report.push({ scope, ok: false, detail: `Gagal menghapus orders: ${String(delOrders.error?.message || delOrders.error?.details || 'unknown')}` })
          continue
        }
        
        console.log('[Reset Orders] Delete successful, storefrontIds:', storefrontIds)

        const afterOrderCount = await countByInIds(supabase, 'storefront_orders', 'storefront_id', storefrontIds)
        const afterAnalyticsCount = await countByInIds(supabase, 'storefront_analytics', 'storefront_id', storefrontIds)
        if (afterOrderCount.error) {
          report.push({ scope, ok: false, detail: String(afterOrderCount.error?.message || 'Gagal verifikasi storefront_orders setelah reset') })
          continue
        }
        if (afterAnalyticsCount.error) {
          report.push({ scope, ok: false, detail: String(afterAnalyticsCount.error?.message || 'Gagal verifikasi storefront_analytics setelah reset') })
          continue
        }

        if ((afterOrderCount.count || 0) > 0 || (afterAnalyticsCount.count || 0) > 0) {
          report.push({
            scope,
            ok: false,
            detail: `Masih tersisa Order ${afterOrderCount.count || 0} dan Analytics ${afterAnalyticsCount.count || 0} setelah reset.`,
          })
          continue
        }

        report.push({
          scope,
          ok: true,
          detail: `Order ${beforeOrderCount.count || 0}→${afterOrderCount.count || 0}, Analytics ${beforeAnalyticsCount.count || 0}→${afterAnalyticsCount.count || 0}`,
        })
        continue
      }
    }

    if (wantsFullPlatformReset) {
      const storefrontRows = await supabase
        .from('business_storefronts')
        .select('id')
        .eq('user_id', user.id)

      if (storefrontRows.error) {
        report.push({ scope: 'full_platform', ok: false, detail: String(storefrontRows.error.message || 'Gagal membaca data lapak untuk reset total') })
      } else {
        const storefrontIds = (storefrontRows.data || []).map((row: any) => row.id)

        if (isPreview) {
          const storefrontCount = storefrontIds.length
          const cartCount = await countByInIds(supabase, 'cart_sessions', 'storefront_id', storefrontIds)
          report.push({
            scope: 'full_platform',
            ok: !cartCount.error,
            detail: cartCount.error
              ? String(cartCount.error?.message || 'Gagal menghitung cart_sessions')
              : `${storefrontCount} lapak + ${cartCount.count || 0} sesi keranjang akan dihapus`,
          })
        } else {
          const delCart = await deleteByInIds(supabase, 'cart_sessions', 'storefront_id', storefrontIds)
          if (!delCart.ok) {
            report.push({ scope: 'full_platform', ok: false, detail: String(delCart.error?.message || 'Gagal menghapus cart_sessions') })
          } else {
            const { error: deleteStorefrontError } = await supabase
              .from('business_storefronts')
              .delete()
              .eq('user_id', user.id)

            report.push({
              scope: 'full_platform',
              ok: !deleteStorefrontError,
              detail: deleteStorefrontError
                ? String(deleteStorefrontError.message || 'Gagal menghapus business_storefronts')
                : 'Reset total platform selesai (akun tetap aman).',
            })
          }
        }
      }
    }

    const failed = report.filter((r) => !r.ok)
    if (failed.length > 0) {
      return NextResponse.json(
        {
          error: isPreview ? 'Sebagian data gagal dihitung. Periksa detail.' : 'Sebagian data gagal dihapus. Periksa detail.',
          report,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, mode: isPreview ? 'preview' : 'delete', report })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
