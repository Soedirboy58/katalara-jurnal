'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, PrinterIcon, DocumentArrowDownIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { jsPDF } from 'jspdf'

interface InvoiceItem {
  productName: string
  quantity: number
  pricePerUnit: number
  total: number
}

interface InvoiceData {
  invoiceNumber: string
  date: string
  customerName?: string
  items: InvoiceItem[]
  subtotal: number
  tax?: number
  total: number
  paymentMethod: string
  dueDate?: string
}

interface InvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  invoiceData: InvoiceData
  businessName: string
}

export function InvoiceModal({ isOpen, onClose, invoiceData, businessName }: InvoiceModalProps) {
  
  const formatCurrency = (value: number) => {
    return `Rp ${value.toLocaleString('id-ID')}`
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(businessName || 'Invoice', 105, 20, { align: 'center' })
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Invoice Penjualan', 105, 28, { align: 'center' })
    
    // Invoice Info
    doc.setFontSize(11)
    doc.text(`No. Invoice: ${invoiceData.invoiceNumber}`, 20, 45)
    doc.text(`Tanggal: ${new Date(invoiceData.date).toLocaleDateString('id-ID')}`, 20, 52)
    if (invoiceData.customerName) {
      doc.text(`Pelanggan: ${invoiceData.customerName}`, 20, 59)
    }
    
    // Line
    doc.line(20, 65, 190, 65)
    
    // Table Header
    doc.setFont('helvetica', 'bold')
    doc.text('Produk', 20, 73)
    doc.text('Qty', 120, 73)
    doc.text('Harga', 140, 73)
    doc.text('Total', 170, 73, { align: 'right' })
    
    doc.line(20, 75, 190, 75)
    
    // Items
    doc.setFont('helvetica', 'normal')
    let yPos = 83
    invoiceData.items.forEach((item) => {
      doc.text(item.productName, 20, yPos)
      doc.text(item.quantity.toString(), 120, yPos)
      doc.text(formatCurrency(item.pricePerUnit), 140, yPos)
      doc.text(formatCurrency(item.total), 190, yPos, { align: 'right' })
      yPos += 7
    })
    
    // Line before total
    doc.line(20, yPos + 2, 190, yPos + 2)
    yPos += 10
    
    // Totals
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL:', 140, yPos)
    doc.text(formatCurrency(invoiceData.total), 190, yPos, { align: 'right' })
    
    yPos += 10
    doc.setFont('helvetica', 'normal')
    doc.text(`Metode Pembayaran: ${invoiceData.paymentMethod}`, 20, yPos)
    
    if (invoiceData.dueDate) {
      yPos += 7
      doc.text(`Jatuh Tempo: ${new Date(invoiceData.dueDate).toLocaleDateString('id-ID')}`, 20, yPos)
    }
    
    // Footer
    doc.setFontSize(9)
    doc.text('Terima kasih atas pembelian Anda!', 105, 280, { align: 'center' })
    
    // Save PDF
    doc.save(`Invoice-${invoiceData.invoiceNumber}.pdf`)
  }

  const handleWhatsApp = () => {
    const message = `*INVOICE ${invoiceData.invoiceNumber}*\n\n` +
      `Terima kasih atas pembelian Anda!\n\n` +
      `Tanggal: ${new Date(invoiceData.date).toLocaleDateString('id-ID')}\n` +
      `Total: ${formatCurrency(invoiceData.total)}\n` +
      `Pembayaran: ${invoiceData.paymentMethod}\n\n` +
      `Detail:\n` +
      invoiceData.items.map(item => 
        `- ${item.productName} (${item.quantity}x) = ${formatCurrency(item.total)}`
      ).join('\n')
    
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank')
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-7 h-7 text-green-600" />
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-xl font-bold text-gray-900">
                        Transaksi Berhasil!
                      </Dialog.Title>
                      <p className="text-sm text-gray-600 mt-1">
                        Invoice #{invoiceData.invoiceNumber}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Invoice Content */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6 print:bg-white">
                  {/* Invoice Header */}
                  <div className="mb-6 pb-4 border-b border-gray-200">
                    <h4 className="text-lg font-bold text-gray-900 mb-1">{businessName}</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>No. Invoice: <span className="font-semibold">{invoiceData.invoiceNumber}</span></p>
                      <p>Tanggal: {new Date(invoiceData.date).toLocaleDateString('id-ID', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                      {invoiceData.customerName && (
                        <p>Pelanggan: <span className="font-semibold">{invoiceData.customerName}</span></p>
                      )}
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="mb-6">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left py-2 font-semibold text-gray-700">Produk</th>
                          <th className="text-center py-2 font-semibold text-gray-700">Qty</th>
                          <th className="text-right py-2 font-semibold text-gray-700">Harga</th>
                          <th className="text-right py-2 font-semibold text-gray-700">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceData.items.map((item, index) => (
                          <tr key={index} className="border-b border-gray-200">
                            <td className="py-3 text-gray-900">{item.productName}</td>
                            <td className="py-3 text-center text-gray-900">{item.quantity}</td>
                            <td className="py-3 text-right text-gray-900">{formatCurrency(item.pricePerUnit)}</td>
                            <td className="py-3 text-right font-semibold text-gray-900">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(invoiceData.subtotal)}</span>
                    </div>
                    {invoiceData.tax && invoiceData.tax > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Pajak:</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(invoiceData.tax)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t-2 border-gray-300">
                      <span className="text-lg font-bold text-gray-900">TOTAL:</span>
                      <span className="text-xl font-bold text-blue-600">{formatCurrency(invoiceData.total)}</span>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="bg-blue-50 rounded-lg p-4 text-sm">
                    <p className="text-gray-700">
                      <span className="font-semibold">Metode Pembayaran:</span> {invoiceData.paymentMethod}
                    </p>
                    {invoiceData.dueDate && (
                      <p className="text-gray-700 mt-1">
                        <span className="font-semibold">Jatuh Tempo:</span> {new Date(invoiceData.dueDate).toLocaleDateString('id-ID')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors print:hidden"
                  >
                    <PrinterIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Cetak</span>
                  </button>
                  
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors print:hidden"
                  >
                    <DocumentArrowDownIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>
                  
                  <button
                    onClick={handleWhatsApp}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors print:hidden"
                  >
                    <span className="text-lg">📲</span>
                    <span className="hidden sm:inline">WhatsApp</span>
                  </button>
                  
                  <button
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors print:hidden"
                  >
                    <span className="text-lg">🔄</span>
                    <span className="hidden sm:inline">Baru</span>
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-4 print:hidden">
                  💡 Tip: Gunakan tombol WhatsApp untuk kirim invoice langsung ke customer
                </p>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
