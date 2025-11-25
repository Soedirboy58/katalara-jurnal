'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Settings {
  theme: 'light' | 'dark' | 'auto'
  language: 'id' | 'en'
  currency: string
  dateFormat: 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd'
  emailNotifications: boolean
  pushNotifications: boolean
  expenseAlerts: boolean
  expenseThreshold: number
  lowStockAlerts: boolean
  lowStockThreshold: number
}

export default function GeneralSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [settings, setSettings] = useState<Settings>({
    theme: 'light',
    language: 'id',
    currency: 'IDR',
    dateFormat: 'dd/mm/yyyy',
    emailNotifications: true,
    pushNotifications: true,
    expenseAlerts: true,
    expenseThreshold: 1000000,
    lowStockAlerts: true,
    lowStockThreshold: 10
  })

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Load from business_configurations table
      const { data, error } = await supabase
        .from('business_configurations')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error)
      }

      if (data) {
        setSettings({
          theme: data.theme || 'light',
          language: data.language || 'id',
          currency: data.currency || 'IDR',
          dateFormat: data.date_format || 'dd/mm/yyyy',
          emailNotifications: data.email_notifications ?? true,
          pushNotifications: data.push_notifications ?? true,
          expenseAlerts: data.expense_alerts ?? true,
          expenseThreshold: data.expense_threshold || 1000000,
          lowStockAlerts: data.low_stock_alerts ?? true,
          lowStockThreshold: data.low_stock_threshold || 10
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('business_configurations')
        .upsert({
          user_id: user.id,
          theme: settings.theme,
          language: settings.language,
          currency: settings.currency,
          date_format: settings.dateFormat,
          email_notifications: settings.emailNotifications,
          push_notifications: settings.pushNotifications,
          expense_alerts: settings.expenseAlerts,
          expense_threshold: settings.expenseThreshold,
          low_stock_alerts: settings.lowStockAlerts,
          low_stock_threshold: settings.lowStockThreshold,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'update_settings',
        description: 'Mengubah pengaturan umum',
        metadata: { settings }
      })

      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('Reset semua pengaturan ke default?')) return

    const defaultSettings: Settings = {
      theme: 'light',
      language: 'id',
      currency: 'IDR',
      dateFormat: 'dd/mm/yyyy',
      emailNotifications: true,
      pushNotifications: true,
      expenseAlerts: true,
      expenseThreshold: 1000000,
      lowStockAlerts: true,
      lowStockThreshold: 10
    }

    setSettings(defaultSettings)
    
    // Save to database
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('business_configurations')
        .upsert({
          user_id: user.id,
          ...defaultSettings,
          date_format: defaultSettings.dateFormat,
          email_notifications: defaultSettings.emailNotifications,
          push_notifications: defaultSettings.pushNotifications,
          expense_alerts: defaultSettings.expenseAlerts,
          expense_threshold: defaultSettings.expenseThreshold,
          low_stock_alerts: defaultSettings.lowStockAlerts,
          low_stock_threshold: defaultSettings.lowStockThreshold,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error

      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    } catch (error) {
      console.error('Error resetting settings:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">General Settings</h1>
        <p className="text-sm text-gray-600 mt-1">Kelola preferensi dan notifikasi aplikasi</p>
      </div>

      <div className="space-y-6">
        {/* Appearance Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🎨</span>
            Tampilan
          </h2>
          
          <div className="space-y-4">
            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
              <select
                value={settings.theme}
                onChange={(e) => setSettings({ ...settings, theme: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="light">Terang</option>
                <option value="dark">Gelap</option>
                <option value="auto">Otomatis (Sesuai Sistem)</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bahasa</label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>

        {/* Regional Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🌍</span>
            Regional
          </h2>
          
          <div className="space-y-4">
            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mata Uang</label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="IDR">Rupiah (IDR)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="SGD">Singapore Dollar (SGD)</option>
              </select>
            </div>

            {/* Date Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Format Tanggal</label>
              <select
                value={settings.dateFormat}
                onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="dd/mm/yyyy">DD/MM/YYYY (31/12/2024)</option>
                <option value="mm/dd/yyyy">MM/DD/YYYY (12/31/2024)</option>
                <option value="yyyy-mm-dd">YYYY-MM-DD (2024-12-31)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🔔</span>
            Notifikasi
          </h2>
          
          <div className="space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                <p className="text-xs text-gray-600">Terima notifikasi via email</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
                <p className="text-xs text-gray-600">Notifikasi browser real-time</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, pushNotifications: !settings.pushNotifications })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.pushNotifications ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            Alerts & Reminders
          </h2>
          
          <div className="space-y-6">
            {/* Expense Alerts */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Expense Alerts</h3>
                  <p className="text-xs text-gray-600">Notifikasi saat pengeluaran besar</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, expenseAlerts: !settings.expenseAlerts })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.expenseAlerts ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.expenseAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {settings.expenseAlerts && (
                <div className="mt-2">
                  <label className="block text-xs text-gray-600 mb-1">Threshold (Rp)</label>
                  <input
                    type="number"
                    value={settings.expenseThreshold}
                    onChange={(e) => setSettings({ ...settings, expenseThreshold: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1000000"
                  />
                </div>
              )}
            </div>

            {/* Low Stock Alerts */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Low Stock Alerts</h3>
                  <p className="text-xs text-gray-600">Notifikasi saat stok menipis</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, lowStockAlerts: !settings.lowStockAlerts })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.lowStockAlerts ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.lowStockAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {settings.lowStockAlerts && (
                <div className="mt-2">
                  <label className="block text-xs text-gray-600 mb-1">Threshold Stok Minimum</label>
                  <input
                    type="number"
                    value={settings.lowStockThreshold}
                    onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <button
            onClick={handleReset}
            disabled={saving}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Reset ke Default
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-up">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Pengaturan berhasil disimpan!</span>
          </div>
        </div>
      )}
    </div>
  )
}
