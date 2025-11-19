'use client'

export function CTA() {
  return (
    <section className="relative py-20 bg-[#1088ff] text-white overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
      </div>
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold mb-6">
          Siap Tingkatkan Bisnis UMKM Anda?
        </h2>
        <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Bergabunglah dengan ribuan UMKM yang sudah merasakan kemudahan mengelola bisnis dengan Katalara
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <a
            href="/register"
            className="px-10 py-5 bg-yellow-400 text-blue-900 font-bold rounded-lg hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-xl text-lg"
          >
            🚀 Daftar Gratis Sekarang
          </a>
          <a
            href="#features"
            className="px-10 py-5 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/20 transition-all border-2 border-white/30 text-lg"
          >
            📚 Pelajari Lebih Lanjut
          </a>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-sm text-blue-100">
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-xl">✓</span>
            <span>Tidak perlu kartu kredit</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-xl">✓</span>
            <span>Setup dalam 2 menit</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-xl">✓</span>
            <span>Cancel kapan saja</span>
          </div>
        </div>
      </div>
    </section>
  )
}
