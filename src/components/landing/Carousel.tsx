'use client'

import { useState, useEffect } from 'react'

const features = [
  {
    icon: '📦',
    title: 'Manajemen Produk',
    description: 'Kelola stok, harga, dan kategori produk dengan mudah. Auto-track inventory saat penjualan.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: '💳',
    title: 'Pencatatan Penjualan',
    description: 'Catat transaksi penjualan lengkap dengan invoice otomatis dan riwayat pelanggan.',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: '💰',
    title: 'Kelola Pengeluaran',
    description: 'Track semua pengeluaran bisnis, dari pembelian bahan hingga operasional harian.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: '📊',
    title: 'Laporan & Analytics',
    description: 'Dashboard analytics real-time dengan grafik penjualan, profit, dan tren bisnis.',
    color: 'from-orange-500 to-red-500'
  },
  {
    icon: '🔔',
    title: 'Alert Stok Rendah',
    description: 'Notifikasi otomatis saat stok produk hampir habis untuk restock tepat waktu.',
    color: 'from-yellow-500 to-amber-500'
  },
  {
    icon: '📱',
    title: 'Mobile Friendly',
    description: 'Akses dari mana saja, kapan saja. Responsive di semua device dari HP hingga desktop.',
    color: 'from-indigo-500 to-blue-500'
  }
]

export function Carousel() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % features.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Semua yang UMKM Anda Butuhkan
          </h2>
          <p className="text-xl text-gray-600">
            Platform lengkap untuk mengelola bisnis dengan lebih efisien
          </p>
        </div>

        {/* Carousel Main Display */}
        <div className="relative mb-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200 min-h-[300px] flex flex-col justify-center">
            <div className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${features[activeIndex].color} text-white text-4xl mb-6 w-fit`}>
              {features[activeIndex].icon}
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              {features[activeIndex].title}
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl">
              {features[activeIndex].description}
            </p>
          </div>
        </div>

        {/* Carousel Dots */}
        <div className="flex justify-center gap-2 mb-12">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === activeIndex ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                index === activeIndex
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h4 className="font-semibold text-lg text-gray-900 mb-2">
                {feature.title}
              </h4>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
