import { NextResponse } from 'next/server'
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'
import { createClient as createSupabaseSsrClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function jsonError(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...(extra || {}) }, { status })
}

export async function POST(req: Request) {
  try {
    const supabaseAuth = await createSupabaseSsrClient()
    const {
      data: { user },
      error: userError
    } = await supabaseAuth.auth.getUser()

    if (userError || !user) return jsonError(401, 'Unauthorized')

    const form = await req.formData()
    const file = form.get('file')
    const filename = (form.get('filename') || 'document.pdf').toString()

    if (!(file instanceof Blob)) return jsonError(400, 'Missing file')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const client =
      supabaseUrl && serviceKey
        ? createSupabaseJsClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false }
          })
        : supabaseAuth

    const bucket = 'invoices'
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-')
    const path = `temp/${user.id}/${Date.now()}-${safeName}`

    const arrayBuffer = await file.arrayBuffer()
    const contentType = file.type || 'application/pdf'

    const upload = await client.storage.from(bucket).upload(path, arrayBuffer, {
      contentType,
      upsert: true
    })

    if (upload.error) {
      return jsonError(500, 'Upload failed', { details: upload.error.message })
    }

    // Prefer signed URL with 24h expiry.
    const signed = await client.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24)

    if (!signed.error && signed.data?.signedUrl) {
      return NextResponse.json({ ok: true, url: signed.data.signedUrl, path, expiresIn: 86400 })
    }

    // Fallback: public URL (bucket might be public)
    const pub = client.storage.from(bucket).getPublicUrl(path)
    if (pub?.data?.publicUrl) {
      return NextResponse.json({ ok: true, url: pub.data.publicUrl, path, expiresIn: 86400 })
    }

    return jsonError(500, 'Unable to create URL', {
      signedError: signed.error?.message || null
    })
  } catch (e: any) {
    return jsonError(500, e?.message || 'Unknown error')
  }
}
