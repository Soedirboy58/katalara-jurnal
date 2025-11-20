'use client'

import { useState } from 'react'
import { 
  ChartPieIcon,
  MegaphoneIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  LightBulbIcon,
  CalendarIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline'

const expertCategories = [
  { id: 'financial', name: 'Financial', icon: CurrencyDollarIcon, color: 'blue' },
  { id: 'marketing', name: 'Marketing', icon: MegaphoneIcon, color: 'green' },
  { id: 'management', name: 'Management', icon: BriefcaseIcon, color: 'purple' },
  { id: 'operations', name: 'Operations', icon: ChartPieIcon, color: 'orange' },
  { id: 'hr', name: 'HR & Team', icon: UserGroupIcon, color: 'pink' },
  { id: 'strategy', name: 'Strategy', icon: LightBulbIcon, color: 'yellow' },
]

const colorClasses: Record<string, { bg: string; text: string; hover: string; border: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', hover: 'hover:bg-blue-100', border: 'border-blue-200' },
  green: { bg: 'bg-green-50', text: 'text-green-600', hover: 'hover:bg-green-100', border: 'border-green-200' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', hover: 'hover:bg-purple-100', border: 'border-purple-200' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', hover: 'hover:bg-orange-100', border: 'border-orange-200' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-600', hover: 'hover:bg-pink-100', border: 'border-pink-200' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', hover: 'hover:bg-yellow-100', border: 'border-yellow-200' },
}

export default function LevelUpPage() {
  const [activeCategory, setActiveCategory] = useState('financial')

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Level Up 🚀</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Belajar dari pakar bisnis untuk tingkatkan skill & performa bisnis Anda
        </p>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 sm:p-8 text-white mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Mentoring dengan Expert</h2>
            <p className="text-sm sm:text-base text-white/90">
              Dapatkan guidance dari praktisi bisnis berpengalaman di bidangnya
            </p>
          </div>
          <button className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap">
            Lihat Jadwal
          </button>
        </div>
      </div>

      {/* Expert Categories */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pilih Kategori Expert</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {expertCategories.map((category) => {
            const Icon = category.icon
            const colors = colorClasses[category.color]
            const isActive = activeCategory === category.id
            
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${isActive 
                    ? `${colors.bg} ${colors.border} ring-2 ring-offset-2 ring-${category.color}-500` 
                    : `bg-white border-gray-200 ${colors.hover}`
                  }
                `}
              >
                <Icon className={`h-8 w-8 mx-auto mb-2 ${isActive ? colors.text : 'text-gray-400'}`} />
                <div className={`text-sm font-medium ${isActive ? colors.text : 'text-gray-700'}`}>
                  {category.name}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Expert List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Expert {expertCategories.find(c => c.id === activeCategory)?.name}
        </h3>

        {/* Expert Card Example */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Expert Photo */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-3xl">
                👤
              </div>
            </div>

            {/* Expert Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-3">
                <div>
                  <h4 className="text-lg font-bold text-gray-900">Expert Name</h4>
                  <p className="text-sm text-gray-600">Financial Planning Specialist</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">15+ tahun exp</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">⭐ 4.9</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Starting from</div>
                  <div className="text-2xl font-bold text-blue-600">Rp 250K</div>
                  <div className="text-xs text-gray-500">per session</div>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4">
                Berpengalaman membantu 100+ UMKM meningkatkan profit margin dan cash flow management. 
                Spesialisasi: Financial forecasting, budgeting, dan investment strategy.
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">Cash Flow Management</span>
                <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">Profit Optimization</span>
                <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">Financial Planning</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  <CalendarIcon className="h-5 w-5" />
                  Book Session
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                  <VideoCameraIcon className="h-5 w-5" />
                  Watch Free Intro
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Placeholder for more experts */}
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-600 font-medium">Coming Soon</p>
          <p className="text-sm text-gray-500 mt-1">Lebih banyak expert sedang dikurasi untuk Anda</p>
        </div>
      </div>

      {/* Webinar Section */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Free Webinar & Workshop</h3>
          <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Lihat Semua →
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Webinar Card */}
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="text-xs text-blue-600 font-semibold mb-2">LIVE WEBINAR</div>
            <h4 className="font-semibold text-gray-900 mb-2">5 Strategi Boost Penjualan di Q4</h4>
            <p className="text-sm text-gray-600 mb-3">
              Pelajari teknik terbukti untuk meningkatkan penjualan jelang akhir tahun
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>📅 25 Nov 2025, 19:00</span>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-medium">FREE</span>
            </div>
          </div>

          {/* Webinar Card */}
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="text-xs text-purple-600 font-semibold mb-2">WORKSHOP</div>
            <h4 className="font-semibold text-gray-900 mb-2">Financial Planning untuk UMKM</h4>
            <p className="text-sm text-gray-600 mb-3">
              Workshop interaktif: membuat cash flow projection & budgeting
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>📅 28 Nov 2025, 14:00</span>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-medium">FREE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Resources */}
      <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">📚 Learning Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a href="#" className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="text-2xl mb-2">📖</div>
            <div className="font-medium text-gray-900 mb-1">Articles</div>
            <div className="text-sm text-gray-600">50+ artikel bisnis gratis</div>
          </a>
          <a href="#" className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="text-2xl mb-2">🎥</div>
            <div className="font-medium text-gray-900 mb-1">Video Tutorials</div>
            <div className="text-sm text-gray-600">Tutorial step-by-step</div>
          </a>
          <a href="#" className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium text-gray-900 mb-1">Templates</div>
            <div className="text-sm text-gray-600">Download business templates</div>
          </a>
        </div>
      </div>
    </div>
  )
}
