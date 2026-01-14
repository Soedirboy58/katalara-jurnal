'use client'

import { useEffect, useMemo, useState } from 'react'
import { buildIncomePdfFilename, generateIncomePdfBlob, type PrintMode } from '@/lib/pdf-generator'
import { buildWhatsAppUrl, normalizeWhatsAppPhone, type WhatsAppDocumentType } from '@/lib/whatsapp'

type Props = {
  isOpen: boolean
  onClose: () => void
  incomeData: any
  businessName: string
}

type ToastState = {
  show: boolean
  type: 'success' | 'error'
  message: string
}

function formatIdDate(value?: string) {
  const d = value ? new Date(value) : new Date()
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function PrintDocumentModal({ isOpen, onClose, incomeData, businessName }: Props) {
  const [mode, setMode] = useState<PrintMode>('receipt')

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [previewLoading, setPreviewLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [waLoading, setWaLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState>({ show: false, type: 'success', message: '' })

  const incomeDateValue =
    incomeData?.income_date ||
    incomeData?.transaction_date ||
    incomeData?.date ||
    incomeData?.created_at ||
    new Date().toISOString()

  const paymentStatus = incomeData?.payment_status || incomeData?.payment_status_label || 'Lunas'

  const customerName = useMemo(() => {
    if (incomeData?.customer_name) return incomeData.customer_name
    if (!incomeData?.customer_id || incomeData.customer_id === 'anonymous') return 'Umum / Walk-in'
    return 'Pelanggan'
  }, [incomeData?.customer_id, incomeData?.customer_name])

  useEffect(() => {
    if (!isOpen) return

    // Auto-suggest print mode: if customer has identity, default invoice.
    const customerId = (incomeData?.customer_id || '').toString()
    const cname = (incomeData?.customer_name || '').toString().toLowerCase()
    const isAnonymous =
      !customerId ||
      customerId === 'anonymous' ||
      cname.includes('walk-in') ||
      cname.includes('umum') ||
      cname === '-'

    const hasIdentity = !!(
      (!isAnonymous && incomeData?.customer_name) ||
      incomeData?.customer_phone ||
      incomeData?.customer_email ||
      incomeData?.customer_address
    )

    setMode(hasIdentity ? 'invoice' : 'receipt')
    setError(null)
    setPreviewOpen(false)
  }, [
    isOpen,
    incomeData?.customer_id,
    incomeData?.customer_name,
    incomeData?.customer_phone,
    incomeData?.customer_email,
    incomeData?.customer_address
  ])

  // Cleanup blob URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    if (!toast.show) return
    const t = setTimeout(() => setToast((s) => ({ ...s, show: false })), 2500)
    return () => clearTimeout(t)
  }, [toast.show])

  if (!isOpen) return null

  const business = useMemo(
    () => ({
      name: businessName || 'Katalara',
      // Optional fields (safe defaults). If later you store these in business_configurations,
      // just pass them down here.
      address: incomeData?.business_address || undefined,
      phone: incomeData?.business_phone || undefined,
      email: incomeData?.business_email || undefined,
      logoUrl: incomeData?.business_logo_url || undefined
    }),
    [businessName, incomeData?.business_address, incomeData?.business_phone, incomeData?.business_email, incomeData?.business_logo_url]
  )

  const runGenerateBlob = async (m: PrintMode) => {
    return await generateIncomePdfBlob({ mode: m, incomeData, business })
  }

  const showSuccess = (message: string) => setToast({ show: true, type: 'success', message })
  const showFailure = (message: string) => setToast({ show: true, type: 'error', message })

  const handlePreview = async () => {
    setError(null)
    setPreviewOpen(true)
    setPreviewLoading(true)

    try {
      const blob = await runGenerateBlob(mode)
      const url = URL.createObjectURL(blob)
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return url
      })
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Gagal membuat preview PDF')
      showFailure('Gagal membuat preview PDF')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleDownload = async () => {
    setError(null)
    setDownloadLoading(true)

    try {
      const blob = await runGenerateBlob(mode)
      const filename = buildIncomePdfFilename({ mode, incomeData })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)

      showSuccess('PDF berhasil diunduh')
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Gagal download PDF')
      showFailure('Gagal download PDF')
    } finally {
      setDownloadLoading(false)
    }
  }

  const handleSendWhatsApp = async () => {
    setError(null)

    const normalizedPhone = normalizeWhatsAppPhone(incomeData?.customer_phone || '')
    if (!normalizedPhone) {
      showFailure('Nomor WhatsApp tidak valid / kosong')
      setError('Nomor WhatsApp tidak valid / kosong')
      return
    }

    setWaLoading(true)

    try {
      const blob = await runGenerateBlob(mode)
      const filename = buildIncomePdfFilename({ mode, incomeData })

      const form = new FormData()
      form.append('filename', filename)
      form.append('file', new File([blob], filename, { type: 'application/pdf' }))

      const res = await fetch('/api/upload-pdf', { method: 'POST', body: form })
      const json = await res.json()

      if (!res.ok || !json?.ok || !json?.url) {
        throw new Error(json?.error || json?.details || 'Upload PDF gagal')
      }

      const docType: WhatsAppDocumentType = mode === 'receipt' ? 'struk' : 'invoice'
      const waUrl = buildWhatsAppUrl({
        phone: normalizedPhone,
        customerName,
        docType,
        pdfUrl: json.url
      })

      window.open(waUrl, '_blank', 'noopener,noreferrer')
      showSuccess('WhatsApp dibuka')
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Gagal kirim WhatsApp')
      showFailure('Gagal kirim WhatsApp')
    } finally {
      setWaLoading(false)
    }
  }

  const busy = previewLoading || downloadLoading || waLoading

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Toast */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-[80]">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold ${
              toast.type === 'success'
                ? 'bg-white border-green-200 text-gray-800'
                : 'bg-white border-red-200 text-gray-800'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Cetak Dokumen</h2>
              <p className="text-xs text-gray-900 mt-1">
                {customerName} • {formatIdDate(incomeDateValue)}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Tutup">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Format</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setMode('receipt')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  mode === 'receipt' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled={busy}
              >
                <div className="text-center">
                  <p className="font-semibold text-gray-900">Struk</p>
                  <p className="text-xs text-gray-700">80mm thermal</p>
                </div>
              </button>

              <button
                onClick={() => setMode('invoice')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  mode === 'invoice' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled={busy}
              >
                <div className="text-center">
                  <p className="font-semibold text-gray-900">Invoice</p>
                  <p className="text-xs text-gray-700">A4 format</p>
                </div>
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <div className="text-sm text-gray-800">
              Status: <span className="font-semibold">{paymentStatus}</span>
            </div>
            <div className="text-sm text-gray-800">
              Total:{' '}
              <span className="font-semibold">
                Rp {new Intl.NumberFormat('id-ID').format(incomeData?.grand_total ?? incomeData?.amount ?? incomeData?.total ?? 0)}
              </span>
            </div>
          </div>

          {error ? (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">{error}</div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 sticky bottom-0 -mx-6 px-4 sm:px-6 py-3 border-t border-gray-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-[0_-10px_30px_-20px_rgba(0,0,0,0.25)]">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handlePreview}
              disabled={busy}
              className="h-12 px-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {previewLoading ? 'Membuat…' : 'Preview'}
            </button>

            <button
              onClick={handleDownload}
              disabled={busy}
              className="h-12 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {downloadLoading ? 'Mengunduh…' : 'Download'}
            </button>

            <button
              onClick={handleSendWhatsApp}
              disabled={busy}
              className="col-span-2 h-12 px-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              title={!incomeData?.customer_phone ? 'Nomor customer kosong' : undefined}
            >
              {waLoading ? 'Menyiapkan WA…' : 'Kirim WA'}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Overlay */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]">
          <div className="min-h-screen flex flex-col items-center justify-start p-4 md:p-8">
            <div className="w-full max-w-4xl mb-4 flex items-center justify-between sticky top-4 z-10 gap-3">
              <button
                onClick={() => setPreviewOpen(false)}
                className="h-11 px-4 bg-white rounded-xl shadow-lg hover:bg-gray-100 flex items-center gap-2 font-semibold text-gray-900 border border-white/20"
              >
                Kembali
              </button>

              <button
                onClick={() => setPreviewOpen(false)}
                className="w-11 h-11 bg-red-600 text-white rounded-xl shadow-lg hover:bg-red-700 flex items-center justify-center"
                aria-label="Tutup"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
              {previewLoading && !previewUrl ? (
                <div className="w-full h-full flex items-center justify-center text-sm text-gray-600">Menyiapkan preview…</div>
              ) : previewUrl ? (
                <iframe title="PDF Preview" src={previewUrl} className="w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-gray-600">Preview tidak tersedia.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
