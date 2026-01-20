import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isMissingTableError(err: any) {
  const code = (err?.code || err?.error_code || '').toString().toUpperCase()
  if (code === '42P01') return true

  const msg = (err?.message || err?.details || '').toString().toLowerCase()
  return msg.includes('relation') && msg.includes('notifications') && msg.includes('does not exist')
}

function json(status: number, body: any) {
  return NextResponse.json(body, { status })
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return json(401, { ok: false, error: 'Unauthorized' })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit') || 20), 100)
    const unreadOnly = searchParams.get('unreadOnly') === '1'

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) query = query.eq('is_read', false)

    const { data, error } = await query
    if (error) {
      if (isMissingTableError(error)) {
        return json(200, { ok: true, data: [], unreadCount: 0 })
      }
      return json(500, { ok: false, error: error.message })
    }

    const { count: unreadCount, error: countErr } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (countErr) {
      if (isMissingTableError(countErr)) {
        return json(200, { ok: true, data: data || [], unreadCount: 0 })
      }
      return json(500, { ok: false, error: countErr.message })
    }

    return json(200, { ok: true, data: data || [], unreadCount: unreadCount || 0 })
  } catch (e: any) {
    return json(500, { ok: false, error: e?.message || 'Unknown error' })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return json(401, { ok: false, error: 'Unauthorized' })
    }

    const body = await request.json().catch(() => ({} as any))
    const markAll = body?.all === true
    const ids = Array.isArray(body?.ids) ? (body.ids as string[]).filter(Boolean) : []

    if (!markAll && ids.length === 0) {
      return json(400, { ok: false, error: 'Expected { all: true } or { ids: [...] }' })
    }

    const now = new Date().toISOString()

    let updateQuery = supabase
      .from('notifications')
      .update({ is_read: true, read_at: now })
      .eq('user_id', user.id)

    if (!markAll) {
      updateQuery = updateQuery.in('id', ids)
    } else {
      updateQuery = updateQuery.eq('is_read', false)
    }

    const { error } = await updateQuery
    if (error) {
      if (isMissingTableError(error)) {
        return json(200, { ok: true, updated: 0 })
      }
      return json(500, { ok: false, error: error.message })
    }

    return json(200, { ok: true })
  } catch (e: any) {
    return json(500, { ok: false, error: e?.message || 'Unknown error' })
  }
}


























































































































