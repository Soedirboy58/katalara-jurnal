'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, CheckCircleIcon, LightBulbIcon } from '@heroicons/react/24/outline'
import { createClient } from '@/lib/supabase/client'
import { 
  classifyBusinessByKeywords, 
  getCategoryExplanation, 
  getDashboardFeatures,
  suggestTargets,
  validateDescription,
  BUSINESS_CATEGORIES,
  BUSINESS_CATEGORIES_ARRAY,
  type BusinessTypeMapping,
  type ClassificationResult
} from '@/lib/business-classifier'
import type { OnboardingWizardData, OnboardingStep } from '@/types/business-config'

interface OnboardingWizardProps {
  onComplete: () => void
  userId: string
}

export function OnboardingWizard({ onComplete, userId }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [mappings, setMappings] = useState<BusinessTypeMapping[]>([])
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null)
  
  const [formData, setFormData] = useState<Partial<OnboardingWizardData>>({
    businessCategory: '',
    businessDescription: '',
    classificationMethod: 'manual',
    classificationConfidence: 0,
    monthlyRevenueTarget: 0,
    profitMarginTarget: 25,
    breakEvenMonths: 12,
    initialCapital: 0,
    monthlyOperationalCost: 0,
    minimumCashAlert: 0,
    enableEmailAlerts: true,
    enableStockAlerts: true,
    enableWeeklySummary: true,
  })

  const supabase = createClient()

  // Load business type mappings
  useEffect(() => {
    async function loadMappings() {
      const { data } = await supabase
        .from('business_type_mappings')
        .select('*')
      if (data) setMappings(data)
    }
    loadMappings()
  }, [])

  const handleAnalyzeDescription = () => {
    const validation = validateDescription(formData.businessDescription || '')
    if (!validation.valid) {
      alert(validation.message)
      return
    }

    setIsAnalyzing(true)
    setTimeout(() => {
      const result = classifyBusinessByKeywords(formData.businessDescription || '', mappings)
      setClassificationResult(result)
      if (result.confidence > 0.5) {
        setFormData(prev => ({
          ...prev,
          businessCategory: result.category,
          classificationMethod: result.method,
          classificationConfidence: result.confidence
        }))
      }
      setIsAnalyzing(false)
      setCurrentStep(1)
    }, 1000)
  }

  const handleCategorySelect = (category: string) => {
    setFormData(prev => ({
      ...prev,
      businessCategory: category,
      classificationMethod: 'manual',
      classificationConfidence: 1
    }))
    setCurrentStep(1)
  }

  const calculateMinimumCash = () => {
    const operationalCost = formData.monthlyOperationalCost || 0
    return operationalCost * 2 // 2x monthly operational as buffer
  }

  const handleNext = () => {
    if (currentStep === 2 && !formData.minimumCashAlert) {
      setFormData(prev => ({
        ...prev,
        minimumCashAlert: calculateMinimumCash()
      }))
    }
    setCurrentStep((prev) => Math.min(prev + 1, 5) as OnboardingStep)
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0) as OnboardingStep)
  }

  const handleComplete = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('business_configurations')
        .upsert({
          user_id: userId,
          business_category: formData.businessCategory,
          business_description: formData.businessDescription,
          classification_method: formData.classificationMethod,
          classification_confidence: formData.classificationConfidence,
          monthly_revenue_target: formData.monthlyRevenueTarget,
          profit_margin_target: formData.profitMarginTarget,
          break_even_months: formData.breakEvenMonths,
          initial_capital: formData.initialCapital,
          monthly_operational_cost: formData.monthlyOperationalCost,
          minimum_cash_alert: formData.minimumCashAlert,
          enable_email_alerts: formData.enableEmailAlerts,
          enable_stock_alerts: formData.enableStockAlerts,
          enable_weekly_summary: formData.enableWeeklySummary,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          onboarding_step: 5
        })

      if (error) throw error
      onComplete()
    } catch (error) {
      console.error('Error saving configuration:', error)
      alert('Gagal menyimpan konfigurasi. Silakan coba lagi.')
    } finally {
      setIsSaving(false)
    }
  }

  const progress = ((currentStep) / 5) * 100

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Progress Bar */}
        <div className="h-2 bg-gray-200">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Step 0: Welcome */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-400 rounded-full mb-4">
                  <span className="text-3xl">🎉</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Selamat Datang di Katalara!</h2>
                <p className="text-gray-600">Platform yang akan membantu bisnis Anda tumbuh lebih cepat</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-4">
                <h3 className="font-semibold text-blue-900">Platform ini akan membantu Anda:</h3>
                <ul className="space-y-2 text-blue-800">
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Memantau kesehatan finansial bisnis secara real-time</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Mengetahui produk/layanan mana yang paling menguntungkan</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Menghindari kehabisan stok atau modal</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Mendapat insight dan rekomendasi untuk tumbuh lebih cepat</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center text-gray-700">
                  <LightBulbIcon className="h-5 w-5 mr-2 text-yellow-500" />
                  <div>
                    <p className="font-medium">Proses setup: 5 menit</p>
                    <p className="text-sm text-gray-600">Semakin lengkap data Anda, semakin akurat analisis yang kami berikan</p>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">
                  ✅ Kami akan memandu langkah demi langkah<br />
                  ❌ Tidak ada tombol "Lewati" - Setup wajib lengkap
                </p>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl"
                >
                  Mulai Setup Bisnis Saya →
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Business Type Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Apa Jenis Bisnis Anda?</h2>
                <p className="text-gray-600">Pilih kategori yang paling sesuai dengan bisnis Anda</p>
              </div>

              {/* Manual Selection with Radio Buttons */}
              <div className="space-y-3">
                {BUSINESS_CATEGORIES_ARRAY.map((category: string) => (
                  <button
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                      formData.businessCategory === category
                        ? 'border-blue-600 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 mt-1 w-5 h-5 rounded-full border-2 ${
                        formData.businessCategory === category
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300'
                      } flex items-center justify-center`}>
                        {formData.businessCategory === category && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="font-semibold text-gray-900">{category}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {getCategoryExplanation(category)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* OR Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">ATAU</span>
                </div>
              </div>

              {/* Auto-Classify Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
                <div className="flex items-start mb-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-xl">💡</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-900">Tidak Yakin Kategori Anda?</h3>
                    <p className="text-sm text-gray-600 mt-1">Jelaskan bisnis Anda, biar sistem yang menganalisis</p>
                  </div>
                </div>
                
                <textarea
                  value={formData.businessDescription || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessDescription: e.target.value }))}
                  placeholder="Contoh: Saya jual beras, minyak goreng, dan sembako lainnya di warung kecil..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
                
                <button
                  onClick={handleAnalyzeDescription}
                  disabled={isAnalyzing || !formData.businessDescription || (formData.businessDescription?.length || 0) < 10}
                  className="mt-3 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  {isAnalyzing ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Menganalisis...
                    </span>
                  ) : '🔍 Analisis Bisnis Saya'}
                </button>

                {formData.businessDescription && (formData.businessDescription?.length || 0) < 10 && (
                  <p className="text-xs text-red-600 mt-2">⚠️ Minimal 10 karakter untuk analisis akurat</p>
                )}
              </div>

              {/* Classification Result */}
              {classificationResult && classificationResult.confidence > 0.5 && (
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-5 animate-fadeIn">
                  <div className="flex items-start">
                    <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-green-900 text-lg">🎯 Hasil Analisis</h3>
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-semibold">
                          {Math.round(classificationResult.confidence * 100)}% Akurat
                        </span>
                      </div>
                      <p className="text-green-900 font-semibold mt-2 text-lg">{classificationResult.category}</p>
                      {classificationResult.reasoning && (
                        <p className="text-sm text-green-700 mt-2">{classificationResult.reasoning}</p>
                      )}
                      {classificationResult.matchedKeywords && classificationResult.matchedKeywords.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-green-600 mb-1">Kata kunci terdeteksi:</p>
                          <div className="flex flex-wrap gap-1">
                            {classificationResult.matchedKeywords.slice(0, 5).map((keyword: string, idx: number) => (
                              <span key={idx} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => {
                            setFormData(prev => ({ ...prev, businessCategory: classificationResult.category }))
                            setClassificationResult(null)
                          }}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-all"
                        >
                          ✓ Ya, Benar
                        </button>
                        <button
                          onClick={() => setClassificationResult(null)}
                          className="flex-1 px-4 py-2 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50 font-semibold transition-all"
                        >
                          ✗ Salah, Pilih Manual
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                <button
                  onClick={handleBack}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                >
                  ← Kembali
                </button>
                <button
                  onClick={handleNext}
                  disabled={!formData.businessCategory}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  Lanjut ke Target →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Targets & Goals */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tentukan Target Bisnis</h2>
                <p className="text-gray-600">Target yang realistis membantu Anda fokus dan terukur</p>
              </div>

              {/* Educational Info Box */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-semibold text-yellow-900">Kenapa Target Penting?</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Target membantu Anda mengukur kesehatan bisnis, mendeteksi masalah lebih cepat, dan membuat keputusan berdasarkan data.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                {/* Monthly Revenue Target */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Target Penjualan per Bulan
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                    <input
                      type="number"
                      value={formData.monthlyRevenueTarget || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, monthlyRevenueTarget: Number(e.target.value) }))}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      placeholder="10000000"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">💡 Contoh: Rp 10.000.000 untuk warung sembako</p>
                </div>

                {/* Profit Margin Target */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Target Profit Margin (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.profitMarginTarget || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, profitMarginTarget: Number(e.target.value) }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      placeholder="25"
                      min="1"
                      max="100"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                  </div>
                  {formData.businessCategory && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800">
                        <strong>💡 Benchmark untuk {formData.businessCategory}:</strong><br />
                        {suggestTargets(formData.businessCategory).profitMarginRange}
                      </p>
                    </div>
                  )}
                </div>

                {/* Break Even Target */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Target Balik Modal (bulan)
                  </label>
                  <input
                    type="number"
                    value={formData.breakEvenMonths || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, breakEvenMonths: Number(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    placeholder="12"
                    min="1"
                    max="60"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">💡 Rata-rata bisnis UMKM: 12-18 bulan</p>
                </div>
              </div>

              {/* Summary Preview */}
              {formData.monthlyRevenueTarget && formData.profitMarginTarget && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">📈 Preview Target Anda:</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Penjualan/bulan:</p>
                      <p className="font-semibold text-gray-900">Rp {formData.monthlyRevenueTarget.toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Profit/bulan (estimasi):</p>
                      <p className="font-semibold text-green-600">
                        Rp {Math.round(formData.monthlyRevenueTarget * (formData.profitMarginTarget / 100)).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                <button
                  onClick={handleBack}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                >
                  ← Kembali
                </button>
                <button
                  onClick={handleNext}
                  disabled={!formData.monthlyRevenueTarget || !formData.profitMarginTarget || !formData.breakEvenMonths}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  Lanjut ke Keuangan →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Capital & Finance */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Modal & Keuangan</h2>
                <p className="text-gray-600">Bantu kami memahami kondisi keuangan bisnis Anda</p>
              </div>

              {/* Educational Info Box */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-semibold text-green-900">Cash Flow adalah Raja!</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Lebih dari 80% bisnis gagal karena cash flow buruk, bukan karena tidak laku. Data ini membantu sistem monitoring kas Anda.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                {/* Initial Capital */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Modal Awal Usaha
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                    <input
                      type="number"
                      value={formData.initialCapital || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, initialCapital: Number(e.target.value) }))}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      placeholder="50000000"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">💡 Termasuk: Stok awal, peralatan, renovasi, sewa awal</p>
                </div>

                {/* Monthly Operational Cost */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Biaya Operasional per Bulan
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                    <input
                      type="number"
                      value={formData.monthlyOperationalCost || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, monthlyOperationalCost: Number(e.target.value) }))}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      placeholder="8000000"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">💡 Termasuk: Gaji karyawan, sewa, listrik, transport, dll</p>
                </div>

                {/* Minimum Cash Alert */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Batas Kas Minimum (Alert Threshold)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                    <input
                      type="number"
                      value={formData.minimumCashAlert || calculateMinimumCash()}
                      onChange={(e) => setFormData(prev => ({ ...prev, minimumCashAlert: Number(e.target.value) }))}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      placeholder={calculateMinimumCash().toString()}
                    />
                  </div>
                  {formData.monthlyOperationalCost && (
                    <div className="mt-2 flex items-start gap-2">
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, minimumCashAlert: calculateMinimumCash() }))}
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 font-medium"
                      >
                        Auto-Fill (2x Operasional)
                      </button>
                      <p className="text-xs text-gray-500 flex-1">
                        💡 Rekomendasi: Rp {calculateMinimumCash().toLocaleString('id-ID')} <br />
                        (2x biaya operasional untuk safety buffer)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Health Check */}
              {formData.initialCapital && formData.monthlyOperationalCost && formData.monthlyRevenueTarget && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">📊 Health Check Keuangan:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Runway Modal:</span>
                      <span className="font-semibold text-gray-900">
                        {Math.floor(formData.initialCapital / formData.monthlyOperationalCost)} bulan
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Break-even Point:</span>
                      <span className="font-semibold text-gray-900">
                        Rp {formData.monthlyOperationalCost.toLocaleString('id-ID')}/bulan
                      </span>
                    </div>
                    {formData.monthlyRevenueTarget > formData.monthlyOperationalCost ? (
                      <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded mt-2">
                        <CheckCircleIcon className="h-4 w-4" />
                        <span className="text-xs font-semibold">Target revenue mencukupi operasional! 👍</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded mt-2">
                        <span className="text-xs font-semibold">⚠️ Target revenue di bawah biaya operasional</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                <button
                  onClick={handleBack}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                >
                  ← Kembali
                </button>
                <button
                  onClick={handleNext}
                  disabled={!formData.initialCapital || !formData.monthlyOperationalCost || !formData.minimumCashAlert}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  Lanjut ke Produk →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Products/Services - Skip for Now */}
          {currentStep === 4 && (
            <div className="space-y-6 text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full mb-4">
                <span className="text-4xl">📦</span>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Produk & Layanan</h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  Anda bisa menambahkan produk atau layanan nanti di menu <strong>Dashboard → Produk</strong>
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto text-left">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tips:</strong> Tambahkan produk setelah setup selesai agar bisa:<br />
                  • Tracking stok otomatis<br />
                  • Analisis produk terlaris<br />
                  • Hitung profit per produk<br />
                  • Alert stok minimum
                </p>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-center gap-4 pt-6">
                <button
                  onClick={handleBack}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                >
                  ← Kembali
                </button>
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 font-semibold transition-all shadow-lg hover:shadow-xl"
                >
                  Lanjut ke Review →
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Review & Complete */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Hampir Selesai!</h2>
                <p className="text-gray-600">Review konfigurasi bisnis Anda</p>
              </div>

              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Tipe Bisnis</p>
                      <p className="font-semibold text-gray-900">{formData.businessCategory}</p>
                    </div>
                    <button onClick={() => setCurrentStep(1)} className="text-blue-600 text-sm hover:underline">
                      Edit
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Target & Goal</p>
                      <p className="font-semibold text-gray-900">
                        Rp {formData.monthlyRevenueTarget?.toLocaleString('id-ID')}/bulan • {formData.profitMarginTarget}%
                      </p>
                    </div>
                    <button onClick={() => setCurrentStep(2)} className="text-blue-600 text-sm hover:underline">
                      Edit
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Modal & Keuangan</p>
                      <p className="font-semibold text-gray-900">
                        Modal: Rp {formData.initialCapital?.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <button onClick={() => setCurrentStep(3)} className="text-blue-600 text-sm hover:underline">
                      Edit
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 Tenang, semua bisa diubah kapan saja di menu Pengaturan
                </p>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  ← Kembali
                </button>
                <button
                  onClick={handleComplete}
                  disabled={isSaving}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan...' : 'Selesai & Mulai! 🚀'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
