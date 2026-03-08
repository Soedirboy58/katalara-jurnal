'use client'













import { useState, useEffect } from 'react'






import { useRouter } from 'next/navigation'






import { createClient } from '@/lib/supabase/client'






import ImageUpload from '@/components/lapak/ImageUpload'













export default function SettingsPage() {






  const router = useRouter()






  const supabase = createClient()






  const [loading, setLoading] = useState(true)






  const [saving, setSaving] = useState(false)






  const [userId, setUserId] = useState('')






  const [activeTab, setActiveTab] = useState<






    'business-type' | 'business' | 'finance' | 'operations' | 'branding' | 'notifications' | 'security'






  >('business-type')













  type BusinessType = 'dagang' | 'jasa' | 'produksi'






  const [businessType, setBusinessType] = useState<BusinessType>('dagang')













  const categoryToBusinessType = (category?: string | null): BusinessType => {






    const c = (category || '').toString().toLowerCase()






    if (c.includes('jasa')) return 'jasa'






    if (c.includes('trading') || c.includes('reseller')) return 'dagang'






    if (c.includes('produk') || c.includes('stok') || c.includes('hybrid')) return 'produksi'






    return 'dagang'






  }













  const businessTypeToCategory = (type: BusinessType): string => {






    if (type === 'jasa') return 'Jasa/Layanan'






    if (type === 'dagang') return 'Trading/Reseller'






    return 'Produk dengan Stok'






  }






  






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













  // Business profile fields






  const [businessName, setBusinessName] = useState('')






  const [businessOwnerName, setBusinessOwnerName] = useState('')

  const [businessSignatureTitle, setBusinessSignatureTitle] = useState('')






  const [businessAddress, setBusinessAddress] = useState('')






  const [businessPhone, setBusinessPhone] = useState('')






  const [businessEmail, setBusinessEmail] = useState('')






  const [businessLogoUrl, setBusinessLogoUrl] = useState('')






  const [businessSignatureUrl, setBusinessSignatureUrl] = useState('')






  const [businessWatermarkLogoUrl, setBusinessWatermarkLogoUrl] = useState('')






  const [profileUploadCount, setProfileUploadCount] = useState(0)

  const [operationalLoading, setOperationalLoading] = useState(false)
  const [unitCatalog, setUnitCatalog] = useState<Array<{ id: string; business_types?: string[]; is_active?: boolean }>>([])
  const [unitPrefs, setUnitPrefs] = useState<Record<string, { is_active: boolean; is_favorite: boolean }>>({})
  const [invoiceTemplates, setInvoiceTemplates] = useState<Array<{ id: string; business_types?: string[] }>>([])
  const [defaultTemplateId, setDefaultTemplateId] = useState('')













  const [resetLoading, setResetLoading] = useState(false)






  const [previewLoading, setPreviewLoading] = useState(false)






  const [resetConfirmation, setResetConfirmation] = useState('')






  const [resetPreviewReport, setResetPreviewReport] = useState<Array<{ scope: string; ok: boolean; detail?: string }>>([])






  const [fullResetLoading, setFullResetLoading] = useState(false)






  const [fullResetPreviewLoading, setFullResetPreviewLoading] = useState(false)






  const [fullResetConfirmation, setFullResetConfirmation] = useState('')






  const [fullResetPreviewReport, setFullResetPreviewReport] = useState<Array<{ scope: string; ok: boolean; detail?: string }>>([])






  const [resetTargets, setResetTargets] = useState<Record<string, boolean>>({






    customers: false,






    suppliers: false,






    transactions: false,






    products: false,






    incomes: false,






    expenses: false,






    lapak_orders: false,






  })






  






  // Toast






  const [toast, setToast] = useState<{show: boolean, type: 'success' | 'error', message: string}>({






    show: false,






    type: 'success',






    message: ''






  })













  useEffect(() => {






    loadSettings()






  }, [])













  useEffect(() => {






    if (userId) {






      loadOperationalSettings(userId, businessType)






    }






  }, [userId, businessType])













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






        setBusinessType(categoryToBusinessType(config.business_category))






        setBusinessName(config.business_name || '')






        setBusinessOwnerName(config.business_owner_name || '')
        setBusinessSignatureTitle(config.business_signature_title || '')






        setBusinessAddress(config.business_address || '')






        setBusinessPhone(config.business_phone || '')






        setBusinessEmail(config.business_email || '')






        setBusinessLogoUrl(config.business_logo_url || '')






        setBusinessSignatureUrl(config.business_signature_url || '')






        setBusinessWatermarkLogoUrl(config.business_watermark_logo_url || '')






      }













      if (!config?.business_name) {






        const { data: profile } = await supabase






          .from('user_profiles')






          .select('business_name')






          .eq('id', user.id)






          .maybeSingle()






        if (profile?.business_name) setBusinessName(profile.business_name)






      }






    } catch (error) {






      console.error('Error loading settings:', error)






    } finally {






      setLoading(false)






    }






  }













  const matchesBusinessType = (types: string[] | null | undefined, type: BusinessType) => {






    if (!types || types.length === 0) return true






    return types.map((t) => t.toLowerCase()).includes(type)






  }













  const loadOperationalSettings = async (uid: string, type: BusinessType) => {






    try {






      setOperationalLoading(true)













      const { data: units, error: unitsError } = await supabase






        .from('unit_catalog')






        .select('*')






        .eq('is_active', true)













      if (unitsError) throw unitsError













      const { data: templates, error: templatesError } = await supabase






        .from('invoice_templates')






        .select('*')






        .eq('is_active', true)













      if (templatesError) throw templatesError













      const filteredUnits = (units || []).filter((unit) => matchesBusinessType(unit.business_types, type))






      const filteredTemplates = (templates || []).filter((tpl) => matchesBusinessType(tpl.business_types, type))













      setUnitCatalog(filteredUnits)






      setInvoiceTemplates(filteredTemplates)













      const { data: unitPreferences, error: unitPrefError } = await supabase






        .from('business_unit_preferences')






        .select('unit_id,is_active,is_favorite')






        .eq('user_id', uid)













      if (unitPrefError) throw unitPrefError













      const { data: templatePreferences, error: templatePrefError } = await supabase






        .from('business_invoice_preferences')






        .select('template_id,is_default')






        .eq('user_id', uid)













      if (templatePrefError) throw templatePrefError













      const initialPrefs: Record<string, { is_active: boolean; is_favorite: boolean }> = {}






      filteredUnits.forEach((unit) => {






        initialPrefs[unit.id] = {






          is_active: unit.is_active ?? true,






          is_favorite: false






        }






      })













      ;(unitPreferences || []).forEach((pref) => {






        initialPrefs[pref.unit_id] = {






          is_active: pref.is_active ?? true,






          is_favorite: pref.is_favorite ?? false






        }






      })













      setUnitPrefs(initialPrefs)













      const defaultPref = (templatePreferences || []).find((pref) => pref.is_default)






      const defaultFromCatalog = filteredTemplates.find((tpl) => tpl.is_default)






      setDefaultTemplateId(defaultPref?.template_id || defaultFromCatalog?.id || filteredTemplates[0]?.id || '')






    } catch (error) {






      console.error('Error loading operational settings:', error)






    } finally {






      setOperationalLoading(false)






    }






  }













  const showToast = (type: 'success' | 'error', message: string) => {






    setToast({ show: true, type, message })






    setTimeout(() => setToast({ show: false, type, message: '' }), 4000)






  }













  const toggleResetTarget = (key: string) => {






    setResetPreviewReport([])






    setResetTargets((prev) => ({ ...prev, [key]: !prev[key] }))






  }













  const handleResetData = async () => {






    const scopes = Object.entries(resetTargets)






      .filter(([, checked]) => checked)






      .map(([key]) => key)













    if (scopes.length === 0) {






      showToast('error', 'Pilih minimal satu jenis data yang ingin dihapus')






      return






    }













    if (resetConfirmation !== 'HAPUS') {






      showToast('error', 'Ketik HAPUS untuk konfirmasi')






      return






    }













    try {






      setResetLoading(true)













      const response = await fetch('/api/settings/reset-data', {






        method: 'POST',






        headers: { 'Content-Type': 'application/json' },






        body: JSON.stringify({ scopes, confirmation: resetConfirmation }),






      })













      const data = await response.json().catch(() => null)






      if (!response.ok) {






        showToast('error', data?.error || 'Gagal reset data')






        return






      }













      showToast('success', 'Data terpilih berhasil dihapus')






      setResetTargets({






        customers: false,






        suppliers: false,






        transactions: false,






        products: false,






        incomes: false,






        expenses: false,






        lapak_orders: false,






      })






      setResetConfirmation('')






      setResetPreviewReport([])






    } catch (error) {






      console.error('Error resetting data:', error)






      showToast('error', 'Terjadi kesalahan saat reset data')






    } finally {






      setResetLoading(false)






    }






  }













  const handlePreviewResetImpact = async () => {






    const scopes = Object.entries(resetTargets)






      .filter(([, checked]) => checked)






      .map(([key]) => key)













    if (scopes.length === 0) {






      showToast('error', 'Pilih minimal satu jenis data untuk preview')






      return






    }













    try {






      setPreviewLoading(true)













      const response = await fetch('/api/settings/reset-data', {






        method: 'POST',






        headers: { 'Content-Type': 'application/json' },






        body: JSON.stringify({ scopes, mode: 'preview' }),






      })













      const data = await response.json().catch(() => null)






      if (!response.ok) {






        showToast('error', data?.error || 'Gagal menghitung dampak reset')






        return






      }













      const report = Array.isArray(data?.report) ? data.report : []






      setResetPreviewReport(report)






      showToast('success', 'Preview reset berhasil dihitung')






    } catch (error) {






      console.error('Error previewing reset data:', error)






      showToast('error', 'Terjadi kesalahan saat preview reset')






    } finally {






      setPreviewLoading(false)






    }






  }













  const handlePreviewFullReset = async () => {






    try {






      setFullResetPreviewLoading(true)













      const response = await fetch('/api/settings/reset-data', {






        method: 'POST',






        headers: { 'Content-Type': 'application/json' },






        body: JSON.stringify({ scopes: ['full_platform'], mode: 'preview' }),






      })













      const data = await response.json().catch(() => null)






      if (!response.ok) {






        showToast('error', data?.error || 'Gagal menghitung dampak reset total')






        return






      }













      const report = Array.isArray(data?.report) ? data.report : []






      setFullResetPreviewReport(report)






      showToast('success', 'Preview reset total berhasil dihitung')






    } catch (error) {






      console.error('Error previewing full reset:', error)






      showToast('error', 'Terjadi kesalahan saat preview reset total')






    } finally {






      setFullResetPreviewLoading(false)






    }






  }













  const handleFullPlatformReset = async () => {






    if (fullResetConfirmation !== 'RESET SEMUA') {






      showToast('error', 'Ketik RESET SEMUA untuk konfirmasi reset total platform')






      return






    }













    try {






      setFullResetLoading(true)













      const response = await fetch('/api/settings/reset-data', {






        method: 'POST',






        headers: { 'Content-Type': 'application/json' },






        body: JSON.stringify({






          scopes: ['full_platform'],






          confirmation: fullResetConfirmation,






        }),






      })













      const data = await response.json().catch(() => null)






      if (!response.ok) {






        showToast('error', data?.error || 'Gagal reset total platform')






        return






      }













      showToast('success', 'Reset total platform berhasil dilakukan')






      setFullResetConfirmation('')






      setFullResetPreviewReport([])






      setResetPreviewReport([])






      setResetTargets({






        customers: false,






        suppliers: false,






        transactions: false,






        products: false,






        incomes: false,






        expenses: false,






        lapak_orders: false,






      })






      setResetConfirmation('')






    } catch (error) {






      console.error('Error resetting full platform data:', error)






      showToast('error', 'Terjadi kesalahan saat reset total platform')






    } finally {






      setFullResetLoading(false)






    }






  }













  const handleSave = async () => {






    try {






      if (profileUploadCount > 0) {






        showToast('error', 'Tunggu upload gambar selesai sebelum menyimpan.')






        return






      }













      setSaving(true)













      // First check if config exists and get business_category






      const { data: existingConfig } = await supabase






        .from('business_configurations')






        .select('business_category')






        .eq('user_id', userId)






        .single()













      const settings = {






        user_id: userId,






        business_category: businessTypeToCategory(businessType),






        daily_expense_limit: dailyExpenseLimit ? parseFloat(dailyExpenseLimit.replace(/\./g, '')) : null,






        daily_revenue_target: dailyRevenueTarget ? parseFloat(dailyRevenueTarget.replace(/\./g, '')) : null,






        enable_expense_notifications: enableNotifications,






        notification_threshold: parseInt(notificationThreshold),






        track_roi: trackROI,






        roi_period: roiPeriod,






        business_name: businessName || null,






        business_owner_name: businessOwnerName || null,

        business_signature_title: businessSignatureTitle || null,

        business_address: businessAddress || null,






        business_phone: businessPhone || null,






        business_email: businessEmail || null,






        business_logo_url: businessLogoUrl || null,






        business_signature_url: businessSignatureUrl || null,






        business_watermark_logo_url: businessWatermarkLogoUrl || null






      }













      const { error } = await supabase






        .from('business_configurations')






        .upsert(settings, { onConflict: 'user_id' })













      if (error) throw error













      if (businessName) {






        await supabase






          .from('user_profiles')






          .update({ business_name: businessName })






          .eq('id', userId)






      }













      if (userId) {






        const unitRows = unitCatalog.map((unit) => ({






          user_id: userId,






          unit_id: unit.id,






          is_active: unitPrefs[unit.id]?.is_active ?? true,






          is_favorite: unitPrefs[unit.id]?.is_favorite ?? false






        }))













        if (unitRows.length > 0) {






          const { error: unitSaveError } = await supabase






            .from('business_unit_preferences')






            .upsert(unitRows, { onConflict: 'user_id,unit_id' })













          if (unitSaveError) throw unitSaveError






        }













        const templateRows = invoiceTemplates.map((tpl) => ({






          user_id: userId,






          template_id: tpl.id,






          is_default: tpl.id === defaultTemplateId






        }))













        if (templateRows.length > 0) {






          const { error: templateSaveError } = await supabase






            .from('business_invoice_preferences')






            .upsert(templateRows, { onConflict: 'user_id,template_id' })













          if (templateSaveError) throw templateSaveError






        }






      }













      showToast('success', 'Γ£à Pengaturan berhasil disimpan!')






    } catch (error: any) {






      console.error('Error saving settings:', error)






      if (error?.code === 'PGRST204') {






        showToast(






          'error',






          'Γ¥î Gagal menyimpan: Database belum ter-update. Jalankan migrasi add_financial_controls.sql lalu refresh schema cache Supabase (Settings ΓåÆ API ΓåÆ Reload schema cache), kemudian coba lagi.'






        )






      } else if (error?.code === '23514' && typeof error?.message === 'string') {






        if (error.message.includes('chk_business_config_updated_after_created')) {






          showToast(






            'error',






            'Γ¥î Gagal menyimpan: timestamp tidak valid (updated_at < created_at). Ini biasanya karena aplikasi mengirim waktu dari device. Refresh halaman lalu coba lagi. Jika tetap, jalankan perbaikan di DB: UPDATE public.business_configurations SET updated_at = GREATEST(updated_at, created_at);'






          )






        } else if (error.message.includes('chk_business_config_category')) {






          showToast(






            'error',






            'Γ¥î Gagal menyimpan: nilai kategori bisnis tidak valid untuk schema saat ini. Selesaikan onboarding atau set business_category ke salah satu: Produk dengan Stok / Produk Tanpa Stok / Jasa/Layanan / Trading/Reseller / Hybrid.'






          )






        } else {






          showToast('error', 'Γ¥î Gagal menyimpan: ' + error.message)






        }






      } else {






        showToast('error', 'Γ¥î Gagal menyimpan: ' + (error?.message || 'Unknown error'))






      }






    } finally {






      setSaving(false)






    }






  }













  const toggleUnitActive = (unitId: string) => {






    setUnitPrefs((prev) => ({






      ...prev,






      [unitId]: {






        is_active: !(prev[unitId]?.is_active ?? true),






        is_favorite: prev[unitId]?.is_favorite ?? false






      }






    }))






  }













  const toggleUnitFavorite = (unitId: string) => {






    setUnitPrefs((prev) => ({






      ...prev,






      [unitId]: {






        is_active: prev[unitId]?.is_active ?? true,






        is_favorite: !(prev[unitId]?.is_favorite ?? false)






      }






    }))






  }













  const formatNumber = (value: string): string => {






    const numbers = value.replace(/\D/g, '')






    if (!numbers) return ''






    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.')






  }













  const handleNumberInput = (value: string, setter: (val: string) => void) => {






    setter(formatNumber(value))






  }













  const tabs = [






    { id: 'business-type', label: 'Tipe Usaha', icon: '🏷️' },






    { id: 'business', label: 'Profil & Bisnis', icon: '🏢' },






    { id: 'finance', label: 'Keuangan', icon: '💰' },






    { id: 'operations', label: 'Operasional', icon: '🧩' },






    { id: 'branding', label: 'Tampilan & Branding', icon: '🎨' },






    { id: 'notifications', label: 'Notifikasi', icon: '🔔' },






    { id: 'security', label: 'Akun & Keamanan', icon: '🔒' }






  ] as const













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



                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Jabatan/Posisi Tanda Tangan</label>
                      <input
                        type="text"
                        value={businessSignatureTitle}
                        onChange={(e) => setBusinessSignatureTitle(e.target.value)}
                        placeholder="Contoh: Owner / Direktur"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>











      {/* Settings Layout */}






      <div className="max-w-6xl">






        <div className="lg:grid lg:grid-cols-[240px_1fr] gap-6">






          {/* Desktop Sidebar Tabs */}






          <aside className="hidden lg:block">






            <div className="bg-white border border-gray-200 rounded-xl p-3 lg:sticky lg:top-24">






              <div className="px-2 pb-2 text-[11px] uppercase tracking-wide text-gray-400">Menu Pengaturan</div>






              <nav className="space-y-1" aria-label="Tabs">






                {tabs.map((tab) => (






                  <button






                    key={tab.id}






                    onClick={() => setActiveTab(tab.id)}






                    className={`






                      w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors






                      ${activeTab === tab.id






                        ? 'bg-blue-50 text-blue-700'






                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'






                      }






                    `}






                  >






                    <span className="text-base">{tab.icon}</span>






                    <span className="truncate">{tab.label}</span>






                  </button>






                ))}






              </nav>






            </div>






          </aside>













          {/* Mobile/Tablet Tabs */}






          <div className="lg:hidden mb-4">






            <div className="border-b border-gray-200">






              <div className="flex gap-2 overflow-x-auto py-2">






                {tabs.map((tab) => (






                  <button






                    key={tab.id}






                    onClick={() => setActiveTab(tab.id)}






                    className={`






                      whitespace-nowrap px-3 py-2 rounded-full border text-xs font-medium transition-colors






                      ${activeTab === tab.id






                        ? 'bg-blue-600 text-white border-blue-600'






                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'






                      }






                    `}






                  >






                    {tab.icon} {tab.label}






                  </button>






                ))}






              </div>






            </div>






          </div>













          {/* Content */}






          <div className="space-y-6">






                    {/* Business Type Tab Content */}




            {activeTab === 'business-type' && (




              <>




                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">




                  <div className="flex items-start gap-3 mb-4">




                    <div className="p-2 bg-blue-100 rounded-lg">




                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">




                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />




                      </svg>




                    </div>




                    <div className="flex-1">




                      <h2 className="text-lg font-semibold text-gray-900">Tipe Usaha</h2>




                      <p className="text-sm text-gray-600 mt-1">




                        Pilih tipe usaha untuk menyesuaikan menu, alur input, dan tampilan fitur agar lebih sederhana.




                      </p>




                    </div>




                  </div>









                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">




                    {[




                      {




                        value: 'dagang',




                        title: 'Usaha Dagang',




                        desc: 'Fokus jual beli barang, stok & supplier aktif.'




                      },




                      {




                        value: 'jasa',




                        title: 'Usaha Jasa',




                        desc: 'Fokus layanan, stok & supplier disederhanakan.'




                      },




                      {




                        value: 'produksi',




                        title: 'Usaha Produksi',




                        desc: 'Produksi barang dengan bahan baku & perakitan.'




                      }




                    ].map((opt) => (




                      <button




                        key={opt.value}




                        onClick={() => setBusinessType(opt.value as BusinessType)}




                        className={`text-left p-4 rounded-lg border transition-colors ${




                          businessType === opt.value




                            ? 'border-blue-600 bg-blue-50'




                            : 'border-gray-200 hover:border-gray-300'




                        }`}




                      >




                        <div className="font-semibold text-gray-900">{opt.title}</div>




                        <div className="text-sm text-gray-600 mt-1">{opt.desc}</div>




                      </button>




                    ))}




                  </div>









                  <div className="mt-4 text-xs text-gray-500">




                    * Pilihan ini menentukan rekomendasi tampilan. Optimasi fitur akan kita lanjutkan setelah UI siap.




                  </div>




                </div>









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









            {/* Business Profile Tab Content */}




            {activeTab === 'business' && (




              <>




                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">




                  <div className="flex items-center mb-4">




                    <div className="text-2xl mr-3">🏢</div>




                    <div>




                      <h2 className="text-lg font-semibold text-gray-900">Profil & Informasi Bisnis</h2>




                      <p className="text-sm text-gray-600">Atur identitas usaha, alamat, dan preferensi dasar</p>




                    </div>




                  </div>









                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">




                    <div>




                      <label className="block text-sm font-medium text-gray-700 mb-2">Nama Bisnis</label>




                      <input




                        type="text"




                        value={businessName}




                        onChange={(e) => setBusinessName(e.target.value)}




                        placeholder="Contoh: PT. Maju Jaya"




                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"




                      />




                    </div>




                    <div>




                      <label className="block text-sm font-medium text-gray-700 mb-2">Nama Pemilik/Penanggung Jawab</label>




                      <input




                        type="text"




                        value={businessOwnerName}




                        onChange={(e) => setBusinessOwnerName(e.target.value)}




                        placeholder="Contoh: Bapak Reza"




                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"




                      />




                    </div>




                    <div>




                      <label className="block text-sm font-medium text-gray-700 mb-2">No. Telepon/WhatsApp</label>




                      <input




                        type="text"




                        value={businessPhone}




                        onChange={(e) => setBusinessPhone(e.target.value)}




                        placeholder="Contoh: 0822xxxx"




                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"




                      />




                    </div>




                    <div>




                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Bisnis</label>




                      <input




                        type="email"




                        value={businessEmail}




                        onChange={(e) => setBusinessEmail(e.target.value)}




                        placeholder="Contoh: info@bisnis.com"




                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"




                      />




                    </div>




                    <div className="lg:col-span-2">




                      <label className="block text-sm font-medium text-gray-700 mb-2">Alamat Bisnis</label>




                      <textarea




                        value={businessAddress}




                        onChange={(e) => setBusinessAddress(e.target.value)}




                        rows={3}




                        placeholder="Contoh: Jl. Raya Susukan Desa Karangjati RT. 02 RW. 02, Kec. Susukan Kab. Banjarnegara"




                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"




                      />




                    </div>




                  </div>




                </div>









                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">




                  <div className="flex items-center mb-4">




                    <div className="text-2xl mr-3">🖼️</div>




                    <div>




                      <h2 className="text-lg font-semibold text-gray-900">Logo, Tanda Tangan, & Watermark</h2>




                      <p className="text-sm text-gray-600">Digunakan di PO, invoice, dan struk.</p>




                    </div>




                  </div>









                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">




                    <ImageUpload




                      currentImageUrl={businessLogoUrl}




                      onImageUploaded={(url) => setBusinessLogoUrl(url)}




                      onUploadingChange={(uploading) =>




                        setProfileUploadCount((prev) => (uploading ? prev + 1 : Math.max(0, prev - 1)))




                      }




                      folder="logos"




                      userId={userId || ''}




                      label="Logo Bisnis (Header)"




                      aspectRatio="square"




                      enableCrop={true}




                    />




                    <ImageUpload




                      currentImageUrl={businessSignatureUrl}




                      onImageUploaded={(url) => setBusinessSignatureUrl(url)}




                      onUploadingChange={(uploading) =>




                        setProfileUploadCount((prev) => (uploading ? prev + 1 : Math.max(0, prev - 1)))




                      }




                      folder="signatures"




                      userId={userId || ''}




                      label="Tanda Tangan (Invoice/PO)"




                      aspectRatio="wide"




                      enableCrop={true}




                    />




                    <ImageUpload




                      currentImageUrl={businessWatermarkLogoUrl}




                      onImageUploaded={(url) => setBusinessWatermarkLogoUrl(url)}




                      onUploadingChange={(uploading) =>




                        setProfileUploadCount((prev) => (uploading ? prev + 1 : Math.max(0, prev - 1)))




                      }




                      folder="watermarks"




                      userId={userId || ''}




                      label="Logo Watermark (Invoice)"




                      aspectRatio="wide"




                      enableCrop={true}




                    />




                  </div>









                  <div className="mt-4 text-xs text-gray-500">




                    Watermark hanya digunakan untuk invoice. Tanda tangan muncul di invoice & PO.




                  </div>




                </div>









                <div className="flex gap-3">




                  <button




                    onClick={handleSave}




                    disabled={saving || profileUploadCount > 0}




                    className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"




                  >




                    {saving ? 'Menyimpan...' : profileUploadCount > 0 ? 'Menunggu upload...' : 'Simpan Profil Bisnis'}




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









            {/* Financial Tab Content */}






        {activeTab === 'finance' && (






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






                Tetapkan batas maksimal <strong>kas keluar</strong> per hari. Transaksi <strong>tempo</strong> tidak mengurangi kas sampai Anda benar-benar membayar.






                Notifikasi akan muncul saat kas keluar mendekati limit.






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













        {/* Financial Accounts (Cash & Bank) */}






        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">






          <div className="flex items-start gap-3 mb-4">






            <div className="p-2 bg-blue-100 rounded-lg">






              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">






                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 11h18M5 15h14M7 19h10" />






              </svg>






            </div>






            <div className="flex-1">






              <h2 className="text-lg font-semibold text-gray-900">Akun Keuangan (Kas & Bank)</h2>






              <p className="text-sm text-gray-600 mt-1">






                Atur daftar akun kas dan bank sebagai wadah transaksi masuk/keluar.






              </p>






            </div>






          </div>













          <div className="text-center py-8 text-gray-500">






            <div className="text-5xl mb-3">≡ƒÅª</div>






            <p className="text-sm">Konfigurasi akun kas/bank akan tersedia di tahap berikutnya.</p>






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






                    ROI = ((Revenue - Expenses) / Expenses) ├ù 100%






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













        {/* Branding Tab Content */}






        {activeTab === 'branding' && (






          <>






            {/* Dashboard Layout */}






            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">






              <div className="flex items-center mb-4">






                <div className="text-2xl mr-3">≡ƒôè</div>






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






                <div className="text-2xl mr-3">≡ƒÄ¿</div>






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













        {/* Operations Tab Content */}






        {activeTab === 'operations' && (






          <>






            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">






              <div className="flex items-center mb-4">






                <div className="text-2xl mr-3">≡ƒº⌐</div>






                <div>






                  <h2 className="text-lg font-semibold text-gray-900">Operasional</h2>






                  <p className="text-sm text-gray-600">Kontrol modul produk, stok, produksi, dan relasi bisnis</p>






                </div>






              </div>













              <div className="text-center py-10 text-gray-500">






                <div className="text-5xl mb-3">≡ƒÜº</div>






                <p className="text-sm">Akan diaktifkan setelah konfigurasi tipe usaha selesai.</p>






              </div>






            </div>






          </>






        )}













        {/* Notifications Tab Content */}






        {activeTab === 'notifications' && (






          <>






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













        {/* Security Tab Content */}






        {activeTab === 'security' && (






          <>






            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">






              <div className="flex items-center mb-4">






                <div className="text-2xl mr-3">≡ƒöÆ</div>






                <div>






                  <h2 className="text-lg font-semibold text-gray-900">Akun & Keamanan</h2>






                  <p className="text-sm text-gray-600">Pengaturan keamanan dan akses akun</p>






                </div>






              </div>













              <div className="text-center py-10 text-gray-500">






                <div className="text-5xl mb-3">≡ƒÜº</div>






                <p className="text-sm">Akan diaktifkan setelah konfigurasi UI selesai.</p>






              </div>






            </div>













            <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">






              <h2 className="text-xl font-semibold text-red-700">ΓÜá∩╕Å Reset Data Terpilih</h2>






              <p className="text-sm text-gray-600 mt-1">






                Hapus permanen data tertentu tanpa menghapus akun.






              </p>













              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">






                {[






                  { key: 'customers', label: 'Pelanggan' },






                  { key: 'suppliers', label: 'Pemasok' },






                  { key: 'transactions', label: 'Transaksi Penjualan' },






                  { key: 'products', label: 'Produk & Inventori' },






                  { key: 'incomes', label: 'Pendapatan Manual' },






                  { key: 'expenses', label: 'Pengeluaran' },






                  { key: 'lapak_orders', label: 'Order Lapak' },






                ].map((item) => (






                  <label key={item.key} className="flex items-center gap-2 text-sm text-gray-800">






                    <input






                      type="checkbox"






                      checked={Boolean(resetTargets[item.key])}






                      onChange={() => toggleResetTarget(item.key)}






                      className="w-4 h-4 rounded border-gray-300"






                    />






                    <span>{item.label}</span>






                  </label>






                ))}






              </div>













              <div className="mt-4">






                <label className="block text-sm font-medium text-gray-700 mb-1">






                  Ketik <span className="font-bold">HAPUS</span> untuk konfirmasi






                </label>






                <input






                  value={resetConfirmation}






                  onChange={(e) => setResetConfirmation(e.target.value)}






                  placeholder="HAPUS"






                  className="w-full sm:max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"






                />






              </div>













              <button






                onClick={handleResetData}






                disabled={resetLoading}






                className="mt-4 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:bg-gray-400"






              >






                {resetLoading ? 'Memproses...' : 'Hapus Data Terpilih'}






              </button>













              <button






                onClick={handlePreviewResetImpact}






                disabled={previewLoading}






                className="mt-4 ml-0 sm:ml-3 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors disabled:bg-gray-100 disabled:text-gray-500"






              >






                {previewLoading ? 'Menghitung...' : 'Preview Dampak'}






              </button>













              {resetPreviewReport.length > 0 && (






                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">






                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Ringkasan Dampak Reset</h3>






                  <div className="space-y-1.5 text-sm">






                    {resetPreviewReport.map((row) => (






                      <div key={row.scope} className="flex items-start justify-between gap-3">






                        <span className="font-medium text-gray-800">{row.scope}</span>






                        <span className={row.ok ? 'text-gray-700' : 'text-red-700'}>{row.detail || '-'}</span>






                      </div>






                    ))}






                  </div>






                </div>






              )}






            </div>













            <div className="bg-white rounded-lg shadow-sm border border-red-300 p-6">






              <h2 className="text-xl font-semibold text-red-700">≡ƒº¿ Reset Total Platform (Mode Uji Coba)</h2>






              <p className="text-sm text-gray-600 mt-1">






                Mengembalikan platform seperti awal (hapus seluruh data operasional), tetapi akun/login tetap aman.






              </p>













              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">






                Gunakan fitur ini hanya untuk skenario testing. Untuk mencegah salah klik, wajib ketik <strong>RESET SEMUA</strong>.






              </div>













              <div className="mt-4">






                <label className="block text-sm font-medium text-gray-700 mb-1">






                  Ketik <span className="font-bold">RESET SEMUA</span> untuk konfirmasi






                </label>






                <input






                  value={fullResetConfirmation}






                  onChange={(e) => setFullResetConfirmation(e.target.value)}






                  placeholder="RESET SEMUA"






                  className="w-full sm:max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"






                />






              </div>













              <div className="mt-4 flex flex-wrap gap-3">






                <button






                  onClick={handlePreviewFullReset}






                  disabled={fullResetPreviewLoading}






                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors disabled:bg-gray-100 disabled:text-gray-500"






                >






                  {fullResetPreviewLoading ? 'Menghitung...' : 'Preview Reset Total'}






                </button>






                <button






                  onClick={handleFullPlatformReset}






                  disabled={fullResetLoading}






                  className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white font-medium rounded-lg transition-colors disabled:bg-gray-400"






                >






                  {fullResetLoading ? 'Memproses...' : 'Reset Total Platform'}






                </button>






              </div>













              {fullResetPreviewReport.length > 0 && (






                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">






                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Ringkasan Dampak Reset Total</h3>






                  <div className="space-y-1.5 text-sm">






                    {fullResetPreviewReport.map((row) => (






                      <div key={row.scope} className="flex items-start justify-between gap-3">






                        <span className="font-medium text-gray-800">{row.scope}</span>






                        <span className={row.ok ? 'text-gray-700' : 'text-red-700'}>{row.detail || '-'}</span>






                      </div>






                    ))}






                  </div>






                </div>






              )}






            </div>






          </>






        )}






          </div>






        </div>






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






              {toast.type === 'success' ? 'Γ£à' : 'Γ¥î'}






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






