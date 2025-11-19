'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-blue-600">Katalara</h1>
              </div>
              <div className="ml-6 flex space-x-8">
                <a href="/dashboard" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900">
                  Dashboard
                </a>
                <a href="/dashboard/products" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900">
                  Produk
                </a>
                <a href="/dashboard/sales" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500">
                  Penjualan
                </a>
                <a href="/dashboard/expenses" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500">
                  Pengeluaran
                </a>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700 mr-4">{user.email}</span>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}
