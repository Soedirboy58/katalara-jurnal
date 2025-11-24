'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Users, TrendingUp, AlertCircle, CheckCircle, 
  DollarSign, Activity, MapPin, Award,
  BookOpen, BarChart3, ShoppingBag
} from 'lucide-react'

// ===== INTERFACES =====
interface PlatformStats {
  total_users: number
  active_users: number
  pending_approval: number
  total_transactions: number
  total_revenue: number
}

interface GeographicStat {
  province: string
  city: string | null
  user_count: number
  active_users: number
  avg_health_score: number | null
}

interface CategoryStat {
  category_name: string
  user_count: number
  active_users: number
  avg_health_score: number | null
  finance_ready_count: number
}

interface FeatureAdoption {
  users_with_income: number
  users_with_expenses: number
  users_with_products: number
  users_with_customers: number
  users_with_suppliers: number
}

interface LapakAdoption {
  users_with_lapak: number
  users_with_traffic: number
  users_with_conversions: number
  avg_page_views: number
  avg_whatsapp_clicks: number
}

interface UserNeedingSupport {
  user_id: string
  email: string
  full_name: string | null
  business_name: string | null
  business_category: string | null
  health_score: number | null
  support_priority: string
  has_cashflow_issues: boolean | null
  has_inventory_issues: boolean | null
}

