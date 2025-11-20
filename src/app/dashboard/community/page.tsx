'use client'

import { useState } from 'react'
import { 
  PlusCircleIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

const categories = [
  { id: 'all', name: 'Semua', count: 0 },
  { id: 'tips', name: 'Tips & Trik', count: 0 },
  { id: 'question', name: 'Tanya Jawab', count: 0 },
  { id: 'story', name: 'Success Story', count: 0 },
  { id: 'promo', name: 'Promo & Kolaborasi', count: 0 },
]

export default function CommunityPage() {
  const [activeCategory, setActiveCategory] = useState('all')

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Community 👥</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Berbagi pengalaman, belajar bersama, dan networking dengan sesama entrepreneur
          </p>
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
          <PlusCircleIcon className="h-5 w-5" />
          Buat Post Baru
        </button>
      </div>

      {/* Stats Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-white/80">Total Members</div>
          </div>
          <div>
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-white/80">Posts</div>
          </div>
          <div>
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-white/80">Discussions</div>
          </div>
          <div>
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-white/80">Active Today</div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari post, topik, atau user..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <FunnelIcon className="h-5 w-5" />
            Filter
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${activeCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              {category.name}
              {category.count > 0 && (
                <span className="ml-2 text-xs opacity-75">({category.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-4">
        {/* Example Post Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Post Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              JD
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900">John Doe</h4>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Owner Toko</span>
              </div>
              <div className="text-xs text-gray-500">2 jam yang lalu • Tips & Trik</div>
            </div>
          </div>

          {/* Post Content */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              5 Tips Meningkatkan Penjualan di Marketplace
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              Setelah 3 tahun jualan di marketplace, ini beberapa tips yang work untuk saya:
              1. Foto produk berkualitas tinggi
              2. Deskripsi detail dan jujur
              3. Response chat maksimal 5 menit
              4. Flash sale setiap weekend
              5. Packaging yang menarik dan aman
              
              Semoga bermanfaat! 🚀
            </p>
          </div>

          {/* Post Actions */}
          <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
            <button className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors">
              <HeartIcon className="h-5 w-5" />
              <span className="text-sm font-medium">24</span>
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
              <ChatBubbleLeftIcon className="h-5 w-5" />
              <span className="text-sm font-medium">8 Komentar</span>
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors">
              <ShareIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Share</span>
            </button>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Post</h3>
          <p className="text-gray-600 mb-4">
            Jadilah yang pertama berbagi pengalaman atau bertanya di community!
          </p>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <PlusCircleIcon className="h-5 w-5" />
            Buat Post Pertama
          </button>
        </div>
      </div>

      {/* Community Guidelines */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">📋 Community Guidelines</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>✓ Berbagi pengalaman dan pengetahuan secara konstruktif</li>
          <li>✓ Hormati pendapat dan privasi member lain</li>
          <li>✓ No spam, no hard selling, no konten negatif</li>
          <li>✓ Gunakan kategori yang sesuai untuk post Anda</li>
          <li>✓ Jaga etika komunikasi dalam setiap interaksi</li>
        </ul>
      </div>

      {/* Trending Topics */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔥 Trending Topics</h3>
        <div className="space-y-3">
          {['#BoostPenjualan', '#FinancialTips', '#MarketingStrategy', '#ProductPhotography', '#CustomerService'].map((tag) => (
            <button
              key={tag}
              className="block w-full text-left px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-blue-600 font-medium">{tag}</span>
                <span className="text-xs text-gray-500">0 posts</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
