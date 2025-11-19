'use client'

export function Hero() {
  return (
    <section className="relative min-h-screen bg-gradient-to-b from-white to-gray-50 overflow-hidden flex items-center">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-96 h-96 bg-[#1088ff] rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#1088ff] rounded-full filter blur-3xl"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100">
              <span className="w-2 h-2 bg-[#1088ff] rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-[#1088ff]">Platform #1 untuk UMKM Indonesia</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight text-gray-900">
              Kelola UMKM{' '}
              <span className="text-[#1088ff]">
                Lebih Mudah
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed">
              Platform manajemen bisnis all-in-one untuk UMKM Indonesia. Kelola produk, penjualan, stok, dan keuangan dalam satu dashboard modern.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a
                href="/register"
                className="group relative px-8 py-4 bg-[#fdc800] text-white font-bold rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-[#fdc800]/30 hover:scale-105 hover:bg-[#edb200]"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Mulai Gratis
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </a>
              <a
                href="/login"
                className="px-8 py-4 bg-[#1088ff] text-white font-semibold rounded-xl hover:bg-[#0a6ecc] transition-all border border-[#1088ff] flex items-center justify-center gap-2"
              >
                Masuk ke Akun
              </a>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-6 justify-center lg:justify-start text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#1088ff]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-600">Gratis Selamanya</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#1088ff]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-600">Tanpa Kartu Kredit</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#1088ff]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-600">Setup 2 Menit</span>
              </div>
            </div>
          </div>
          
          {/* Right Content - Dashboard Preview */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-[#1088ff] rounded-3xl blur-3xl opacity-10"></div>
              
              {/* Dashboard Card */}
              <div className="relative bg-white rounded-3xl p-8 border border-gray-200 shadow-2xl">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Dashboard Overview</h3>
                    <span className="text-xs px-3 py-1 bg-blue-50 text-[#1088ff] rounded-full border border-blue-100">Live</span>
                  </div>
                  
                  {/* Stats */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors">
                      <div className="w-14 h-14 bg-[#1088ff] rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-600">Total Penjualan</div>
                        <div className="text-2xl font-bold text-gray-900">Rp 45.500.000</div>
                        <div className="text-xs text-[#1088ff] mt-1">+12% dari bulan lalu</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors">
                      <div className="w-14 h-14 bg-[#1088ff] rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-600">Total Produk</div>
                        <div className="text-2xl font-bold text-gray-900">127 Items</div>
                        <div className="text-xs text-gray-500 mt-1">8 stok menipis</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors">
                      <div className="w-14 h-14 bg-[#1088ff] rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-600">Profit Bulan Ini</div>
                        <div className="text-2xl font-bold text-gray-900">Rp 12.300.000</div>
                        <div className="text-xs text-[#1088ff] mt-1">Margin 27%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-[#1088ff]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
      
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </section>
  )
}
