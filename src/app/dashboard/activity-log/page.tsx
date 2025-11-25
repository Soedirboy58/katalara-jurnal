'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface ActivityLog {
  id: string
  user_id: string
  action: string
  description: string
  metadata: any
  created_at: string
}

export default function ActivityLogPage() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'product' | 'other'>('all')
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week')
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadActivityLogs()
  }, [filter, dateRange])

  const loadActivityLogs = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      let query = supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      // Apply date filter
      if (dateRange !== 'all') {
        const now = new Date()
        let startDate = new Date()
        
        switch (dateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0)
            break
          case 'week':
            startDate.setDate(now.getDate() - 7)
            break
          case 'month':
            startDate.setMonth(now.getMonth() - 1)
            break
        }
        
        query = query.gte('created_at', startDate.toISOString())
      }

      const { data, error } = await query

      if (error) throw error

      // Apply action filter
      let filteredData = data || []
      if (filter !== 'all') {
        filteredData = filteredData.filter(log => {
          if (filter === 'income') return log.action.includes('income') || log.action.includes('pendapatan')
          if (filter === 'expense') return log.action.includes('expense') || log.action.includes('pengeluaran')
          if (filter === 'product') return log.action.includes('product') || log.action.includes('produk')
          return true
        })
      }

      setLogs(filteredData)
    } catch (error) {
      console.error('Error loading activity logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    if (action.includes('income') || action.includes('pendapatan')) {
      return { icon: '💰', color: 'text-green-600 bg-green-50' }
    }
    if (action.includes('expense') || action.includes('pengeluaran')) {
      return { icon: '💸', color: 'text-red-600 bg-red-50' }
    }
    if (action.includes('product') || action.includes('produk')) {
      return { icon: '📦', color: 'text-blue-600 bg-blue-50' }
    }
    if (action.includes('delete') || action.includes('hapus')) {
      return { icon: '🗑️', color: 'text-orange-600 bg-orange-50' }
    }
    if (action.includes('update') || action.includes('edit')) {
      return { icon: '✏️', color: 'text-purple-600 bg-purple-50' }
    }
    if (action.includes('create') || action.includes('tambah')) {
      return { icon: '➕', color: 'text-green-600 bg-green-50' }
    }
    return { icon: '📝', color: 'text-gray-600 bg-gray-50' }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'Baru saja'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} menit yang lalu`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam yang lalu`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} hari yang lalu`
    
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
        <p className="text-sm text-gray-600 mt-1">Riwayat aktivitas dan perubahan data</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Action Filter */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-2">Filter Aktivitas</label>
            <div className="flex flex-wrap gap-2">
              {['all', 'income', 'expense', 'product', 'other'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === f
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' ? 'Semua' : 
                   f === 'income' ? 'Pendapatan' : 
                   f === 'expense' ? 'Pengeluaran' :
                   f === 'product' ? 'Produk' : 'Lainnya'}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Periode</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="today">Hari Ini</option>
              <option value="week">7 Hari Terakhir</option>
              <option value="month">30 Hari Terakhir</option>
              <option value="all">Semua</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading activity logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Aktivitas</h3>
            <p className="text-sm text-gray-600">Aktivitas Anda akan muncul di sini</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => {
              const { icon, color } = getActionIcon(log.action)
              return (
                <div
                  key={log.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-2xl flex-shrink-0`}>
                      {icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 mb-1">
                            {log.description}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {log.action.replace(/_/g, ' ').toUpperCase()}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatTimeAgo(log.created_at)}
                        </span>
                      </div>

                      {/* Metadata */}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
                          {Object.entries(log.metadata).slice(0, 3).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="font-medium">{key}:</span>
                              <span className="text-gray-500 truncate">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">Tentang Activity Log</h4>
            <p className="text-xs text-blue-700">
              Semua aktivitas penting seperti input transaksi, edit data, dan perubahan setting akan tercatat di sini. 
              Log disimpan maksimal 100 aktivitas terakhir untuk setiap filter.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
