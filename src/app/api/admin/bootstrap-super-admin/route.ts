import { NextResponse } from 'next/server'
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function requireBootstrapSecret(req: Request): string | null {
  const secret = process.env.ADMIN_BOOTSTRAP_SECRET
  if (!secret) return 'Missing ADMIN_BOOTSTRAP_SECRET env'

  const header = req.headers.get('x-bootstrap-secret') || req.headers.get('authorization') || ''
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : header.trim()

  if (token === secret) return null
  return 'Forbidden'
}

/**
 * One-time bootstrap endpoint to promote the CURRENT logged-in account to super_admin.
 *
 * Usage (after login as the target account):
 * - POST /api/admin/bootstrap-super-admin
 * - Header: x-bootstrap-secret: <ADMIN_BOOTSTRAP_SECRET>
 */
export async function POST(req: Request) {
  const authErr = requireBootstrapSecret(req)
  if (authErr) return NextResponse.json({ ok: false, error: authErr }, { status: 403 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { ok: false, error: 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    )
  }

  const sessionClient = await createClient()
  const { data: { user }, error: userErr } = await sessionClient.auth.getUser()

  if (userErr || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized - login first' }, { status: 401 })
  }

  const adminSupabase = createSupabaseJsClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { error: updateErr } = await adminSupabase
    .from('user_profiles')
    .update({ role: 'super_admin' })
    .eq('user_id', user.id)

  if (updateErr) {
    return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, userId: user.id, email: user.email })
}
