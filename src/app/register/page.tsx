'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { Building2, Users } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  
  // Get role from URL parameter (umkm or ranger)
  const [selectedRole, setSelectedRole] = useState<'umkm' | 'ranger'>('umkm')
  
  useEffect(() => {
    const roleParam = searchParams?.get('role')
    if (roleParam === 'ranger' || roleParam === 'umkm') {
      setSelectedRole(roleParam)
    }
  }, [searchParams])
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter')
      setLoading(false)
      return
    }

    try {
      // Step 1: Create auth user with email confirmation
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/login`,
          data: {
            email: formData.email,
            role: selectedRole // Store role in metadata
          }
        }
      })

      console.log('Signup response:', data) // Debug log

      if (signUpError) throw signUpError

      // Show success modal
      setShowSuccessModal(true)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mendaftar')
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-300">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Content */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Pendaftaran Berhasil!
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Silakan cek email Anda untuk verifikasi akun.
              </p>
              <p className="text-gray-600 leading-relaxed mt-2">
                Setelah <span className="font-semibold text-blue-600">verifikasi</span>, Anda bisa login untuk melengkapi data bisnis.
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              OK, Saya Mengerti
            </button>

            {/* Helper Text */}
            <p className="text-center text-sm text-gray-500 mt-4">
              Belum menerima email? Cek folder spam Anda
            </p>
          </div>
        </div>
      )}

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-8">
          {/* Role Badge */}
          <div className="flex justify-center mb-6">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
              selectedRole === 'umkm' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-purple-100 text-purple-800'
            }`}>
              {selectedRole === 'umkm' ? (
                <>
                  <Building2 className="w-4 h-4" />
                  <span>Daftar sebagai UMKM</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  <span>Daftar sebagai Ranger</span>
                </>
              )}
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Daftar Akun Baru
            </h2>
            <p className="text-gray-600">
              Langkah 1 dari 2: Buat akun Anda
            </p>
            <button
              onClick={() => router.push('/register-role')}
              className="text-sm text-blue-600 hover:text-blue-700 underline mt-2"
            >
              Ganti role
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                1
              </div>
              <div className="w-24 h-1 bg-gray-200"></div>
              <div className="w-12 h-12 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-semibold">
                2
              </div>
            </div>
            <div className="flex justify-between mt-2 px-1">
              <span className="text-sm font-medium text-blue-600">Email & Password</span>
              <span className="text-sm text-gray-500">
                {selectedRole === 'umkm' ? 'Data Bisnis' : 'Data Ranger'}
              </span>
            </div>
          </div>

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
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="nama@email.com"
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Minimal 6 karakter"
              autoComplete="new-password"
            />

            <Input
              label="Konfirmasi Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              placeholder="Ketik ulang password"
              autoComplete="new-password"
            />

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Memproses...' : (
                selectedRole === 'umkm' ? 'Lanjut ke Data Bisnis →' : 'Lanjut ke Data Ranger →'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Sudah punya akun?{' '}
              <a href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                Masuk di sini
              </a>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Dengan mendaftar, Anda menyetujui{' '}
              <a href="#" className="text-blue-600 hover:underline">Syarat & Ketentuan</a>
              {' '}serta{' '}
              <a href="#" className="text-blue-600 hover:underline">Kebijakan Privasi</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
