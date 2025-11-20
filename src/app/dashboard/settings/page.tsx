'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')
  const [activeTab, setActiveTab] = useState<'financial' | 'display' | 'general'>('financial')
  
  // Financial Settings state
  const [dailyExpenseLimit, setDailyExpenseLimit] = useState('')
  const [dailyRevenueTarget, setDailyRevenueTarget] = useState('')
  const [enableNotifications, setEnableNotifications] = useState(true)
  const [notificationThreshold, setNotificationThreshold] = useState('80') // Alert at 80% of limit
  
  // ROI settings
  const [trackROI, setTrackROI] = useState(true)
  const [roiPeriod, setRoiPeriod] = useState('monthly') // daily, weekly, monthly
  
  // Display Settings state
  const [dashboardLayout, setDashboardLayout] = useState('grid') // grid, list
  const [compactMode, setCompactMode] = useState(false)
  const [showAnimations, setShowAnimations] = useState(true)
  
  // Toast
  const [toast, setToast] = useState<{show: boolean, type: 'success' | 'error', message: string}>({
    show: false,
    type: 'success',
    message: ''
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      // Load from business_configurations
      const { data: config } = await supabase
        .from('business_configurations')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (config) {
        setDailyExpenseLimit(config.daily_expense_limit?.toString() || '')
        setDailyRevenueTarget(config.daily_revenue_target?.toString() || '')
        setEnableNotifications(config.enable_expense_notifications ?? true)
        setNotificationThreshold(config.notification_threshold?.toString() || '80')
        setTrackROI(config.track_roi ?? true)
        setRoiPeriod(config.roi_period || 'monthly')
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ show: true, type, message })
    setTimeout(() => setToast({ show: false, type, message: '' }), 4000)
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // First check if config exists and get business_category
      const { data: existingConfig } = await supabase
        .from('business_configurations')
        .select('business_category')
        .eq('user_id', userId)
        .single()

      const settings = {
        user_id: userId,
        business_category: existingConfig?.business_category || 'other', // Preserve or default
        daily_expense_limit: dailyExpenseLimit ? parseFloat(dailyExpenseLimit.replace(/\./g, '')) : null,
        daily_revenue_target: dailyRevenueTarget ? parseFloat(dailyRevenueTarget.replace(/\./g, '')) : null,
        enable_expense_notifications: enableNotifications,
        notification_threshold: parseInt(notificationThreshold),
        track_roi: trackROI,
        roi_period: roiPeriod,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('business_configurations')
        .upsert(settings, { onConflict: 'user_id' })

      if (error) throw error

      showToast('success', '✅ Pengaturan berhasil disimpan!')
    } catch (error: any) {
      console.error('Error saving settings:', error)
      showToast('error', '❌ Gagal menyimpan: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const formatNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, '')
    if (!numbers) return ''
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  const handleNumberInput = (value: string, setter: (val: string) => void) => {
    setter(formatNumber(value))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pengaturan Platform</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Kelola preferensi dan konfigurasi platform Katalara Anda
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-4xl mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('financial')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'financial'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              💰 Keuangan
            </button>
            <button
              onClick={() => setActiveTab('display')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'display'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              🎨 Tampilan
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'general'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              ⚙️ Umum
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Financial Tab Content */}
        {activeTab === 'financial' && (
          <>
        {/* Daily Expense Limit */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">Limit Pengeluaran Harian</h2>
              <p className="text-sm text-gray-600 mt-1">
                Tetapkan batas maksimal pengeluaran per hari. Notifikasi akan muncul saat mendekati limit.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limit Harian (Opsional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={dailyExpenseLimit}
                  onChange={(e) => handleNumberInput(e.target.value, setDailyExpenseLimit)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {dailyExpenseLimit && (
                <p className="text-xs text-gray-500 mt-1">Rp {dailyExpenseLimit}</p>
              )}
            </div>

            {dailyExpenseLimit && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-900">Peringatan Aktif</p>
                    <p className="text-xs text-amber-800 mt-1">
                      Anda akan mendapat notifikasi saat pengeluaran mencapai {notificationThreshold}% dari limit (Rp {formatNumber((parseFloat(dailyExpenseLimit.replace(/\./g, '')) * parseInt(notificationThreshold) / 100).toString())})
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Daily Revenue Target */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">Target Pemasukan Harian</h2>
              <p className="text-sm text-gray-600 mt-1">
                Tetapkan target pendapatan harian untuk memotivasi dan tracking progress bisnis Anda.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Harian (Opsional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={dailyRevenueTarget}
                onChange={(e) => handleNumberInput(e.target.value, setDailyRevenueTarget)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {dailyRevenueTarget && (
              <p className="text-xs text-gray-500 mt-1">Rp {dailyRevenueTarget}</p>
            )}
          </div>

          {dailyRevenueTarget && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-900">Target Tracking</p>
                  <p className="text-xs text-blue-800 mt-1">
                    Dashboard akan menampilkan progress harian Anda terhadap target ini
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">Notifikasi Pengeluaran</h2>
              <p className="text-sm text-gray-600 mt-1">
                Dapatkan peringatan otomatis saat pengeluaran mendekati limit yang ditetapkan
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Aktifkan Notifikasi</p>
                <p className="text-xs text-gray-600 mt-1">Terima alert saat mendekati limit pengeluaran</p>
              </div>
              <button
                onClick={() => setEnableNotifications(!enableNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  enableNotifications ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enableNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {enableNotifications && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Threshold Notifikasi
                </label>
                <select
                  value={notificationThreshold}
                  onChange={(e) => setNotificationThreshold(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="50">50% dari limit</option>
                  <option value="70">70% dari limit</option>
                  <option value="80">80% dari limit (Recommended)</option>
                  <option value="90">90% dari limit</option>
                  <option value="95">95% dari limit</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Notifikasi akan muncul saat pengeluaran mencapai persentase ini
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ROI Analysis Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">Analisa ROI (Return on Investment)</h2>
              <p className="text-sm text-gray-600 mt-1">
                Tracking otomatis untuk mengukur efektivitas investasi dan pengeluaran bisnis Anda
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Track ROI Otomatis</p>
                <p className="text-xs text-gray-600 mt-1">Sistem akan menghitung ROI berdasarkan revenue dan expenses</p>
              </div>
              <button
                onClick={() => setTrackROI(!trackROI)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  trackROI ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    trackROI ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {trackROI && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Period Analisa
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setRoiPeriod('daily')}
                    className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                      roiPeriod === 'daily'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Harian
                  </button>
                  <button
                    onClick={() => setRoiPeriod('weekly')}
                    className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                      roiPeriod === 'weekly'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Mingguan
                  </button>
                  <button
                    onClick={() => setRoiPeriod('monthly')}
                    className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                      roiPeriod === 'monthly'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Bulanan
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  ROI akan dihitung dan ditampilkan di dashboard berdasarkan periode ini
                </p>
              </div>
            )}

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-indigo-900">Formula ROI</p>
                  <p className="text-xs text-indigo-800 mt-1">
                    ROI = ((Revenue - Expenses) / Expenses) × 100%
                  </p>
                  <p className="text-xs text-indigo-700 mt-2">
                    Contoh: Jika revenue Rp 10 juta dan expenses Rp 7 juta, ROI = 42.86%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
          <button
            onClick={loadSettings}
            disabled={saving}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Reset
          </button>
        </div>
          </>
        )}

        {/* Display Tab Content */}
        {activeTab === 'display' && (
          <>
            {/* Dashboard Layout */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="text-2xl mr-3">📊</div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Layout Dashboard</h2>
                  <p className="text-sm text-gray-600">Pilih tampilan dashboard yang sesuai</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Layout</label>
                  <select
                    value={dashboardLayout}
                    onChange={(e) => setDashboardLayout(e.target.value as 'grid' | 'list')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="grid">Grid (Kotak-kotak)</option>
                    <option value="list">List (Daftar Vertikal)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Appearance Options */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="text-2xl mr-3">🎨</div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Tampilan & Animasi</h2>
                  <p className="text-sm text-gray-600">Sesuaikan pengalaman visual Anda</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Compact Mode */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Mode Kompak</h3>
                    <p className="text-sm text-gray-600">Tampilkan lebih banyak informasi dalam ruang lebih kecil</p>
                  </div>
                  <button
                    onClick={() => setCompactMode(!compactMode)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      compactMode ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        compactMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Animations */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Animasi</h3>
                    <p className="text-sm text-gray-600">Aktifkan animasi transisi dan efek visual</p>
                  </div>
                  <button
                    onClick={() => setShowAnimations(!showAnimations)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showAnimations ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showAnimations ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
            </div>
          </>
        )}

        {/* General Tab Content */}
        {activeTab === 'general' && (
          <>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="text-2xl mr-3">⚙️</div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Pengaturan Umum</h2>
                  <p className="text-sm text-gray-600">Fitur pengaturan tambahan akan tersedia segera</p>
                </div>
              </div>
              
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">🚧</div>
                <p className="text-lg font-medium">Sedang Dalam Pengembangan</p>
                <p className="text-sm mt-2">Pengaturan umum seperti bahasa, zona waktu, dan notifikasi email<br/>akan tersedia di update berikutnya</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-8 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Kembali ke Dashboard
              </button>
            </div>
          </>
        )}
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-[100] animate-slide-in">
          <div className={`
            rounded-lg shadow-2xl p-4 min-w-[300px] max-w-md
            flex items-start gap-3 border-l-4
            ${
              toast.type === 'success' ? 'bg-green-50 border-green-500' :
              'bg-red-50 border-red-500'
            }
          `}>
            <span className="text-2xl flex-shrink-0">
              {toast.type === 'success' ? '✅' : '❌'}
            </span>
            <div className="flex-1">
              <p className={`
                text-sm font-medium
                ${toast.type === 'success' ? 'text-green-900' : 'text-red-900'}
              `}>
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast({ ...toast, show: false })}
              className={`
                flex-shrink-0 rounded-full p-1 transition-colors
                ${toast.type === 'success' ? 'hover:bg-green-200' : 'hover:bg-red-200'}
              `}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
