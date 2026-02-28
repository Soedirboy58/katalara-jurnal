import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const normalizeRate = (value: any) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return null
  return Math.max(0, Math.min(100, num))
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null as any)
    const storefrontId = String(body?.storefront_id || '').trim()

    if (!storefrontId) {
      return NextResponse.json({ error: 'Storefront ID wajib diisi' }, { status: 400 })
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
      outlet_code: String(body?.outlet_code || '').trim() || null,
      outlet_manager_phone: String(body?.outlet_manager_phone || '').trim() || null,
      commission_rate: normalizeRate(body?.commission_rate),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('business_storefronts')
      .update(payload)
      .eq('id', storefrontId)
      .eq('user_id', user.id)
      .select()
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message || 'Gagal memperbarui outlet' }, { status: 500 })
    }

    return NextResponse.json({ outlet: data })
  } catch (error) {
    console.error('PATCH /api/lapak/outlet-settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
