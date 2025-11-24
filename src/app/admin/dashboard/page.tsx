'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface UserAnalytics {
  user_id: string
  email: string
  registered_at: string
  full_name: string | null
  business_name: string | null
  phone: string | null
  address: string | null
  business_category: string | null
  business_type: string | null
  number_of_employees: string | null
  is_active: boolean
  is_approved: boolean
  is_verified: boolean
  role: string
  total_income_transactions: number
  total_expense_transactions: number
  total_products: number
  total_customers: number
  total_suppliers: number
  revenue_30d: number
  expenses_30d: number
  total_revenue: number
  total_expenses: number
  last_activity_date: string
  days_registered: number
  activity_status: string
}

interface PlatformStats {
  total_users: number
  active_users: number
  pending_approval: number
  new_today: number
  new_this_week: number
  new_this_month: number
  income_transactions_30d: number
  expense_transactions_30d: number
  total_revenue_30d: number
  total_expenses_30d: number
  total_products: number
  total_customers: number
  total_suppliers: number
  users_with_income: number
  users_with_expenses: number
  users_with_products: number
  users_with_customers: number
  income_adoption_rate: number
  expense_adoption_rate: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<PlatformStats | null>(null)
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
      const { data, error } = await supabase
        .from('admin_platform_stats')
        .select('*')
        .single()

      if (error) throw error
      setStats(data)
    } catch (error) {
      console.error('Error loading platform stats:', error)
    }
  }

  const loadUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('admin_user_analytics')
        .select('*')
        .order('registered_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getActivityBadge = (status: string) => {
    const badges: Record<string, string> = {
      'Very Active': 'bg-green-100 text-green-800',
      'Active': 'bg-blue-100 text-blue-800',
      'Idle': 'bg-yellow-100 text-yellow-800',
      'Dormant': 'bg-gray-100 text-gray-800'
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  // Debug: Log users data
  useEffect(() => {
    console.log('Users loaded:', users)
    console.log('Users count:', users.length)
    console.log('Filter status:', filterStatus)
  }, [users, filterStatus])

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'active' && user.is_active === true && user.is_approved === true) ||
                         (filterStatus === 'pending' && user.is_approved !== true) ||
                         (filterStatus === 'inactive' && user.is_active !== true)
    
    return matchesSearch && matchesFilter
  })
  
  // Debug filtered results
  console.log('Filtered users:', filteredUsers.length, filteredUsers)

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
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.total_users || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Active: {stats?.active_users || 0}</p>
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
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{stats?.pending_approval || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Need review</p>
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
                <p className="text-sm text-gray-600">Transactions (30d)</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {((stats?.income_transactions_30d || 0) + (stats?.expense_transactions_30d || 0))}
                </p>
                <p className="text-xs text-gray-500 mt-1">Income + Expense</p>
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
                <p className="text-sm text-gray-600">Revenue (30d)</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {formatCurrency(stats?.total_revenue_30d || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Platform total</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Adoption */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Feature Adoption</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats?.income_adoption_rate || 0}%</div>
              <div className="text-sm text-gray-600 mt-1">Input Sales</div>
              <div className="text-xs text-gray-500">{stats?.users_with_income || 0} users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats?.expense_adoption_rate || 0}%</div>
              <div className="text-sm text-gray-600 mt-1">Input Expenses</div>
              <div className="text-xs text-gray-500">{stats?.users_with_expenses || 0} users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {stats && stats.total_users > 0 ? Math.round((stats.users_with_products / stats.total_users) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Inventory</div>
              <div className="text-xs text-gray-500">{stats?.users_with_products || 0} users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {stats && stats.total_users > 0 ? Math.round((stats.users_with_customers / stats.total_users) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600 mt-1">CRM</div>
              <div className="text-xs text-gray-500">{stats?.users_with_customers || 0} users</div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
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
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400">Joined: {formatDate(user.registered_at)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.business_name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{user.business_category || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActivityBadge(user.activity_status)}`}>
                        {user.activity_status}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">{user.days_registered}d ago</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Income: {user.total_income_transactions}</div>
                        <div>Expense: {user.total_expense_transactions}</div>
                      </div>
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
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-sm text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-sm text-gray-900">{selectedUser.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Business Name</label>
                      <p className="text-sm text-gray-900">{selectedUser.business_name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Category</label>
                      <p className="text-sm text-gray-900">{selectedUser.business_category || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Business Type</label>
                      <p className="text-sm text-gray-900">{selectedUser.business_type || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Activity Metrics</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{selectedUser.total_income_transactions}</div>
                        <div className="text-xs text-gray-600">Income Trans.</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{selectedUser.total_expense_transactions}</div>
                        <div className="text-xs text-gray-600">Expense Trans.</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{selectedUser.total_products}</div>
                        <div className="text-xs text-gray-600">Products</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{selectedUser.total_customers}</div>
                        <div className="text-xs text-gray-600">Customers</div>
                      </div>
                      <div className="text-center p-3 bg-pink-50 rounded-lg">
                        <div className="text-2xl font-bold text-pink-600">{selectedUser.total_suppliers}</div>
                        <div className="text-xs text-gray-600">Suppliers</div>
                      </div>
                      <div className="text-center p-3 bg-indigo-50 rounded-lg">
                        <div className="text-sm font-bold text-indigo-600">{formatCurrency(selectedUser.total_revenue)}</div>
                        <div className="text-xs text-gray-600">Total Revenue</div>
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
