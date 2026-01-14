// Client-side Supabase client for browser usage
import { createBrowserClient } from '@supabase/ssr'

type RuntimePublicEnv = {
  supabaseUrl?: string | null
  supabaseAnonKey?: string | null
}

function getRuntimePublicEnv(): RuntimePublicEnv | null {
  if (typeof window === 'undefined') return null
  const w = window as any
  const env = w?.__KATALARA_PUBLIC_ENV__ as RuntimePublicEnv | undefined
  return env ?? null
}

function missingSupabaseEnvClient() {
  const message =
    'Supabase env is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (e.g. in Vercel Environment Variables), then redeploy.'

  return new Proxy(
    {},
    {
      get() {
        throw new Error(message)
      },
    }
  )
}

export const createClient = () =>
  {
    const runtimeEnv = getRuntimePublicEnv()

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || runtimeEnv?.supabaseUrl || undefined
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || runtimeEnv?.supabaseAnonKey || undefined

    if (!url || !anonKey) {
      return missingSupabaseEnvClient() as any
    }

    return createBrowserClient(url, anonKey)
  }
