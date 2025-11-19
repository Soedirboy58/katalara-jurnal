'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Sidebar, MobileMenuButton } from '@/components/dashboard/Sidebar'
import { createClient } from '@/lib/supabase/client'
import { Bars3Icon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, BellIcon, UserCircleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      setUserEmail(user.email || '')
      // Fetch user profile for full name
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .maybeSingle()
        if (data?.full_name) {
          setFullName(data.full_name)
        }
      }
      fetchProfile()
    }
  }, [user, loading, router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="w-full max-w-6xl mx-auto flex items-center justify-between h-16 px-4 lg:px-6">
            <div className="flex items-center space-x-4">
              <MobileMenuButton onClick={() => setSidebarOpen(true)} />
              {/* Desktop Toggle Button */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex items-center justify-center p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? (
                  <ChevronDoubleRightIcon className="h-5 w-5" />
                ) : (
                  <ChevronDoubleLeftIcon className="h-5 w-5" />
                )}
              </button>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => router.push('/dashboard/sales/new')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium hidden sm:block"
                >
                  Input Penjualan
                </button>
                <button
                  onClick={() => router.push('/dashboard/expenses/new')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium hidden sm:block"
                >
                  Input Pengeluaran
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <button className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                <BellIcon className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* User Name */}
              <span className="text-sm font-medium text-gray-700 hidden md:block">{fullName || userEmail}</span>
              
              {/* Avatar Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-semibold text-sm hover:shadow-lg transition-all ring-2 ring-blue-100"
                >
                  {(fullName || userEmail).charAt(0).toUpperCase()}
                </button>
                
                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{fullName || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                      </div>
                      <button
                        onClick={() => {
                          setDropdownOpen(false)
                          router.push('/dashboard/profile')
                        }}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                      >
                        <UserCircleIcon className="h-5 w-5 mr-3 text-gray-500" />
                        Profile Settings
                      </button>
                      <button
                        onClick={() => {
                          setDropdownOpen(false)
                          router.push('/dashboard/settings')
                        }}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                      >
                        <Cog6ToothIcon className="h-5 w-5 mr-3 text-gray-500" />
                        General Settings
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6">
          <div className="w-full max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
