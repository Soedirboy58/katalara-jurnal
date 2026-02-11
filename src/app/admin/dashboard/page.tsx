'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface UserAnalytics {
  user_id: string
  full_name: string | null
  business_name: string | null
  is_active: boolean
  is_approved: boolean
  role: string
  created_at: string
  last_active_at: string | null
  events_7d: number
}

interface OverviewStats {
  totalUsers: number
  activeUsers: number
  newToday: number
  newThisWeek: number
  newThisMonth: number
  totalAuthUsers?: number
  totalProfileUsers?: number
  missingProfiles?: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [users, setUsers] = useState<UserAnalytics[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'inactive'>('all')
  const [selectedUser, setSelectedUser] = useState<UserAnalytics | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (profile?.role !== 'super_admin') {
        router.push('/dashboard')
        return
      }

      // Load data
      await Promise.all([
        loadPlatformStats(),
        loadUsers()
      ])
    } catch (error) {
      console.error('Error checking admin access:', error)
      router.push('/login')
    }
  }

  const loadPlatformStats = async () => {
    try {
      const res = await fetch('/api/admin/monitoring?type=overview', { cache: 'no-store' })
      const json = await res.json()

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Failed to load overview stats')
      }

      setStats({
        totalUsers: Number(json.data?.totalUsers || 0),
        activeUsers: Number(json.data?.activeUsers || 0),
        newToday: Number(json.data?.newToday || 0),
        newThisWeek: Number(json.data?.newThisWeek || 0),
        newThisMonth: Number(json.data?.newThisMonth || 0),
        totalAuthUsers: Number(json.data?.totalAuthUsers || 0),
        totalProfileUsers: Number(json.data?.totalProfileUsers || 0),
        missingProfiles: Number(json.data?.missingProfiles || 0)
      })
    } catch (error) {
      console.error('Error loading platform stats:', error)
    }
  }

  const loadUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/monitoring?type=user_stats&limit=500', { cache: 'no-store' })
      const json = await res.json()

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Failed to load user stats')
      }

      setUsers((json.data || []) as UserAnalytics[])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveUser = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('approve_user', {
        target_user_id: userId,
        admin_notes: 'Approved from admin panel'
      })

      if (error) throw error
      
      alert('User berhasil disetujui!')
      await loadUsers()
      setShowUserModal(false)
    } catch (error: any) {
      console.error('Error approving user:', error)
      alert('Gagal menyetujui user: ' + error.message)
    }
  }

  const handleSuspendUser = async (userId: string) => {
    const reason = prompt('Alasan suspend (opsional):')
    
    try {
      const { error } = await supabase.rpc('suspend_user', {
        target_user_id: userId,
        reason: reason || 'Suspended by admin'
      })

      if (error) throw error
      
      alert('User berhasil disuspend!')
      await loadUsers()
      setShowUserModal(false)
    } catch (error: any) {
      console.error('Error suspending user:', error)
      alert('Gagal suspend user: ' + error.message)
    }
  }

  const handleActivateUser = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('activate_user', {
        target_user_id: userId
      })

      if (error) throw error
      
      alert('User berhasil diaktifkan!')
      await loadUsers()
      setShowUserModal(false)
    } catch (error: any) {
      console.error('Error activating user:', error)
      alert('Gagal mengaktifkan user: ' + error.message)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getUsageBadge = (events7d: number) => {
    if (events7d >= 50) return 'bg-green-100 text-green-800'
    if (events7d >= 10) return 'bg-blue-100 text-blue-800'
    if (events7d >= 1) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'active' && user.is_active && user.is_approved) ||
                         (filterStatus === 'pending' && !user.is_approved) ||
                         (filterStatus === 'inactive' && !user.is_active)
    
    return matchesSearch && matchesFilter
  })

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-500">Platform Katalara</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalUsers || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Active (7d): {stats?.activeUsers || 0}</p>
                {!!stats?.missingProfiles && stats.missingProfiles > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Missing profiles: {stats.missingProfiles} (Auth: {stats.totalAuthUsers || 0} • Profiles: {stats.totalProfileUsers || 0})
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New Users</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{stats?.newToday || 0}</p>
                <p className="text-xs text-gray-500 mt-1">7d: {stats?.newThisWeek || 0} • 30d: {stats?.newThisMonth || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Usage (7d)</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {users.reduce((sum, u) => sum + (u.events_7d || 0), 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total events in logs</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Events / User (7d)</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {stats && stats.totalUsers > 0
                    ? Math.round((users.reduce((sum, u) => sum + (u.events_7d || 0), 0) / stats.totalUsers) * 10) / 10
                    : 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Signal engagement frequency</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* User List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Users</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending Approval</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage (7d)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.full_name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{user.business_name || 'N/A'}</div>
                        <div className="text-xs text-gray-400">Joined: {formatDate(user.created_at)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getUsageBadge(user.events_7d || 0)}`}>
                        {user.events_7d >= 50 ? 'Very Active' : user.events_7d >= 10 ? 'Active' : user.events_7d >= 1 ? 'Idle' : 'Dormant'}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">{user.events_7d || 0} events</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.last_active_at ? formatDateTime(user.last_active_at) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-600 font-mono">{user.user_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {user.is_active ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Inactive</span>
                        )}
                        {!user.is_approved && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedUser(user)
                          setShowUserModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">No users found</p>
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity bg-black/30 backdrop-blur-sm z-40"
              onClick={() => setShowUserModal(false)}
            ></div>

            <div className="relative z-50 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-6 pt-5 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="text-sm text-gray-900">{selectedUser.full_name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Business Name</label>
                      <p className="text-sm text-gray-900">{selectedUser.business_name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">User ID</label>
                      <p className="text-sm text-gray-900 font-mono">{selectedUser.user_id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Joined</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedUser.created_at)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Last Active</label>
                      <p className="text-sm text-gray-900">{selectedUser.last_active_at ? formatDateTime(selectedUser.last_active_at) : 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Usage (7d)</label>
                      <p className="text-sm text-gray-900">{selectedUser.events_7d || 0} events</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Interpretation</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600">Engagement label</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {selectedUser.events_7d >= 50 ? 'Very Active' : selectedUser.events_7d >= 10 ? 'Active' : selectedUser.events_7d >= 1 ? 'Idle' : 'Dormant'}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600">Account status</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {selectedUser.is_active ? 'Active' : 'Inactive'}{selectedUser.is_approved ? '' : ' • Pending approval'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                {!selectedUser.is_approved && (
                  <button
                    onClick={() => handleApproveUser(selectedUser.user_id)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Approve User
                  </button>
                )}
                {selectedUser.is_active ? (
                  <button
                    onClick={() => handleSuspendUser(selectedUser.user_id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Suspend User
                  </button>
                ) : (
                  <button
                    onClick={() => handleActivateUser(selectedUser.user_id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Activate User
                  </button>
                )}
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
