'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Sidebar, MobileMenuButton } from '@/components/dashboard/Sidebar'
import { createClient } from '@/lib/supabase/client'
import { Bars3Icon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, BellIcon, UserCircleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import WhatsAppGroupButton from '@/components/WhatsAppGroupButton'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [storefrontSlug, setStorefrontSlug] = useState<string | null>(null)

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

      // Check if onboarding is completed (skip for Rangers)
      const checkOnboarding = async () => {
        // Check if user has ranger_profiles entry (direct check)
        const { data: rangerData } = await supabase
          .from('ranger_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()
        
        // If ranger profile exists, skip business onboarding
        if (rangerData) {
          setShowOnboarding(false)
          setCheckingOnboarding(false)
          return
        }
        
        // For UMKM users, check business configuration
        const { data } = await supabase
          .from('business_configurations')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .maybeSingle()
        
        setShowOnboarding(!data?.onboarding_completed)
        setCheckingOnboarding(false)
      }
      checkOnboarding()
      
      // Load notifications
      loadNotifications()
      
      // Load storefront slug for quick action button
      loadStorefrontSlug()
    }
  }, [user, loading, router, supabase])
  
  const loadStorefrontSlug = async () => {
    if (!user) return
    try {
      const response = await fetch('/api/lapak')
      const data = await response.json()
      if (data.storefront?.slug) {
        setStorefrontSlug(data.storefront.slug)
      }
    } catch (error) {
      console.error('Error loading storefront:', error)
    }
  }
  
  const loadNotifications = async () => {
    if (!user) return
    
    try {
      const today = new Date().toISOString().split('T')[0]
      const notifs: any[] = []
      
      // Get today's expenses (use date range for DATE column)
      const startOfDay = `${today}T00:00:00.000Z`
      const endOfDay = `${today}T23:59:59.999Z`
      
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
        .gte('expense_date', startOfDay)
        .lte('expense_date', endOfDay)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (expenses) {
        expenses.forEach(exp => {
          notifs.push({
            id: `expense-${exp.id}`,
            type: 'expense',
            title: 'Pengeluaran Baru',
            message: `${exp.expense_name || exp.category} - Rp ${parseFloat(exp.amount).toLocaleString('id-ID')}`,
            time: exp.created_at,
            icon: '💰',
            color: 'red'
          })
        })
      }
      
      // Get settings for limit warning
      const { data: settings } = await supabase
        .from('business_configurations')
        .select('daily_expense_limit, enable_expense_notifications, notification_threshold')
        .eq('user_id', user.id)
        .single()
      
      if (settings?.daily_expense_limit && settings.enable_expense_notifications && expenses) {
        const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
        const percentage = (totalExpenses / settings.daily_expense_limit) * 100
        
        if (percentage >= (settings.notification_threshold || 80)) {
          notifs.unshift({
            id: 'limit-warning',
            type: 'warning',
            title: percentage >= 100 ? '🚨 Limit Terlampaui!' : '⚠️ Mendekati Limit',
            message: `Pengeluaran hari ini ${percentage.toFixed(0)}% dari limit (Rp ${totalExpenses.toLocaleString('id-ID')} / Rp ${settings.daily_expense_limit.toLocaleString('id-ID')})`,
            time: new Date().toISOString(),
            icon: percentage >= 100 ? '🚨' : '⚠️',
            color: percentage >= 100 ? 'red' : 'amber'
          })
        }
      }
      
      setNotifications(notifs)
      setUnreadCount(notifs.length)
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  if (loading || checkingOnboarding) {
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
    <>
      {/* Onboarding Wizard */}
      {showOnboarding && (
        <OnboardingWizard 
          userId={user.id}
          onComplete={() => {
            setShowOnboarding(false)
            // Refresh page to reload dashboard
            window.location.reload()
          }}
        />
      )}

      {/* Main Dashboard */}
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
              <div className="flex items-center gap-2">
                {/* Dashboard Button */}
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center justify-center p-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  title="Dashboard"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                  <span className="ml-2 text-sm font-medium hidden sm:inline">Dashboard</span>
                </button>
                
                {/* Input Pendapatan Button */}
                <button
                  onClick={() => router.push('/dashboard/input-income')}
                  className="flex items-center justify-center p-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  title="Input Pendapatan"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span className="ml-2 text-sm font-medium hidden sm:inline">Pendapatan</span>
                </button>
                
                {/* Input Pengeluaran Button */}
                <button
                  onClick={() => router.push('/dashboard/input-expenses')}
                  className="flex items-center justify-center p-2 sm:px-4 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  title="Input Pengeluaran"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                  </svg>
                  <span className="ml-2 text-sm font-medium hidden sm:inline">Pengeluaran</span>
                </button>

                {/* Lapak Saya Button - Navigate to public storefront or dashboard */}
                <button
                  onClick={() => {
                    if (storefrontSlug) {
                      // Open public storefront in new tab
                      window.open(`/lapak/${storefrontSlug}`, '_blank')
                    } else {
                      // If no storefront yet, go to setup
                      router.push('/dashboard/lapak')
                    }
                  }}
                  className="flex items-center justify-center p-2 sm:px-4 sm:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg"
                  title={storefrontSlug ? 'Buka Lapak Online Anda' : 'Setup Lapak Online'}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                  </svg>
                  <span className="ml-2 text-sm font-medium hidden sm:inline">
                    {storefrontSlug ? 'Buka Lapak' : 'Setup Lapak'}
                  </span>
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Notification Bell with Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="relative p-2 text-gray-600 hover:text-[#1088ff] hover:bg-blue-50 rounded-lg transition-all"
                >
                  <BellIcon className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Notification Panel */}
                {notificationOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotificationOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[calc(100vh-5rem)] overflow-hidden flex flex-col">
                      {/* Header */}
                      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-semibold text-white flex items-center gap-2">
                            <BellIcon className="h-5 w-5" />
                            Notifikasi Hari Ini
                          </h3>
                          <button
                            onClick={() => {
                              setUnreadCount(0)
                              loadNotifications()
                            }}
                            className="text-xs text-blue-100 hover:text-white font-medium transition-colors"
                          >
                            Refresh
                          </button>
                        </div>
                        <p className="text-xs text-blue-100 mt-1">
                          {notifications.length} aktivitas hari ini
                        </p>
                      </div>
                      
                      {/* Notifications List */}
                      <div className="flex-1 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="text-center py-12 px-4">
                            <div className="text-4xl mb-2">🔔</div>
                            <p className="text-sm text-gray-600 font-medium">Belum ada notifikasi</p>
                            <p className="text-xs text-gray-500 mt-1">Aktivitas hari ini akan muncul di sini</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {notifications.map((notif) => (
                              <div
                                key={notif.id}
                                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                                  notif.color === 'red' ? 'bg-red-50/50' :
                                  notif.color === 'amber' ? 'bg-amber-50/50' :
                                  ''
                                }`}
                                onClick={() => {
                                  if (notif.type === 'warning') {
                                    router.push('/dashboard/settings')
                                  } else if (notif.type === 'expense') {
                                    router.push('/dashboard/input-expenses')
                                  }
                                  setNotificationOpen(false)
                                }}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 text-2xl">
                                    {notif.icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${
                                      notif.color === 'red' ? 'text-red-900' :
                                      notif.color === 'amber' ? 'text-amber-900' :
                                      'text-gray-900'
                                    }`}>
                                      {notif.title}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1 break-words">
                                      {notif.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {new Date(notif.time).toLocaleTimeString('id-ID', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Footer */}
                      {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-200 bg-gray-50">
                          <button
                            onClick={() => {
                              router.push('/dashboard/input-expenses')
                              setNotificationOpen(false)
                            }}
                            className="w-full text-center text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            Lihat Semua Aktivitas →
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              {/* Avatar Dropdown - Katalara Style */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#1088ff] to-[#f1c800] hover:from-[#0d6ecc] hover:to-[#d1a800] transition-all shadow-md hover:shadow-lg"
                >
                  <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-[#1088ff] font-bold text-sm">
                    {(fullName || userEmail).charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-white hidden md:inline max-w-[120px] truncate">{fullName || userEmail}</span>
                  <svg className={`h-4 w-4 text-white transition-transform hidden md:block ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-scale-in">
                      {/* Header with gradient */}
                      <div className="bg-gradient-to-r from-[#1088ff] to-[#f1c800] p-4 text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-lg">
                            {(fullName || userEmail).charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{fullName || 'User'}</p>
                            <p className="text-xs text-white/90 truncate">{userEmail}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Menu Items */}
                      <div className="py-2">
                        {/* Account Section */}
                        <div className="px-4 py-2">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>
                        </div>
                        <button
                          onClick={() => {
                            setDropdownOpen(false)
                            router.push('/dashboard/profile')
                          }}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                        >
                          <UserCircleIcon className="h-5 w-5 text-gray-500 group-hover:text-[#1088ff] transition-colors mt-0.5" />
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-gray-900 group-hover:text-[#1088ff] transition-colors">Profile</p>
                            <p className="text-xs text-gray-500 truncate">Edit profil & info bisnis</p>
                          </div>
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-[#1088ff] transition-colors mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setDropdownOpen(false)
                            router.push('/dashboard/general-settings')
                          }}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                        >
                          <Cog6ToothIcon className="h-5 w-5 text-gray-500 group-hover:text-[#1088ff] transition-colors mt-0.5" />
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-gray-900 group-hover:text-[#1088ff] transition-colors">General Settings</p>
                            <p className="text-xs text-gray-500 truncate">Tema, bahasa, notifikasi</p>
                          </div>
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-[#1088ff] transition-colors mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        
                        <div className="my-2 border-t border-gray-200"></div>
                        
                        {/* Activity Section */}
                        <div className="px-4 py-2">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Activity</p>
                        </div>
                        <button
                          onClick={() => {
                            setDropdownOpen(false)
                            router.push('/dashboard/activity-log')
                          }}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                        >
                          <svg className="w-5 h-5 text-gray-500 group-hover:text-[#1088ff] transition-colors mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 group-hover:text-[#1088ff] transition-colors">Activity Log</p>
                              <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold bg-green-100 text-green-700">NEW</span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">Riwayat aktivitas</p>
                          </div>
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-[#1088ff] transition-colors mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        
                        <div className="my-2 border-t border-gray-200"></div>
                        
                        {/* Support Section */}
                        <div className="px-4 py-2">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Support</p>
                        </div>
                        <button
                          onClick={() => {
                            setDropdownOpen(false)
                            router.push('/dashboard/help')
                          }}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                        >
                          <svg className="w-5 h-5 text-gray-500 group-hover:text-[#1088ff] transition-colors mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-gray-900 group-hover:text-[#1088ff] transition-colors">Help & Support</p>
                            <p className="text-xs text-gray-500 truncate">Dokumentasi & bantuan</p>
                          </div>
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-[#1088ff] transition-colors mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Footer - Logout */}
                      <div className="border-t border-gray-200 p-2">
                        <button
                          onClick={async () => {
                            setDropdownOpen(false)
                            await supabase.auth.signOut()
                            router.push('/login')
                          }}
                          className="w-full px-4 py-3 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-3 group"
                        >
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span className="text-sm font-semibold text-red-600">Logout</span>
                        </button>
                      </div>
                    </div>
                    
                    <style jsx>{`
                      @keyframes scale-in {
                        from {
                          opacity: 0;
                          transform: scale(0.95) translateY(-10px);
                        }
                        to {
                          opacity: 1;
                          transform: scale(1) translateY(0);
                        }
                      }
                      .animate-scale-in {
                        animation: scale-in 0.15s cubic-bezier(0.16, 1, 0.3, 1);
                      }
                    `}</style>
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

      {/* WhatsApp Community Floating Button */}
      <WhatsAppGroupButton />
    </div>
    </>
  )
}
