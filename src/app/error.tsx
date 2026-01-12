'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to console so it shows up in DevTools
    // eslint-disable-next-line no-console
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="max-w-md w-full rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="text-lg font-semibold text-gray-900">Terjadi kesalahan</div>
        <div className="mt-2 text-sm text-gray-600">
          Halaman gagal dimuat. Coba muat ulang.
        </div>
        <div className="mt-4 text-xs text-gray-500 break-words">
          {error.message}
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 rounded-xl bg-[#1088ff] text-white font-semibold hover:bg-[#0b6fcc]"
          >
            Coba lagi
          </button>
          <a
            href="/"
            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
          >
            Ke Beranda
          </a>
        </div>
      </div>
    </div>
  )
}
