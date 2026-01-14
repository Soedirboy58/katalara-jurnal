export const dynamic = 'force-dynamic'

function safeHost(url?: string) {
  if (!url) return null
  try {
    return new URL(url).host
  } catch {
    return null
  }
}

export default function DebugEnvPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">Debug: Runtime Env</h1>
        <p className="text-sm text-gray-600 mt-2">
          Halaman ini membaca <code>process.env</code> dari server saat runtime (bukan dari bundle JS).
        </p>

        <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Vercel</h2>
          </div>
          <div className="p-5 space-y-2 text-sm">
            <div className="flex justify-between gap-4"><span className="text-gray-600">VERCEL_ENV</span><span className="font-mono text-gray-900">{process.env.VERCEL_ENV ?? '(null)'}</span></div>
            <div className="flex justify-between gap-4"><span className="text-gray-600">VERCEL_URL</span><span className="font-mono text-gray-900">{process.env.VERCEL_URL ?? '(null)'}</span></div>
            <div className="flex justify-between gap-4"><span className="text-gray-600">GIT SHA</span><span className="font-mono text-gray-900">{process.env.VERCEL_GIT_COMMIT_SHA ?? '(null)'}</span></div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Supabase Public Env</h2>
          </div>
          <div className="p-5 space-y-2 text-sm">
            <div className="flex justify-between gap-4"><span className="text-gray-600">NEXT_PUBLIC_SUPABASE_URL</span><span className={supabaseUrl ? 'font-mono text-green-700' : 'font-mono text-red-700'}>{supabaseUrl ? 'PRESENT' : 'MISSING'}</span></div>
            <div className="flex justify-between gap-4"><span className="text-gray-600">URL host</span><span className="font-mono text-gray-900">{safeHost(supabaseUrl) ?? '(null)'}</span></div>
            <div className="flex justify-between gap-4"><span className="text-gray-600">NEXT_PUBLIC_SUPABASE_ANON_KEY</span><span className={supabaseAnonKey ? 'font-mono text-green-700' : 'font-mono text-red-700'}>{supabaseAnonKey ? 'PRESENT' : 'MISSING'}</span></div>
            <div className="flex justify-between gap-4"><span className="text-gray-600">Anon key length</span><span className="font-mono text-gray-900">{supabaseAnonKey?.length ?? 0}</span></div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-sm">
          <p className="text-gray-700">
            Kalau halaman ini menunjukkan <b>PRESENT</b> tapi login masih error “Supabase env is missing”, berarti build/client bundle
            yang sedang kamu akses dibuat saat env belum terset (atau kamu sedang membuka deployment/preview yang beda).
          </p>
          <ul className="list-disc list-inside mt-3 text-gray-700 space-y-1">
            <li>Cek domain yang kamu buka: production vs preview.</li>
            <li>Di Vercel, pastikan env diset untuk scope yang benar (Production/Preview) lalu redeploy (tanpa cache kalau perlu).</li>
          </ul>
          <p className="mt-3 text-gray-700">
            Endpoint JSON: <a className="text-blue-600 underline" href="/api/debug/env">/api/debug/env</a>
          </p>
        </div>
      </div>
    </div>
  )
}
