import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const normalizeRate = (value: any) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.max(0, Math.min(100, num))
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const storefrontId = searchParams.get('storefrontId')

    let storefront = storefrontId
    if (!storefront) {
      const { data } = await supabase
        .from('business_storefronts')
        .select('id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      storefront = data?.id || null
    }

    if (!storefront) {
      return NextResponse.json({ affiliates: [] })
    }

    const { data, error } = await supabase
      .from('storefront_affiliates')
      .select('*')
      .eq('storefront_id', storefront)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Gagal memuat data affiliate' }, { status: 500 })
    }

    return NextResponse.json({ affiliates: data || [] })
  } catch (error) {
    console.error('GET /api/lapak/affiliates error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null as any)
    const storefrontId = String(body?.storefront_id || '').trim()
    const code = String(body?.code || '').trim()

    if (!storefrontId || !code) {
      return NextResponse.json({ error: 'Storefront dan kode wajib diisi' }, { status: 400 })
    }

    const { data: storefront, error: storefrontError } = await supabase
      .from('business_storefronts')
      .select('id')
      .eq('id', storefrontId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (storefrontError || !storefront) {
      return NextResponse.json({ error: 'Lapak tidak ditemukan' }, { status: 404 })
    }

    const payload = {
      storefront_id: storefrontId,
      code,
      name: String(body?.name || '').trim() || null,
      phone: String(body?.phone || '').trim() || null,
      commission_rate: normalizeRate(body?.commission_rate),
      is_active: body?.is_active === false ? false : true,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('storefront_affiliates')
      .insert(payload)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message || 'Gagal menambah affiliate' }, { status: 500 })
    }

    return NextResponse.json({ affiliate: data })
  } catch (error) {
    console.error('POST /api/lapak/affiliates error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null as any)
    const id = String(body?.id || '').trim()

    if (!id) {
      return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 })
    }

    const payload = {
      name: String(body?.name || '').trim() || null,
      phone: String(body?.phone || '').trim() || null,
      commission_rate: normalizeRate(body?.commission_rate),
      is_active: body?.is_active === false ? false : true,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('storefront_affiliates')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message || 'Gagal memperbarui affiliate' }, { status: 500 })
    }

    return NextResponse.json({ affiliate: data })
  } catch (error) {
    console.error('PATCH /api/lapak/affiliates error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 })
    }

    const { error } = await supabase
      .from('storefront_affiliates')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message || 'Gagal menghapus affiliate' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/lapak/affiliates error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
