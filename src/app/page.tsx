import { Hero } from '@/components/landing/Hero'
import { Carousel } from '@/components/landing/Carousel'
import { Features } from '@/components/landing/Features'
import { CTA } from '@/components/landing/CTA'

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <a href="/" className="flex items-center gap-3 group">
              {/* Logo Katalara Official */}
              <div className="relative">
                <img 
                  src="https://usradkbchlkcfoabxvbo.supabase.co/storage/v1/object/public/assets/Logo.png" 
                  alt="Katalara Logo" 
                  className="h-12 w-auto group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900 tracking-tight">Kata<span className="text-[#fdc800]">lara</span></span>
                <div className="text-xs text-gray-500 -mt-1">UMKM Platform</div>
              </div>
            </a>
            
            <div className="flex items-center gap-4">
              <a
                href="/login"
                className="hidden sm:block px-6 py-2 text-gray-700 font-semibold hover:text-[#1088ff] transition-colors"
              >
                Masuk
              </a>
              <a
                href="/register"
                className="px-6 py-2.5 bg-[#fdc800] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-[#fdc800]/30 transition-all hover:scale-105 hover:bg-[#edb200]"
              >
                Daftar Gratis
              </a>
            </div>
          </div>
        </div>
      </nav>

      <Hero />
      <Carousel />
      <Features />
      <CTA />

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Katalara</h3>
              <p className="text-gray-400">
                Platform manajemen UMKM modern untuk Indonesia
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produk</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Fitur</a></li>
                <li><a href="#" className="hover:text-white">Harga</a></li>
                <li><a href="#" className="hover:text-white">Tutorial</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Perusahaan</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Tentang</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Karir</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Bantuan</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">FAQ</a></li>
                <li><a href="#" className="hover:text-white">Kontak</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Katalara. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
