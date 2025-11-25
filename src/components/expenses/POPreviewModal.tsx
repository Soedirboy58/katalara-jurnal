'use client'

import { useState } from 'react'

interface POPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  expenseData: any
  businessName: string
}

export default function POPreviewModal({ isOpen, onClose, expenseData, businessName }: POPreviewModalProps) {
  const [showPreview, setShowPreview] = useState(false)

  if (!isOpen || !expenseData) return null

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num)
  }

  const handleDownloadPDF = () => {
    // Trigger browser print dialog for PDF generation
    window.print()
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {!showPreview ? (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold">Detail Pengeluaran</h2>
                  <p className="text-blue-100 text-xs md:text-sm mt-1">Purchase Order & Tracking Pembayaran</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">PO Number</div>
                  <div className="font-mono font-bold text-lg text-blue-600">{expenseData.purchase_order_number || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Tanggal</div>
                  <div className="font-medium">{new Date(expenseData.expense_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Supplier</div>
                  <div className="font-medium">{expenseData.supplier?.name || 'Tanpa Supplier'}</div>
                  {expenseData.supplier?.phone && (
                    <div className="text-xs text-gray-600 mt-1">📞 {expenseData.supplier.phone}</div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Kategori</div>
                  <div className="font-medium">{expenseData.category}</div>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h3 className="font-bold text-gray-800 text-sm md:text-base mb-2 md:mb-3 pb-2 border-b-2 border-gray-200">Daftar Item</h3>
                {expenseData.items && expenseData.items.length > 0 ? (
                  <div className="space-y-2 max-h-48 md:max-h-none overflow-y-auto">
                    {expenseData.items.map((item: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-2 md:p-3 flex items-center justify-between hover:bg-gray-100 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-800 text-sm md:text-base truncate">{item.product_name}</div>
                          <div className="text-xs md:text-sm text-gray-600">
                            {item.quantity} {item.unit} × Rp {formatCurrency(item.price_per_unit)}
                          </div>
                        </div>
                        <div className="font-bold text-red-600 text-sm md:text-base ml-2">
                          Rp {formatCurrency(item.subtotal)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-4 bg-gray-50 rounded-lg">Tidak ada item</div>
                )}
              </div>

              {/* Financial Summary */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 md:p-4 space-y-1.5 md:space-y-2 border border-gray-200">
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">Rp {formatCurrency(expenseData.subtotal || 0)}</span>
                </div>
                {expenseData.discount_amount > 0 && (
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-gray-600">Diskon ({expenseData.discount_percent}%)</span>
                    <span className="font-medium text-red-600">- Rp {formatCurrency(expenseData.discount_amount)}</span>
                  </div>
                )}
                {expenseData.tax_amount > 0 && (
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-gray-600">Pajak</span>
                    <span className="font-medium">Rp {formatCurrency(expenseData.tax_amount)}</span>
                  </div>
                )}
                {expenseData.other_fees > 0 && (
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-gray-600">Biaya Lain</span>
                    <span className="font-medium">Rp {formatCurrency(expenseData.other_fees)}</span>
                  </div>
                )}
                <div className="border-t-2 border-gray-300 pt-2 flex justify-between">
                  <span className="font-bold text-gray-800 text-base md:text-lg">TOTAL</span>
                  <span className="font-bold text-red-600 text-xl md:text-2xl">Rp {formatCurrency(expenseData.grand_total || expenseData.amount || 0)}</span>
                </div>
              </div>

              {/* Payment Status & Tracking */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-lg p-3 md:p-4">
                <h3 className="font-bold text-gray-800 text-sm md:text-base mb-2 md:mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Status Pembayaran & Tracking Hutang
                </h3>
                <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2 md:mb-3">
                  <span className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold ${
                    expenseData.payment_status === 'Lunas'
                      ? 'bg-green-100 text-green-700 border-2 border-green-300'
                      : 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                  }`}>
                    {expenseData.payment_status === 'Lunas' ? '✓ LUNAS' : '⏰ TEMPO'}
                  </span>
                  {expenseData.payment_status === 'Tempo' && expenseData.due_date && (
                    <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-semibold text-orange-700">
                        Jatuh Tempo: {new Date(expenseData.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>
                {expenseData.payment_status === 'Tempo' && (
                  <div className="bg-white rounded-lg p-3 md:p-4 border-2 border-orange-300 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs md:text-sm text-gray-600">Down Payment (DP):</span>
                      <span className="font-bold text-green-700 text-base md:text-lg">Rp {formatCurrency(expenseData.down_payment || 0)}</span>
                    </div>
                    <div className="border-t border-orange-200 pt-2 flex justify-between items-center">
                      <span className="text-xs md:text-sm font-semibold text-gray-700">Sisa Hutang ke Supplier:</span>
                      <span className="font-bold text-red-600 text-lg md:text-xl">Rp {formatCurrency(expenseData.remaining_payment || 0)}</span>
                    </div>
                    <div className="bg-orange-100 rounded p-2 mt-2">
                      <p className="text-xs text-orange-800">
                        💡 <strong>Reminder:</strong> Pastikan pelunasan sebelum tanggal jatuh tempo untuk menjaga hubungan baik dengan supplier
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {expenseData.notes && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-blue-900 mb-2 text-sm">Catatan:</h3>
                  <p className="text-sm text-gray-700">{expenseData.notes}</p>
                </div>
              )}

              {/* Action Buttons - Responsive: Icon-only on mobile, full on desktop */}
              <div className="flex items-center justify-center gap-3 pt-4 border-t-2 border-gray-200">
                <button
                  onClick={() => setShowPreview(true)}
                  className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white p-3 md:px-6 md:py-3 rounded-lg font-medium transition-colors shadow-md"
                  title="Preview PO"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="hidden md:inline">Preview PO</span>
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white p-3 md:px-6 md:py-3 rounded-lg font-medium transition-colors shadow-md"
                  title="Download PDF"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="hidden md:inline">Download PDF</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white p-3 md:px-8 md:py-3 rounded-lg font-medium transition-colors shadow-md"
                  title="Tutup"
                >
                  <svg className="w-5 h-5 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="hidden md:inline">Tutup</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Purchase Order A4 Preview */}
            <div className="bg-white">
              {/* Preview Controls - Responsive: Icon-only on mobile */}
              <div className="bg-gray-100 p-3 md:p-4 flex items-center justify-between border-b print:hidden">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium p-2 md:p-0"
                  title="Kembali"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="hidden md:inline">Kembali</span>
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white p-2 md:px-4 md:py-2 rounded-lg font-medium transition-colors"
                    title="Print / Download"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span className="hidden md:inline">Print / Download</span>
                  </button>
                </div>
              </div>

              {/* A4 Document */}
              <div className="bg-gray-200 p-4 md:p-8 print:p-0 print:bg-white">
                <div 
                  className="bg-white shadow-xl mx-auto print:shadow-none" 
                  style={{
                    width: '100%',
                    maxWidth: '210mm',
                    minHeight: '297mm',
                    padding: typeof window !== 'undefined' && window.innerWidth < 768 ? '12px' : '32px'
                  }}
                >
                  {/* Header */}
                  <div className="text-center border-b-4 border-blue-600 pb-4 mb-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-blue-600">PURCHASE ORDER</h1>
                    <p className="text-lg md:text-xl font-mono font-bold text-gray-900 mt-2">{expenseData.purchase_order_number || 'PO/2025/000001'}</p>
                  </div>

                  {/* Company & Supplier Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="font-bold text-sm text-gray-500 mb-2">DARI:</h3>
                      <h2 className="font-bold text-lg text-black mb-1">{businessName}</h2>
                      <p className="text-sm text-gray-700">Jl. Contoh Alamat No. 123</p>
                      <p className="text-sm text-gray-700">Jakarta Selatan, DKI Jakarta</p>
                      <p className="text-sm text-gray-700">Telp: 021-1234567</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-500 mb-2">KEPADA SUPPLIER:</h3>
                      <h2 className="font-bold text-lg text-black mb-1">{expenseData.supplier?.name || 'Supplier'}</h2>
                      {expenseData.supplier?.phone && (
                        <p className="text-sm text-gray-700">Telp: {expenseData.supplier.phone}</p>
                      )}
                      {expenseData.supplier?.address && (
                        <p className="text-sm text-gray-700 mt-1">{expenseData.supplier.address}</p>
                      )}
                    </div>
                  </div>

                  {/* Date & Payment Info */}
                  <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <span className="text-sm font-semibold text-gray-600">Tanggal PO:</span>
                      <p className="font-medium text-gray-900">{new Date(expenseData.expense_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-600">Metode Bayar:</span>
                      <p className="font-medium text-gray-900">{expenseData.payment_method}</p>
                    </div>
                  </div>

                  {/* Items Table - Responsive: Hide on mobile, show cards instead */}
                  <div className="mb-6">
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-blue-600 text-white">
                            <th className="text-left py-3 px-3 font-bold text-sm border border-blue-700">No.</th>
                            <th className="text-left py-3 px-3 font-bold text-sm border border-blue-700">Deskripsi</th>
                            <th className="text-center py-3 px-3 font-bold text-sm border border-blue-700">Qty</th>
                            <th className="text-center py-3 px-3 font-bold text-sm border border-blue-700">Satuan</th>
                            <th className="text-right py-3 px-3 font-bold text-sm border border-blue-700">Harga/Unit</th>
                            <th className="text-right py-3 px-3 font-bold text-sm border border-blue-700">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenseData.items && expenseData.items.length > 0 ? (
                            expenseData.items.map((item: any, idx: number) => (
                              <tr key={idx} className="border-b border-gray-300">
                                <td className="py-2 px-3 text-sm">{idx + 1}</td>
                                <td className="py-2 px-3 text-sm font-medium">{item.product_name}</td>
                                <td className="py-2 px-3 text-sm text-center">{item.quantity}</td>
                                <td className="py-2 px-3 text-sm text-center">{item.unit}</td>
                                <td className="py-2 px-3 text-sm text-right">Rp {formatCurrency(item.price_per_unit)}</td>
                                <td className="py-2 px-3 text-sm text-right font-semibold">Rp {formatCurrency(item.subtotal)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="text-center py-4 text-gray-400">Tidak ada item</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {expenseData.items && expenseData.items.length > 0 ? (
                        expenseData.items.map((item: any, idx: number) => (
                          <div key={idx} className="bg-gray-50 border-2 border-gray-300 rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded">#{idx + 1}</span>
                                  <span className="font-bold text-sm text-gray-900 truncate">{item.product_name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <span>Qty: <strong className="text-gray-900">{item.quantity} {item.unit}</strong></span>
                                  <span>•</span>
                                  <span>@ Rp {formatCurrency(item.price_per_unit)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-gray-300">
                              <span className="text-xs font-semibold text-gray-600">Subtotal:</span>
                              <span className="text-sm font-bold text-gray-900">Rp {formatCurrency(item.subtotal)}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-gray-400 text-sm">Tidak ada item</div>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="flex justify-end mb-6">
                    <div className="w-full md:w-96 space-y-2">
                      <div className="flex justify-between py-2 text-sm border-b border-gray-200">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">Rp {formatCurrency(expenseData.subtotal || 0)}</span>
                      </div>
                      {expenseData.discount_amount > 0 && (
                        <div className="flex justify-between py-2 text-sm border-b border-gray-200">
                          <span className="text-gray-600">Diskon ({expenseData.discount_percent}%)</span>
                          <span className="font-medium text-red-600">- Rp {formatCurrency(expenseData.discount_amount)}</span>
                        </div>
                      )}
                      {expenseData.tax_amount > 0 && (
                        <div className="flex justify-between py-2 text-sm border-b border-gray-200">
                          <span className="text-gray-600">Pajak</span>
                          <span className="font-medium">Rp {formatCurrency(expenseData.tax_amount)}</span>
                        </div>
                      )}
                      {expenseData.other_fees > 0 && (
                        <div className="flex justify-between py-2 text-sm border-b border-gray-200">
                          <span className="text-gray-600">Biaya Lain</span>
                          <span className="font-medium">Rp {formatCurrency(expenseData.other_fees)}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-3 text-lg font-bold border-t-2 border-blue-600 bg-blue-50 px-3 rounded">
                        <span>TOTAL</span>
                        <span className="text-blue-600">Rp {formatCurrency(expenseData.grand_total || expenseData.amount || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Terms */}
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg border-l-4 border-orange-500">
                    <h3 className="font-bold text-sm mb-2">TERMS PEMBAYARAN:</h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>Status:</strong> {expenseData.payment_status === 'Lunas' ? '✓ LUNAS' : '⏰ TEMPO'}</p>
                      {expenseData.payment_status === 'Tempo' && (
                        <>
                          <p><strong>Down Payment:</strong> Rp {formatCurrency(expenseData.down_payment || 0)}</p>
                          <p className="text-red-600 font-semibold"><strong>Sisa Pembayaran:</strong> Rp {formatCurrency(expenseData.remaining_payment || 0)}</p>
                          {expenseData.due_date && (
                            <p className="text-orange-600 font-semibold"><strong>Jatuh Tempo:</strong> {new Date(expenseData.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {expenseData.notes && (
                    <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg">
                      <h3 className="font-semibold text-sm mb-2">CATATAN:</h3>
                      <p className="text-sm text-gray-700">{expenseData.notes}</p>
                    </div>
                  )}

                  {/* Signature */}
                  <div className="grid grid-cols-2 gap-8 mt-12">
                    <div className="text-center">
                      <p className="text-sm mb-12">Supplier,</p>
                      <div className="border-t-2 border-gray-800 pt-2">
                        <p className="font-bold">{expenseData.supplier?.name || '( _____________ )'}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm mb-12">Pembeli,</p>
                      <div className="border-t-2 border-gray-800 pt-2">
                        <p className="font-bold">{businessName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t border-gray-200">
                    Dokumen ini dibuat secara elektronik dan sah sebagai bukti transaksi
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