export default function AdminDashboardEnhanced() {
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null)
  const [geographicStats, setGeographicStats] = useState<GeographicStat[]>([])
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([])
  const [featureAdoption, setFeatureAdoption] = useState<FeatureAdoption | null>(null)
  const [lapakAdoption, setLapakAdoption] = useState<LapakAdoption | null>(null)
  const [usersNeedingSupport, setUsersNeedingSupport] = useState<UserNeedingSupport[]>([])

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadPlatformStats(),
        loadGeographicStats(),
        loadCategoryStats(),
        loadFeatureAdoption(),
        loadLapakAdoption(),
        loadUsersNeedingSupport()
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPlatformStats = async () => {
    const { data, error } = await supabase
      .from('admin_platform_stats')
      .select('*')
      .single()

    if (!error && data) {
      setPlatformStats({
        total_users: data.total_users || 0,
        active_users: data.active_users || 0,
        pending_approval: data.pending_approval || 0,
        total_transactions: (data.income_transactions_30d || 0) + (data.expense_transactions_30d || 0),
        total_revenue: data.total_revenue_30d || 0
      })
    }
  }

  const loadGeographicStats = async () => {
    const { data, error } = await supabase
      .from('admin_geographic_stats')
      .select('*')
      .limit(10)

    if (!error && data) {
      setGeographicStats(data)
    }
  }

  const loadCategoryStats = async () => {
    const { data, error } = await supabase
      .from('admin_category_stats')
      .select('*')
      .limit(10)

    if (!error && data) {
      setCategoryStats(data)
    }
  }

  const loadFeatureAdoption = async () => {
    const { data: stats } = await supabase
      .from('admin_platform_stats')
      .select('*')
      .single()

    if (stats) {
      setFeatureAdoption({
        users_with_income: stats.users_with_income || 0,
        users_with_expenses: stats.users_with_expenses || 0,
        users_with_products: stats.users_with_products || 0,
        users_with_customers: stats.users_with_customers || 0,
        users_with_suppliers: stats.users_with_suppliers || 0
      })
    }
  }

  const loadLapakAdoption = async () => {
    const { data, error } = await supabase
      .from('admin_lapak_adoption')
      .select('*')
      .single()

    if (!error && data) {
      setLapakAdoption(data)
    }
  }

  const loadUsersNeedingSupport = async () => {
    const { data, error } = await supabase
      .from('admin_users_needing_support')
      .select('*')
      .limit(5)

    if (!error && data) {
      setUsersNeedingSupport(data)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Platform overview & user insights</p>
      </div>

      {/* Platform Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Users"
          value={platformStats?.total_users || 0}
          icon={<Users className="h-8 w-8 text-indigo-600" />}
          bgColor="bg-indigo-50"
        />
        <StatCard
          title="Active Users"
          value={platformStats?.active_users || 0}
          subtitle="Last 30 days"
          icon={<Activity className="h-8 w-8 text-green-600" />}
          bgColor="bg-green-50"
        />
        <StatCard
          title="Pending Approval"
          value={platformStats?.pending_approval || 0}
          icon={<AlertCircle className="h-8 w-8 text-yellow-600" />}
          bgColor="bg-yellow-50"
        />
        <StatCard
          title="Total Transactions"
          value={platformStats?.total_transactions || 0}
          subtitle="Last 30 days"
          icon={<BarChart3 className="h-8 w-8 text-blue-600" />}
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(platformStats?.total_revenue || 0)}
          subtitle="All users, 30d"
          icon={<DollarSign className="h-8 w-8 text-emerald-600" />}
          bgColor="bg-emerald-50"
        />
      </div>

      {/* Feature Adoption */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Feature Adoption</h2>
          <span className="text-sm text-gray-500">Usage by active users</span>
        </div>
        
        <div className="space-y-4">
          <FeatureBar
            label="Input Pendapatan"
            value={featureAdoption?.users_with_income || 0}
            total={platformStats?.active_users || 1}
            color="bg-indigo-600"
          />
          <FeatureBar
            label="Input Pengeluaran"
            value={featureAdoption?.users_with_expenses || 0}
            total={platformStats?.active_users || 1}
            color="bg-purple-600"
          />
          <FeatureBar
            label="Pencatatan Produk"
            value={featureAdoption?.users_with_products || 0}
            total={platformStats?.active_users || 1}
            color="bg-blue-600"
          />
          <FeatureBar
            label="Pencatatan Pelanggan"
            value={featureAdoption?.users_with_customers || 0}
            total={platformStats?.active_users || 1}
            color="bg-green-600"
          />
          <FeatureBar
            label="Pencatatan Supplier"
            value={featureAdoption?.users_with_suppliers || 0}
            total={platformStats?.active_users || 1}
            color="bg-orange-600"
          />
          <FeatureBar
            label="Buka Lapak (Traffic)"
            value={lapakAdoption?.users_with_traffic || 0}
            total={platformStats?.active_users || 1}
            color="bg-pink-600"
          />
        </div>
      </div>

      {/* Geographic & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Cities */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">Top Cities</h2>
          </div>
          
          <div className="space-y-3">
            {geographicStats.slice(0, 5).map((stat, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">
                    {stat.city || stat.province || 'Unknown'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {stat.active_users} active / {stat.user_count} total
                  </div>
                </div>
                {stat.avg_health_score && (
                  <div className="text-right">
                    <div className="text-lg font-semibold text-indigo-600">
                      {stat.avg_health_score.toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-500">Health Score</div>
                  </div>
                )}
              </div>
            ))}
            {geographicStats.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                No geographic data available yet
              </p>
            )}
          </div>
        </div>

        {/* Top Business Categories */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">Business Categories</h2>
          </div>
          
          <div className="space-y-3">
            {categoryStats.slice(0, 5).map((stat, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">
                    {stat.category_name || 'Uncategorized'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {stat.user_count} users • {stat.finance_ready_count} finance-ready
                  </div>
                </div>
                {stat.avg_health_score && (
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600">
                      {stat.avg_health_score.toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-500">Avg Health</div>
                  </div>
                )}
              </div>
            ))}
            {categoryStats.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                No category data available yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Users Needing Support */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <h2 className="text-xl font-semibold text-gray-900">Users Needing Support</h2>
          <span className="ml-auto text-sm text-gray-500">Top 5 priority cases</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Health Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issues</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {usersNeedingSupport.map((user) => (
                <tr key={user.user_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{user.full_name || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">{user.business_name || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{user.business_category || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <HealthScoreBadge score={user.health_score || 0} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={user.support_priority} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {user.has_cashflow_issues && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">Cashflow</span>
                      )}
                      {user.has_inventory_issues && (
                        <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded">Inventory</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                      View Details →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {usersNeedingSupport.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-gray-500">No users need urgent support 🎉</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          icon={<Users className="h-6 w-6" />}
          title="Manage Users"
          description="View all users, approve registrations"
          href="/admin/users"
          color="bg-indigo-600"
        />
        <QuickActionCard
          icon={<BookOpen className="h-6 w-6" />}
          title="View Reports"
          description="Bug reports & user feedback"
          href="/admin/reports"
          color="bg-purple-600"
        />
        <QuickActionCard
          icon={<Award className="h-6 w-6" />}
          title="Settings"
          description="Platform configuration & admins"
          href="/admin/settings"
          color="bg-blue-600"
        />
      </div>
    </div>
  )
}

// ===== COMPONENTS =====
function StatCard({ title, value, subtitle, icon, bgColor }: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  bgColor: string
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`${bgColor} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function FeatureBar({ label, value, total, color }: {
  label: string
  value: number
  total: number
  color: string
}) {
  const percentage = Math.round((value / total) * 100)
  
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">{value} / {total} ({percentage}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`${color} h-2.5 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
}

function HealthScoreBadge({ score }: { score: number }) {
  let color = 'bg-red-100 text-red-700'
  if (score >= 75) color = 'bg-green-100 text-green-700'
  else if (score >= 60) color = 'bg-yellow-100 text-yellow-700'
  else if (score >= 40) color = 'bg-orange-100 text-orange-700'
  
  return (
    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${color}`}>
      {score}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    urgent_support: 'bg-red-100 text-red-700',
    moderate_support: 'bg-orange-100 text-orange-700',
    guidance_only: 'bg-blue-100 text-blue-700'
  }
  
  const labels: Record<string, string> = {
    urgent_support: 'Urgent',
    moderate_support: 'Moderate',
    guidance_only: 'Low'
  }
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${colors[priority] || 'bg-gray-100 text-gray-700'}`}>
      {labels[priority] || priority}
    </span>
  )
}

function QuickActionCard({ icon, title, description, href, color }: {
  icon: React.ReactNode
  title: string
  description: string
  href: string
  color: string
}) {
  return (
    <a
      href={href}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className={`${color} text-white w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </a>
  )
}
