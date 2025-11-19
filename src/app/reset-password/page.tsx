'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validSession, setValidSession] = useState(false)

  useEffect(() => {
    console.log('Reset password page mounted')
    console.log('Current URL:', window.location.href)
    console.log('Hash:', window.location.hash)
    console.log('Search params:', window.location.search)
    
    // Check for code in URL (PKCE flow)
    const searchParams = new URLSearchParams(window.location.search)
    const code = searchParams.get('code')
    console.log('Recovery code from URL:', code)
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, 'Has session:', !!session)
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log('✅ Password recovery event detected')
        setValidSession(true)
        setError('') // Clear any error
      } else if (session) {
        console.log('✅ Session exists')
        setValidSession(true)
        setError('') // Clear any error
      } else if (event === 'SIGNED_OUT') {
        console.log('❌ Signed out event')
        setError('Link reset password tidak valid atau sudah expired. Silakan request ulang.')
      }
    })

    // Exchange code for session if code exists
    if (code) {
      console.log('Exchanging code for session...')
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error) {
          console.error('❌ Error exchanging code:', error)
          setError('Link reset password tidak valid atau sudah expired. Silakan request ulang.')
        } else {
          console.log('✅ Code exchanged successfully', data)
          // Session will be set via onAuthStateChange
        }
      })
    } else {
      // No code in URL, check if there's already a session
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        console.log('Initial session check:', !!session, error)
        if (session) {
          setValidSession(true)
        } else {
          setError('Link reset password tidak valid atau sudah expired.')
        }
      })
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validasi
    if (password.length < 6) {
      setError('Password minimal 6 karakter')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Password tidak cocok')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      // Success - redirect to login
      alert('Password berhasil diubah! Silakan login dengan password baru.')
      router.push('/login')
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  if (!validSession && !error) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center relative"
        style={{
          backgroundImage: 'url(https://usradkbchlkcfoabxvbo.supabase.co/storage/v1/object/public/assets/Brand%20Guidelines%20Katalara_19.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="text-center relative z-10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-md mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Memverifikasi link...</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative"
      style={{
        backgroundImage: 'url(https://usradkbchlkcfoabxvbo.supabase.co/storage/v1/object/public/assets/Brand%20Guidelines%20Katalara_19.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black/40"></div>
      
      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              Katalara
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Reset Password
            </h2>
            <p className="text-gray-600">
              Masukkan password baru Anda
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Form */}
          {validSession && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Password Baru"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Minimal 6 karakter"
                autoComplete="new-password"
              />

              <Input
                label="Konfirmasi Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Ulangi password"
                autoComplete="new-password"
              />

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Mengubah Password...' : 'Ubah Password'}
              </Button>
            </form>
          )}

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <a href="/login" className="text-sm text-gray-600 hover:text-gray-900">
              ← Kembali ke Login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
