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
    
    // Check for token_hash or code in URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const searchParams = new URLSearchParams(window.location.search)
    const tokenHash = hashParams.get('access_token') || searchParams.get('token_hash')
    const type = hashParams.get('type') || searchParams.get('type')
    const code = searchParams.get('code')
    
    console.log('URL params:', { tokenHash: !!tokenHash, type, code: !!code })
    
    // Listen for auth state changes - Supabase client will auto-handle the URL
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth event:', event, 'Session:', !!session)
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log('✅ PASSWORD_RECOVERY event - User dapat reset password')
        setValidSession(true)
        setError('')
      } else if (event === 'SIGNED_IN' && type === 'recovery') {
        console.log('✅ SIGNED_IN with recovery type')
        setValidSession(true)
        setError('')
      } else if (session && type === 'recovery') {
        console.log('✅ Session exists with recovery context')
        setValidSession(true)
        setError('')
      } else if (event === 'SIGNED_OUT') {
        console.log('❌ User signed out')
      }
    })

    // Let Supabase client auto-handle the URL params
    // It will trigger onAuthStateChange with appropriate events
    const initSession = async () => {
      // Small delay to let Supabase process the URL
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const { data: { session }, error } = await supabase.auth.getSession()
      console.log('Session check after delay:', !!session, error?.message)
      
      if (session) {
        console.log('✅ Valid session found')
        setValidSession(true)
        setError('')
      } else if (!code && !tokenHash) {
        console.log('❌ No recovery params in URL')
        setError('Link reset password tidak valid atau sudah expired. Silakan request ulang.')
      }
    }
    
    initSession()

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
