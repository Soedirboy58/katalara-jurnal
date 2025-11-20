// ============================================================================
// COMPONENT: Bug Report Button (Quick Action)
// ============================================================================
// Floating action button untuk report bug dari halaman manapun
// ============================================================================

'use client'

import { useState } from 'react'
import { X, Bug, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function BugReportButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'bug',
    severity: 'medium',
    user_email: '',
    user_phone: '',
    user_name: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      // Get browser info
      const browserInfo = navigator.userAgent
      const pageUrl = window.location.href
      
      // Detect device type
      const deviceInfo = /Mobile|Android|iPhone/i.test(navigator.userAgent) 
        ? 'mobile' 
        : /Tablet|iPad/i.test(navigator.userAgent)
        ? 'tablet'
        : 'desktop'

      const response = await fetch('/api/bug-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          page_url: pageUrl,
          browser_info: browserInfo,
          device_info: deviceInfo
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSubmitStatus('success')
        // Reset form after 2 seconds
        setTimeout(() => {
          setFormData({
            title: '',
            description: '',
            category: 'bug',
            severity: 'medium',
            user_email: '',
            user_phone: '',
            user_name: ''
          })
          setIsOpen(false)
          setSubmitStatus('idle')
        }, 2000)
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Error submitting bug report:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
        title="Laporkan Bug / Feedback"
      >
        <Bug className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
          !
        </span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-red-500 to-orange-500 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">🐛 Laporkan Bug / Feedback</h2>
                  <p className="text-red-100 text-sm">
                    Bantu kami meningkatkan Katalara dengan laporan Anda
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Success Message */}
            {submitStatus === 'success' && (
              <div className="mx-6 mt-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">Terima kasih! ✨</h3>
                  <p className="text-sm text-green-700">
                    Laporan Anda telah diterima. Kami akan segera menindaklanjuti.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {submitStatus === 'error' && (
              <div className="mx-6 mt-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Gagal mengirim laporan</h3>
                  <p className="text-sm text-red-700">
                    Terjadi kesalahan. Silakan coba lagi atau hubungi admin.
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Category & Severity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kategori
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value="bug">🐛 Bug / Error</option>
                    <option value="feature_request">💡 Request Fitur Baru</option>
                    <option value="feedback">💬 Feedback / Saran</option>
                    <option value="complaint">⚠️ Keluhan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tingkat Keparahan
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="low">🟢 Rendah</option>
                    <option value="medium">🟡 Sedang</option>
                    <option value="high">🟠 Tinggi</option>
                    <option value="critical">🔴 Kritis</option>
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Judul Laporan *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="ex: Tombol simpan tidak berfungsi di halaman input pengeluaran"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Deskripsi Detail *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Jelaskan masalah atau feedback Anda secara detail:&#10;- Apa yang terjadi?&#10;- Apa yang seharusnya terjadi?&#10;- Langkah-langkah untuk reproduksi masalah?"
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-gray-900"
                  required
                />
              </div>

              {/* Contact Info (Optional) */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">
                  📞 Kontak (Opsional - untuk follow up)
                </h3>
                
                <div className="space-y-3">
                  <input
                    type="text"
                    value={formData.user_name}
                    onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                    placeholder="Nama Anda"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  
                  <input
                    type="email"
                    value={formData.user_email}
                    onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                    placeholder="Email Anda"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  
                  <input
                    type="tel"
                    value={formData.user_phone}
                    onChange={(e) => setFormData({ ...formData, user_phone: e.target.value })}
                    placeholder="Nomor WhatsApp"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                <div className="text-2xl flex-shrink-0">ℹ️</div>
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Informasi teknis otomatis tercatat:</p>
                  <ul className="list-disc list-inside text-blue-700 space-y-1">
                    <li>Halaman saat ini: <code className="bg-blue-100 px-1 rounded text-xs">{typeof window !== 'undefined' ? window.location.pathname : ''}</code></li>
                    <li>Browser & Device info</li>
                    <li>Timestamp</li>
                  </ul>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting || submitStatus === 'success'}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Mengirim...
                    </>
                  ) : submitStatus === 'success' ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Terkirim!
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Kirim Laporan
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  )
}
