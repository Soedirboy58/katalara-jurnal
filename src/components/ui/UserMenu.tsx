'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface MenuItem {
  icon: React.ReactElement
  label: string
  description: string
  href?: string
  onClick?: () => void
  badge: string | null
}

interface MenuSection {
  section: string
  items: MenuItem[]
}

interface UserMenuProps {
  user: {
    email?: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
  businessName?: string
}

export function UserMenu({ user, businessName }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
      setSigningOut(false)
    }
  }

  const getInitials = () => {
    const name = user.user_metadata?.full_name || user.email || 'User'
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const menuItems: MenuSection[] = [
    {
      section: 'Account',
      items: [
        {
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ),
          label: 'Profile',
          description: 'Edit profil & info bisnis',
          href: '/dashboard/profile',
          badge: null
        },
        {
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
          label: 'General Settings',
          description: 'Tema, bahasa, notifikasi',
          href: '/dashboard/general-settings',
          badge: null
        }
      ]
    },
    {
      section: 'Activity',
      items: [
        {
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          label: 'Activity Log',
          description: 'Riwayat aktivitas',
          href: '/dashboard/activity-log',
          badge: 'NEW'
        },
        {
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          ),
          label: 'Notifications',
          description: 'Alerts & reminders',
          href: '/dashboard/notifications',
          badge: '3'
        }
      ]
    },
    {
      section: 'Support',
      items: [
        {
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
          label: 'Help & Support',
          description: 'Dokumentasi & bantuan',
          href: '/dashboard/help',
          badge: null
        },
        {
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          ),
          label: 'Keyboard Shortcuts',
          description: 'Tips cepat navigasi',
          href: '#',
          onClick: () => {
            alert('Ctrl+K: Quick Search\nCtrl+N: New Transaction\nCtrl+D: Dashboard\nEsc: Close Dialog')
            setIsOpen(false)
          },
          badge: null
        }
      ]
    }
  ]

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
      >
        {/* Avatar */}
        <div className="relative">
          {user.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 group-hover:border-blue-500 transition-colors"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm border-2 border-gray-200 dark:border-gray-700 group-hover:border-blue-500 transition-colors">
              {getInitials()}
            </div>
          )}
          {/* Online Indicator */}
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
        </div>

        {/* User Info */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
            {user.user_metadata?.full_name || 'User'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
            {businessName || user.email}
          </p>
        </div>

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform hidden md:block ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>

          {/* Menu Panel */}
          <div className="absolute left-0 bottom-full mb-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 animate-scale-in origin-bottom-left overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-lg">
                  {getInitials()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">
                    {user.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-blue-100 truncate">{user.email}</p>
                  {businessName && (
                    <p className="text-xs text-blue-200 truncate mt-0.5">🏪 {businessName}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="max-h-[70vh] overflow-y-auto py-2">
              {menuItems.map((section, sectionIdx) => (
                <div key={sectionIdx}>
                  <div className="px-4 py-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {section.section}
                    </p>
                  </div>
                  {section.items.map((item, itemIdx) => (
                    <button
                      key={itemIdx}
                      onClick={() => {
                        if (item.onClick) {
                          item.onClick()
                        } else if (item.href) {
                          router.push(item.href)
                          setIsOpen(false)
                        }
                      }}
                      className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-start gap-3 group"
                    >
                      <div className="text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mt-0.5">
                        {item.icon}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {item.label}
                          </p>
                          {item.badge && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                              item.badge === 'NEW'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {item.description}
                        </p>
                      </div>
                      <svg
                        className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mt-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                  {sectionIdx < menuItems.length - 1 && (
                    <div className="my-2 border-t border-gray-200 dark:border-gray-700"></div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer - Logout */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-2">
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {signingOut ? 'Signing out...' : 'Logout'}
                </span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Animation CSS */}
      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
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
    </div>
  )
}
