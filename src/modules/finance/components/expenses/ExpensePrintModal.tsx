'use client'

import { useEffect, useMemo, useState } from 'react'
import jsPDF from 'jspdf'
import { getPaymentMethodLabel } from '@/modules/finance/types/financeTypes'

interface ExpensePrintModalProps {
  isOpen: boolean
  onClose: () => void
  expenseData: any
  businessName: string
}

type Mode = 'po' | 'summary'

type NormalizedLineItem = {
  product_name: string
  qty: number
  unit: string
  price_per_unit: number
  subtotal: number
}

type NormalizedExpenseData = {
  id?: string
  dateISO: string
  po_number?: string
  category?: string
  supplier_name?: string
  supplier_phone?: string
  supplier_email?: string
  supplier_address?: string
  payment_method: string
  payment_status: string
  payment_type?: string
  due_date?: string
  amount: number
  subtotal?: number
  discount_amount?: number
  ppn_amount?: number
  pph_amount?: number
  down_payment?: number
  remaining_payment?: number
  description?: string
  notes?: string
  receipt_url?: string
  receipt_filename?: string
  items: NormalizedLineItem[]
}

const toNumber = (v: any): number => {
  const n = typeof v === 'number' ? v : Number((v ?? '').toString().replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

const normalizeDate = (raw: any): string => {
  const v = (raw ?? '').toString().trim()
  if (!v) return new Date().toISOString()
  return v
}

const normalizeExpenseData = (raw: any): NormalizedExpenseData => {
  const id = raw?.id ? String(raw.id) : undefined

  const dateISO = normalizeDate(raw?.expense_date || raw?.date || raw?.transaction_date || raw?.created_at)
  const po_number = (raw?.po_number || raw?.purchase_order_number || raw?.purchaseOrderNumber || '').toString() || undefined

  const supplier = raw?.supplier || {}
  const supplier_name = (raw?.supplier_name || raw?.supplierName || supplier?.name || raw?.supplier || raw?.vendor || raw?.customer_or_supplier || '').toString() || undefined
  const supplier_phone = (raw?.supplier_phone || supplier?.phone || raw?.phone || '').toString() || undefined
  const supplier_email = (raw?.supplier_email || supplier?.email || raw?.email || '').toString() || undefined
  const supplier_address = (raw?.supplier_address || supplier?.address || raw?.address || '').toString() || undefined

  const category = (raw?.expense_category || raw?.category || '').toString() || undefined

  const payment_method = (raw?.payment_method || raw?.paymentMethod || raw?.payment_type || raw?.paymentType || '').toString()
  const payment_status = (raw?.payment_status || raw?.paymentStatus || raw?.payment_status_label || 'Tempo').toString()

  const payment_type = (raw?.payment_type || raw?.paymentType || '').toString() || undefined
  const due_date = (raw?.due_date || raw?.dueDate || raw?.payment_due_date || raw?.tempo_date || '').toString() || undefined

  const amount = toNumber(raw?.amount ?? raw?.total ?? raw?.grand_total ?? raw?.total_amount ?? 0)
  const subtotal = toNumber(raw?.subtotal ?? 0)
  const discount_amount = toNumber(raw?.discount_amount ?? raw?.discount ?? 0)
  const ppn_amount = toNumber(raw?.ppn_amount ?? raw?.tax_ppn ?? 0)
  const pph_amount = toNumber(raw?.pph_amount ?? raw?.tax_pph ?? 0)

  const down_payment = toNumber(raw?.down_payment ?? raw?.paid_amount ?? raw?.dp ?? 0)
  const remaining_payment = toNumber(raw?.remaining_payment ?? raw?.remaining_amount ?? 0)

  const description = (raw?.description || '').toString() || undefined
  const notes = (raw?.notes || '').toString() || undefined

  const receipt_url = (raw?.receipt_url || raw?.receiptUrl || '').toString() || undefined
  const receipt_filename = (raw?.receipt_filename || raw?.receiptFilename || '').toString() || undefined

  const rawItems = raw?.items ?? raw?.expense_items ?? raw?.line_items ?? raw?.lineItems ?? raw?.transaction_items ?? []
  const parsedItems = Array.isArray(rawItems)
    ? rawItems
    : typeof rawItems === 'string'
      ? (() => {
          try {
            const parsed = JSON.parse(rawItems)
            return Array.isArray(parsed) ? parsed : []
          } catch {
            return []
          }
        })()
      : []

  const items: NormalizedLineItem[] = parsedItems.map((it: any) => {
    const qty = toNumber(it?.qty ?? it?.quantity ?? 1) || 1
    const unit = (it?.unit || 'pcs').toString()
    const price_per_unit = toNumber(it?.price_per_unit ?? it?.pricePerUnit ?? it?.price ?? it?.unit_price ?? 0) || 0
    const product_name = (it?.product_name || it?.productName || it?.name || it?.description || 'Item').toString()
    const subtotal = toNumber(it?.subtotal ?? qty * price_per_unit) || 0
    return { product_name, qty, unit, price_per_unit, subtotal }
  })

  return {
    id,
    dateISO,
    po_number,
    category,
    supplier_name,
    supplier_phone,
    supplier_email,
    supplier_address,
    payment_method,
    payment_status,
    payment_type,
    due_date,
    amount,
    subtotal,
    discount_amount,
    ppn_amount,
    pph_amount,
    down_payment,
    remaining_payment,
    description,
    notes,
    receipt_url,
    receipt_filename,
    items
  }
}

const formatDate = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

const formatMoney = (n: number) => {
  return new Intl.NumberFormat('id-ID').format(Number.isFinite(n) ? n : 0)
}

export function ExpensePrintModal({ isOpen, onClose, expenseData, businessName }: ExpensePrintModalProps) {
  const [mode, setMode] = useState<Mode>('po')
  const [showPreview, setShowPreview] = useState(false)

  const d = useMemo(() => normalizeExpenseData(expenseData), [expenseData])

  useEffect(() => {
    if (!isOpen) return
    const supplierName = (d.supplier_name || '').toLowerCase()
    const isAnonymous = !supplierName || supplierName === '-' || supplierName.includes('tanpa')
    const hasIdentity = !isAnonymous && !!d.supplier_name
    setMode(hasIdentity ? 'po' : 'summary')
    setShowPreview(false)
  }, [isOpen, d.supplier_name])

  if (!isOpen) return null

  const getDocNo = () => {
    if (d.po_number) return d.po_number
    if (d.id) return `PO-${d.id.substring(0, 8).toUpperCase()}`
    return 'N/A'
  }

  const shareToWhatsApp = () => {
    if (!d.supplier_phone) {
      alert('Nomor WhatsApp supplier tidak tersedia')
      return
    }

    const phone = d.supplier_phone.replace(/^0/, '62').replace(/\D/g, '')
    const title = mode === 'po' ? 'PESANAN PEMBELIAN (PO)' : 'RINGKASAN PENGELUARAN'

    const message = `
*${title}*

${businessName}
━━━━━━━━━━━━━━━━

No: ${getDocNo()}
Tanggal: ${formatDate(d.dateISO)}
Supplier: ${d.supplier_name || '-'}

Total: Rp ${formatMoney(d.amount)}
Pembayaran: ${getPaymentMethodLabel(d.payment_method) || d.payment_method || '-'}
Status: ${d.payment_status}
${d.due_date ? `Jatuh Tempo: ${formatDate(d.due_date)}` : ''}

Terima kasih.
    `.trim()

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  const generatePdf = (m: Mode) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const pageWidth = 210
    const marginX = 16
    let y = 18

    const addHeader = (title: string) => {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.text(title, pageWidth / 2, y, { align: 'center' })
      y += 7

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(`Nomor: ${getDocNo()}`, pageWidth / 2, y, { align: 'center' })
      y += 10

      doc.setDrawColor(30)
      doc.setLineWidth(0.4)
      doc.line(marginX, y, pageWidth - marginX, y)
      y += 8

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text(businessName || 'Bisnis Saya', marginX, y)
      y += 5

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(`Tanggal: ${formatDate(d.dateISO)}`, marginX, y)
      y += 8

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('Kepada:', marginX, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      doc.text(d.supplier_name || '-', marginX, y)
      y += 5
      if (d.supplier_phone) {
        doc.text(`Telp/WA: ${d.supplier_phone}`, marginX, y)
        y += 5
      }
      if (d.supplier_email) {
        doc.text(`Email: ${d.supplier_email}`, marginX, y)
        y += 5
      }
      if (d.supplier_address) {
        doc.text(`Alamat: ${d.supplier_address}`, marginX, y)
        y += 5
      }

      y += 3
    }

    const addItemsTable = () => {
      const startY = y
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)

      // Header row
      doc.setFillColor(245, 245, 245)
      doc.rect(marginX, startY, pageWidth - marginX * 2, 8, 'F')
      doc.setDrawColor(220)
      doc.rect(marginX, startY, pageWidth - marginX * 2, 8)

      const xNo = marginX + 2
      const xDesc = marginX + 14
      const xQty = 138
      const xPrice = 162
      const xSubtotal = 194

      doc.text('No', xNo, startY + 5.5)
      doc.text('Deskripsi', xDesc, startY + 5.5)
      doc.text('Qty', xQty, startY + 5.5, { align: 'right' })
      doc.text('Harga', xPrice, startY + 5.5, { align: 'right' })
      doc.text('Jumlah', xSubtotal, startY + 5.5, { align: 'right' })

      y = startY + 10
      doc.setFont('helvetica', 'normal')

      const items = d.items || []
      if (!items.length) {
        doc.text('Tidak ada item', marginX + 2, y)
        y += 8
        return
      }

      items.forEach((it, idx) => {
        if (y > 270) {
          doc.addPage()
          y = 18
        }
        doc.setFontSize(9)
        doc.text(String(idx + 1), xNo, y)
        doc.text((it.product_name || 'Item').slice(0, 46), xDesc, y)
        doc.text(`${it.qty} ${it.unit || ''}`.trim(), xQty, y, { align: 'right' })
        doc.text(formatMoney(it.price_per_unit || 0), xPrice, y, { align: 'right' })
        doc.text(formatMoney(it.subtotal || 0), xSubtotal, y, { align: 'right' })
        y += 7
      })

      y += 4
    }

    const addTotals = () => {
      const rightX = pageWidth - marginX
      const labelX = 132

      doc.setDrawColor(200)
      doc.setLineWidth(0.3)
      doc.line(labelX, y, rightX, y)
      y += 6

      const subtotal = d.subtotal && d.subtotal > 0 ? d.subtotal : d.items.reduce((s, it) => s + (it.subtotal || 0), 0)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text('Subtotal', labelX, y)
      doc.text(`Rp ${formatMoney(subtotal)}`, rightX, y, { align: 'right' })
      y += 6

      if ((d.discount_amount || 0) > 0) {
        doc.text('Diskon', labelX, y)
        doc.text(`- Rp ${formatMoney(d.discount_amount || 0)}`, rightX, y, { align: 'right' })
        y += 6
      }

      if ((d.ppn_amount || 0) > 0) {
        doc.text('PPN', labelX, y)
        doc.text(`Rp ${formatMoney(d.ppn_amount || 0)}`, rightX, y, { align: 'right' })
        y += 6
      }

      if ((d.pph_amount || 0) > 0) {
        doc.text('PPh', labelX, y)
        doc.text(`Rp ${formatMoney(d.pph_amount || 0)}`, rightX, y, { align: 'right' })
        y += 6
      }

      doc.setDrawColor(30)
      doc.setLineWidth(0.5)
      doc.line(labelX, y, rightX, y)
      y += 7

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('TOTAL', labelX, y)
      doc.text(`Rp ${formatMoney(d.amount)}`, rightX, y, { align: 'right' })
      y += 10

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(`Metode Pembayaran: ${getPaymentMethodLabel(d.payment_method) || d.payment_method || '-'}`, marginX, y)
      y += 5
      doc.text(`Status: ${d.payment_status || '-'}`, marginX, y)
      y += 5
      if (d.due_date && (d.payment_status || '').toLowerCase().includes('tempo')) {
        doc.text(`Jatuh Tempo: ${formatDate(d.due_date)}`, marginX, y)
        y += 5
      }

      if ((d.down_payment || 0) > 0 || (d.remaining_payment || 0) > 0) {
        y += 4
        doc.setFont('helvetica', 'bold')
        doc.text('Tracking Hutang', marginX, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        doc.text(`DP: Rp ${formatMoney(d.down_payment || 0)}`, marginX, y)
        doc.text(`Sisa: Rp ${formatMoney(d.remaining_payment || 0)}`, marginX + 60, y)
        y += 6
      }
    }

    if (m === 'po') {
      addHeader('PURCHASE ORDER')
      addItemsTable()
      addTotals()
    } else {
      addHeader('RINGKASAN PENGELUARAN')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(`Kategori: ${d.category || '-'}`, marginX, y)
      y += 6
      doc.text(`Deskripsi: ${(d.description || '-').slice(0, 90)}`, marginX, y)
      y += 8
      if (d.items.length) {
        doc.setFont('helvetica', 'bold')
        doc.text('Item', marginX, y)
        y += 6
        doc.setFont('helvetica', 'normal')
        d.items.slice(0, 10).forEach((it, idx) => {
          doc.text(`${idx + 1}. ${(it.product_name || 'Item').slice(0, 70)} (${it.qty} ${it.unit})`, marginX, y)
          y += 5
        })
        y += 4
      }
      addTotals()
    }

    const filename = `${m === 'po' ? 'PO' : 'Pengeluaran'}_${(d.po_number || d.id || 'N_A').toString().substring(0, 12)}.pdf`
    doc.save(filename)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Cetak Dokumen</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Tutup">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Format</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setMode('po')}
                className={`p-4 border-2 rounded-lg transition-all ${mode === 'po' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="text-center">
                  <p className="font-semibold text-gray-900">PO</p>
                  <p className="text-xs text-gray-700">A4 untuk supplier</p>
                </div>
              </button>
              <button
                onClick={() => setMode('summary')}
                className={`p-4 border-2 rounded-lg transition-all ${mode === 'summary' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="text-center">
                  <p className="font-semibold text-gray-900">Ringkasan</p>
                  <p className="text-xs text-gray-700">A4 internal</p>
                </div>
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              PO cocok untuk transaksi pemasok (supplier teridentifikasi). Ringkasan cocok untuk arsip internal.
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Preview Data</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                (d.payment_status || '').toLowerCase().includes('lunas') ? 'bg-green-100 text-green-800' :
                (d.payment_status || '').toLowerCase().includes('tempo') ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {d.payment_status || '-'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-xs text-gray-600">Nomor Dokumen</div>
                <div className="font-mono font-semibold text-gray-900">{getDocNo()}</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-xs text-gray-600">Tanggal</div>
                <div className="font-semibold text-gray-900">{formatDate(d.dateISO)}</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-xs text-gray-600">Supplier</div>
                <div className="font-semibold text-gray-900">{d.supplier_name || '-'}</div>
                {d.supplier_phone ? <div className="text-xs text-gray-600 mt-1">{d.supplier_phone}</div> : null}
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-xs text-gray-600">Total</div>
                <div className="text-lg font-bold text-gray-900">Rp {formatMoney(d.amount)}</div>
              </div>
            </div>

            {d.items.length ? (
              <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <div className="text-xs font-semibold text-gray-700">Daftar Item ({d.items.length})</div>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Produk</th>
                        <th className="px-3 py-2 text-center font-semibold text-gray-700">Qty</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-700">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {d.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 text-gray-900">
                            <div className="font-medium">{it.product_name}</div>
                            <div className="text-gray-600">@Rp {formatMoney(it.price_per_unit)}</div>
                          </td>
                          <td className="px-3 py-2 text-center text-gray-700">{it.qty} {it.unit}</td>
                          <td className="px-3 py-2 text-right font-semibold text-gray-900">Rp {formatMoney(it.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex-shrink-0 sticky bottom-0 -mx-6 px-4 sm:px-6 py-3 border-t border-gray-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-[0_-10px_30px_-20px_rgba(0,0,0,0.25)]">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowPreview(true)}
                className="h-12 px-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold"
              >
                Preview
              </button>
              <button
                onClick={() => generatePdf(mode)}
                className="h-12 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
              >
                Download
              </button>
              {d.supplier_phone ? (
                <button
                  onClick={shareToWhatsApp}
                  className="col-span-2 h-12 px-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold"
                >
                  Kirim WA
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {showPreview ? (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] overflow-auto" style={{ touchAction: 'pan-x pan-y pinch-zoom' }}>
          <div className="min-h-screen flex flex-col items-center justify-start p-4 md:p-8">
            <div className="w-full max-w-4xl mb-4 flex items-center justify-between sticky top-4 z-10">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2.5 bg-white rounded-lg shadow-lg hover:bg-gray-100 font-semibold text-gray-900"
              >
                Kembali
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="w-10 h-10 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 flex items-center justify-center"
                aria-label="Tutup"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-2xl overflow-auto w-full max-w-4xl" style={{ maxHeight: 'calc(100vh - 120px)' }}>
              <div className="bg-gray-200 p-4 md:p-8">
                <div
                  className="bg-white shadow-xl mx-auto"
                  style={{ width: '100%', maxWidth: '210mm', minHeight: '297mm', padding: '24px' }}
                >
                  <div className="text-center border-b-4 border-blue-600 pb-4 mb-6">
                    <h1 className="text-3xl font-bold text-blue-600">
                      {mode === 'po' ? 'PURCHASE ORDER' : 'RINGKASAN PENGELUARAN'}
                    </h1>
                    <p className="text-sm text-gray-700 mt-1">Nomor: {getDocNo()}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div>
                      <div className="font-bold text-gray-900">{businessName}</div>
                    </div>
                    <div className="text-right">
                      <div><span className="font-semibold">Tanggal:</span> {formatDate(d.dateISO)}</div>
                      {d.due_date ? <div className="mt-1"><span className="font-semibold">Jatuh Tempo:</span> {formatDate(d.due_date)}</div> : null}
                    </div>
                  </div>

                  <div className="border border-gray-300 rounded p-3 mb-6">
                    <p className="font-bold text-sm text-gray-900 mb-1">Kepada:</p>
                    <p className="font-bold text-lg text-black">{d.supplier_name || '-'}</p>
                    {d.supplier_phone ? <p className="text-sm text-gray-700">Telp/WA: {d.supplier_phone}</p> : null}
                  </div>

                  {mode === 'po' ? (
                    <table className="w-full mb-6 border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-100 border-y-2 border-gray-800">
                          <th className="text-left py-2 px-2 font-bold">No.</th>
                          <th className="text-left py-2 px-2 font-bold">Deskripsi</th>
                          <th className="text-center py-2 px-2 font-bold">Qty</th>
                          <th className="text-right py-2 px-2 font-bold">Harga</th>
                          <th className="text-right py-2 px-2 font-bold">Jumlah</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(d.items || []).length ? (
                          d.items.map((it, idx) => (
                            <tr key={idx} className="border-b border-gray-200">
                              <td className="py-2 px-2">{idx + 1}</td>
                              <td className="py-2 px-2">{it.product_name}</td>
                              <td className="py-2 px-2 text-center">{it.qty} {it.unit}</td>
                              <td className="py-2 px-2 text-right">{formatMoney(it.price_per_unit)}</td>
                              <td className="py-2 px-2 text-right font-semibold">{formatMoney(it.subtotal)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td className="py-3 px-2 text-gray-500" colSpan={5}>Tidak ada item</td></tr>
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <div className="mb-6 text-sm">
                      <div className="mb-2"><span className="font-semibold">Kategori:</span> {d.category || '-'}</div>
                      <div><span className="font-semibold">Deskripsi:</span> {d.description || '-'}</div>
                    </div>
                  )}

                  <div className="flex justify-end mb-6">
                    <div className="w-80 text-sm">
                      <div className="flex justify-between py-1 border-b border-gray-200">
                        <span>Subtotal</span>
                        <span>Rp {formatMoney((d.subtotal && d.subtotal > 0) ? d.subtotal : d.items.reduce((s, it) => s + (it.subtotal || 0), 0))}</span>
                      </div>
                      {(d.discount_amount || 0) > 0 ? (
                        <div className="flex justify-between py-1 border-b border-gray-200">
                          <span>Diskon</span>
                          <span>- Rp {formatMoney(d.discount_amount || 0)}</span>
                        </div>
                      ) : null}
                      <div className="flex justify-between py-2 text-lg font-bold border-t-2 border-gray-800">
                        <span>TOTAL</span>
                        <span>Rp {formatMoney(d.amount)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-700">
                    <div><span className="font-semibold">Pembayaran:</span> {getPaymentMethodLabel(d.payment_method) || d.payment_method || '-'}</div>
                    <div className="mt-1"><span className="font-semibold">Status:</span> {d.payment_status || '-'}</div>
                  </div>

                  <div className="text-center text-xs text-gray-600 mt-8 pt-4 border-t border-gray-200">
                    Dokumen ini dibuat secara elektronik.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
