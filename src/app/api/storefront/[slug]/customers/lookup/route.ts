import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type CustomersUserColumn = 'owner_id' | 'user_id'

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

async function getCustomersUserColumn(supabase: any): Promise<CustomersUserColumn> {
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

const normalizePhone = (value: string) => {
  let v = value.replace(/\D/g, '')
  if (v.startsWith('0')) v = v.slice(1)
  if (v && !v.startsWith('62')) v = `62${v}`
  return v
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const { searchParams } = new URL(request.url)
    const rawPhone = (searchParams.get('phone') || '').trim()

    if (!rawPhone) {
      return NextResponse.json({ found: false, data: null }, { status: 200 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase =
      supabaseUrl && serviceKey
        ? createSupabaseJsClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
        : await createClient()

    const { data: storefront, error: storefrontError } = await supabase
      .from('business_storefronts')
      .select('id, user_id')
      .eq('slug', slug)
      .single()

    if (storefrontError || !storefront) {
      return NextResponse.json({ found: false, data: null }, { status: 404 })
    }

    const userCol = await getCustomersUserColumn(supabase)
    const phone = normalizePhone(rawPhone)
    const altPhone = phone.startsWith('62') ? `0${phone.slice(2)}` : phone

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq(userCol, storefront.user_id)
      .in('phone', [phone, altPhone])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ found: false, data: null }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ found: false, data: null }, { status: 200 })
    }

    return NextResponse.json({ found: true, data })
  } catch (error) {
    console.error('GET /api/storefront/[slug]/customers/lookup error:', error)
    return NextResponse.json({ found: false, data: null }, { status: 500 })
  }
}
