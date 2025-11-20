'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';
import { Storefront, StorefrontProduct, THEME_PRESETS, PRODUCT_CATEGORIES } from '@/types/lapak';

export default function LapakPage() {
  const router = useRouter();
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
    category: '',
    price: 0,
    compare_at_price: 0,
    stock_quantity: 0,
    track_inventory: true,
    is_visible: true,
    is_featured: false,
  });

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
      category: '',
      price: 0,
      compare_at_price: 0,
      stock_quantity: 0,
      track_inventory: true,
      is_visible: true,
      is_featured: false,
    } as Partial<StorefrontProduct>);
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

                  <div>
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

                  <button
                    onClick={handleSaveStorefront}
                    disabled={saving || !formData.store_name || !formData.whatsapp_number}
                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? 'Menyimpan...' : storefront ? 'Perbarui Lapak' : 'Buat Lapak'}
                  </button>
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
                                  setProductForm(product);
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
                            }}
                            className="p-2 hover:bg-gray-100 rounded-full"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="p-6 space-y-4">
                          <div>
                            <label className="block font-medium mb-2">Nama Produk *</label>
                            <input
                              type="text"
                              value={productForm.name}
                              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                              className="w-full px-4 py-2 border rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block font-medium mb-2">Deskripsi</label>
                            <textarea
                              value={productForm.description}
                              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                              rows={3}
                              className="w-full px-4 py-2 border rounded-lg resize-none"
                            />
                          </div>

                          <div>
                            <label className="block font-medium mb-2">Kategori</label>
                            <select
                              value={productForm.category}
                              onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                              className="w-full px-4 py-2 border rounded-lg"
                            >
                              <option value="">Pilih Kategori</option>
                              {PRODUCT_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block font-medium mb-2">Harga *</label>
                              <input
                                type="number"
                                value={productForm.price}
                                onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                                className="w-full px-4 py-2 border rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block font-medium mb-2">Harga Coret</label>
                              <input
                                type="number"
                                value={productForm.compare_at_price}
                                onChange={(e) => setProductForm({ ...productForm, compare_at_price: Number(e.target.value) })}
                                className="w-full px-4 py-2 border rounded-lg"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block font-medium mb-2">Stok</label>
                            <input
                              type="number"
                              value={productForm.stock_quantity}
                              onChange={(e) => setProductForm({ ...productForm, stock_quantity: Number(e.target.value) })}
                              className="w-full px-4 py-2 border rounded-lg"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={productForm.track_inventory}
                                onChange={(e) => setProductForm({ ...productForm, track_inventory: e.target.checked })}
                                className="w-5 h-5"
                              />
                              <span>Lacak Stok</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={productForm.is_visible}
                                onChange={(e) => setProductForm({ ...productForm, is_visible: e.target.checked })}
                                className="w-5 h-5"
                              />
                              <span>Tampilkan di Lapak</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={productForm.is_featured}
                                onChange={(e) => setProductForm({ ...productForm, is_featured: e.target.checked })}
                                className="w-5 h-5"
                              />
                              <span>⭐ Produk Unggulan</span>
                            </label>
                          </div>

                          <button
                            onClick={handleSaveProduct}
                            disabled={!productForm.name || !productForm.price}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
