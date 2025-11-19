'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import type { BusinessCategory } from '@/types/user'
import { provinsiList, getKabupatenByProvinsi, getKecamatanByKabupaten } from '@/lib/data/wilayah-indonesia'

export default function BusinessInfoPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<BusinessCategory[]>([])
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    kecamatan: '',
    kabupaten: '',
    provinsi: '',
    business_name: '',
    business_category_id: '',
    business_start_year: '',
    business_type: '',
    number_of_employees: ''
  })
  
  // State for location dropdowns
  const [selectedProvinsi, setSelectedProvinsi] = useState('')
  const [selectedKabupaten, setSelectedKabupaten] = useState('')
  const [selectedKecamatan, setSelectedKecamatan] = useState('')
  const [availableKabupaten, setAvailableKabupaten] = useState<any[]>([])
  const [availableKecamatan, setAvailableKecamatan] = useState<any[]>([])

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login')
        return
      }
    })

    // Load business categories
    loadCategories()
  }, [router, supabase])
  
  // Handle provinsi change
  useEffect(() => {
    if (selectedProvinsi) {
      const kabupaten = getKabupatenByProvinsi(selectedProvinsi)
      setAvailableKabupaten(kabupaten)
      // Reset kabupaten and kecamatan when provinsi changes
      setSelectedKabupaten('')
      setSelectedKecamatan('')
      setAvailableKecamatan([])
      setFormData(prev => ({ ...prev, kabupaten: '', kecamatan: '' }))
    } else {
      setAvailableKabupaten([])
      setAvailableKecamatan([])
    }
  }, [selectedProvinsi])
  
  // Handle kabupaten change
  useEffect(() => {
    if (selectedKabupaten) {
      const kecamatan = getKecamatanByKabupaten(selectedKabupaten)
      setAvailableKecamatan(kecamatan)
      // Reset kecamatan when kabupaten changes
      setSelectedKecamatan('')
      setFormData(prev => ({ ...prev, kecamatan: '' }))
    } else {
      setAvailableKecamatan([])
    }
  }, [selectedKabupaten])

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('business_categories')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error loading categories:', error)
        throw error
      }
      
      console.log('Loaded categories:', data) // Debug log
      setCategories(data || [])
    } catch (err) {
      console.error('Error loading categories:', err)
      setError('Gagal memuat kategori bisnis')
    } finally {
      setLoadingCategories(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    let userId = ''
    
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Session tidak ditemukan. Silakan login kembali.')
      }

      userId = session.user.id

      // Check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('id, business_name, phone, address')
        .eq('user_id', userId)
        .maybeSingle() // Use maybeSingle instead of single to avoid error if not found

      console.log('Check profile result:', { existingProfile, checkError })

      // If checkError exists and it's a 500 error, likely column doesn't exist
      if (checkError) {
        console.error('Error checking profile:', checkError)
        if (checkError.message?.includes('column') || checkError.code === '42703') {
          throw new Error('Database schema belum lengkap. Silakan jalankan migration SQL terlebih dahulu. Buka Supabase SQL Editor dan jalankan file sql/cleanup_user_profiles.sql')
        }
        // For other errors, continue to try insert/update
      }

      console.log('Form data being saved:', formData)
      console.log('Existing profile:', existingProfile)

      if (existingProfile && !checkError) {
        // Update existing profile
        console.log('Updating existing profile for user:', userId)
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            address: formData.address,
            kecamatan: formData.kecamatan,
            kabupaten: formData.kabupaten,
            provinsi: formData.provinsi,
            business_name: formData.business_name,
            business_category_id: formData.business_category_id,
            business_start_year: formData.business_start_year ? parseInt(formData.business_start_year) : null,
            business_type: formData.business_type,
            number_of_employees: formData.number_of_employees,
            is_approved: true
          })
          .eq('user_id', userId)

        if (updateError) {
          console.error('Update error:', updateError)
          throw updateError
        }
        console.log('Profile updated successfully')
      } else {
        // Create new profile
        console.log('Creating new profile for user:', userId)
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: userId,
            full_name: formData.full_name,
            phone: formData.phone,
            address: formData.address,
            kecamatan: formData.kecamatan,
            kabupaten: formData.kabupaten,
            provinsi: formData.provinsi,
            business_name: formData.business_name,
            business_category_id: formData.business_category_id,
            business_start_year: formData.business_start_year ? parseInt(formData.business_start_year) : null,
            business_type: formData.business_type,
            number_of_employees: formData.number_of_employees,
            role: 'user',
            is_verified: true,
            is_approved: true,
            is_active: true
          })

        if (profileError) {
          console.error('Insert error:', profileError)
          throw profileError
        }
        console.log('Profile created successfully')
      }

      // Success message and redirect to dashboard
      console.log('Business info saved, showing success modal')
      setShowSuccessModal(true)
      setTimeout(() => {
        router.push('/dashboard/products')
      }, 2000)
    } catch (err: any) {
      console.error('Error submitting business info:', err)
      
      // Handle specific error types with detailed messages
      if (err.code === '23505' || err.message?.includes('duplicate key') || err.message?.includes('user_profiles_user_id_key')) {
        setError(`❌ Error: Profil sudah ada untuk akun ini (Duplicate)

📋 SOLUSI CEPAT - Buka Supabase SQL Editor:
1. Copy & paste query ini:

DELETE FROM user_profiles WHERE user_id = '${userId}';

2. Klik Run
3. Refresh halaman ini (F5) dan isi form lagi

💡 Atau gunakan: katalara-nextjs/sql/cleanup_user_profiles.sql`)
      } else if (err.code === '42703' || err.message?.includes('column') || err.message?.includes('does not exist')) {
        setError(`❌ Error: Database schema belum lengkap (kolom tidak ada).

📋 SOLUSI WAJIB:
1. Buka Supabase Dashboard → SQL Editor
2. Jalankan script ini:

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS kecamatan TEXT,
ADD COLUMN IF NOT EXISTS kabupaten TEXT,
ADD COLUMN IF NOT EXISTS provinsi TEXT,
ADD COLUMN IF NOT EXISTS business_start_year INT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS number_of_employees TEXT;

3. Setelah berhasil, refresh halaman dan coba lagi

📁 File SQL lengkap: katalara-nextjs/sql/QUICK_FIX_DATABASE.sql`)
      } else if (err.message?.includes('500') || err.message?.includes('Internal Server Error')) {
        setError(`❌ Error 500: Server error dari Supabase.

📋 KEMUNGKINAN PENYEBAB:
1. Kolom database belum ditambahkan
2. RLS Policy memblokir operasi
3. Database connection issue

📁 Jalankan SQL fix: katalara-nextjs/sql/QUICK_FIX_DATABASE.sql
💡 Atau gunakan email fresh yang belum pernah didaftarkan`)
      } else {
        setError(err.message || 'Terjadi kesalahan saat menyimpan data. Silakan coba lagi atau hubungi admin.')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatPhoneNumber = (value: string) => {
    // Remove non-numeric characters
    const cleaned = value.replace(/\D/g, '')
    // Format: 08xx-xxxx-xxxx
    if (cleaned.length <= 4) return cleaned
    if (cleaned.length <= 8) return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 12)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setFormData({ ...formData, phone: formatted })
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

      <div className="max-w-2xl w-full relative z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-8 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Lengkapi Data Bisnis
            </h2>
            <p className="text-gray-600">
              Langkah 2 dari 2: Informasi bisnis Anda
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center">
                ✓
              </div>
              <div className="w-24 h-1 bg-blue-600"></div>
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                2
              </div>
            </div>
            <div className="flex justify-between mt-2 px-1">
              <span className="text-sm text-gray-500">Email & Password</span>
              <span className="text-sm font-medium text-blue-600">Data Bisnis</span>
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
              label="Nama Lengkap"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              placeholder="Nama lengkap Anda"
            />

            <Input
              label="No. Telepon"
              type="tel"
              value={formData.phone}
              onChange={handlePhoneChange}
              required
              placeholder="08xx-xxxx-xxxx"
              maxLength={14}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alamat Lengkap <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Jl. nama jalan, RT/RW, Desa/Kelurahan"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provinsi <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedProvinsi}
                  onChange={(e) => {
                    const value = e.target.value
                    setSelectedProvinsi(value)
                    const selectedProv = provinsiList.find(p => p.id === value)
                    setFormData({ ...formData, provinsi: selectedProv?.nama || '' })
                  }}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Pilih Provinsi</option>
                  {provinsiList.map((prov) => (
                    <option key={prov.id} value={prov.id}>
                      {prov.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kabupaten/Kota <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedKabupaten}
                  onChange={(e) => {
                    const value = e.target.value
                    setSelectedKabupaten(value)
                    const selectedKab = availableKabupaten.find(k => k.id === value)
                    setFormData({ ...formData, kabupaten: selectedKab?.nama || '' })
                  }}
                  required
                  disabled={!selectedProvinsi}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {selectedProvinsi ? 'Pilih Kabupaten/Kota' : 'Pilih provinsi dulu'}
                  </option>
                  {availableKabupaten.map((kab) => (
                    <option key={kab.id} value={kab.id}>
                      {kab.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kecamatan <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedKecamatan}
                  onChange={(e) => {
                    const value = e.target.value
                    setSelectedKecamatan(value)
                    const selectedKec = availableKecamatan.find(k => k.id === value)
                    setFormData({ ...formData, kecamatan: selectedKec?.nama || '' })
                  }}
                  required
                  disabled={!selectedKabupaten}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {selectedKabupaten ? 'Pilih Kecamatan' : 'Pilih kabupaten dulu'}
                  </option>
                  {availableKecamatan.map((kec) => (
                    <option key={kec.id} value={kec.id}>
                      {kec.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategori Bisnis <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.business_category_id}
                onChange={(e) => setFormData({ ...formData, business_category_id: e.target.value })}
                required
                disabled={loadingCategories}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Pilih Kategori --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Nama Bisnis (Opsional)"
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              placeholder="Contoh: Warung Makan Ibu Siti"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bentuk Usaha
                </label>
                <select
                  value={formData.business_type}
                  onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Pilih --</option>
                  <option value="perorangan">Perorangan</option>
                  <option value="cv">CV</option>
                  <option value="pt">PT</option>
                  <option value="koperasi">Koperasi</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>

              <Input
                label="Tahun Mulai Bisnis"
                type="number"
                value={formData.business_start_year}
                onChange={(e) => setFormData({ ...formData, business_start_year: e.target.value })}
                placeholder="2020"
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jumlah Karyawan
              </label>
              <select
                value={formData.number_of_employees}
                onChange={(e) => setFormData({ ...formData, number_of_employees: e.target.value })}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Pilih --</option>
                <option value="1-5">1-5 orang</option>
                <option value="6-20">6-20 orang</option>
                <option value="21-50">21-50 orang</option>
                <option value="51-100">51-100 orang</option>
                <option value="100+">Lebih dari 100 orang</option>
              </select>
            </div>

            <Button type="submit" disabled={loading || loadingCategories} className="w-full">
              {loading ? 'Menyimpan...' : 'Selesaikan Pendaftaran ✓'}
            </Button>
          </form>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.back()}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Kembali
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all animate-fade-in">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Message */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Data Bisnis Berhasil Disimpan! 🎉
              </h3>
              <p className="text-gray-600 mb-2">
                Selamat datang di <span className="font-semibold text-blue-600">Katalara</span>
              </p>
              <p className="text-sm text-gray-500">
                Anda akan dialihkan ke dashboard dalam beberapa saat...
              </p>
            </div>

            {/* Loading Bar */}
            <div className="mt-6">
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full animate-loading-bar"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
