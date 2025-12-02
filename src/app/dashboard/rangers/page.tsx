'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, FileText, Star, TrendingUp, MapPin, Award, Briefcase, Sparkles, User } from 'lucide-react'

interface RangerProfile {
  full_name: string
  university: string
  major: string
  skills: string[]
  total_jobs_completed: number
  total_earnings: number
  average_rating: number
  total_reviews: number
  is_verified: boolean
  verification_status: string
}

export default function RangersDashboardPage() {
  const [profile, setProfile] = useState<RangerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('Auth error:', authError)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('ranger_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error in loadProfile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Welcome Header */}
        <div className="mb-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 sm:px-10 py-8 sm:py-12 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <User className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-1">
                  Selamat Datang, {profile?.full_name || 'Ranger'}! 👋
                </h1>
                <p className="text-purple-100 text-sm sm:text-base">
                  {profile?.university} • {profile?.major}
                </p>
              </div>
            </div>
            
            {profile?.verification_status === 'pending' && (
              <div className="bg-yellow-400 text-yellow-900 px-4 py-3 rounded-xl inline-flex items-center gap-2 font-semibold text-sm sm:text-base">
                <Clock className="w-5 h-5" />
                <span>Profil kamu sedang dalam proses verifikasi</span>
              </div>
            )}
            
            {profile?.is_verified && (
              <div className="bg-green-400 text-green-900 px-4 py-3 rounded-xl inline-flex items-center gap-2 font-semibold text-sm sm:text-base">
                <Award className="w-5 h-5" />
                <span>✓ Profil Terverifikasi - Siap Menerima Job!</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-sm text-gray-600 mb-1">Total Pendapatan</h3>
            <p className="text-2xl font-bold text-gray-900">
              Rp {profile?.total_earnings?.toLocaleString('id-ID') || '0'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl">✅</span>
            </div>
            <h3 className="text-sm text-gray-600 mb-1">Job Selesai</h3>
            <p className="text-2xl font-bold text-gray-900">
              {profile?.total_jobs_completed || 0}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-yellow-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-2xl">⭐</span>
            </div>
            <h3 className="text-sm text-gray-600 mb-1">Rating Rata-rata</h3>
            <p className="text-2xl font-bold text-gray-900">
              {profile?.average_rating?.toFixed(1) || '0.0'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-sm text-gray-600 mb-1">Total Review</h3>
            <p className="text-2xl font-bold text-gray-900">
              {profile?.total_reviews || 0}
            </p>
          </div>
        </div>

        {/* Skills & Expertise */}
        {profile?.skills && profile.skills.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-6 h-6 text-green-600" />
              Keahlian Kamu
            </h2>
            <div className="flex flex-wrap gap-3">
              {profile.skills.map((skill: string) => (
                <span
                  key={skill}
                  className="px-4 py-2 bg-green-50 border-2 border-green-200 rounded-lg text-green-700 font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* What You'll Do Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Apa yang Akan Kamu Lakukan?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📸</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Foto Produk UMKM</h4>
                <p className="text-sm text-gray-600">
                  Datang ke lokasi UMKM, foto produk mereka dengan HP/kamera sederhana untuk katalog online.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">⌨️</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Input Data ke Sistem</h4>
                <p className="text-sm text-gray-600">
                  Bantu input data produk massal ke sistem Katalara (nama, harga, stok, deskripsi).
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🎓</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Edukasi UMKM</h4>
                <p className="text-sm text-gray-600">
                  Ajarkan cara pakai aplikasi secara tatap muka. Hand-holding sampai UMKM paham.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📱</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Social Media Marketing</h4>
                <p className="text-sm text-gray-600">
                  (Future) Posting konten Instagram, desain promo, kelola marketplace untuk UMKM.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Start Guide for Rangers */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-lg p-8 mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Panduan Memulai sebagai Ranger
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Lengkapi Profil</h3>
                  <p className="text-sm text-gray-600">
                    Pastikan semua informasi profilmu sudah lengkap dan akurat. 
                    Upload portfolio terbaikmu untuk menarik UMKM.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Tunggu Verifikasi</h3>
                  <p className="text-sm text-gray-600">
                    Tim kami akan memverifikasi data dan dokumenmu dalam 1-2 hari kerja. 
                    Kamu akan mendapat notifikasi via email.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Terima Job Request</h3>
                  <p className="text-sm text-gray-600">
                    Setelah terverifikasi, kamu bisa menerima request dari UMKM terdekat 
                    untuk membantu digitalisasi bisnis mereka.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-yellow-600 font-bold">4</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Kerjakan & Dapatkan Bayaran</h3>
                  <p className="text-sm text-gray-600">
                    Selesaikan pekerjaan sesuai kesepakatan, dapatkan review positif, 
                    dan terima pembayaran langsung ke rekening kamu.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Job Marketplace - Coming Soon */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-8 text-center text-white mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
            <Briefcase className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Job Marketplace Segera Hadir!</h2>
          <p className="text-purple-100 mb-4 max-w-2xl mx-auto">
            Fitur marketplace job sedang dalam pengembangan. Setelah verifikasi selesai, 
            kamu akan bisa melihat dan menerima job request dari UMKM terdekat di sini.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>Auto-matching by lokasi</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span>Rating & Review system</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
