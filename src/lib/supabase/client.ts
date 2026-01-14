// Client-side Supabase client for browser usage
import { createBrowserClient } from '@supabase/ssr'

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
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !anonKey) {
      return missingSupabaseEnvClient() as any
    }

    return createBrowserClient(url, anonKey)
  }
