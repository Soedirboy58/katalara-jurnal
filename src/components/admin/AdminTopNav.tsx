// Admin Top Navigation Bar with Menu
'use client'

import { usePathname, useRouter } from 'next/navigation'
import { LogOut, User, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

interface AdminTopNavProps {
  adminEmail?: string
}

export function AdminTopNav({ adminEmail }: AdminTopNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    // TODO: Fetch unread notifications count
    // This is placeholder for future notification system
    setUnreadNotifications(0)
  }, [])

  const menuItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
    { label: 'Monitoring', href: '/admin/monitoring', icon: '🧭' }
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center">
            <div className="text-2xl font-bold text-indigo-600">
              🏢 KATALARA
            </div>
            <span className="ml-3 px-2 py-1 text-xs font-semibold text-white bg-indigo-600 rounded">
              ADMIN
            </span>
          </div>

          {/* Navigation Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`
                    flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </button>
              )
            })}
          </div>

          {/* Right Side: Notifications & User Menu */}
          <div className="flex items-center space-x-4">
            
            {/* Notifications */}
            <button 
              className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* User Menu */}
            <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-700">Super Admin</div>
                <div className="text-xs text-gray-500">{adminEmail || 'admin@katalara.com'}</div>
              </div>
              
              <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center">
                <User className="h-5 w-5 text-indigo-600" />
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu (visible on small screens) */}
      <div className="md:hidden border-t border-gray-200">
        <div className="flex justify-around py-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`
                  flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium
                  ${isActive 
                    ? 'text-indigo-700' 
                    : 'text-gray-600'
                  }
                `}
              >
                <span className="text-xl mb-1">{item.icon}</span>
                {item.label}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
