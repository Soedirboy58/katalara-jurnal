'use client'

import BugReportButton from '@/components/BugReportButton'
import { useState } from 'react'

export const dynamic = 'force-dynamic'

export default function HelpPage() {
  const [showBugReport, setShowBugReport] = useState(false)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bantuan & Support</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Panduan lengkap dan dukungan untuk memaksimalkan penggunaan platform
        </p>
      </div>

      {/* Bug Report Banner - Prominent */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-6 mb-8 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <div className="text-4xl">🐛</div>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">Laporkan Bug atau Kirim Feedback</h2>
            <p className="text-white/90 mb-4">
              Bantu kami meningkatkan platform dengan melaporkan masalah atau memberikan saran. 
              Setiap laporan sangat berarti bagi kami!
            </p>
            <button
              onClick={() => setShowBugReport(true)}
              className="bg-white text-orange-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
            >
              <span>🐛</span>
              Laporkan Bug / Feedback
            </button>
          </div>
        </div>
      </div>

      {/* Bug Report Modal - Conditionally Rendered */}
      {showBugReport && (
        <div onClick={() => setShowBugReport(false)}>
          <BugReportButton />
        </div>
      )}

      {/* Quick Support Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <a href="#faq" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="text-3xl mb-3">❓</div>
          <h3 className="font-semibold text-gray-900 mb-1">FAQ</h3>
          <p className="text-sm text-gray-600">Pertanyaan umum & jawaban</p>
        </a>
        <a href="#tutorial" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="text-3xl mb-3">📚</div>
          <h3 className="font-semibold text-gray-900 mb-1">Tutorial</h3>
          <p className="text-sm text-gray-600">Panduan step-by-step</p>
        </a>
        <a href="#contact" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="text-3xl mb-3">💬</div>
          <h3 className="font-semibold text-gray-900 mb-1">Live Chat</h3>
          <p className="text-sm text-gray-600">Chat dengan support</p>
        </a>
        <a href="#video" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="text-3xl mb-3">🎥</div>
          <h3 className="font-semibold text-gray-900 mb-1">Video Tutorial</h3>
          <p className="text-sm text-gray-600">Belajar melalui video</p>
        </a>
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cari Jawaban</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Ketik pertanyaan Anda... (misal: 'cara tambah produk')"
            className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Cari
          </button>
        </div>
      </div>

      {/* FAQ Section */}
      <div id="faq" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          {/* FAQ Item */}
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="font-medium text-gray-900">Bagaimana cara menambah produk baru?</span>
              <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="mt-2 p-4 text-sm text-gray-700 leading-relaxed">
              1. Buka menu <strong>Produk Saya</strong> di sidebar<br />
              2. Klik tombol <strong>+ Tambah Produk</strong><br />
              3. Isi informasi produk (nama, harga, stok, dll)<br />
              4. Klik <strong>Simpan</strong>
            </div>
          </details>

          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="font-medium text-gray-900">Bagaimana cara input transaksi penjualan?</span>
              <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="mt-2 p-4 text-sm text-gray-700 leading-relaxed">
              1. Klik menu <strong>Input Penjualan</strong> di sidebar<br />
              2. Pilih tanggal dan produk yang terjual<br />
              3. Masukkan jumlah dan metode pembayaran<br />
              4. Klik <strong>Simpan Transaksi</strong><br />
              Data akan otomatis masuk ke laporan dan dashboard Anda.
            </div>
          </details>

          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="font-medium text-gray-900">Apa maksud Business Health Score?</span>
              <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="mt-2 p-4 text-sm text-gray-700 leading-relaxed">
              Business Health Score adalah nilai 0-100 yang menunjukkan kesehatan bisnis Anda berdasarkan 4 aspek:
              <ul className="list-disc ml-5 mt-2">
                <li><strong>Cash Flow Health:</strong> Kesehatan arus kas</li>
                <li><strong>Profitability:</strong> Tingkat keuntungan</li>
                <li><strong>Growth:</strong> Pertumbuhan bisnis</li>
                <li><strong>Efficiency:</strong> Efisiensi operasional</li>
              </ul>
              Score dihitung otomatis dari 20+ metrik finansial bisnis Anda.
            </div>
          </details>

          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="font-medium text-gray-900">Bagaimana cara tracking piutang pelanggan?</span>
              <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="mt-2 p-4 text-sm text-gray-700 leading-relaxed">
              1. Buka menu <strong>Pelanggan</strong><br />
              2. Tambahkan data pelanggan terlebih dahulu<br />
              3. Saat input penjualan, pilih metode pembayaran <strong>"Kredit/Tempo"</strong><br />
              4. Set tanggal jatuh tempo<br />
              5. Sistem akan mengirim alert saat mendekati jatuh tempo
            </div>
          </details>

          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="font-medium text-gray-900">Apakah data saya aman?</span>
              <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="mt-2 p-4 text-sm text-gray-700 leading-relaxed">
              Ya, sangat aman! Platform ini menggunakan:
              <ul className="list-disc ml-5 mt-2">
                <li>Enkripsi SSL/TLS untuk semua data</li>
                <li>Database Supabase dengan security enterprise-grade</li>
                <li>Backup otomatis setiap hari</li>
                <li>Row Level Security (RLS) - data Anda hanya bisa diakses oleh Anda</li>
              </ul>
            </div>
          </details>
        </div>
      </div>

      {/* Contact Support */}
      <div id="contact" className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 sm:p-8 text-white mb-6">
        <h2 className="text-xl font-bold mb-2">Butuh Bantuan Lebih Lanjut?</h2>
        <p className="text-white/90 mb-4">
          Tim support kami siap membantu Anda!
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl mb-2">📧</div>
            <div className="font-semibold mb-1">Email Support</div>
            <a href="mailto:support@katalara.com" className="text-sm text-white/90 hover:text-white">
              support@katalara.com
            </a>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl mb-2">💬</div>
            <div className="font-semibold mb-1">WhatsApp</div>
            <a href="https://wa.me/62812345678" className="text-sm text-white/90 hover:text-white">
              +62 812-3456-7890
            </a>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl mb-2">⏰</div>
            <div className="font-semibold mb-1">Jam Operasional</div>
            <div className="text-sm text-white/90">
              Senin-Jumat<br />09:00 - 18:00 WIB
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started Guide */}
      <div id="tutorial" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Panduan Memulai</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Lengkapi Business Configuration</h3>
              <p className="text-sm text-gray-600">
                Isi target penjualan, modal, dan operasional cost untuk mendapatkan insights yang akurat
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Tambahkan Produk/Layanan</h3>
              <p className="text-sm text-gray-600">
                Input produk atau jasa yang Anda jual untuk memudahkan tracking penjualan
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Catat Setiap Transaksi</h3>
              <p className="text-sm text-gray-600">
                Input penjualan dan pengeluaran secara rutin untuk data yang akurat
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              4
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Monitor Dashboard & Insights</h3>
              <p className="text-sm text-gray-600">
                Review KPI dan AI-powered insights untuk optimasi bisnis Anda
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
