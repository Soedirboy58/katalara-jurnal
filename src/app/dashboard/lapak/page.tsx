'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';
import { Storefront, StorefrontProduct, THEME_PRESETS, PRODUCT_TYPES, BARANG_CATEGORIES, JASA_CATEGORIES } from '@/types/lapak';
import ImageUpload from '@/components/lapak/ImageUpload';
import { useAuth } from '@/hooks/useAuth';

export default function LapakPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storefront, setStorefront] = useState<Storefront | null>(null);
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'products' | 'analytics'>('settings');

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
        alert('✅ Lapak berhasil disimpan!');
      } else {
        alert('❌ ' + data.error);
      }
    } catch (error) {
      console.error('Error saving storefront:', error);
      alert('❌ Gagal menyimpan lapak');
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
          alert('✅ Produk berhasil diperbarui!');
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
          alert('✅ Produk berhasil ditambahkan!');
          loadData();
          setShowProductForm(false);
          resetProductForm();
        }
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('❌ Gagal menyimpan produk');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Hapus produk ini?')) return;

    try {
      const response = await fetch(`/api/lapak/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('✅ Produk berhasil dihapus!');
        loadData();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('❌ Gagal menghapus produk');
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('✅ Link berhasil disalin!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🏪 Lapak Online</h1>
          <p className="text-gray-600">
            Kelola toko online Anda dan jual produk lewat link yang bisa dishare
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ⚙️ Pengaturan Toko
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'products'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📦 Produk ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Statistik
            </button>
          </div>

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column - Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block font-medium text-gray-900 mb-2">
                      Nama Toko <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.store_name}
                      onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                      placeholder="Toko Kue Ibu Ani"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-900 mb-2">Deskripsi</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Kue kering dan basah enak dari rumah"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
                    />
                  </div>

                  <ImageUpload
                    currentImageUrl={formData.logo_url}
                    onImageUploaded={(url) => setFormData({ ...formData, logo_url: url })}
                    folder="logos"
                    userId={user?.id || ''}
                    label="Logo Bisnis"
                    aspectRatio="square"
                  />

                  <div>
                    <label className="block font-medium text-gray-900 mb-2">
                      Nomor WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.whatsapp_number}
                      onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                      placeholder="628123456789"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">Format: 628xxxxxxxxxx (tanpa +)</p>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-900 mb-2">Instagram</label>
                    <input
                      type="text"
                      value={formData.instagram_handle}
                      onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
                      placeholder="@tokokueibuani"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-900 mb-2">Lokasi</label>
                    <input
                      type="text"
                      value={formData.location_text}
                      onChange={(e) => setFormData({ ...formData, location_text: e.target.value })}
                      placeholder="Jakarta Selatan"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
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
                          if (!confirm('⚠️ PERHATIAN!\n\nMenghapus lapak akan menghapus:\n• Semua produk\n• Data analytics\n• Link lapak tidak akan bisa diakses lagi\n\nApakah Anda yakin ingin menghapus lapak ini?')) {
                            return;
                          }

                          setSaving(true);
                          try {
                            const response = await fetch('/api/lapak', {
                              method: 'DELETE',
                            });

                            if (response.ok) {
                              alert('✅ Lapak berhasil dihapus');
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
                              alert('❌ Gagal menghapus lapak');
                            }
                          } catch (error) {
                            console.error('Error deleting storefront:', error);
                            alert('❌ Terjadi kesalahan');
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
                  <div className="space-y-6">
                    {/* QR Code */}
                    <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
                      <h3 className="font-bold text-gray-900 mb-4">QR Code Lapak</h3>
                      <div className="bg-white p-4 inline-block rounded-lg shadow-sm">
                        <QRCode value={getStorefrontUrl()} size={200} />
                      </div>
                      <p className="text-sm text-gray-600 mt-4">
                        Scan QR code ini untuk membuka lapak
                      </p>
                    </div>

                    {/* Share Links */}
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <h3 className="font-bold text-gray-900 mb-4">Bagikan Lapak</h3>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Link Lapak</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={getStorefrontUrl()}
                            readOnly
                            className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                          />
                          <button
                            onClick={() => copyToClipboard(getStorefrontUrl())}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Salin
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={() => window.open(getStorefrontUrl(), '_blank')}
                          className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          🔗 Buka Lapak
                        </button>
                        <button
                          onClick={() => {
                            const text = `Cek lapak online saya: ${getStorefrontUrl()}`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                          }}
                          className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          📱 Share via WhatsApp
                        </button>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
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
            <div className="p-6">
              {!storefront ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">Buat lapak terlebih dahulu untuk menambah produk</p>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Buat Lapak
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Produk Saya</h2>
                    <button
                      onClick={() => {
                        resetProductForm();
                        setShowProductForm(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      + Tambah Produk
                    </button>
                  </div>

                  {/* Product List */}
                  {products.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">Belum ada produk. Tambahkan produk pertama Anda!</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {products.map((product) => (
                        <div key={product.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <div className="aspect-square bg-gray-100 flex items-center justify-center">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-gray-400">No Image</span>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-bold text-gray-900 mb-1">{product.name}</h3>
                            <p className="text-lg font-bold text-blue-600 mb-2">
                              Rp {product.price.toLocaleString('id-ID')}
                            </p>
                            <div className="flex gap-2 text-sm mb-3">
                              <span className={`px-2 py-1 rounded ${product.is_visible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                {product.is_visible ? 'Tampil' : 'Tersembunyi'}
                              </span>
                              {product.is_featured && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">⭐ Unggulan</span>
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
                                className="flex-1 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="flex-1 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
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
            <div className="p-6">
              {!storefront ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Buat lapak terlebih dahulu</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {analytics?.page_views || 0}
                    </div>
                    <div className="text-gray-700">Pengunjung (30 hari)</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {analytics?.cart_adds || 0}
                    </div>
                    <div className="text-gray-700">Produk Ditambah ke Keranjang</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-6">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {analytics?.whatsapp_clicks || 0}
                    </div>
                    <div className="text-gray-700">Chat WhatsApp</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
