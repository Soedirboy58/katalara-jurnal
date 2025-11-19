'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Exchange the code for a session
        const code = new URLSearchParams(window.location.search).get('code')
        const next = new URLSearchParams(window.location.search).get('next') || '/login'

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            console.error('Exchange code error:', error)
            router.push('/login?error=verification_failed')
            return
          }
        }

        // Check token_hash for email verification
        const tokenHash = new URLSearchParams(window.location.search).get('token_hash')
        const type = new URLSearchParams(window.location.search).get('type')

        if (tokenHash && type) {
          // Verify the token
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type === 'signup' ? 'signup' : 'email',
          })

          if (error) {
            console.error('Verify OTP error:', error)
            router.push('/login?error=verification_failed')
            return
          }
        }

        // Email verified successfully, redirect to login with success message
        router.push(`${next}?verified=true`)
      } catch (err) {
        console.error('Callback error:', err)
        router.push('/login?error=verification_failed')
      }
    }

    handleCallback()
  }, [router, supabase.auth])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Memverifikasi email Anda...</p>
      </div>
    </div>
  )
}
