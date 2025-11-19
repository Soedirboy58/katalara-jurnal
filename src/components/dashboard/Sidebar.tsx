'use client'

import { useState } from 'react'
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
  Bars3Icon
} from '@heroicons/react/24/outline'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Produk', href: '/dashboard/products', icon: ShoppingCartIcon },
  { name: 'Penjualan', href: '/dashboard/sales', icon: CurrencyDollarIcon },
  { name: 'Pengeluaran', href: '/dashboard/expenses', icon: CircleStackIcon },
  { name: 'Pengaturan', href: '/dashboard/settings', icon: Cog6ToothIcon },
  { name: 'Bantuan', href: '/dashboard/help', icon: QuestionMarkCircleIcon },
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
          fixed top-0 left-0 z-50 h-full border-r-2 border-white/10 shadow-xl
          transform transition-all duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${collapsed ? 'lg:w-20 w-64' : 'lg:w-72 w-64'}
        `}
        style={{
          background: 'linear-gradient(180deg, #1088ff 0%, #0066cc 100%)'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header with Logo Badge */}
          <div className="relative py-6 px-4 border-b border-white/10">
            <div className="flex flex-col items-center">
              {/* Logo Badge Container */}
              <div className={`
                relative bg-white rounded-2xl shadow-2xl
                transition-all duration-300 mb-3
                ${collapsed ? 'p-3' : 'p-4'}
              `}>
                {/* Decorative corner accents */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
                
                <img
                  src="https://usradkbchlkcfoabxvbo.supabase.co/storage/v1/object/public/assets/Artboard%201.png"
                  alt="Katalara"
                  className={`object-contain transition-all duration-300 ${
                    collapsed ? 'h-10 w-10' : 'h-16 w-16'
                  }`}
                />
              </div>
              
              {/* Brand Name */}
              {!collapsed && (
                <div className="text-center">
                  <h2 className="text-xl font-bold text-white mb-1">Katalara</h2>
                  <p className="text-xs text-white/60 font-medium">Business Platform</p>
                </div>
              )}
            </div>
            
            {/* Toggle Button */}
            <button
              onClick={onToggleCollapse}
              className="hidden lg:block absolute -right-3 top-8 p-2 bg-white text-blue-600 hover:bg-blue-50 rounded-full shadow-lg transition-all hover:scale-110"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Bars3Icon className="h-4 w-4" />
            </button>
            
            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="lg:hidden absolute top-6 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <a
                  key={item.name}
                  href={item.href}
                  title={collapsed ? item.name : ''}
                  className={`
                    flex items-center px-4 py-3.5 font-medium rounded-xl
                    transition-all duration-200
                    ${collapsed ? 'justify-center text-base' : 'text-base'}
                    ${
                      isActive
                        ? 'bg-white/25 text-white shadow-lg backdrop-blur-sm scale-105'
                        : 'text-white/85 hover:bg-white/15 hover:text-white hover:scale-105'
                    }
                  `}
                >
                  <Icon className={`h-6 w-6 ${collapsed ? '' : 'mr-3'} flex-shrink-0`} />
                  {!collapsed && <span className="whitespace-nowrap">{item.name}</span>}
                </a>
              )
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title={collapsed ? 'Keluar' : ''}
              className={`
                flex items-center w-full px-4 py-3.5 font-medium
                text-yellow-300 hover:bg-yellow-400/20 rounded-xl
                transition-all duration-200 hover:scale-105
                disabled:opacity-50 disabled:cursor-not-allowed
                ${collapsed ? 'justify-center text-base' : 'text-base'}
              `}
            >
              <ArrowLeftOnRectangleIcon className={`h-6 w-6 ${collapsed ? '' : 'mr-3'} flex-shrink-0`} />
              {!collapsed && (loggingOut ? 'Keluar...' : 'Keluar')}
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
