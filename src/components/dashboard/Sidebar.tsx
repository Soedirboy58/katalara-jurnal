'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  HomeIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  CircleStackIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowLeftOnRectangleIcon,
  XMarkIcon,
  Bars3Icon,
  CubeIcon,
  UserGroupIcon,
  ChartBarIcon,
  RocketLaunchIcon,
  ChatBubbleLeftRightIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}

const menuItems = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: HomeIcon,
    description: 'Overview bisnis Anda'
  },
  { 
    name: 'Input Pendapatan', 
    href: '/dashboard/input-income', 
    icon: PlusCircleIcon,
    description: 'Catat pendapatan & penjualan',
    badge: 'Hot'
  },
  { 
    name: 'Input Pengeluaran', 
    href: '/dashboard/input-expenses', 
    icon: MinusCircleIcon,
    description: 'Catat pengeluaran bisnis',
    badge: 'Hot'
  },
  { 
    name: 'Produk Saya', 
    href: '/dashboard/products', 
    icon: CubeIcon,
    description: 'Kelola produk & stok'
  },
  { 
    name: 'Pelanggan', 
    href: '/dashboard/customers', 
    icon: UserGroupIcon,
    description: 'Data pelanggan & piutang'
  },
  { 
    name: 'Supplier', 
    href: '/dashboard/suppliers', 
    icon: CircleStackIcon,
    description: 'Data supplier & hutang'
  },
  { 
    name: 'Lapak Online', 
    href: '/dashboard/lapak', 
    icon: BuildingStorefrontIcon,
    description: 'Toko online & share link',
    badge: 'New'
  },
  { 
    name: 'Laporan', 
    href: '/dashboard/reports', 
    icon: ChartBarIcon,
    description: 'Analisis & laporan'
  },
  { 
    name: 'Level Up', 
    href: '/dashboard/level-up', 
    icon: RocketLaunchIcon,
    description: 'Mentoring & pembelajaran',
    badge: 'Soon'
  },
  { 
    name: 'Community', 
    href: '/dashboard/community', 
    icon: ChatBubbleLeftRightIcon,
    description: 'Forum & diskusi',
    badge: 'Soon'
  },
  { 
    name: 'Pengaturan', 
    href: '/dashboard/settings', 
    icon: Cog6ToothIcon,
    description: 'Konfigurasi platform'
  },
  { 
    name: 'Bantuan', 
    href: '/dashboard/help', 
    icon: QuestionMarkCircleIcon,
    description: 'Panduan & support'
  },
]

export function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-blue-900/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 min-h-screen border-r border-white/10 shadow-lg
          transform transition-all duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${collapsed ? 'lg:w-20 w-64' : 'lg:w-64 w-64'}
        `}
        style={{
          background: 'linear-gradient(180deg, #1088ff 0%, #0066cc 100%)'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header with Logo Badge */}
          <div className="relative py-4 px-4 border-b border-white/10">
            <div className="flex flex-col items-center">
              {/* Logo Badge Container */}
              <div className={`
                relative bg-white rounded-xl shadow-lg
                transition-all duration-300
                ${collapsed ? 'p-2 mb-0' : 'p-3 mb-2'}
              `}>
                {/* Decorative corner accent */}
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full"></div>
                
                <img
                  src="https://usradkbchlkcfoabxvbo.supabase.co/storage/v1/object/public/assets/Artboard%201.png"
                  alt="Katalara"
                  className={`object-contain transition-all duration-300 ${
                    collapsed ? 'h-8 w-8' : 'h-12 w-12'
                  }`}
                />
              </div>
              
              {/* Brand Name */}
              {!collapsed && (
                <div className="text-center">
                  <h2 className="text-base font-bold text-white">Katalara</h2>
                  <p className="text-[10px] text-white/50 font-medium">Business Platform</p>
                </div>
              )}
            </div>
            
            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="lg:hidden absolute top-6 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
            {menuItems.map((item, index) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              const showDivider = index === 2 || index === 5 || index === 7 // After Input Pengeluaran, Laporan, Community
              
              return (
                <div key={item.name}>
                  <a
                    href={item.href}
                    title={collapsed ? item.name : item.description}
                    className={`
                      group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg
                      transition-all duration-200 relative
                      ${collapsed ? 'justify-center' : ''}
                      ${
                        isActive
                          ? 'bg-white/20 text-white shadow-md'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    <Icon className={`h-5 w-5 ${collapsed ? '' : 'mr-3'} flex-shrink-0 transition-transform group-hover:scale-110`} />
                    {!collapsed && (
                      <div className="flex-1 flex items-center justify-between">
                        <span className="whitespace-nowrap">{item.name}</span>
                        {item.badge && (
                          <span className={`
                            ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wide
                            ${item.badge === 'Hot' ? 'bg-red-500 text-white' : 
                              item.badge === 'Soon' ? 'bg-orange-500 text-white' : 
                              'bg-green-500 text-white'}
                          `}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-yellow-400 rounded-r-full" />
                    )}
                  </a>
                  
                  {/* Divider */}
                  {showDivider && !collapsed && (
                    <div className="my-2 h-px bg-white/10" />
                  )}
                </div>
              )
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-3 border-t border-white/10">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className={`
                w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg
                text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
                ${collapsed ? 'justify-center' : ''}
              `}
              title="Logout"
            >
              <ArrowLeftOnRectangleIcon className={`h-5 w-5 ${collapsed ? '' : 'mr-3'} flex-shrink-0`} />
              {!collapsed && <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
    >
      <Bars3Icon className="h-6 w-6" />
    </button>
  )
}
