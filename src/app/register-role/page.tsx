'use client'

import { useRouter } from 'next/navigation'
import { Building2, Users, TrendingUp, Shield } from 'lucide-react'

export default function RoleSelectionPage() {
  const router = useRouter()

  const handleRoleSelect = (role: 'umkm' | 'ranger') => {
    // Redirect to register with role parameter
    router.push(`/register?role=${role}`)
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
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-purple-900/70 to-indigo-900/80 backdrop-blur-sm"></div>

      <div className="max-w-6xl w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4">
            Katalara
          </h1>
          <p className="text-xl sm:text-2xl text-blue-100 mb-2">
            Teman Setia Pertumbuhan Bisnis Anda
          </p>
          <p className="text-lg text-blue-200">
            Pilih peran Anda untuk memulai
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* UMKM Card */}
          <div 
            onClick={() => handleRoleSelect('umkm')}
            className="group cursor-pointer"
          >
            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 sm:p-10 h-full transition-all duration-300 hover:scale-105 hover:shadow-blue-500/20 border-2 border-transparent hover:border-blue-400">
              {/* Icon */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>

              {/* Content */}
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Saya Pelaku UMKM
              </h2>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                Kelola keuangan bisnis, inventory, dan katalog produk dengan mudah. 
                Dapatkan bantuan dari Rangers untuk digitalisasi bisnis Anda.
              </p>

              {/* Features */}
              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-gray-700">📊 <strong>Jurnal Keuangan</strong> otomatis</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-gray-700">🛍️ <strong>Katalog Digital</strong> & Lapak Online</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-gray-700">📞 <strong>Panggil Ranger</strong> untuk bantuan</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-gray-700">📈 <strong>Business Health Score</strong></p>
                </div>
              </div>

              {/* CTA Button */}
              <button className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg group-hover:shadow-xl text-lg">
                Daftar sebagai UMKM →
              </button>
            </div>
          </div>

          {/* Ranger Card */}
          <div 
            onClick={() => handleRoleSelect('ranger')}
            className="group cursor-pointer"
          >
            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 sm:p-10 h-full transition-all duration-300 hover:scale-105 hover:shadow-purple-500/20 border-2 border-transparent hover:border-purple-400">
              {/* Icon */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>

              {/* Content */}
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Saya Katalara Ranger
              </h2>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                Mahasiswa atau freelancer yang ingin mendapat penghasilan sambil membantu 
                UMKM naik kelas digital. Bangun portfolio profesional!
              </p>

              {/* Features */}
              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-gray-700">💰 <strong>Penghasilan Fleksibel</strong> Rp 25K - 150K/job</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-gray-700">📸 <strong>Foto Produk</strong> & Input Data</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-gray-700">🎓 <strong>Portfolio</strong> & Rating profesional</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-gray-700">⏰ <strong>Waktu Fleksibel</strong> sesuai jadwal</p>
                </div>
              </div>

              {/* CTA Button */}
              <button className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg group-hover:shadow-xl text-lg">
                Daftar sebagai Ranger →
              </button>
            </div>
          </div>
        </div>

        {/* Already have account */}
        <div className="text-center mt-8">
          <p className="text-white text-lg">
            Sudah punya akun?{' '}
            <a 
              href="/login" 
              className="font-bold text-yellow-300 hover:text-yellow-200 underline transition-colors"
            >
              Login di sini
            </a>
          </p>
        </div>

        {/* Info Banner */}
        <div className="mt-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Shield className="w-6 h-6 text-yellow-300" />
            <h3 className="text-xl font-bold text-white">100% Gratis untuk Memulai</h3>
          </div>
          <p className="text-blue-100 text-sm">
            Tidak ada biaya pendaftaran. UMKM bisa langsung pakai semua fitur dasar. 
            Rangers mulai dapat penghasilan dari job pertama!
          </p>
        </div>
      </div>
    </div>
  )
}
