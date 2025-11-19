'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export default function VerifyEmailPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [resending, setResending] = useState(false)

  useEffect(() => {
    // Get current user email
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email || '')
      }
    })
  }, [supabase])

  const handleResend = async () => {
    setResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })
      if (error) throw error
      alert('Email verifikasi telah dikirim ulang!')
    } catch (err) {
      alert('Gagal mengirim ulang email')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Header */}
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Pendaftaran Berhasil! 🎉
          </h2>
          <p className="text-gray-600 mb-6">
            Terima kasih telah mendaftar di Katalara Platform
          </p>

          {/* Email Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-blue-900">Cek Email Anda</span>
            </div>
            <p className="text-sm text-blue-800">
              Kami telah mengirim link verifikasi ke:
            </p>
            <p className="text-sm font-semibold text-blue-900 mt-1">{email}</p>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">Langkah selanjutnya:</h3>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">1.</span>
                <span>Buka email dari Katalara (cek folder spam jika tidak ada)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">2.</span>
                <span>Klik link verifikasi dalam email</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">3.</span>
                <span>Tunggu approval dari admin (1-2 hari kerja)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">4.</span>
                <span>Login dan mulai gunakan platform</span>
              </li>
            </ol>
          </div>

          {/* Resend Button */}
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-6"
          >
            {resending ? 'Mengirim...' : 'Tidak menerima email? Kirim ulang'}
          </button>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Kembali ke Login
            </Button>
            <Button
              onClick={() => router.push('/')}
              variant="secondary"
              className="w-full"
            >
              Kembali ke Beranda
            </Button>
          </div>

          {/* Help Text */}
          <p className="mt-6 text-xs text-gray-500">
            Butuh bantuan? Hubungi{' '}
            <a href="mailto:support@katalara.com" className="text-blue-600 hover:underline">
              support@katalara.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
