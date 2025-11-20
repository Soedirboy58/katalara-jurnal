'use client';

import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { CartItem } from '@/types/lapak';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  totalAmount: number;
  themeColor: string;
  storeName: string;
  qrisImage?: string;
  businessBankAccount?: {
    bank_name: string;
    account_number: string;
    account_holder: string;
  };
  onPaymentComplete: (method: 'qris' | 'transfer' | 'cash') => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  cartItems,
  totalAmount,
  themeColor,
  storeName,
  qrisImage,
  businessBankAccount,
  onPaymentComplete,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'transfer' | null>(null);
  const [showVerification, setShowVerification] = useState(false);

  if (!isOpen) return null;

  const handleCashPayment = () => {
    if (confirm('Konfirmasi pembayaran tunai?')) {
      onPaymentComplete('cash');
      onClose();
    }
  };

  const handleVerifyPayment = () => {
    if (confirm('Konfirmasi bahwa pembayaran sudah dilakukan?')) {
      onPaymentComplete(paymentMethod || 'qris');
      setShowVerification(false);
      onClose();
    }
  };

  const orderCode = `KNT-${Date.now().toString().slice(-8)}`;

  // Generate transfer instructions
  const transferInstructions = businessBankAccount ? [
    { step: 1, text: `Transfer ke ${businessBankAccount.bank_name}` },
    { step: 2, text: `No. Rek: ${businessBankAccount.account_number}` },
    { step: 3, text: `A/n: ${businessBankAccount.account_holder}` },
    { step: 4, text: `Nominal: Rp ${totalAmount.toLocaleString('id-ID')}` },
    { step: 5, text: 'Upload bukti transfer' },
    { step: 6, text: 'Konfirmasi pembayaran' },
  ] : [];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {/* Modal */}
        <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          {!paymentMethod ? (
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white text-center">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1" />
                <h2 className="text-xl font-bold flex-1">Checkout Berhasil!</h2>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors"
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

              <div className="space-y-3">
                <button
                  onClick={handleVerifyPayment}
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
                          alert('Nomor rekening disalin!');
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

              <button
                onClick={handleVerifyPayment}
                className="w-full py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
              >
                ✅ Konfirmasi Sudah Transfer
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
