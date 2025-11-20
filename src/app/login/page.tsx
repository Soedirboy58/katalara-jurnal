'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // Check for verification success message
    const params = new URLSearchParams(window.location.search)
    if (params.get('verified') === 'true') {
      setSuccess('Email berhasil diverifikasi! Silakan login.')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Sign in
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) throw signInError

      if (!authData.user) {
        throw new Error('Login gagal')
      }

      // Wait for session to be fully established
      await new Promise(resolve => setTimeout(resolve, 500))

      // Try to get user profile
      let profile: any = null
      let retryCount = 0
      const maxRetries = 3
      
      while (retryCount < maxRetries && !profile) {
        try {
          const { data, error: profileError } = await supabase
            .from('user_profiles')
            .select('role, is_approved, is_active, full_name, business_name, phone, address')
            .eq('user_id', authData.user.id)
            .maybeSingle()

          if (profileError) {
            console.error('Profile query error (attempt ' + (retryCount + 1) + '):', profileError)
            
            // If it's an RLS error or 500, retry
            if (profileError.code === '42P17' || profileError.message?.includes('infinite recursion')) {
              retryCount++
              await new Promise(resolve => setTimeout(resolve, 1000))
              continue
            }
          }
          
          if (data) {
            profile = data
            console.log('Profile loaded from database:', profile)
          } else {
            console.log('No profile found in database')
          }
          break
        } catch (profileErr) {
          console.error('Profile error (attempt ' + (retryCount + 1) + '):', profileErr)
          retryCount++
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      }

      // If no profile OR profile incomplete (missing business info), redirect to business info
      if (!profile || !profile.business_name || !profile.phone || !profile.address) {
        console.log('Profile incomplete:', { 
          hasProfile: !!profile, 
          hasBusinessName: !!profile?.business_name,
          hasPhone: !!profile?.phone,
          hasAddress: !!profile?.address 
        })
        console.log('Redirecting to business-info to complete profile')
        setShowSuccessModal(true)
        setTimeout(() => {
          router.push('/register/business-info')
        }, 2000)
        return
      }

      console.log('Profile complete, redirecting to dashboard')

      // Check if user is active
      if (profile.is_active === false) {
        setError('Akun Anda telah dinonaktifkan. Hubungi admin.')
        await supabase.auth.signOut()
        return
      }

      // Success login - show modal then redirect
      setShowSuccessModal(true)
      setTimeout(() => {
        // Redirect based on role
        if (profile.role === 'super_admin') {
          router.push('/admin/dashboard')
        } else {
          router.push('/dashboard')
        }
      }, 2000)
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Email atau password salah')
    } finally {
      setLoading(false)
    }
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
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-10 animate-fade-in transform transition-all">
            {/* Success Icon with Animation */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg animate-scale-up">
                  <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {/* Pulse rings */}
                <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-20"></div>
              </div>
            </div>

            {/* Content */}
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-3">
                Login Berhasil!
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Selamat datang kembali! Anda akan diarahkan ke dashboard.
              </p>
            </div>

            {/* Loading bar */}
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-loading-bar"></div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              Katalara
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Selamat Datang Kembali!
            </h2>
            <p className="text-gray-600">
              Masuk ke akun Anda untuk melanjutkan
            </p>
          </div>

          {/* Success Alert */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="nama@email.com"
              autoComplete="email"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-gray-600">Ingat saya</span>
              </label>
              <a href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
                Lupa password?
              </a>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Masuk...' : 'Masuk'}
            </Button>
          </form>

          {/* Divider */}
          <div className="mt-6 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Belum punya akun?</span>
              </div>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <a
              href="/register"
              className="inline-flex items-center justify-center w-full px-4 py-3 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
            >
              Daftar Sekarang Gratis →
            </a>
          </div>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-gray-600 hover:text-gray-900">
              ← Kembali ke Beranda
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
