import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function safeHost(url?: string) {
  if (!url) return null
  try {
    return new URL(url).host
  } catch {
    return null
  }
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return NextResponse.json(
    {
      ok: true,
      serverTime: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      vercel: {
        env: process.env.VERCEL_ENV ?? null,
        url: process.env.VERCEL_URL ?? null,
        gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      },
      supabasePublicEnv: {
        urlPresent: Boolean(supabaseUrl),
        anonKeyPresent: Boolean(supabaseAnonKey),
        urlHost: safeHost(supabaseUrl),
        anonKeyLength: supabaseAnonKey?.length ?? 0,
      },
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  )
}
