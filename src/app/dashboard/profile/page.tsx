'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [fullName, setFullName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [toast, setToast] = useState<{show: boolean, type: 'success' | 'error', message: string}>({
    show: false,
    type: 'success',
    message: ''
  })

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        router.push('/login')
        return
      }

      setUser(currentUser)

      // Load profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle()

      if (profile) {
        setFullName(profile.full_name || '')
        setBusinessName(profile.business_name || '')
        setPhone(profile.phone || '')
        setAddress(profile.address || '')
        setBusinessType(profile.business_type || '')
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          business_name: businessName,
          phone,
          address,
          business_type: businessType,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      showToast('success', '✅ Profile berhasil diupdate!')
      
      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'update_profile',
        description: 'Mengupdate informasi profil',
        metadata: { full_name: fullName, business_name: businessName }
      })
      
    } catch (error: any) {
      console.error('Error saving profile:', error)
      showToast('error', '❌ Gagal menyimpan: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ show: true, type, message })
    setTimeout(() => setToast({ show: false, type, message: '' }), 4000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-sm text-gray-600 mt-1">Kelola informasi pribadi dan bisnis Anda</p>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Avatar Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-3xl border-4 border-white/30">
              {(fullName || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-white">
              <h2 className="text-2xl font-bold">{fullName || 'User'}</h2>
              <p className="text-blue-100 mt-1">{user?.email}</p>
              <p className="text-sm text-blue-200 mt-2">{businessName || 'Bisnis Anda'}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-8 space-y-6">
          {/* Personal Info Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Informasi Pribadi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Telepon
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="08123456789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Jl. Contoh No. 123"
                />
              </div>
            </div>
          </div>

          {/* Business Info Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Informasi Bisnis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Bisnis <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Toko ABC"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Bisnis
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Pilih jenis bisnis</option>
                  <option value="retail">Retail / Toko</option>
                  <option value="fnb">Makanan & Minuman</option>
                  <option value="service">Jasa / Service</option>
                  <option value="manufacturing">Produksi / Manufaktur</option>
                  <option value="online">Online Shop</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
            >
              {saving ? 'Menyimpan...' : '💾 Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md border-2 ${
            toast.type === 'success' 
              ? 'bg-green-500/95 border-green-400 text-white' 
              : 'bg-red-500/95 border-red-400 text-white'
          }`}>
            <span className="font-semibold">{toast.message}</span>
            <button onClick={() => setToast({ ...toast, show: false })}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
