'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QRCodeSVG } from 'qrcode.react'
import { 
  CogIcon, 
  BuildingStorefrontIcon,
  MapPinIcon,
  ClockIcon,
  PhoneIcon,
  GlobeAltIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline'

export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')
  
  // Store Settings
  const [storeLocation, setStoreLocation] = useState('')
  const [storeHours, setStoreHours] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  
  // QR Code
  const [showQR, setShowQR] = useState(false)
  const [storeUrl, setStoreUrl] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUserId(user.id)
        setStoreUrl(`${window.location.origin}/store/${user.id}`)

        const { data: config } = await supabase
          .from('business_configurations')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (config) {
          setStoreLocation(config.store_location || '')
          setStoreHours(config.store_hours || '')
          setWhatsappNumber(config.whatsapp_number || '')
          setPhoneNumber(config.phone_number || '')
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const { error } = await supabase
        .from('business_configurations')
        .upsert({
          user_id: userId,
          store_location: storeLocation,
          store_hours: storeHours,
          whatsapp_number: whatsappNumber,
          phone_number: phoneNumber,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error

      alert('✅ Pengaturan berhasil disimpan!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('❌ Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    canvas.width = 1024
    canvas.height = 1024

    img.onload = () => {
      ctx!.fillStyle = 'white'
      ctx!.fillRect(0, 0, canvas.width, canvas.height)
      ctx!.drawImage(img, 0, 0)
      
      const pngFile = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.download = 'Lapak-QRCode.png'
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <CogIcon className="w-8 h-8" />
          Pengaturan
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Kelola pengaturan bisnis dan lapak online Anda
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <BuildingStorefrontIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Lapak Online</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPinIcon className="w-4 h-4 inline mr-1" />
                Lokasi Toko
              </label>
              <input
                type="text"
                placeholder="Jl. Contoh No. 123, Jakarta"
                value={storeLocation}
                onChange={(e) => setStoreLocation(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Alamat lengkap toko yang akan ditampilkan di lapak online
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ClockIcon className="w-4 h-4 inline mr-1" />
                Jam Operasional
              </label>
              <input
                type="text"
                placeholder="Senin-Sabtu: 08:00 - 20:00"
                value={storeHours}
                onChange={(e) => setStoreHours(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Jam buka toko untuk informasi customer
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <PhoneIcon className="w-4 h-4 inline mr-1" />
                Nomor WhatsApp
              </label>
              <input
                type="tel"
                placeholder="628123456789"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: 628xxx (tanpa tanda +). Untuk tombol "Pesan via WhatsApp"
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <PhoneIcon className="w-4 h-4 inline mr-1" />
                Nomor Telepon (Opsional)
              </label>
              <input
                type="tel"
                placeholder="021-12345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:bg-gray-400"
            >
              {saving ? 'Menyimpan...' : '💾 Simpan Pengaturan'}
            </button>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-sm border border-purple-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <QrCodeIcon className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">QR Code Lapak</h2>
          </div>

          <div className="bg-white rounded-lg p-6 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <GlobeAltIcon className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Link Lapak Online Anda:</h3>
            </div>
            <a 
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 break-all underline"
            >
              {storeUrl}
            </a>
          </div>

          {!showQR ? (
            <button
              onClick={() => setShowQR(true)}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              🎯 Generate QR Code
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-lg flex justify-center">
                <div id="qr-code-container">
                  <QRCodeSVG
                    id="qr-code-svg"
                    value={storeUrl}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={downloadQR}
                  className="py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors text-sm"
                >
                  📥 Download PNG
                </button>
                <button
                  onClick={() => window.print()}
                  className="py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors text-sm"
                >
                  🖨️ Print
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-semibold">💡 Tips Penggunaan QR Code:</span>
                </p>
                <ul className="text-xs text-gray-600 mt-2 space-y-1 ml-4 list-disc">
                  <li>Cetak dan pajang di toko fisik Anda</li>
                  <li>Posting di media sosial (Instagram, Facebook)</li>
                  <li>Tambahkan ke kartu nama & brosur</li>
                  <li>Customer scan → langsung ke katalog online</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h3 className="text-lg font-bold mb-2">🚀 Fitur Lapak Online</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <span>✅</span>
            <span>Katalog produk dengan harga real-time</span>
          </div>
          <div className="flex items-start gap-2">
            <span>✅</span>
            <span>Tombol pesan via WhatsApp otomatis</span>
          </div>
          <div className="flex items-start gap-2">
            <span>✅</span>
            <span>Sinkronisasi stok dengan inventory</span>
          </div>
          <div className="flex items-start gap-2">
            <span>✅</span>
            <span>Tampilan mobile-friendly & profesional</span>
          </div>
        </div>
      </div>
    </div>
  )
}
