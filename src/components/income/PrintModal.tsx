'use client'

import { useState, useEffect } from 'react'
import jsPDF from 'jspdf'

interface PrintModalProps {
  isOpen: boolean
  onClose: () => void
  incomeData: any
  businessName: string
}

export function PrintModal({ isOpen, onClose, incomeData, businessName }: PrintModalProps) {
  const [printMode, setPrintMode] = useState<'receipt' | 'invoice'>('receipt')
  const [showPreview, setShowPreview] = useState(false)
  
  if (!isOpen) return null
  
  // Get customer display name
  const getCustomerName = () => {
    if (incomeData.customer_name) return incomeData.customer_name
    if (!incomeData.customer_id || incomeData.customer_id === 'anonymous') return 'Umum / Walk-in'
    return 'Customer'
  }
  
  const getCustomerPhone = () => {
    return incomeData.customer_phone || ''
  }

  const generatePDF = (mode: 'receipt' | 'invoice') => {
    // Calculate receipt height based on content
    let receiptHeight = 200 // default
    if (mode === 'receipt') {
      let parsedItems = []
      try {
        parsedItems = typeof incomeData.line_items === 'string' 
          ? JSON.parse(incomeData.line_items) 
          : (incomeData.line_items || [])
      } catch (e) {
        parsedItems = []
      }
      const itemCount = parsedItems.length || 1
      const baseHeight = 80 // header + footer
      const itemHeight = 9 // per item (name + details)
      receiptHeight = Math.max(120, baseHeight + (itemCount * itemHeight))
    }

    const doc = new jsPDF({
      orientation: mode === 'receipt' ? 'portrait' : 'portrait',
      unit: 'mm',
      format: mode === 'receipt' ? [80, receiptHeight] : 'a4'
    })

    if (mode === 'receipt') {
      // STRUK MODE (Thermal Printer 80mm) - Simple Receipt
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(businessName.toUpperCase(), 40, 10, { align: 'center' })
      
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('='.repeat(48), 40, 14, { align: 'center' })
      
      doc.text(`No.${incomeData.id?.substring(0, 8) || 'N/A'}`, 5, 19)
      doc.text(new Date(incomeData.income_date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      }), 5, 24)
      doc.text(new Date(incomeData.income_date).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      }), 5, 29)
      
      doc.text('-'.repeat(48), 40, 33, { align: 'center' })
      
      // Items
      let y = 38
      // Parse line_items if it's a string
      let lineItems = []
      try {
        lineItems = typeof incomeData.line_items === 'string' 
          ? JSON.parse(incomeData.line_items) 
          : (incomeData.line_items || [])
      } catch (e) {
        lineItems = []
      }
      
      if (lineItems.length > 0) {
        lineItems.forEach((item: any) => {
          doc.text(item.product_name || 'Item', 5, y)
          y += 4
          const qty = item.quantity || 1
          const pricePerUnit = item.price_per_unit || 0
          const subtotal = item.subtotal || (qty * pricePerUnit)
          doc.text(`${qty} x ${pricePerUnit.toLocaleString('id-ID')}`, 8, y)
          doc.text(`Rp ${subtotal.toLocaleString('id-ID')}`, 75, y, { align: 'right' })
          y += 5
        })
      } else if (incomeData.product_name) {
        doc.text(incomeData.product_name, 5, y)
        y += 4
        doc.text(`${incomeData.quantity || 1} x ${(incomeData.price_per_unit || incomeData.amount).toLocaleString('id-ID')}`, 8, y)
        doc.text(`Rp ${incomeData.amount.toLocaleString('id-ID')}`, 75, y, { align: 'right' })
        y += 5
      }
      
      doc.text('-'.repeat(48), 40, y, { align: 'center' })
      y += 5
      
      // Totals
      if (incomeData.discount && incomeData.discount > 0) {
        doc.text('Diskon', 5, y)
        doc.text(`Rp ${incomeData.discount.toLocaleString('id-ID')}`, 75, y, { align: 'right' })
        y += 4
      }
      
      if (incomeData.tax_ppn && incomeData.tax_ppn > 0) {
        doc.text('PPN 11%', 5, y)
        doc.text(`Rp ${incomeData.tax_ppn.toLocaleString('id-ID')}`, 75, y, { align: 'right' })
        y += 4
      }
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Total', 5, y)
      doc.text(`Rp ${incomeData.amount.toLocaleString('id-ID')}`, 75, y, { align: 'right' })
      y += 5
      
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(`Bayar (${incomeData.payment_method})`, 5, y)
      doc.text(`Rp ${incomeData.amount.toLocaleString('id-ID')}`, 75, y, { align: 'right' })
      y += 4
      
      doc.text('Kembali', 5, y)
      doc.text('Rp 0', 75, y, { align: 'right' })
      y += 5
      
      if (incomeData.payment_status !== 'Lunas') {
        doc.text('-'.repeat(48), 40, y, { align: 'center' })
        y += 4
        doc.setFont('helvetica', 'bold')
        doc.text(`STATUS: ${incomeData.payment_status.toUpperCase()}`, 40, y, { align: 'center' })
        y += 4
        if (incomeData.due_date) {
          doc.setFont('helvetica', 'normal')
          doc.text(`Jatuh Tempo: ${new Date(incomeData.due_date).toLocaleDateString('id-ID')}`, 40, y, { align: 'center' })
          y += 4
        }
      }
      
      doc.text('='.repeat(48), 40, y, { align: 'center' })
      y += 5
      doc.text('Terima kasih atas kunjungan Anda', 40, y, { align: 'center' })
      
    } else {
      // INVOICE MODE (A4) - Professional Format
      // Header
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('INVOICE', 105, 20, { align: 'center' })
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      const invoiceNo = `INV-${incomeData.id?.substring(0, 8).toUpperCase() || 'N/A'}`
      doc.text(`Nomor: ${invoiceNo}`, 105, 26, { align: 'center' })
      
      // From (Sender) - Left Side
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(businessName, 20, 40)
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('Jl. Contoh Alamat No. 123', 20, 46)
      doc.text('Jakarta Selatan, DKI Jakarta', 20, 51)
      doc.text('Telp: 021-1234567', 20, 56)
      doc.text('Email: info@business.com', 20, 61)
      
      // Date & Due Date - Right Side
      doc.setFontSize(9)
      doc.text('Tanggal', 140, 40)
      doc.text(': ' + new Date(incomeData.income_date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }), 165, 40)
      
      if (incomeData.due_date) {
        doc.text('Tgl. Jatuh Tempo', 140, 46)
        doc.text(': ' + new Date(incomeData.due_date).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }), 165, 46)
      }
      
      // To (Recipient/Customer) - Box
      doc.setDrawColor(200)
      doc.setLineWidth(0.3)
      doc.rect(20, 70, 85, 30)
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Tagihan Kepada', 23, 76)
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text(incomeData.customer_name || 'Walk-in Customer', 23, 83)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      if (incomeData.customer_phone) {
        doc.text(`Telp: ${incomeData.customer_phone}`, 23, 88)
      }
      if (incomeData.customer_email) {
        doc.text(`Email: ${incomeData.customer_email}`, 23, 93)
      }
      if (!incomeData.customer_phone && !incomeData.customer_email) {
        doc.text('Alamat: -', 23, 88)
      }
      
      // Table Header
      const tableTop = 110
      doc.setFillColor(240, 240, 240)
      doc.rect(20, tableTop, 170, 8, 'F')
      
      doc.setDrawColor(200)
      doc.setLineWidth(0.3)
      doc.rect(20, tableTop, 170, 8)
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('No.', 22, tableTop + 5.5)
      doc.text('Deskripsi', 32, tableTop + 5.5)
      doc.text('Qty', 105, tableTop + 5.5, { align: 'center' })
      doc.text('Satuan', 120, tableTop + 5.5, { align: 'center' })
      doc.text('Harga/Unit', 145, tableTop + 5.5, { align: 'right' })
      doc.text('Jumlah', 185, tableTop + 5.5, { align: 'right' })
      
      // Table Items
      let y = tableTop + 8
      doc.setFont('helvetica', 'normal')
      
      // Parse line_items if it's a string
      let lineItems = []
      try {
        lineItems = typeof incomeData.line_items === 'string' 
          ? JSON.parse(incomeData.line_items) 
          : (incomeData.line_items || [])
      } catch (e) {
        lineItems = []
      }
      let itemNo = 1
      let subtotal = 0
      
      if (lineItems.length > 0) {
        lineItems.forEach((item: any) => {
          doc.rect(20, y, 170, 10)
          doc.text(itemNo.toString(), 22, y + 6.5)
          doc.text(item.product_name || 'Item', 32, y + 6.5)
          const qty = item.quantity || 1
          const pricePerUnit = item.price_per_unit || item.price || 0
          const itemSubtotal = item.subtotal || (qty * pricePerUnit)
          doc.text(qty.toString(), 105, y + 6.5, { align: 'center' })
          doc.text(item.unit || 'pcs', 120, y + 6.5, { align: 'center' })
          doc.text(pricePerUnit.toLocaleString('id-ID'), 145, y + 6.5, { align: 'right' })
          doc.text(itemSubtotal.toLocaleString('id-ID'), 185, y + 6.5, { align: 'right' })
          y += 10
          itemNo++
          subtotal += itemSubtotal
        })
      } else if (incomeData.product_name) {
        doc.rect(20, y, 170, 10)
        doc.text('1', 22, y + 6.5)
        doc.text(incomeData.product_name, 32, y + 6.5)
        doc.text((incomeData.quantity || 1).toString(), 105, y + 6.5, { align: 'center' })
        doc.text('pcs', 120, y + 6.5, { align: 'center' })
        doc.text((incomeData.price_per_unit || incomeData.amount).toLocaleString('id-ID'), 145, y + 6.5, { align: 'right' })
        doc.text(incomeData.amount.toLocaleString('id-ID'), 185, y + 6.5, { align: 'right' })
        y += 10
        subtotal = incomeData.amount
      }
      
      // Summary Box (right side)
      const summaryX = 130
      y += 5
      
      doc.setFont('helvetica', 'normal')
      doc.text('Subtotal', summaryX, y)
      doc.text(`Rp ${(incomeData.subtotal || subtotal).toLocaleString('id-ID')}`, 185, y, { align: 'right' })
      y += 6
      
      if (incomeData.discount && incomeData.discount > 0) {
        doc.text('Diskon', summaryX, y)
        doc.text(`Rp ${incomeData.discount.toLocaleString('id-ID')}`, 185, y, { align: 'right' })
        y += 6
      }
      
      if (incomeData.tax_ppn && incomeData.tax_ppn > 0) {
        doc.text('PPN 11%', summaryX, y)
        doc.text(`Rp ${incomeData.tax_ppn.toLocaleString('id-ID')}`, 185, y, { align: 'right' })
        y += 6
      }
      
      if (incomeData.tax_pph && incomeData.tax_pph > 0) {
        doc.text('PPh 23', summaryX, y)
        doc.text(`Rp ${incomeData.tax_pph.toLocaleString('id-ID')}`, 185, y, { align: 'right' })
        y += 6
      }
      
      if (incomeData.other_fees && incomeData.other_fees > 0) {
        doc.text('Biaya Lain', summaryX, y)
        doc.text(`Rp ${incomeData.other_fees.toLocaleString('id-ID')}`, 185, y, { align: 'right' })
        y += 6
      }
      
      // Total
      doc.setDrawColor(0)
      doc.setLineWidth(0.5)
      doc.line(summaryX, y, 190, y)
      y += 6
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('Total', summaryX, y)
      doc.text(`Rp ${incomeData.amount.toLocaleString('id-ID')}`, 185, y, { align: 'right' })
      y += 6
      
      if (incomeData.down_payment && incomeData.down_payment > 0) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.text('DP/Terbayar', summaryX, y)
        doc.text(`Rp ${incomeData.down_payment.toLocaleString('id-ID')}`, 185, y, { align: 'right' })
        y += 6
        
        doc.setFont('helvetica', 'bold')
        doc.text('Sisa Tagihan', summaryX, y)
        doc.text(`Rp ${(incomeData.remaining || 0).toLocaleString('id-ID')}`, 185, y, { align: 'right' })
        y += 6
      }
      
      // Payment Info
      y += 10
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text('Pesan', 20, y)
      
      doc.setFont('helvetica', 'normal')
      y += 5
      doc.text(`Metode Pembayaran: ${incomeData.payment_method}`, 20, y)
      y += 5
      
      if (incomeData.payment_status !== 'Lunas') {
        doc.setTextColor(200, 0, 0)
        doc.setFont('helvetica', 'bold')
        doc.text(`Status Pembayaran: ${incomeData.payment_status}`, 20, y)
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'normal')
      } else {
        doc.text(`Status Pembayaran: ${incomeData.payment_status}`, 20, y)
      }
      y += 5
      
      doc.text('Harap melakukan pembayaran sesuai nominal yang tertera.', 20, y)
      y += 5
      doc.text('Terima kasih atas kepercayaan Anda.', 20, y)
      
      // Footer - Signature
      y = 250
      doc.setFont('helvetica', 'normal')
      doc.text('Dengan Hormat,', 140, y)
      y += 20
      doc.setFont('helvetica', 'bold')
      doc.text(businessName, 140, y)
      
      // Footer text
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(100)
      doc.text('Dokumen ini dibuat secara elektronik dan sah tanpa tanda tangan basah', 105, 285, { align: 'center' })
    }

    // Save PDF
    const filename = `${mode === 'receipt' ? 'Struk' : 'Invoice'}_${incomeData.id?.substring(0, 8) || 'N/A'}.pdf`
    doc.save(filename)
  }

  const shareToWhatsApp = () => {
    if (!incomeData.customer_phone) {
      alert('Nomor WhatsApp customer tidak tersedia')
      return
    }
    
    const phone = incomeData.customer_phone.replace(/^0/, '62').replace(/\D/g, '')
    const message = `
*INVOICE PEMBAYARAN*

${businessName}
━━━━━━━━━━━━━━━━

No: ${incomeData.id?.substring(0, 8)}
Tanggal: ${new Date(incomeData.income_date).toLocaleDateString('id-ID')}

${incomeData.product_name || incomeData.description}
${incomeData.quantity ? `${incomeData.quantity} x Rp ${incomeData.price_per_unit?.toLocaleString('id-ID')}` : ''}

━━━━━━━━━━━━━━━━
*TOTAL: Rp ${incomeData.amount.toLocaleString('id-ID')}*

Pembayaran: ${incomeData.payment_method}
Status: ${incomeData.payment_status}
${incomeData.due_date ? `Jatuh Tempo: ${new Date(incomeData.due_date).toLocaleDateString('id-ID')}` : ''}

Terima kasih! 🙏
    `.trim()
    
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Cetak Dokumen</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih Format
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPrintMode('receipt')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  printMode === 'receipt'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="font-semibold text-gray-900">Struk</p>
                  <p className="text-xs text-gray-500">80mm thermal</p>
                </div>
              </button>
              
              <button
                onClick={() => setPrintMode('invoice')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  printMode === 'invoice'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="font-semibold text-gray-900">Invoice</p>
                  <p className="text-xs text-gray-500">A4 format</p>
                </div>
              </button>
            </div>
          </div>

          {/* Professional Preview Data */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Preview Data
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                incomeData.payment_status === 'Lunas' 
                  ? 'bg-green-100 text-green-800'
                  : incomeData.payment_status === 'Pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {incomeData.payment_status}
              </span>
            </div>
            
            <div className="space-y-3">
              {/* Customer Info */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {getCustomerName()}
                    </p>
                    {getCustomerPhone() && (
                      <p className="text-xs text-gray-600 mt-1">{getCustomerPhone()}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Transaction Details - Line Items */}
              {(() => {
                let parsedLineItems = []
                try {
                  parsedLineItems = typeof incomeData.line_items === 'string' 
                    ? JSON.parse(incomeData.line_items) 
                    : (incomeData.line_items || [])
                } catch (e) {
                  parsedLineItems = []
                }
                
                if (parsedLineItems.length > 0) {
                  return (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="bg-purple-50 px-3 py-2 border-b border-gray-200">
                        <p className="text-xs font-semibold text-purple-900 uppercase tracking-wide flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          Daftar Item ({parsedLineItems.length})
                        </p>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700">Produk</th>
                              <th className="px-3 py-2 text-center font-semibold text-gray-700">Qty</th>
                              <th className="px-3 py-2 text-right font-semibold text-gray-700">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {parsedLineItems.map((item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-3 py-2 text-gray-900">
                                  <div className="font-medium">{item.product_name || 'Item'}</div>
                                  <div className="text-gray-500">
                                    @Rp {(item.price_per_unit || item.price || 0).toLocaleString('id-ID')}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-center text-gray-700">
                                  {item.quantity || 1} {item.unit || 'pcs'}
                                </td>
                                <td className="px-3 py-2 text-right font-semibold text-gray-900">
                                  Rp {(item.subtotal || ((item.quantity || 1) * (item.price_per_unit || item.price || 0))).toLocaleString('id-ID')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                } else {
                  return (
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Item / Produk</p>
                          <p className="text-sm font-semibold text-gray-900 mt-0.5 break-words">
                            {incomeData.product_name || incomeData.description || 'Transaksi'}
                          </p>
                          {incomeData.quantity && incomeData.price_per_unit && (
                            <p className="text-xs text-gray-600 mt-1">
                              {incomeData.quantity} × Rp {incomeData.price_per_unit.toLocaleString('id-ID')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                }
              })()}

              {/* Amount */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-blue-100 uppercase tracking-wide">Total Transaksi</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      Rp {incomeData.amount?.toLocaleString('id-ID') || '0'}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Payment Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Metode Bayar</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {incomeData.payment_method || '-'}
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tanggal</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {new Date(incomeData.income_date).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Due Date Warning */}
              {incomeData.payment_type === 'tempo' && incomeData.due_date && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-amber-800">Pembayaran Tempo</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Jatuh tempo: {new Date(incomeData.due_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Invoice Number */}
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Invoice No: <span className="font-mono font-semibold text-gray-700">
                    {incomeData.id ? `TR${incomeData.id.substring(0, 8).toUpperCase()}` : 'N/A'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowPreview(true)}
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </button>
            <button
              onClick={() => generatePDF(printMode)}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
            
            {incomeData.customer_phone && (
              <button
                onClick={shareToWhatsApp}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Kirim WA
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Print Preview Modal - Like Paper */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-auto">
          <div className="relative w-full max-w-4xl">
            {/* Close Button */}
            <button
              onClick={() => setShowPreview(false)}
              className="absolute -top-12 right-0 px-4 py-2 bg-white rounded-lg shadow-lg hover:bg-gray-100 flex items-center gap-2 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Tutup Preview
            </button>

            {/* Paper Preview */}
            <div className="bg-white rounded-lg shadow-2xl overflow-hidden mt-4">
              {printMode === 'receipt' ? (
                // Receipt Preview (80mm thermal)
                <div className="bg-gradient-to-b from-gray-50 to-white p-8 flex justify-center">
                  <div style={{width: '80mm'}} className="bg-white shadow-xl p-6 font-mono text-sm border border-gray-200">
                    <div className="text-center border-b-2 border-dashed border-gray-300 pb-3 mb-3">
                      <div className="font-bold text-base mb-1">{businessName.toUpperCase()}</div>
                      <div className="text-xs text-gray-600">================================</div>
                    </div>
                    
                    <div className="space-y-1 text-xs mb-3">
                      <div>No.{incomeData.id?.substring(0, 8) || 'N/A'}</div>
                      <div>{new Date(incomeData.income_date).toLocaleDateString('id-ID')}</div>
                      <div>{new Date(incomeData.income_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>

                    <div className="border-t border-dashed border-gray-300 pt-2 mb-2"></div>

                    {/* Items */}
                    {(() => {
                      let parsedItems = []
                      try {
                        parsedItems = typeof incomeData.line_items === 'string' 
                          ? JSON.parse(incomeData.line_items) 
                          : (incomeData.line_items || [])
                      } catch (e) {
                        parsedItems = []
                      }
                      
                      if (parsedItems.length > 0) {
                        return parsedItems.map((item: any, idx: number) => (
                          <div key={idx} className="mb-2">
                            <div className="font-semibold">{item.product_name}</div>
                            <div className="flex justify-between text-xs pl-2">
                              <span>{item.quantity} x {(item.price_per_unit || 0).toLocaleString('id-ID')}</span>
                              <span className="font-semibold">{(item.subtotal || 0).toLocaleString('id-ID')}</span>
                            </div>
                          </div>
                        ))
                      } else if (incomeData.product_name) {
                        return (
                          <div className="mb-2">
                            <div className="font-semibold">{incomeData.product_name}</div>
                            <div className="flex justify-between text-xs pl-2">
                              <span>{incomeData.quantity || 1} x {(incomeData.price_per_unit || 0).toLocaleString('id-ID')}</span>
                              <span className="font-semibold">{incomeData.amount.toLocaleString('id-ID')}</span>
                            </div>
                          </div>
                        )
                      }
                    })()}

                    <div className="border-t border-dashed border-gray-300 my-2"></div>

                    {/* Tax & Discounts */}
                    {incomeData.discount > 0 && (
                      <div className="flex justify-between text-xs mb-1">
                        <span>Diskon</span>
                        <span>{incomeData.discount.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    {incomeData.tax_ppn > 0 && (
                      <div className="flex justify-between text-xs mb-1">
                        <span>PPN 11%</span>
                        <span>{incomeData.tax_ppn.toLocaleString('id-ID')}</span>
                      </div>
                    )}

                    {/* Total */}
                    <div className="flex justify-between font-bold text-base my-2 pt-2 border-t-2 border-gray-800">
                      <span>Total</span>
                      <span>Rp {incomeData.amount.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span>Bayar ({incomeData.payment_method})</span>
                      <span>Rp {incomeData.amount.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-xs mb-2">
                      <span>Kembali</span>
                      <span>Rp 0</span>
                    </div>

                    {incomeData.payment_status !== 'Lunas' && (
                      <div className="text-center font-bold text-xs my-2 py-1 bg-yellow-100 border border-yellow-300">
                        STATUS: {incomeData.payment_status.toUpperCase()}
                      </div>
                    )}

                    <div className="text-xs text-gray-600 text-center border-t-2 border-dashed border-gray-300 pt-2 mt-3">
                      ================================
                      <div className="mt-1">Terima kasih atas kunjungan Anda</div>
                    </div>
                  </div>
                </div>
              ) : (
                // Invoice Preview (A4)
                <div className="bg-gradient-to-b from-gray-50 to-white p-8">
                  <div className="bg-white shadow-xl p-12 max-w-[210mm] mx-auto" style={{minHeight: '297mm'}}>
                    {/* Header */}
                    <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                      <h1 className="text-3xl font-bold text-gray-800">INVOICE</h1>
                      <p className="text-sm text-gray-600 mt-1">Nomor: INV-{incomeData.id?.substring(0, 8).toUpperCase() || 'N/A'}</p>
                    </div>

                    {/* Company & Customer Info */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                      <div>
                        <h3 className="font-bold text-lg mb-2">{businessName}</h3>
                        <p className="text-sm text-gray-600">Jl. Contoh Alamat No. 123</p>
                        <p className="text-sm text-gray-600">Jakarta Selatan, DKI Jakarta</p>
                        <p className="text-sm text-gray-600">Telp: 021-1234567</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm"><span className="font-semibold">Tanggal:</span> {new Date(incomeData.income_date).toLocaleDateString('id-ID')}</p>
                        {incomeData.due_date && (
                          <p className="text-sm"><span className="font-semibold">Jatuh Tempo:</span> {new Date(incomeData.due_date).toLocaleDateString('id-ID')}</p>
                        )}
                      </div>
                    </div>

                    {/* Bill To */}
                    <div className="border border-gray-300 rounded p-4 mb-8">
                      <p className="font-bold text-sm text-gray-600 mb-2">Tagihan Kepada:</p>
                      <p className="font-bold text-lg">{getCustomerName()}</p>
                      {getCustomerPhone() && <p className="text-sm text-gray-600">Telp: {getCustomerPhone()}</p>}
                    </div>

                    {/* Items Table */}
                    <table className="w-full mb-8 border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border-y-2 border-gray-800">
                          <th className="text-left py-3 px-4 font-bold text-sm">No.</th>
                          <th className="text-left py-3 px-4 font-bold text-sm">Deskripsi</th>
                          <th className="text-center py-3 px-4 font-bold text-sm">Qty</th>
                          <th className="text-center py-3 px-4 font-bold text-sm">Satuan</th>
                          <th className="text-right py-3 px-4 font-bold text-sm">Harga/Unit</th>
                          <th className="text-right py-3 px-4 font-bold text-sm">Jumlah</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          let parsedItems = []
                          try {
                            parsedItems = typeof incomeData.line_items === 'string' 
                              ? JSON.parse(incomeData.line_items) 
                              : (incomeData.line_items || [])
                          } catch (e) {
                            parsedItems = []
                          }
                          
                          if (parsedItems.length > 0) {
                            return parsedItems.map((item: any, idx: number) => (
                              <tr key={idx} className="border-b border-gray-200">
                                <td className="py-3 px-4 text-sm">{idx + 1}</td>
                                <td className="py-3 px-4 text-sm">{item.product_name}</td>
                                <td className="py-3 px-4 text-sm text-center">{item.quantity}</td>
                                <td className="py-3 px-4 text-sm text-center">{item.unit || 'pcs'}</td>
                                <td className="py-3 px-4 text-sm text-right">{(item.price_per_unit || 0).toLocaleString('id-ID')}</td>
                                <td className="py-3 px-4 text-sm text-right font-semibold">{(item.subtotal || 0).toLocaleString('id-ID')}</td>
                              </tr>
                            ))
                          } else if (incomeData.product_name) {
                            return (
                              <tr className="border-b border-gray-200">
                                <td className="py-3 px-4 text-sm">1</td>
                                <td className="py-3 px-4 text-sm">{incomeData.product_name}</td>
                                <td className="py-3 px-4 text-sm text-center">{incomeData.quantity || 1}</td>
                                <td className="py-3 px-4 text-sm text-center">pcs</td>
                                <td className="py-3 px-4 text-sm text-right">{(incomeData.price_per_unit || 0).toLocaleString('id-ID')}</td>
                                <td className="py-3 px-4 text-sm text-right font-semibold">{incomeData.amount.toLocaleString('id-ID')}</td>
                              </tr>
                            )
                          }
                        })()}
                      </tbody>
                    </table>

                    {/* Summary */}
                    <div className="flex justify-end mb-8">
                      <div className="w-80">
                        {incomeData.subtotal > 0 && (
                          <div className="flex justify-between py-2 text-sm border-b border-gray-200">
                            <span>Subtotal</span>
                            <span>Rp {incomeData.subtotal.toLocaleString('id-ID')}</span>
                          </div>
                        )}
                        {incomeData.discount > 0 && (
                          <div className="flex justify-between py-2 text-sm border-b border-gray-200">
                            <span>Diskon</span>
                            <span>Rp {incomeData.discount.toLocaleString('id-ID')}</span>
                          </div>
                        )}
                        {incomeData.tax_ppn > 0 && (
                          <div className="flex justify-between py-2 text-sm border-b border-gray-200">
                            <span>PPN 11%</span>
                            <span>Rp {incomeData.tax_ppn.toLocaleString('id-ID')}</span>
                          </div>
                        )}
                        <div className="flex justify-between py-3 text-lg font-bold border-t-2 border-gray-800">
                          <span>TOTAL</span>
                          <span>Rp {incomeData.amount.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="mb-8">
                      <p className="font-bold text-sm mb-2">Pesan:</p>
                      <p className="text-sm text-gray-700">Metode Pembayaran: {incomeData.payment_method}</p>
                      <p className="text-sm text-gray-700">Status Pembayaran: <span className={incomeData.payment_status === 'Lunas' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{incomeData.payment_status}</span></p>
                      <p className="text-sm text-gray-700 mt-2">Harap melakukan pembayaran sesuai nominal yang tertera.</p>
                      <p className="text-sm text-gray-700">Terima kasih atas kepercayaan Anda.</p>
                    </div>

                    {/* Signature */}
                    <div className="flex justify-end mt-16">
                      <div className="text-center">
                        <p className="text-sm mb-16">Dengan Hormat,</p>
                        <p className="font-bold border-t border-gray-800 pt-2">{businessName}</p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t border-gray-200">
                      Dokumen ini dibuat secara elektronik dan sah tanpa tanda tangan basah
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
