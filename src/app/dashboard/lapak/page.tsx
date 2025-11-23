'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';
import { Storefront, StorefrontProduct, THEME_PRESETS, PRODUCT_TYPES, BARANG_CATEGORIES, JASA_CATEGORIES } from '@/types/lapak';
import ImageUpload from '@/components/lapak/ImageUpload';
import KPIModal from '@/components/lapak/KPIModal';
import { useAuth } from '@/hooks/useAuth';
import { showToast, ToastContainer } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useConfirm } from '@/hooks/useConfirm';

export default function LapakPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storefront, setStorefront] = useState<Storefront | null>(null);
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [orderStats, setOrderStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'products' | 'analytics' | 'notifications'>('settings');
  const [kpiModal, setKpiModal] = useState<{
    isOpen: boolean;
    type: 'views' | 'cart' | 'whatsapp' | 'orders' | null;
  }>({ isOpen: false, type: null });
  const [deleteProductModal, setDeleteProductModal] = useState<{ isOpen: boolean; productId: string | null }>({ isOpen: false, productId: null });
  const [deleteLapakModal, setDeleteLapakModal] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    store_name: '',
    description: '',
    logo_url: '',
    qris_image_url: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_holder: '',
    whatsapp_number: '',
    instagram_handle: '',
    location_text: '',
    theme_color: '#3B82F6',
    is_active: true,
  });

  // Product form state
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StorefrontProduct | null>(null);
  const [productForm, setProductForm] = useState<Partial<StorefrontProduct>>({
    name: '',
    description: '',
    product_type: 'barang',
    category: '',
    price: 0,
    compare_at_price: 0,
    stock_quantity: 0,
    track_inventory: true,
    is_visible: true,
    is_featured: false,
  });
  const [priceInput, setPriceInput] = useState('');
  const [compareAtPriceInput, setCompareAtPriceInput] = useState('');

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/api/lapak');
      const data = await response.json();

      if (data.storefront) {
        setStorefront(data.storefront);
        setFormData({
          store_name: data.storefront.store_name,
          description: data.storefront.description || '',
          logo_url: data.storefront.logo_url || '',
          qris_image_url: data.storefront.qris_image_url || '',
          bank_name: data.storefront.bank_name || '',
          bank_account_number: data.storefront.bank_account_number || '',
          bank_account_holder: data.storefront.bank_account_holder || '',
          whatsapp_number: data.storefront.whatsapp_number,
          instagram_handle: data.storefront.instagram_handle || '',
          location_text: data.storefront.location_text || '',
          theme_color: data.storefront.theme_color,
          is_active: data.storefront.is_active,
        });
        setAnalytics(data.analytics);

        // Load products
        const productsResponse = await fetch('/api/lapak/products');
        const productsData = await productsResponse.json();
        setProducts(productsData.products || []);

        // Load orders
        if (data.storefront.slug) {
          const ordersResponse = await fetch(`/api/storefront/${data.storefront.slug}/orders`);
          if (ordersResponse.ok) {
            const ordersData = await ordersResponse.json();
            setOrders(ordersData.orders || []);
            setOrderStats(ordersData.stats);
          }
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleSaveStorefront = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/lapak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        setStorefront(data.storefront);
        showToast('Lapak berhasil disimpan!', 'success');
      } else {
        showToast(data.error, 'error');
      }
    } catch (error) {
      console.error('Error saving storefront:', error);
      showToast('Gagal menyimpan lapak', 'error');
    }
    setSaving(false);
  };

  const handleSaveProduct = async () => {
    try {
      if (editingProduct) {
        // Update
        const response = await fetch(`/api/lapak/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productForm),
        });

        if (response.ok) {
          showToast('Produk berhasil diperbarui!', 'success');
          loadData();
          setShowProductForm(false);
          setEditingProduct(null);
          resetProductForm();
        }
      } else {
        // Create
        const response = await fetch('/api/lapak/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productForm),
        });

        if (response.ok) {
          showToast('Produk berhasil ditambahkan!', 'success');
          loadData();
          setShowProductForm(false);
          resetProductForm();
        }
      }
    } catch (error) {
      console.error('Error saving product:', error);
      showToast('Gagal menyimpan produk', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const confirmed = await confirm({
      title: 'Hapus Produk',
      message: 'Apakah Anda yakin ingin menghapus produk ini?',
      type: 'danger',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/lapak/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast('Produk berhasil dihapus!', 'success');
        loadData();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('Gagal menghapus produk', 'error');
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      product_type: 'barang',
      category: '',
      price: 0,
      compare_at_price: 0,
      stock_quantity: 999999, // Set high number for unlimited stock (especially for jasa)
      track_inventory: false, // Default to not track inventory
      is_visible: true,
      is_featured: false,
    } as Partial<StorefrontProduct>);
    setPriceInput('');
    setCompareAtPriceInput('');
  };

  // Format number with thousand separators for display
  const formatNumber = (num: number | string): string => {
    if (!num) return '';
    const numStr = num.toString().replace(/\D/g, '');
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Parse formatted number back to integer
  const parseFormattedNumber = (str: string): number => {
    if (!str) return 0;
    return parseInt(str.replace(/\./g, ''), 10) || 0;
  };

  // Get categories based on product type
  const getAvailableCategories = () => {
    return productForm.product_type === 'jasa' ? JASA_CATEGORIES : BARANG_CATEGORIES;
  };

  const getStorefrontUrl = () => {
    if (!storefront) return '';
    return `${window.location.origin}/lapak/${storefront.slug}`;
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 300;
    canvas.height = 300;

    img.onload = () => {
      ctx!.fillStyle = 'white';
      ctx!.fillRect(0, 0, 300, 300);
      ctx!.drawImage(img, 0, 0, 300, 300);
      
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob!);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-code-${storefront?.slug || 'lapak'}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Link berhasil disalin!', 'success');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className="min-h-screen bg-gray-50 p-3 sm:p-6 overflow-x-hidden">
        <div className="max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="mb-4 sm:mb-6 px-1">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">🏪 Lapak Online</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Kelola toko online Anda dan jual produk lewat link yang bisa dishare
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 sm:mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-medium transition-colors whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ⚙️ Pengaturan
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-medium transition-colors whitespace-nowrap ${
                activeTab === 'products'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📦 Produk ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-medium transition-colors whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Statistik
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-medium transition-colors whitespace-nowrap ${
                activeTab === 'notifications'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🔔 Notifikasi Order
            </button>
          </div>

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="p-3 sm:p-6 overflow-x-hidden">
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-full">
                {/* Left Column - Form */}
                <div className="space-y-4 min-w-0">
                  <div>
                    <label className="block font-medium text-gray-900 mb-2 text-sm sm:text-base">
                      Nama Toko <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.store_name}
                      onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                      placeholder="Toko Kue Ibu Ani"
                      className="w-full max-w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm sm:text-base box-border"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-900 mb-2 text-sm sm:text-base">Deskripsi</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Kue kering dan basah enak dari rumah"
                      rows={3}
                      className="w-full max-w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none text-sm sm:text-base box-border"
                    />
                  </div>

                  <ImageUpload
                    currentImageUrl={formData.logo_url}
                    onImageUploaded={(url) => setFormData({ ...formData, logo_url: url })}
                    folder="logos"
                    userId={user?.id || ''}
                    label="Logo Bisnis"
                    aspectRatio="square"
                    enableCrop={true}
                  />

                  <div>
                    <label className="block font-medium text-gray-900 mb-2 text-sm sm:text-base">
                      Nomor WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <div className="relative max-w-full">
                      <div className="absolute left-2 sm:left-3 top-2.5 text-gray-700 font-medium text-sm sm:text-base">+62</div>
                      <input
                        type="tel"
                        value={formData.whatsapp_number.replace(/^62/, '')}
                        onChange={(e) => {
                          // Remove non-numeric characters
                          let value = e.target.value.replace(/\D/g, '');
                          
                          // Remove leading 0 if exists
                          if (value.startsWith('0')) {
                            value = value.substring(1);
                          }
                          
                          // Auto-format with 62 prefix
                          const formattedNumber = value ? `62${value}` : '';
                          setFormData({ ...formData, whatsapp_number: formattedNumber });
                        }}
                        placeholder="8123456789"
                        maxLength={13}
                        className="w-full max-w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm sm:text-base box-border"
                      />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      💡 Otomatis format <span className="font-semibold">+62</span>, tinggal masukkan nomor tanpa 0 di depan
                    </p>
                    {formData.whatsapp_number && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Format final: +{formData.whatsapp_number}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-medium text-gray-900 mb-2 text-sm sm:text-base">Instagram</label>
                    <input
                      type="text"
                      value={formData.instagram_handle}
                      onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
                      placeholder="@tokokueibuani"
                      className="w-full max-w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm sm:text-base box-border"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-900 mb-2 text-sm sm:text-base">Lokasi</label>
                    <input
                      type="text"
                      value={formData.location_text}
                      onChange={(e) => setFormData({ ...formData, location_text: e.target.value })}
                      placeholder="Jakarta Selatan"
                      className="w-full max-w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm sm:text-base box-border"
                    />
                  </div>

                  {/* Payment Methods Section */}
                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">💳 Metode Pembayaran</h3>
                    
                    <ImageUpload
                      currentImageUrl={formData.qris_image_url}
                      onImageUploaded={(url) => setFormData({ ...formData, qris_image_url: url })}
                      folder="qris"
                      userId={user?.id || ''}
                      label="QRIS Code"
                      aspectRatio="square"
                    />

                    <div className="mt-6 space-y-4">
                      <h4 className="font-semibold text-gray-900">Rekening Bank Transfer</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bank</label>
                        <select
                          value={formData.bank_name}
                          onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        >
                          <option value="">Pilih Bank</option>
                          <option value="BCA">BCA</option>
                          <option value="Mandiri">Mandiri</option>
                          <option value="BNI">BNI</option>
                          <option value="BRI">BRI</option>
                          <option value="CIMB Niaga">CIMB Niaga</option>
                          <option value="Permata">Permata</option>
                          <option value="Danamon">Danamon</option>
                          <option value="BTN">BTN</option>
                          <option value="Bank Syariah Indonesia (BSI)">Bank Syariah Indonesia (BSI)</option>
                          <option value="Jenius">Jenius</option>
                          <option value="SeaBank">SeaBank</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Rekening</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formData.bank_account_number}
                          onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                          placeholder="1234567890"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Atas Nama</label>
                        <input
                          type="text"
                          value={formData.bank_account_holder}
                          onChange={(e) => setFormData({ ...formData, bank_account_holder: e.target.value })}
                          placeholder="Nama Pemilik Rekening"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <label className="block font-medium text-gray-900 mb-2">Warna Tema</label>
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {THEME_PRESETS.map((preset) => (
                        <button
                          key={preset.color}
                          onClick={() => setFormData({ ...formData, theme_color: preset.color })}
                          className={`w-full aspect-square rounded-lg border-2 transition-all ${
                            formData.theme_color === preset.color
                              ? 'border-gray-900 scale-110'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          style={{ backgroundColor: preset.color }}
                          title={preset.name}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      value={formData.theme_color}
                      onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <label className="font-medium text-gray-900">Aktifkan Lapak</label>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleSaveStorefront}
                      disabled={saving || !formData.store_name || !formData.whatsapp_number}
                      className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? 'Menyimpan...' : storefront ? 'Perbarui Lapak' : 'Buat Lapak'}
                    </button>

                    {storefront && (
                      <button
                        onClick={async () => {
                          const confirmed = await confirm({
                            title: '⚠️ Hapus Lapak Permanen',
                            message: 'Menghapus lapak akan menghapus:\n• Semua produk\n• Data analytics\n• Link lapak tidak akan bisa diakses lagi\n\nApakah Anda yakin?',
                            type: 'danger',
                            confirmText: 'Ya, Hapus Permanen',
                            cancelText: 'Batal',
                          });

                          if (!confirmed) return;

                          setSaving(true);
                          try {
                            const response = await fetch('/api/lapak', {
                              method: 'DELETE',
                            });

                            if (response.ok) {
                              showToast('Lapak berhasil dihapus', 'success');
                              setStorefront(null);
                              setProducts([]);
                              setFormData({
                                store_name: '',
                                description: '',
                                logo_url: '',
                                qris_image_url: '',
                                bank_name: '',
                                bank_account_number: '',
                                bank_account_holder: '',
                                whatsapp_number: '',
                                instagram_handle: '',
                                location_text: '',
                                theme_color: '#3B82F6',
                                is_active: true,
                              });
                            } else {
                              showToast('Gagal menghapus lapak', 'error');
                            }
                          } catch (error) {
                            console.error('Error deleting storefront:', error);
                            showToast('Terjadi kesalahan', 'error');
                          } finally {
                            setSaving(false);
                          }
                        }}
                        disabled={saving}
                        className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        🗑️ Hapus Lapak Permanen
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Column - Preview & Share */}
                {storefront && (
                  <div className="space-y-4 sm:space-y-6 min-w-0 max-w-full">
                    {/* QR Code */}
                    <div className="bg-gray-50 rounded-lg p-4 sm:p-6 text-center border border-gray-200">
                      <h3 className="font-bold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">QR Code Lapak</h3>
                      <div className="bg-white p-3 sm:p-4 inline-block rounded-lg shadow-sm">
                        <QRCode id="qr-code-svg" value={getStorefrontUrl()} size={150} className="sm:w-[200px] sm:h-[200px]" />
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 mt-2">
                        Scan QR code ini untuk membuka lapak
                      </p>
                      <button
                        onClick={downloadQRCode}
                        className="mt-3 w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2 mx-auto"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download QR Code
                      </button>
                    </div>

                    {/* Share Links */}
                    <div className="bg-gray-50 rounded-lg p-4 sm:p-6 border border-gray-200">
                      <h3 className="font-bold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Bagikan Lapak</h3>
                      
                      <div className="mb-3 sm:mb-4">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Link Lapak</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={getStorefrontUrl()}
                            readOnly
                            className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm truncate"
                          />
                          <button
                            onClick={() => copyToClipboard(getStorefrontUrl())}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm whitespace-nowrap"
                          >
                            Salin
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={() => window.open(getStorefrontUrl(), '_blank')}
                          className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          🔗 Buka Lapak
                        </button>
                        <button
                          onClick={() => {
                            const text = `Cek lapak online saya: ${getStorefrontUrl()}`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                          }}
                          className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                        >
                          📱 Share via WhatsApp
                        </button>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="bg-gray-50 rounded-lg p-4 sm:p-6 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Status Lapak</span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            formData.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {formData.is_active ? '🟢 Aktif' : '⚫ Nonaktif'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {formData.is_active
                          ? 'Lapak Anda dapat diakses oleh pelanggan'
                          : 'Lapak tidak dapat diakses sementara'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="p-3 sm:p-6">
              {!storefront ? (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-sm sm:text-base text-gray-600 mb-4">Buat lapak terlebih dahulu untuk menambah produk</p>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
                  >
                    Buat Lapak
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4 sm:mb-6">
                    <h2 className="text-base sm:text-xl font-bold text-gray-900">Produk Saya</h2>
                    <button
                      onClick={() => {
                        resetProductForm();
                        setShowProductForm(true);
                      }}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-base whitespace-nowrap"
                    >
                      + Tambah
                    </button>
                  </div>

                  {/* Sync Hint */}
                  <div className="mb-4 p-3 sm:p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-lg sm:text-xl">💡</span>
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm text-purple-900 font-medium">
                          Tips: Punya produk di menu <strong>Products</strong>?
                        </p>
                        <p className="text-xs sm:text-sm text-purple-700 mt-1">
                          Klik tombol <strong>🛒</strong> di menu Products untuk sync otomatis ke Lapak Online tanpa input ulang!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Product List */}
                  {products.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
                      <p className="text-sm sm:text-base text-gray-600 mb-2">Belum ada produk. Tambahkan produk pertama Anda!</p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Atau sync dari menu <strong>Products</strong> dengan klik tombol 🛒
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {products.map((product) => (
                        <div key={product.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <div className="aspect-square bg-gray-100 flex items-center justify-center">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-gray-400">No Image</span>
                            )}
                          </div>
                          <div className="p-3 sm:p-4">
                            <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
                            <p className="text-base sm:text-lg font-bold text-blue-600 mb-2">
                              Rp {product.price.toLocaleString('id-ID')}
                            </p>
                            <div className="flex gap-1.5 sm:gap-2 text-xs sm:text-sm mb-2 sm:mb-3 flex-wrap">
                              <span className={`px-2 py-0.5 sm:py-1 rounded ${product.is_visible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                {product.is_visible ? 'Tampil' : 'Tersembunyi'}
                              </span>
                              {product.is_featured && (
                                <span className="px-2 py-0.5 sm:py-1 bg-yellow-100 text-yellow-700 rounded">⭐ Unggulan</span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingProduct(product);
                                  setProductForm({
                                    ...product,
                                    product_type: product.product_type || 'barang',
                                  });
                                  // Set formatted price inputs for editing
                                  setPriceInput(formatNumber(product.price));
                                  setCompareAtPriceInput(product.compare_at_price ? formatNumber(product.compare_at_price) : '');
                                  setShowProductForm(true);
                                }}
                                className="flex-1 py-1.5 sm:py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-xs sm:text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="flex-1 py-1.5 sm:py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 text-xs sm:text-sm"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Product Form Modal */}
                  {showProductForm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                          <h2 className="text-xl font-bold">
                            {editingProduct ? 'Edit Produk' : 'Tambah Produk'}
                          </h2>
                          <button
                            onClick={() => {
                              setShowProductForm(false);
                              setEditingProduct(null);
                              // Reset formatted inputs
                              setPriceInput('');
                              setCompareAtPriceInput('');
                            }}
                            className="p-2 hover:bg-gray-100 rounded-full"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="p-6 space-y-4">
                          {/* Jenis Produk */}
                          <div>
                            <label className="block font-medium text-gray-900 mb-2">Jenis Produk *</label>
                            <div className="grid grid-cols-2 gap-3">
                              {PRODUCT_TYPES.map((type) => (
                                <button
                                  key={type.value}
                                  type="button"
                                  onClick={() => {
                                    setProductForm({ 
                                      ...productForm, 
                                      product_type: type.value,
                                      category: '', // Reset category when type changes
                                      // For jasa: unlimited stock, don't track inventory
                                      stock_quantity: type.value === 'jasa' ? 999999 : (productForm.stock_quantity || 0),
                                      track_inventory: type.value === 'barang',
                                    });
                                  }}
                                  className={`p-4 border-2 rounded-lg font-medium transition-all ${
                                    productForm.product_type === type.value
                                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                                      : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                >
                                  <div className="text-2xl mb-1">
                                    {type.value === 'barang' ? '📦' : '🛠️'}
                                  </div>
                                  {type.label}
                                </button>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              {productForm.product_type === 'barang' 
                                ? 'Barang fisik yang dijual (makanan, pakaian, elektronik, dll)'
                                : 'Layanan/jasa yang ditawarkan (catering, desain, konsultasi, dll)'}
                            </p>
                          </div>

                          {/* Nama Produk */}
                          <div>
                            <label className="block font-medium mb-2">Nama Produk *</label>
                            <input
                              type="text"
                              value={productForm.name}
                              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                              placeholder={productForm.product_type === 'barang' ? 'Contoh: Kue Nastar Premium' : 'Contoh: Jasa Desain Logo Profesional'}
                              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                            />
                          </div>

                          {/* Deskripsi */}
                          <div>
                            <label className="block font-medium mb-2">Deskripsi</label>
                            <textarea
                              value={productForm.description}
                              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                              rows={3}
                              placeholder={productForm.product_type === 'barang' 
                                ? 'Jelaskan detail produk, bahan, ukuran, dll'
                                : 'Jelaskan layanan yang diberikan, benefit, dll'}
                              className="w-full px-4 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                            />
                          </div>

                          {/* Upload Foto Produk */}
                          <ImageUpload
                            currentImageUrl={productForm.image_url}
                            onImageUploaded={(url) => setProductForm({ ...productForm, image_url: url })}
                            folder="products"
                            userId={user?.id || ''}
                            label="Foto Produk"
                            aspectRatio="auto"
                            enableCrop={true}
                          />

                          {/* Kategori - Dynamic based on product type */}
                          <div>
                            <label className="block font-medium mb-2">Kategori</label>
                            <select
                              value={productForm.category}
                              onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                            >
                              <option value="">Pilih Kategori</option>
                              {getAvailableCategories().map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                              Kategori akan membantu pembeli menemukan produk Anda
                            </p>
                          </div>

                          {/* Harga */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block font-medium mb-2">Harga {productForm.product_type === 'jasa' ? 'Mulai' : ''} *</label>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500">Rp</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={priceInput}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '');
                                    setPriceInput(formatNumber(value));
                                    setProductForm({ ...productForm, price: parseFormattedNumber(value) });
                                  }}
                                  placeholder="0"
                                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                />
                              </div>
                              {productForm.product_type === 'jasa' && (
                                <p className="text-xs text-gray-500 mt-1">Harga mulai dari</p>
                              )}
                            </div>
                            <div>
                              <label className="block font-medium mb-2">Harga Coret</label>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500">Rp</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={compareAtPriceInput}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '');
                                    setCompareAtPriceInput(formatNumber(value));
                                    setProductForm({ ...productForm, compare_at_price: parseFormattedNumber(value) });
                                  }}
                                  placeholder="0"
                                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                />
                              </div>
                              <p className="text-xs text-gray-500 mt-1">Opsional (untuk diskon)</p>
                            </div>
                          </div>

                          {/* Stok - Only for Barang */}
                          {productForm.product_type === 'barang' && (
                            <div>
                              <label className="block font-medium mb-2">Stok</label>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={productForm.stock_quantity || ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '');
                                  setProductForm({ ...productForm, stock_quantity: parseInt(value) || 0 });
                                }}
                                placeholder="0"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Jumlah stok yang tersedia. Kosongkan jika stok tidak terbatas.
                              </p>
                            </div>
                          )}

                          {/* Opsi */}
                          <div className="space-y-2">
                            {productForm.product_type === 'barang' && (
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={productForm.track_inventory}
                                  onChange={(e) => setProductForm({ ...productForm, track_inventory: e.target.checked })}
                                  className="w-5 h-5 rounded"
                                />
                                <span>Lacak Stok (tampilkan info ketersediaan)</span>
                              </label>
                            )}
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={productForm.is_visible}
                                onChange={(e) => setProductForm({ ...productForm, is_visible: e.target.checked })}
                                className="w-5 h-5 rounded"
                              />
                              <span>Tampilkan di Lapak</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={productForm.is_featured}
                                onChange={(e) => setProductForm({ ...productForm, is_featured: e.target.checked })}
                                className="w-5 h-5 rounded"
                              />
                              <span>⭐ Produk Unggulan (tampil di atas)</span>
                            </label>
                          </div>

                          {/* Submit Button */}
                          <button
                            onClick={handleSaveProduct}
                            disabled={!productForm.name || !productForm.price}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                          >
                            {editingProduct ? 'Perbarui Produk' : 'Tambah Produk'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="p-3 sm:p-6">
              {!storefront ? (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-sm sm:text-base text-gray-600">Buat lapak terlebih dahulu</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                  {/* Pengunjung KPI */}
                  <button
                    onClick={() => setKpiModal({ isOpen: true, type: 'views' })}
                    className="bg-blue-50 rounded-lg p-3 sm:p-6 hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-200 text-left group"
                  >
                    <div className="flex items-start justify-between mb-1 sm:mb-2">
                      <div className="text-xl sm:text-3xl font-bold text-blue-600">
                        {analytics?.page_views || 0}
                      </div>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-gray-700 text-xs sm:text-sm font-medium">👁️ Pengunjung</div>
                    <div className="text-[10px] sm:text-xs text-blue-600 mt-1 sm:mt-2 group-hover:underline">Detail →</div>
                  </button>

                  {/* Keranjang KPI */}
                  <button
                    onClick={() => setKpiModal({ isOpen: true, type: 'cart' })}
                    className="bg-green-50 rounded-lg p-3 sm:p-6 hover:shadow-lg transition-all border-2 border-transparent hover:border-green-200 text-left group"
                  >
                    <div className="flex items-start justify-between mb-1 sm:mb-2">
                      <div className="text-xl sm:text-3xl font-bold text-green-600">
                        {analytics?.cart_adds || 0}
                      </div>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 group-hover:text-green-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-gray-700 text-xs sm:text-sm font-medium">🛒 Keranjang</div>
                    <div className="text-[10px] sm:text-xs text-green-600 mt-1 sm:mt-2 group-hover:underline">Detail →</div>
                  </button>

                  {/* WhatsApp KPI */}
                  <button
                    onClick={() => setKpiModal({ isOpen: true, type: 'whatsapp' })}
                    className="bg-purple-50 rounded-lg p-3 sm:p-6 hover:shadow-lg transition-all border-2 border-transparent hover:border-purple-200 text-left group"
                  >
                    <div className="flex items-start justify-between mb-1 sm:mb-2">
                      <div className="text-xl sm:text-3xl font-bold text-purple-600">
                        {analytics?.whatsapp_clicks || 0}
                      </div>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 group-hover:text-purple-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-gray-700 text-xs sm:text-sm font-medium">💬 Chat WA</div>
                    <div className="text-[10px] sm:text-xs text-purple-600 mt-1 sm:mt-2 group-hover:underline">Detail →</div>
                  </button>

                  {/* Orders KPI */}
                  <button
                    onClick={() => setKpiModal({ isOpen: true, type: 'orders' })}
                    className="bg-orange-50 rounded-lg p-3 sm:p-6 hover:shadow-lg transition-all border-2 border-transparent hover:border-orange-200 text-left group"
                  >
                    <div className="flex items-start justify-between mb-1 sm:mb-2">
                      <div className="text-xl sm:text-3xl font-bold text-orange-600">
                        {orderStats?.total_orders || 0}
                      </div>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 group-hover:text-orange-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-gray-700 text-xs sm:text-sm font-medium">📦 Order</div>
                    <div className="text-[10px] sm:text-xs text-orange-600 mt-1 sm:mt-2 group-hover:underline">Detail →</div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="p-3 sm:p-6 overflow-x-hidden">
              {!storefront ? (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-sm sm:text-base text-gray-600">Buat lapak terlebih dahulu</p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6 max-w-full">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Notifikasi Order</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        Order akan dikirim ke WhatsApp Anda setelah customer checkout
                      </p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap self-start sm:self-center">
                      WhatsApp Integration
                    </span>
                  </div>

                  {/* Info Card */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="bg-white rounded-full p-2 sm:p-3 shadow-sm flex-shrink-0">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Cara Kerja:</h4>
                        <ol className="text-xs sm:text-sm text-gray-700 space-y-1.5 sm:space-y-2">
                          <li className="flex items-start gap-1.5 sm:gap-2">
                            <span className="bg-blue-600 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                            <span className="break-words">Customer mengisi keranjang belanja di lapak Anda</span>
                          </li>
                          <li className="flex items-start gap-1.5 sm:gap-2">
                            <span className="bg-blue-600 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                            <span className="break-words">Customer klik "Checkout via WhatsApp"</span>
                          </li>
                          <li className="flex items-start gap-1.5 sm:gap-2">
                            <span className="bg-blue-600 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                            <span className="break-words">Otomatis terbuka WhatsApp dengan detail pesanan</span>
                          </li>
                          <li className="flex items-start gap-1.5 sm:gap-2">
                            <span className="bg-blue-600 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                            <span className="break-words">Anda terima pesan order langsung di WhatsApp bisnis Anda</span>
                          </li>
                          <li className="flex items-start gap-1.5 sm:gap-2">
                            <span className="bg-blue-600 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs font-bold flex-shrink-0 mt-0.5">5</span>
                            <span className="break-words">Balas chat untuk konfirmasi pembayaran & pengiriman</span>
                          </li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Number Display */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                          Nomor WhatsApp Bisnis:
                        </label>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg sm:text-2xl font-bold text-gray-900 break-all">
                            +{storefront.whatsapp_number}
                          </span>
                          <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded whitespace-nowrap">
                            Aktif
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Semua notifikasi order akan dikirim ke nomor ini
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('settings')}
                        className="px-4 py-2 text-xs sm:text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap self-start sm:self-center"
                      >
                        Ubah Nomor
                      </button>
                    </div>
                  </div>

                  {/* Tips Section */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 sm:p-5">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-xl sm:text-2xl flex-shrink-0">💡</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-amber-900 mb-2 text-sm sm:text-base">Tips Mengelola Order:</h4>
                        <ul className="text-xs sm:text-sm text-amber-800 space-y-1 sm:space-y-1.5">
                          <li>• <strong>Balas cepat</strong> - Customer menghargai respons dalam 5-15 menit</li>
                          <li>• <strong>Konfirmasi stok</strong> - Pastikan produk masih tersedia sebelum konfirmasi</li>
                          <li>• <strong>Detail pembayaran</strong> - Kirim QRIS atau rekening bank dengan jelas</li>
                          <li>• <strong>Bukti transfer</strong> - Minta customer kirim screenshot bukti bayar</li>
                          <li>• <strong>Resi pengiriman</strong> - Kirim nomor resi setelah paket dikirim</li>
                          <li>• <strong>Follow up</strong> - Tanyakan apakah barang sudah diterima dengan baik</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Recent Orders Placeholder */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 sm:p-8 text-center">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Riwayat Order via WhatsApp</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-4">
                      Order dari customer akan muncul di chat WhatsApp Anda.<br className="hidden sm:block"/>
                      <span className="sm:hidden"> </span>
                      Gunakan WhatsApp Business untuk manajemen chat yang lebih baik.
                    </p>
                    <a
                      href={`https://wa.me/${storefront.whatsapp_number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-green-700 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Buka WhatsApp Business
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* KPI Modals */}
      <KPIModal
        isOpen={kpiModal.isOpen && kpiModal.type === 'views'}
        onClose={() => setKpiModal({ isOpen: false, type: null })}
        title="Pengunjung Lapak"
        icon="👁️"
        value={analytics?.page_views || 0}
        description="Total kunjungan ke lapak dalam 30 hari terakhir"
        color="blue"
        detailItems={[
          { label: 'Hari Ini', value: 0, icon: '📅' },
          { label: '7 Hari Terakhir', value: 0, icon: '📊' },
          { label: 'Unique Visitors', value: 0, icon: '👤' },
        ]}
      />

      <KPIModal
        isOpen={kpiModal.isOpen && kpiModal.type === 'cart'}
        onClose={() => setKpiModal({ isOpen: false, type: null })}
        title="Produk ke Keranjang"
        icon="🛒"
        value={analytics?.cart_adds || 0}
        description="Jumlah produk yang ditambahkan ke keranjang"
        color="green"
        detailItems={[
          { label: 'Conversion Rate', value: `${analytics?.page_views > 0 ? Math.round((analytics?.cart_adds / analytics?.page_views) * 100) : 0}%`, icon: '📈' },
          { label: 'Avg. per Visit', value: (analytics?.cart_adds / (analytics?.page_views || 1)).toFixed(1), icon: '🎯' },
        ]}
      />

      <KPIModal
        isOpen={kpiModal.isOpen && kpiModal.type === 'whatsapp'}
        onClose={() => setKpiModal({ isOpen: false, type: null })}
        title="Chat WhatsApp"
        icon="💬"
        value={analytics?.whatsapp_clicks || 0}
        description="Jumlah customer yang klik tombol WhatsApp"
        color="purple"
        detailItems={[
          { label: 'From Checkout', value: orderStats?.total_orders || 0, icon: '✅' },
          { label: 'Direct Chat', value: (analytics?.whatsapp_clicks || 0) - (orderStats?.total_orders || 0), icon: '💭' },
          { label: 'Response Rate', value: '~85%', icon: '⚡' },
        ]}
      />

      <KPIModal
        isOpen={kpiModal.isOpen && kpiModal.type === 'orders'}
        onClose={() => setKpiModal({ isOpen: false, type: null })}
        title="Total Order"
        icon="📦"
        value={orderStats?.total_orders || 0}
        description="Semua order yang masuk via WhatsApp checkout"
        color="orange"
        detailItems={[
          { 
            label: 'Total Pendapatan', 
            value: `Rp ${(orderStats?.total_revenue || 0).toLocaleString('id-ID')}`, 
            icon: '💰' 
          },
          { label: 'Order Pending', value: orderStats?.pending_orders || 0, icon: '⏳' },
          { 
            label: 'Rata-rata Nilai Order', 
            value: `Rp ${orderStats?.total_orders > 0 ? Math.round(orderStats?.total_revenue / orderStats?.total_orders).toLocaleString('id-ID') : 0}`, 
            icon: '📊' 
          },
        ]}
      />
      </div>

      {/* Confirm Modal */}
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
    </>
  );
}

