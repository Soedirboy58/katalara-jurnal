// ============================================================================
// PAGE: Admin Monitoring Dashboard
// ============================================================================
// Dashboard untuk monitor user activity, bug reports, dan stats
// ============================================================================

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, Bug, Activity, Bell, TrendingUp, AlertCircle, 
  CheckCircle, Clock, Search, Filter, Download, RefreshCw,
  ChevronDown, ChevronUp, Eye, X, Calendar, BarChart3
} from 'lucide-react'

interface OverviewStats {
  totalUsers: number
  activeUsers: number
  totalBugs: number
  openBugs: number
  criticalBugs: number
  unreadNotifications: number
  recentUsers: any[]
  bugsByCategory: Record<string, number>
}

type UserStatRow = {
  user_id: string
  full_name: string | null
  business_name: string | null
  created_at: string
  role?: string | null
  is_active?: boolean | null
  is_approved?: boolean | null
  last_active_at?: string | null
  events_7d?: number | null
}

type ActivityLogRow = {
  id?: string
  user_id: string
  action?: string | null
  description?: string | null
  metadata?: any
  page?: string | null
  details?: any
  created_at: string
}

export default function AdminMonitoringPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'bugs' | 'users' | 'activity'>('overview')
  const [isLoading, setIsLoading] = useState(true)
  
  // Data states
  const [overviewData, setOverviewData] = useState<OverviewStats | null>(null)
  const [bugReports, setBugReports] = useState<any[]>([])
  const [userStats, setUserStats] = useState<any[]>([])
  const [activityLog, setActivityLog] = useState<any[]>([])
  
  // Filter states
  const [bugStatusFilter, setBugStatusFilter] = useState<string>('all')
  const [bugSeverityFilter, setBugSeverityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Detail modal
  const [selectedBug, setSelectedBug] = useState<any>(null)

  // Fetch data
  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      if (activeTab === 'overview') {
        const res = await fetch('/api/admin/monitoring?type=overview')
        const data = await res.json()
        if (data.success) {
          setOverviewData(data.data)
        }
      } else if (activeTab === 'bugs') {
        const params = new URLSearchParams()
        if (bugStatusFilter !== 'all') params.append('status', bugStatusFilter)
        if (bugSeverityFilter !== 'all') params.append('severity', bugSeverityFilter)
        
        const res = await fetch(`/api/admin/monitoring?type=bug_reports&${params}`)
        const data = await res.json()
        if (data.success) {
          setBugReports(data.data)
        }
      } else if (activeTab === 'users') {
        const res = await fetch('/api/admin/monitoring?type=user_stats')
        const data = await res.json()
        if (data.success) {
          setUserStats(data.data)
        }
      } else if (activeTab === 'activity') {
        const res = await fetch('/api/admin/monitoring?type=activity_log')
        const data = await res.json()
        if (data.success) {
          setActivityLog(data.data)
        }
      }
    } catch (error) {
      console.error('Error fetching monitoring data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getSeverityBadge = (severity: string) => {
    const styles = {
      low: 'bg-green-100 text-green-800 border-green-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      critical: 'bg-red-100 text-red-800 border-red-300'
    }
    return styles[severity as keyof typeof styles] || styles.medium
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      new: 'bg-blue-100 text-blue-800 border-blue-300',
      in_progress: 'bg-purple-100 text-purple-800 border-purple-300',
      resolved: 'bg-green-100 text-green-800 border-green-300',
      wont_fix: 'bg-gray-100 text-gray-800 border-gray-300',
      duplicate: 'bg-gray-100 text-gray-800 border-gray-300'
    }
    return styles[status as keyof typeof styles] || styles.new
  }

  const formatDateTime = (iso: string) => {
    if (!iso) return 'N/A'
    return new Date(iso).toLocaleString('id-ID')
  }

  const filteredUserStats = (userStats as UserStatRow[]).filter((u) => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    return (
      String(u.user_id || '').toLowerCase().includes(q) ||
      String(u.full_name || '').toLowerCase().includes(q) ||
      String(u.business_name || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">🎯 Admin Monitoring</h1>
              <p className="text-purple-100">Monitor user activity, bug reports, dan platform analytics</p>
            </div>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white rounded-t-2xl shadow-lg p-2 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
              activeTab === 'overview' 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="w-5 h-5 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('bugs')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
              activeTab === 'bugs' 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Bug className="w-5 h-5 inline mr-2" />
            Bug Reports
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
              activeTab === 'users' 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="w-5 h-5 inline mr-2" />
            User Stats
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
              activeTab === 'activity' 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Activity className="w-5 h-5 inline mr-2" />
            Activity Log
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-b-2xl shadow-lg p-6">
          
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading data...</p>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && overviewData && (
                <div className="space-y-6">
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* Total Users */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <Users className="w-8 h-8 text-blue-600" />
                        <span className="text-3xl font-bold text-blue-900">{overviewData.totalUsers}</span>
                      </div>
                      <h3 className="font-semibold text-blue-900 mb-1">Total Users</h3>
                      <p className="text-sm text-blue-700">
                        {overviewData.activeUsers} active (7 days)
                      </p>
                    </div>

                    {/* Bug Reports */}
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
                      <div className="flex items-center justify-between mb-4">
                        <Bug className="w-8 h-8 text-red-600" />
                        <span className="text-3xl font-bold text-red-900">{overviewData.totalBugs}</span>
                      </div>
                      <h3 className="font-semibold text-red-900 mb-1">Bug Reports</h3>
                      <p className="text-sm text-red-700">
                        {overviewData.openBugs} open · {overviewData.criticalBugs} critical
                      </p>
                    </div>

                    {/* Notifications */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                      <div className="flex items-center justify-between mb-4">
                        <Bell className="w-8 h-8 text-purple-600" />
                        <span className="text-3xl font-bold text-purple-900">{overviewData.unreadNotifications}</span>
                      </div>
                      <h3 className="font-semibold text-purple-900 mb-1">Unread Alerts</h3>
                      <p className="text-sm text-purple-700">
                        System notifications
                      </p>
                    </div>

                  </div>

                  {/* Recent Users */}
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Recent Registrations (24h)
                    </h3>
                    {overviewData.recentUsers.length > 0 ? (
                      <div className="space-y-2">
                        {overviewData.recentUsers.map((user: any) => (
                          <div key={user.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">{user.full_name || 'Unknown'}</p>
                              <p className="text-sm text-gray-600">{new Date(user.created_at).toLocaleString('id-ID')}</p>
                            </div>
                            <span className="text-green-600 font-semibold">NEW</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No new users in the last 24 hours</p>
                    )}
                  </div>

                </div>
              )}

              {/* Bug Reports Tab */}
              {activeTab === 'bugs' && (
                <div className="space-y-6">
                  
                  {/* Filters */}
                  <div className="flex flex-wrap gap-4">
                    <select
                      value={bugStatusFilter}
                      onChange={(e) => { setBugStatusFilter(e.target.value); fetchData(); }}
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="all">All Status</option>
                      <option value="new">New</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>

                    <select
                      value={bugSeverityFilter}
                      onChange={(e) => { setBugSeverityFilter(e.target.value); fetchData(); }}
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="all">All Severity</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  {/* Bug Reports List */}
                  <div className="space-y-4">
                    {bugReports.map((bug: any) => (
                      <div key={bug.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityBadge(bug.severity)}`}>
                                {bug.severity.toUpperCase()}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(bug.status)}`}>
                                {bug.status.replace('_', ' ').toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-500">
                                {bug.category}
                              </span>
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg mb-2">{bug.title}</h3>
                            <p className="text-gray-600 text-sm line-clamp-2">{bug.description}</p>
                          </div>
                          <button
                            onClick={() => setSelectedBug(bug)}
                            className="ml-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                          >
                            <Eye className="w-4 h-4" />
                            Detail
                          </button>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-4 pt-4 border-t border-gray-200">
                          <span>📧 {bug.user_email || 'Anonymous'}</span>
                          <span>📱 {bug.device_info}</span>
                          <span>🕐 {new Date(bug.created_at).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    ))}
                    {bugReports.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <Bug className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>No bug reports found</p>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Users</h2>
                      <p className="text-sm text-gray-600">Registrasi + aktivitas 7 hari terakhir</p>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Cari user_id / nama / bisnis"
                          className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg w-full md:w-80"
                        />
                      </div>
                      <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="min-w-full bg-white">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-xs font-semibold text-gray-600">
                          <th className="px-4 py-3">User</th>
                          <th className="px-4 py-3">Role</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Registered</th>
                          <th className="px-4 py-3">Last Active</th>
                          <th className="px-4 py-3">Events (7d)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredUserStats.map((u) => (
                          <tr key={u.user_id} className="text-sm text-gray-700">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-gray-900">{u.full_name || 'Unknown'}</div>
                              <div className="text-xs text-gray-500 truncate max-w-[320px]">{u.business_name || '—'}</div>
                              <div className="text-xs text-gray-400 truncate max-w-[320px]">{u.user_id}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                                {u.role || 'user'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.is_active === false ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                  {u.is_active === false ? 'inactive' : 'active'}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.is_approved ? 'bg-blue-50 text-blue-700' : 'bg-yellow-50 text-yellow-700'}`}>
                                  {u.is_approved ? 'approved' : 'pending'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(u.created_at)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{u.last_active_at ? formatDateTime(u.last_active_at) : '—'}</td>
                            <td className="px-4 py-3">
                              <span className="font-semibold">{u.events_7d || 0}</span>
                            </td>
                          </tr>
                        ))}

                        {filteredUserStats.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                              Tidak ada user ditemukan
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Activity</h2>
                      <p className="text-sm text-gray-600">Log penggunaan terbaru (limit default 100)</p>
                    </div>
                    <button
                      onClick={fetchData}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                    >
                      Refresh
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(activityLog as ActivityLogRow[]).map((row, idx) => (
                      <div key={row.id || `${row.user_id}-${row.created_at}-${idx}`} className="bg-white border border-gray-200 rounded-xl p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {row.action || 'activity'}
                            </div>
                            <div className="text-xs text-gray-500">user_id: {row.user_id}</div>
                          </div>
                          <div className="text-xs text-gray-500 whitespace-nowrap">{formatDateTime(row.created_at)}</div>
                        </div>

                        {(row.description || row.page) && (
                          <div className="mt-2 text-sm text-gray-700">
                            {row.description || row.page}
                          </div>
                        )}

                        {(row.metadata || row.details) && (
                          <details className="mt-2">
                            <summary className="text-sm text-indigo-700 cursor-pointer">Detail</summary>
                            <pre className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs overflow-x-auto">
{JSON.stringify(row.metadata || row.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}

                    {(activityLog as ActivityLogRow[]).length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>No activity logs found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* Bug Detail Modal */}
      {selectedBug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-2xl flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">{selectedBug.title}</h2>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityBadge(selectedBug.severity)} !text-white !bg-white/20 !border-white/30`}>
                    {selectedBug.severity.toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(selectedBug.status)} !text-white !bg-white/20 !border-white/30`}>
                    {selectedBug.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedBug(null)}
                className="text-white hover:bg-white/20 rounded-full p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedBug.description}</p>
              </div>
              
              {selectedBug.error_message && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Error Message</h3>
                  <pre className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-900 overflow-x-auto">
                    {selectedBug.error_message}
                  </pre>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Reporter Info</h3>
                  <div className="space-y-1 text-gray-700">
                    <p><strong>Email:</strong> {selectedBug.user_email || 'N/A'}</p>
                    <p><strong>Phone:</strong> {selectedBug.user_phone || 'N/A'}</p>
                    <p><strong>Name:</strong> {selectedBug.user_name || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Technical Info</h3>
                  <div className="space-y-1 text-gray-700">
                    <p><strong>Page:</strong> {selectedBug.page_url}</p>
                    <p><strong>Device:</strong> {selectedBug.device_info}</p>
                    <p><strong>Browser:</strong> {selectedBug.browser_info?.substring(0, 50)}...</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Timestamps</h3>
                <div className="space-y-1 text-sm text-gray-700">
                  <p><strong>Created:</strong> {new Date(selectedBug.created_at).toLocaleString('id-ID')}</p>
                  <p><strong>Updated:</strong> {new Date(selectedBug.updated_at).toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
