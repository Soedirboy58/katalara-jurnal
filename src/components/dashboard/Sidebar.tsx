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
          fixed top-0 left-0 z-50 h-full border-r border-white/10 shadow-lg
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
            
            {/* Toggle Button */}
            <button
              onClick={onToggleCollapse}
              className="hidden lg:block absolute -right-2.5 top-5 p-1.5 bg-white text-blue-600 hover:bg-blue-50 rounded-full shadow-md transition-all hover:scale-110"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Bars3Icon className="h-3.5 w-3.5" />
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
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <a
                  key={item.name}
                  href={item.href}
                  title={collapsed ? item.name : ''}
                  className={`
                    flex items-center px-3 py-2.5 text-sm font-medium rounded-lg
                    transition-all duration-200
                    ${collapsed ? 'justify-center' : ''}
                    ${
                      isActive
                        ? 'bg-white/20 text-white shadow-md'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 ${collapsed ? '' : 'mr-3'} flex-shrink-0`} />
                  {!collapsed && <span className="whitespace-nowrap">{item.name}</span>}
                </a>
              )
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-3 border-t border-white/10">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title={collapsed ? 'Keluar' : ''}
              className={`
                flex items-center w-full px-3 py-2.5 text-sm font-medium
                text-yellow-300 hover:bg-yellow-400/20 rounded-lg
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <ArrowLeftOnRectangleIcon className={`h-5 w-5 ${collapsed ? '' : 'mr-3'} flex-shrink-0`} />
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
