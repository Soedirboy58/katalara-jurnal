'use client';

import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import { CartItem, CheckoutForm } from '@/types/lapak';
import { uploadPaymentProof } from '@/lib/uploadPaymentProof';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useConfirm } from '@/hooks/useConfirm';
import { showToast, ToastContainer } from '@/components/ui/Toast';
import { provinsiList, kabupatenList, kecamatanList } from '@/lib/data/wilayah-indonesia';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  totalAmount: number;
  themeColor: string;
  storeName: string;
  storefrontSlug: string;
  qrisImage?: string;
  businessBankAccount?: {
    bank_name: string;
    account_number: string;
    account_holder: string;
  };
  onPaymentComplete: (payload: {
    method: 'qris' | 'transfer' | 'cash';
    customer: CheckoutForm;
    paymentProofUrl?: string;
    orderCode: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

export default function PaymentModal({
  isOpen,
  onClose,
  cartItems,
  totalAmount,
  themeColor,
  storeName,
  storefrontSlug,
  qrisImage,
  businessBankAccount,
  onPaymentComplete,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'transfer' | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [orderCode, setOrderCode] = useState('');
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    customer_province_id: '',
    customer_province_name: '',
    customer_kabupaten_id: '',
    customer_kabupaten_name: '',
    customer_kecamatan_id: '',
    customer_kecamatan_name: '',
    customer_desa_id: '',
    customer_desa_name: '',
    customer_address_detail: '',
    customer_rt_rw: '',
    customer_landmark: '',
    delivery_method: 'delivery',
    notes: '',
  });
  const [desaOptions, setDesaOptions] = useState<Array<{ id: string; nama: string }>>([])
  const [desaLoading, setDesaLoading] = useState(false)
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | undefined>(undefined);
  const [paymentProofUploading, setPaymentProofUploading] = useState(false);
  const [paymentProofError, setPaymentProofError] = useState<string | null>(null);
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  useEffect(() => {
    if (!isOpen) return;
    setPaymentMethod(null);
    setShowVerification(false);
    setPaymentProofUrl(undefined);
    setPaymentProofUploading(false);
    setPaymentProofError(null);
    setCheckoutForm({
      customer_name: '',
      customer_phone: '',
      customer_address: '',
      customer_province_id: '',
      customer_province_name: '',
      customer_kabupaten_id: '',
      customer_kabupaten_name: '',
      customer_kecamatan_id: '',
      customer_kecamatan_name: '',
      customer_desa_id: '',
      customer_desa_name: '',
      customer_address_detail: '',
      customer_rt_rw: '',
      customer_landmark: '',
      delivery_method: 'delivery',
      notes: '',
    });
    setOrderCode(`KNT-${Date.now().toString().slice(-8)}`);
  }, [isOpen]);

  const normalizePhone = (value: string) => {
    let v = value.replace(/\D/g, '');
    if (v.startsWith('0')) v = v.slice(1);
    if (v && !v.startsWith('62')) v = `62${v}`;
    return v;
  };

  const buildAddressString = (form: CheckoutForm) => {
    const detail = (form.customer_address_detail || '').trim()
    const rtRw = (form.customer_rt_rw || '').trim()
    const landmark = (form.customer_landmark || '').trim()
    const desa = (form.customer_desa_name || '').trim()
    const kecamatan = (form.customer_kecamatan_name || '').trim()
    const kabupaten = (form.customer_kabupaten_name || '').trim()
    const provinsi = (form.customer_province_name || '').trim()

    const addressParts = [detail]
    if (rtRw) addressParts.push(`RT/RW ${rtRw}`)
    if (landmark) addressParts.push(`Patokan: ${landmark}`)

    const regionParts = [desa, kecamatan, kabupaten, provinsi].filter(Boolean)
    if (regionParts.length) addressParts.push(regionParts.join(', '))

    return addressParts.filter(Boolean).join(', ')
  }

  const isAddressComplete = checkoutForm.delivery_method === 'pickup'
    ? true
    : Boolean(
        checkoutForm.customer_province_id &&
        checkoutForm.customer_kabupaten_id &&
        checkoutForm.customer_kecamatan_id &&
        checkoutForm.customer_desa_name &&
        checkoutForm.customer_address_detail?.trim()
      )

  const isCustomerValid =
    checkoutForm.customer_name.trim().length > 0 &&
    checkoutForm.customer_phone.trim().length > 0 &&
    isAddressComplete;

  const requiresProof = paymentMethod === 'qris' || paymentMethod === 'transfer';

  const kabupatenOptions = useMemo(() => {
    if (!checkoutForm.customer_province_id) return []
    return kabupatenList.filter((row) => row.provinsi_id === checkoutForm.customer_province_id)
  }, [checkoutForm.customer_province_id])

  const kecamatanOptions = useMemo(() => {
    if (!checkoutForm.customer_kabupaten_id) return []
    return kecamatanList.filter((row) => row.kabupaten_id === checkoutForm.customer_kabupaten_id)
  }, [checkoutForm.customer_kabupaten_id])

  useEffect(() => {
    const kecamatanId = checkoutForm.customer_kecamatan_id
    if (!kecamatanId) {
      setDesaOptions([])
      return
    }

    const fetchDesa = async () => {
      setDesaLoading(true)
      try {
        const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${kecamatanId}.json`)
        const data = await res.json().catch(() => [])
        if (Array.isArray(data)) {
          setDesaOptions(data.map((row: any) => ({ id: String(row.id), nama: String(row.name) })))
        } else {
          setDesaOptions([])
        }
      } catch {
        setDesaOptions([])
      } finally {
        setDesaLoading(false)
      }
    }

    fetchDesa()
  }, [checkoutForm.customer_kecamatan_id])

  const handleProofUpload = async (file?: File) => {
    if (!file) return;

    setPaymentProofUploading(true);
    setPaymentProofError(null);

    const result = await uploadPaymentProof(file, storefrontSlug, orderCode || 'KNT');
    if (result.success && result.url) {
      setPaymentProofUrl(result.url);
    } else {
      setPaymentProofError(result.error || 'Gagal upload bukti pembayaran');
    }

    setPaymentProofUploading(false);
  };

  const handleCashPayment = async () => {
    if (!isCustomerValid) {
      showToast('Lengkapi data pembeli terlebih dahulu.', 'warning');
      return;
    }
    const resolvedAddress = checkoutForm.delivery_method === 'delivery'
      ? buildAddressString(checkoutForm)
      : ''
    const ok = await confirm({
      title: 'Konfirmasi pembayaran',
      message: 'Konfirmasi pembayaran tunai?',
      confirmText: 'Konfirmasi',
      cancelText: 'Batal',
      type: 'warning'
    });
    if (ok) {
      const result = await onPaymentComplete({
        method: 'cash',
        customer: {
          ...checkoutForm,
          customer_address: resolvedAddress,
        },
        orderCode,
      });
      if (result?.success) onClose();
    }
  };

  const handleVerifyPayment = async () => {
    if (!isCustomerValid) {
      showToast('Lengkapi data pembeli terlebih dahulu.', 'warning');
      return;
    }
    const resolvedAddress = checkoutForm.delivery_method === 'delivery'
      ? buildAddressString(checkoutForm)
      : ''
    if (requiresProof && !paymentProofUrl) {
      showToast('Mohon upload bukti pembayaran terlebih dahulu.', 'warning');
      return;
    }
    const ok = await confirm({
      title: 'Konfirmasi pembayaran',
      message: 'Konfirmasi bahwa pembayaran sudah dilakukan?',
      confirmText: 'Konfirmasi',
      cancelText: 'Batal',
      type: 'warning'
    });
    if (ok) {
      const result = await onPaymentComplete({
        method: paymentMethod || 'qris',
        customer: {
          ...checkoutForm,
          customer_address: resolvedAddress,
        },
        paymentProofUrl,
        orderCode,
      });
      if (result?.success) {
        setShowVerification(false);
        onClose();
      }
    }
  };

  // Generate transfer instructions
  const transferInstructions = businessBankAccount ? [
    { step: 1, text: `Transfer ke ${businessBankAccount.bank_name}` },
    { step: 2, text: `No. Rek: ${businessBankAccount.account_number}` },
    { step: 3, text: `A/n: ${businessBankAccount.account_holder}` },
    { step: 4, text: `Nominal: Rp ${totalAmount.toLocaleString('id-ID')}` },
    { step: 5, text: 'Upload bukti transfer' },
    { step: 6, text: 'Konfirmasi pembayaran' },
  ] : [];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {/* Modal */}
        <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          {!paymentMethod ? (
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white text-center">
              <div className="relative mb-2">
                <h2 className="text-xl font-bold text-center">Checkout Berhasil!</h2>
                <button
                  onClick={onClose}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="text-3xl mb-2">✓</div>
              <p className="text-sm text-green-100">Kode Transaksi</p>
              <p className="text-xl font-mono font-bold">{orderCode}</p>
            </div>
          ) : (
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <button
                onClick={() => {
                  setPaymentMethod(null);
                  setShowVerification(false);
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Kembali
              </button>
              <h3 className="font-bold text-gray-900">
                {paymentMethod === 'qris' ? 'Scan QRIS' : 'Transfer Bank'}
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
          )}

          {/* Content */}
          {!paymentMethod ? (
            <div className="p-6">
              {/* Customer Info */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">Data Pembeli</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama *</label>
                    <input
                      type="text"
                      value={checkoutForm.customer_name}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, customer_name: e.target.value })}
                      placeholder="Nama pembeli"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">No. WhatsApp *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-600 text-sm">+62</span>
                      <input
                        type="tel"
                        value={checkoutForm.customer_phone.replace(/^62/, '')}
                        onChange={(e) => {
                          const formatted = normalizePhone(e.target.value);
                          setCheckoutForm({ ...checkoutForm, customer_phone: formatted });
                        }}
                        placeholder="8123456789"
                        className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Metode Pengiriman</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setCheckoutForm({ ...checkoutForm, delivery_method: 'delivery' })}
                        className={`flex-1 py-2 rounded-lg border ${
                          checkoutForm.delivery_method === 'delivery'
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 text-gray-600'
                        }`}
                      >
                        🚚 Diantar
                      </button>
                      <button
                        type="button"
                        onClick={() => setCheckoutForm({
                          ...checkoutForm,
                          delivery_method: 'pickup',
                          customer_address: '',
                          customer_province_id: '',
                          customer_province_name: '',
                          customer_kabupaten_id: '',
                          customer_kabupaten_name: '',
                          customer_kecamatan_id: '',
                          customer_kecamatan_name: '',
                          customer_desa_id: '',
                          customer_desa_name: '',
                          customer_address_detail: '',
                          customer_rt_rw: '',
                          customer_landmark: '',
                        })}
                        className={`flex-1 py-2 rounded-lg border ${
                          checkoutForm.delivery_method === 'pickup'
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 text-gray-600'
                        }`}
                      >
                        🏪 Ambil Sendiri
                      </button>
                    </div>
                  </div>
                  {checkoutForm.delivery_method === 'delivery' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Alamat Pengiriman *</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Provinsi *</label>
                          <select
                            value={checkoutForm.customer_province_id || ''}
                            onChange={(e) => {
                              const value = e.target.value
                              const selected = provinsiList.find((row) => row.id === value)
                              setCheckoutForm({
                                ...checkoutForm,
                                customer_province_id: value,
                                customer_province_name: selected?.nama || '',
                                customer_kabupaten_id: '',
                                customer_kabupaten_name: '',
                                customer_kecamatan_id: '',
                                customer_kecamatan_name: '',
                                customer_desa_id: '',
                                customer_desa_name: '',
                              })
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Pilih provinsi</option>
                            {provinsiList.map((prov) => (
                              <option key={prov.id} value={prov.id}>{prov.nama}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Kabupaten/Kota *</label>
                          <select
                            value={checkoutForm.customer_kabupaten_id || ''}
                            onChange={(e) => {
                              const value = e.target.value
                              const selected = kabupatenOptions.find((row) => row.id === value)
                              setCheckoutForm({
                                ...checkoutForm,
                                customer_kabupaten_id: value,
                                customer_kabupaten_name: selected?.nama || '',
                                customer_kecamatan_id: '',
                                customer_kecamatan_name: '',
                                customer_desa_id: '',
                                customer_desa_name: '',
                              })
                            }}
                            disabled={!checkoutForm.customer_province_id}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          >
                            <option value="">Pilih kabupaten/kota</option>
                            {kabupatenOptions.map((kab) => (
                              <option key={kab.id} value={kab.id}>{kab.nama}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Kecamatan *</label>
                          <select
                            value={checkoutForm.customer_kecamatan_id || ''}
                            onChange={(e) => {
                              const value = e.target.value
                              const selected = kecamatanOptions.find((row) => row.id === value)
                              setCheckoutForm({
                                ...checkoutForm,
                                customer_kecamatan_id: value,
                                customer_kecamatan_name: selected?.nama || '',
                                customer_desa_id: '',
                                customer_desa_name: '',
                              })
                            }}
                            disabled={!checkoutForm.customer_kabupaten_id}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          >
                            <option value="">Pilih kecamatan</option>
                            {kecamatanOptions.map((kec) => (
                              <option key={kec.id} value={kec.id}>{kec.nama}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Desa/Kelurahan *</label>
                          <select
                            value={checkoutForm.customer_desa_id || ''}
                            onChange={(e) => {
                              const value = e.target.value
                              const selected = desaOptions.find((row) => row.id === value)
                              setCheckoutForm({
                                ...checkoutForm,
                                customer_desa_id: value,
                                customer_desa_name: selected?.nama || '',
                              })
                            }}
                            disabled={!checkoutForm.customer_kecamatan_id || desaLoading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          >
                            <option value="">{desaLoading ? 'Memuat desa...' : 'Pilih desa/kelurahan'}</option>
                            {desaOptions.map((desa) => (
                              <option key={desa.id} value={desa.id}>{desa.nama}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">RT/RW</label>
                          <input
                            type="text"
                            value={checkoutForm.customer_rt_rw || ''}
                            onChange={(e) => setCheckoutForm({ ...checkoutForm, customer_rt_rw: e.target.value })}
                            placeholder="001/002"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Patokan</label>
                          <input
                            type="text"
                            value={checkoutForm.customer_landmark || ''}
                            onChange={(e) => setCheckoutForm({ ...checkoutForm, customer_landmark: e.target.value })}
                            placeholder="Contoh: dekat masjid"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Alamat Detail *</label>
                        <textarea
                          value={checkoutForm.customer_address_detail || ''}
                          onChange={(e) => setCheckoutForm({ ...checkoutForm, customer_address_detail: e.target.value })}
                          rows={2}
                          placeholder="Nama jalan, nomor rumah, blok, dll."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
                    <textarea
                      value={checkoutForm.notes || ''}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, notes: e.target.value })}
                      rows={2}
                      placeholder="Catatan untuk penjual"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                {!isCustomerValid && (
                  <p className="text-xs text-red-600 mt-2">Lengkapi data pembeli sebelum melanjutkan pembayaran.</p>
                )}
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Item:</span>
                  <span className="font-medium">{cartItems.reduce((sum, item) => sum + item.quantity, 0)} item</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">Total Bayar:</span>
                  <span className="text-2xl font-bold" style={{ color: themeColor }}>
                    Rp {totalAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Ringkasan Pesanan */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">Ringkasan Pesanan</h3>
                <div className="space-y-2">
                  {cartItems.map((item) => (
                    <div key={item.product_id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        {item.product_name} <span className="text-gray-500">x{item.quantity}</span>
                      </span>
                      <span className="font-medium text-gray-900">
                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">Cara Pembayaran:</h3>
                <div className="space-y-3">
                  {/* Download QRIS Button */}
                  <button
                    onClick={() => {
                      const qrCodeSvg = document.getElementById('qris-code');
                      if (qrCodeSvg) {
                        const svgData = new XMLSerializer().serializeToString(qrCodeSvg);
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const img = new Image();
                        img.onload = () => {
                          canvas.width = img.width;
                          canvas.height = img.height;
                          ctx?.drawImage(img, 0, 0);
                          const pngFile = canvas.toDataURL('image/png');
                          const downloadLink = document.createElement('a');
                          downloadLink.download = `QRIS-${storeName}.png`;
                          downloadLink.href = pngFile;
                          downloadLink.click();
                        };
                        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                      }
                    }}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download QRIS
                  </button>

                  {/* Cash Payment Button */}
                  <button
                    onClick={handleCashPayment}
                    disabled={!isCustomerValid}
                    className="w-full py-4 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    💵 Bayar Tunai
                  </button>

                  {/* Transfer Bank Button */}
                  {businessBankAccount && (
                    <button
                      onClick={() => setPaymentMethod('transfer')}
                      disabled={!isCustomerValid}
                      className="w-full py-4 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Transfer Bank
                    </button>
                  )}

                  {/* Verify Payment Button */}
                  <button
                    onClick={() => {
                      setPaymentMethod('qris');
                      setShowVerification(true);
                    }}
                    disabled={!isCustomerValid}
                    className="w-full py-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    ✅ Verifikasi Bayar QRIS
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="text-xs text-gray-500 text-center">
                Klik verifikasi setelah berhasil melakukan pembayaran • Admin akan mengonfirmasi pesanan Anda
              </div>
            </div>
          ) : paymentMethod === 'qris' && showVerification ? (
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">✅</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Verifikasi Pembayaran QRIS</h3>
                <p className="text-sm text-gray-600">
                  Konfirmasi bahwa Anda sudah melakukan pembayaran via QRIS
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900">
                  <strong>Catatan:</strong> Pastikan pembayaran sudah berhasil sebelum melakukan verifikasi. Admin akan mengecek dan mengonfirmasi pesanan Anda.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Bukti Pembayaran *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleProofUpload(e.target.files?.[0])}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {paymentProofUploading && (
                    <p className="text-xs text-gray-500 mt-2">Mengupload bukti pembayaran...</p>
                  )}
                  {paymentProofUrl && (
                    <p className="text-xs text-green-600 mt-2">Bukti pembayaran berhasil diupload.</p>
                  )}
                  {paymentProofError && (
                    <p className="text-xs text-red-600 mt-2">{paymentProofError}</p>
                  )}
                </div>
                <button
                  onClick={handleVerifyPayment}
                  disabled={!paymentProofUrl}
                  className="w-full py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
                >
                  ✓ Ya, Saya Sudah Bayar
                </button>
                <button
                  onClick={() => setShowVerification(false)}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Kembali
                </button>
              </div>
            </div>
          ) : paymentMethod === 'qris' ? (
            <div className="p-6">
              {/* QRIS Design matching screenshot */}
              <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 mb-6">
                {/* Logo and Business Name */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xl font-bold">🏪</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">MERCHANT</p>
                      <p className="font-bold text-gray-900 text-sm">{storeName}</p>
                    </div>
                  </div>
                  <div className="w-10 h-10">
                    <img 
                      src="/qris-logo.png" 
                      alt="QRIS" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* QR Code */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 mb-4">
                  {qrisImage ? (
                    <img 
                      src={qrisImage} 
                      alt="QRIS Code" 
                      className="w-full h-auto"
                    />
                  ) : (
                    <div id="qris-code" className="bg-white p-2">
                      <QRCode
                        value={`${storeName}-ORDER-${orderCode}-${totalAmount}`}
                        size={256}
                        level="H"
                        style={{ width: '100%', height: 'auto' }}
                      />
                    </div>
                  )}
                </div>

                {/* Payment Info */}
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-xs text-gray-600 mb-1">Jumlah yang dibayarkan:</p>
                  <p className="text-2xl font-bold text-gray-900">
                    Rp {totalAmount.toLocaleString('id-ID')}
                  </p>
                </div>

                {/* Footer Icons */}
                <div className="flex items-center justify-center gap-4 pt-3 border-t border-gray-200">
                  <div className="w-8 h-8 bg-blue-600 rounded-full" />
                  <div className="w-8 h-8 bg-red-600 rounded-full" />
                  <div className="w-8 h-8 bg-green-600 rounded-full" />
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h4 className="font-bold text-blue-900 mb-2 text-sm">Cara Pembayaran:</h4>
                <ol className="text-xs text-blue-800 space-y-1.5 list-decimal list-inside">
                  <li>Download QRIS atau screenshot layar ini</li>
                  <li>Buka aplikasi mobile banking atau e-wallet</li>
                  <li>Pilih "Bayar" atau "Scan QR"</li>
                  <li>Upload QRIS atau scan QR code</li>
                  <li>Masukkan nominal dan konfirmasi</li>
                  <li>Klik tombol "Verifikasi Bayar QRIS"</li>
                </ol>
              </div>

              <button
                onClick={() => setShowVerification(true)}
                className="w-full py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
              >
                ✅ Verifikasi Bayar QRIS
              </button>
            </div>
          ) : (
            <div className="p-6">
              {/* Transfer Bank Instructions */}
              <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 mb-6">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">{businessBankAccount?.bank_name}</h3>
                  <p className="text-sm text-gray-600 mt-1">Informasi Rekening</p>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Nomor Rekening</p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-mono font-bold text-gray-900">
                        {businessBankAccount?.account_number}
                      </p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(businessBankAccount?.account_number || '');
                          showToast('Nomor rekening disalin!', 'success');
                        }}
                        className="text-blue-600 text-xs font-medium"
                      >
                        Salin
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Atas Nama</p>
                    <p className="font-bold text-gray-900">{businessBankAccount?.account_holder}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Nominal Transfer</p>
                    <p className="text-2xl font-bold text-purple-600">
                      Rp {totalAmount.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transfer Instructions */}
              <div className="bg-purple-50 rounded-lg p-4 mb-4">
                <h4 className="font-bold text-purple-900 mb-2 text-sm">Cara Transfer:</h4>
                <ol className="text-xs text-purple-800 space-y-1.5 list-decimal list-inside">
                  {transferInstructions.map((instruction) => (
                    <li key={instruction.step}>{instruction.text}</li>
                  ))}
                </ol>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Bukti Transfer *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleProofUpload(e.target.files?.[0])}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                {paymentProofUploading && (
                  <p className="text-xs text-gray-500 mt-2">Mengupload bukti pembayaran...</p>
                )}
                {paymentProofUrl && (
                  <p className="text-xs text-green-600 mt-2">Bukti transfer berhasil diupload.</p>
                )}
                {paymentProofError && (
                  <p className="text-xs text-red-600 mt-2">{paymentProofError}</p>
                )}
              </div>

              <button
                onClick={handleVerifyPayment}
                disabled={!paymentProofUrl}
                className="w-full py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
              >
                ✅ Konfirmasi Sudah Transfer
              </button>
            </div>
          )}
        </div>
      </div>
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={confirmState.options.title}
        message={confirmState.options.message}
        confirmText={confirmState.options.confirmText}
        cancelText={confirmState.options.cancelText}
        type={confirmState.options.type}
      />
      <ToastContainer />
    </>
  );
}
