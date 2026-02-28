'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductCard from '@/components/lapak/ProductCard';
import ProductDetailModal from '@/components/lapak/ProductDetailModal';
import FloatingCartButton from '@/components/lapak/FloatingCartButton';
import FloatingWhatsApp from '@/components/lapak/FloatingWhatsApp';
import ShoppingCart from '@/components/lapak/ShoppingCart';
import PaymentModal from '@/components/lapak/PaymentModal';
import { Storefront, StorefrontProduct, CartItem, formatWhatsAppMessage } from '@/types/lapak';
import { showToast, ToastContainer } from '@/components/ui/Toast';

interface StorefrontPageProps {
  params: Promise<{ slug: string }>;
}

export default function StorefrontPage({ params }: StorefrontPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [slug, setSlug] = useState<string>('');
  const [storefront, setStorefront] = useState<Storefront | null>(null);
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [selectedProduct, setSelectedProduct] = useState<StorefrontProduct | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeBannerIndex, setActiveBannerIndex] = useState(0)
  const productsSectionRef = useRef<HTMLElement | null>(null)

  const affiliateCode = useMemo(() => {
    return (searchParams.get('ref') || searchParams.get('aff') || '').trim()
  }, [searchParams])

  // Load slug from params
  useEffect(() => {
    params.then(p => setSlug(p.slug));
  }, [params]);

  // Load cart from localStorage
  useEffect(() => {
    if (!slug) return;
    const savedCart = localStorage.getItem(`cart_${slug}`);
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error loading cart:', e);
      }
    }
  }, [slug]);

  // Save cart to localStorage
  useEffect(() => {
    if (!slug) return;
    localStorage.setItem(`cart_${slug}`, JSON.stringify(cartItems));
  }, [cartItems, slug]);

  // Fetch storefront data
  useEffect(() => {
    if (!slug) return;

    const fetchStorefront = async () => {
      try {
        const response = await fetch(`/api/storefront/${slug}`, {
          headers: {
            'x-session-id': getSessionId(),
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError('Toko tidak ditemukan');
          } else {
            setError('Gagal memuat toko');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setStorefront(data.storefront);
        setProducts(data.products);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching storefront:', err);
        setError('Gagal memuat toko');
        setLoading(false);
      }
    };

    fetchStorefront();
  }, [slug]);

  // Generate or get session ID
  const getSessionId = () => {
    let sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  };

  // Track analytics event
  const trackEvent = async (eventType: string, productId?: string, metadata?: Record<string, unknown>) => {
    if (!storefront) return;
    
    try {
      await fetch(`/api/storefront/${slug}/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getSessionId(),
        },
        body: JSON.stringify({
          event_type: eventType,
          product_id: productId,
          metadata,
        }),
      });
    } catch (err) {
      console.error('Error tracking event:', err);
    }
  };

  // Cart functions
  const addToCart = (product: StorefrontProduct, quantity: number, variant?: string, notes?: string) => {
    const newItem: CartItem = {
      product_id: product.id,
      product_name: product.name,
      product_image: product.image_url,
      price: product.price,
      quantity,
      variant,
      notes,
    };

    setCartItems(prev => {
      const existingIndex = prev.findIndex(
        item => item.product_id === product.id && item.variant === variant
      );
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      
      return [...prev, newItem];
    });

    setSelectedProduct(null);
    trackEvent('cart_add', product.id);
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems(prev =>
      prev.map(item =>
        item.product_id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product_id !== productId));
  };

  const handleCheckout = (selectedItems: CartItem[]) => {
    if (!storefront) return;
    
    trackEvent('checkout_start', undefined, { item_count: selectedItems.length });
    
    // Store checkout items and open payment modal
    setCheckoutItems(selectedItems);
    setIsCartOpen(false);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentComplete = async (payload: {
    method: 'qris' | 'transfer' | 'cash';
    customer: {
      customer_name: string;
      customer_phone: string;
      customer_address: string;
      delivery_method: 'pickup' | 'delivery';
      notes?: string;
    };
    paymentProofUrl?: string;
    orderCode: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!storefront) return;

    const { method, customer, paymentProofUrl, orderCode } = payload;

    // Calculate total
    const total = checkoutItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Format WhatsApp message with payment method
    const paymentMethodText = 
      method === 'qris' ? 'QRIS (Sudah Dibayar)' :
      method === 'transfer' ? 'Transfer Bank (Sudah Dibayar)' :
      'Tunai (Bayar di Tempat)';

    // Track order to database FIRST (so tracking link is guaranteed valid)
    let trackingCode = ''
    try {
      const orderResponse = await fetch(`/api/storefront/${slug}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getSessionId(),
        },
        body: JSON.stringify({
          order_items: checkoutItems.map(item => ({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            price: item.price,
            variant: item.variant,
            notes: item.notes,
          })),
          total_amount: total,
          payment_method: method,
          customer_name: customer.customer_name,
          customer_phone: customer.customer_phone,
          customer_address: customer.customer_address,
          customer_province_id: customer.customer_province_id,
          customer_province_name: customer.customer_province_name,
          customer_kabupaten_id: customer.customer_kabupaten_id,
          customer_kabupaten_name: customer.customer_kabupaten_name,
          customer_kecamatan_id: customer.customer_kecamatan_id,
          customer_kecamatan_name: customer.customer_kecamatan_name,
          customer_desa_id: customer.customer_desa_id,
          customer_desa_name: customer.customer_desa_name,
          customer_address_detail: customer.customer_address_detail,
          customer_rt_rw: customer.customer_rt_rw,
          customer_landmark: customer.customer_landmark,
          delivery_method: customer.delivery_method,
          notes: customer.notes,
          payment_proof_url: paymentProofUrl,
          order_code: orderCode,
          affiliate_code: affiliateCode || null,
        }),
      });
      const orderJson = await orderResponse.json().catch(() => null as any)
      if (!orderResponse.ok || !orderJson?.success) {
        console.error('Error tracking order:', orderJson?.error || orderResponse.statusText)
        showToast('Order gagal tersimpan. Mohon coba lagi.', 'error')
        return { success: false, error: orderJson?.error || 'Order gagal tersimpan' }
      }

      trackingCode = String(orderJson?.public_tracking_code || '')
    } catch (err) {
      console.error('Error tracking order:', err);
      showToast('Order gagal tersimpan. Mohon coba lagi.', 'error');
      return { success: false, error: 'Order gagal tersimpan' }
    }

    const trackingUrl = trackingCode
      ? `${window.location.origin}/lapak/${slug}/order/${encodeURIComponent(trackingCode)}`
      : ''

    const message = formatWhatsAppMessage({
      storefront_name: storefront.store_name,
      store_description: storefront.description || '',
      customer_name: customer.customer_name,
      customer_phone: customer.customer_phone,
      customer_address: customer.customer_address,
      delivery_method: customer.delivery_method,
      items: checkoutItems,
      total_amount: total,
      payment_method: paymentMethodText,
      notes: customer.notes,
      order_code: orderCode,
      payment_proof_url: paymentProofUrl,
      tracking_url: trackingUrl,
    });

    // Track WhatsApp click
    trackEvent('whatsapp_click');

    // Open WhatsApp
    const url = `https://wa.me/${storefront.whatsapp_number}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');

    // Remove checked out items from cart
    setCartItems(prev => 
      prev.filter(item => !checkoutItems.find(ci => ci.product_id === item.product_id))
    );

    // Close modal
    setIsPaymentModalOpen(false);

    return { success: true }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const product of products) {
      const category = (product.category || '').trim()
      if (!category) continue
      counts.set(category, (counts.get(category) || 0) + 1)
    }
    return counts
  }, [products])

  const quickActionCategories = useMemo(() => {
    return Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name)
  }, [categoryCounts])

  const highlightCategories = useMemo(() => {
    const fromQuick = quickActionCategories.slice(0, 2)
    if (fromQuick.length > 0) return fromQuick
    return categories.slice(0, 2)
  }, [quickActionCategories, categories])

  const bannerImages = useMemo(() => {
    const raw = (storefront as any)?.banner_image_urls
    const parsed = Array.isArray(raw)
      ? raw
      : typeof raw === 'string'
        ? (() => {
            try {
              return JSON.parse(raw)
            } catch {
              return []
            }
          })()
        : []

    const cleaned = (Array.isArray(parsed) ? parsed : [])
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, 6)

    if (cleaned.length > 0) return cleaned
    if (storefront?.cover_image_url) return [storefront.cover_image_url]
    return []
  }, [storefront])

  const bannerAutoplayMs = useMemo(() => {
    const raw = Number((storefront as any)?.banner_autoplay_ms)
    if (!Number.isFinite(raw)) return 3500
    return Math.max(1200, Math.min(10000, Math.round(raw)))
  }, [storefront])

  const heroTitle = (storefront?.hero_title || '').trim() || 'Healthy Organic Food'
  const heroSubtitle = (storefront?.hero_subtitle || '').trim() || 'Produk segar dan alami untuk gaya hidup sehat setiap hari.'
  const heroCtaLabel = (storefront?.hero_cta_label || '').trim() || 'Belanja Sekarang'
  const productsTitle = (storefront?.products_title || '').trim() || 'Our Products'
  const productsSubtitle = (storefront?.products_subtitle || '').trim() || 'Pilihan terbaik untuk kebutuhan harian.'

  useEffect(() => {
    setActiveBannerIndex(0)
  }, [slug, bannerImages.length])

  useEffect(() => {
    if (bannerImages.length <= 1) return
    const timer = window.setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % bannerImages.length)
    }, bannerAutoplayMs)

    return () => window.clearInterval(timer)
  }, [bannerImages.length, bannerAutoplayMs])

  const handleScrollToProducts = () => {
    if (!productsSectionRef.current) return
    productsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleShoppingNow = () => {
    setIsCartOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat toko...</p>
        </div>
      </div>
    );
  }

  if (error || !storefront) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-xl text-gray-600 mb-2">{error}</p>
          <p className="text-gray-400">Toko yang Anda cari tidak tersedia</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8F4] text-[#2F3B2F]">
      {/* Header */}
      <header className="bg-[#F6F8F4] border-b border-[#E3E9DE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex items-center gap-3">
              {storefront.logo_url ? (
                <img
                  src={storefront.logo_url}
                  alt={storefront.store_name}
                  className="w-10 h-10 rounded-full border border-white shadow-sm object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#DCE7D6] flex items-center justify-center text-sm font-bold">
                  {storefront.store_name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-base font-semibold text-[#243024]">{storefront.store_name}</div>
                {storefront.location_text && (
                  <div className="text-xs text-[#5B6B5B]">{storefront.location_text}</div>
                )}
              </div>
            </div>

            <div className="flex-1 flex justify-center">
              <div className="relative w-full max-w-xl">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari produk organik..."
                  className="w-full px-4 py-2.5 pl-11 text-sm bg-white border border-[#DDE6D8] rounded-full focus:outline-none focus:ring-2 focus:ring-current"
                  style={{ '--tw-ring-color': storefront.theme_color } as React.CSSProperties}
                />
                <svg className="absolute left-4 top-2.5 w-4 h-4 text-[#8C9A8C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button className="w-10 h-10 rounded-full border border-[#DDE6D8] bg-white text-[#6B7A6B] hover:bg-[#EFF4EA]">
                <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 7.5A3.75 3.75 0 0112 11.25 3.75 3.75 0 018.25 7.5 3.75 3.75 0 0112 3.75a3.75 3.75 0 013.75 3.75z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 20.25a7.5 7.5 0 0115 0" />
                </svg>
              </button>
              <button className="w-10 h-10 rounded-full border border-[#DDE6D8] bg-white text-[#6B7A6B] hover:bg-[#EFF4EA]">
                <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 6h13L17 13M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
                </svg>
              </button>
              <button className="w-10 h-10 rounded-full border border-[#DDE6D8] bg-white text-[#6B7A6B] hover:bg-[#EFF4EA]">
                <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.74 0 3.41 1.01 4.13 2.6C11.09 5.01 12.76 4 14.5 4 17 4 19 6 19 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Carousel */}
      {bannerImages.length > 0 && (
        <section className="bg-[#EEF3E8] border-b border-[#E3E9DE]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[#7C8C7A] mb-3">Fresh Organic</div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#243024] leading-tight mb-4">
                  {heroTitle}
                </h2>
                <p className="text-sm sm:text-base text-[#5F6D5F] mb-6 max-w-lg">
                  {heroSubtitle}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleShoppingNow}
                    className="px-5 py-2.5 rounded-full text-sm font-semibold text-white shadow-sm"
                    style={{ backgroundColor: storefront.theme_color }}
                  >
                    {heroCtaLabel}
                  </button>
                  <button
                    type="button"
                    onClick={handleScrollToProducts}
                    className="px-5 py-2.5 rounded-full text-sm font-semibold text-[#4B5A4B] border border-[#C9D6C5] bg-white"
                  >
                    Lihat Kategori
                  </button>
                </div>
              </div>

              <div>
                <div className="relative rounded-3xl bg-[#E5ECDD] p-3 shadow-[0_18px_50px_rgba(48,64,48,0.18)]">
                  <div className="relative aspect-video overflow-hidden rounded-2xl">
                    <img
                      key={bannerImages[activeBannerIndex]}
                      src={bannerImages[activeBannerIndex]}
                      alt={`${storefront.store_name} banner ${activeBannerIndex + 1}`}
                      className="w-full h-full object-cover"
                      loading={activeBannerIndex === 0 ? 'eager' : 'lazy'}
                      fetchPriority={activeBannerIndex === 0 ? 'high' : 'auto'}
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-black/20" />
                  </div>

                  {bannerImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveBannerIndex((prev) => (prev - 1 + bannerImages.length) % bannerImages.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 text-[#314031] shadow hover:bg-white"
                        aria-label="Banner sebelumnya"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveBannerIndex((prev) => (prev + 1) % bannerImages.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 text-[#314031] shadow hover:bg-white"
                        aria-label="Banner berikutnya"
                      >
                        ›
                      </button>
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/80 px-3 py-2 rounded-full shadow">
                        {bannerImages.map((_, index) => (
                          <button
                            key={`dot-${index}`}
                            type="button"
                            onClick={() => setActiveBannerIndex(index)}
                            className={`h-2 rounded-full transition-all ${activeBannerIndex === index ? 'w-6 bg-[#4B5A4B]' : 'w-2 bg-[#C7D3C2]'}`}
                            aria-label={`Pilih banner ${index + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Products Grid */}
      <main ref={productsSectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[#7C8C7A]">{productsTitle}</div>
            <h3 className="text-2xl sm:text-3xl font-semibold text-[#243024]">{productsTitle}</h3>
            <p className="text-sm text-[#5F6D5F]">{productsSubtitle}</p>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all ${
                selectedCategory === 'all'
                  ? 'text-white border-transparent'
                  : 'bg-white text-[#4B5A4B] border-[#DCE7D6] hover:bg-[#EEF3E8]'
              }`}
              style={selectedCategory === 'all' ? { backgroundColor: storefront.theme_color } : {}}
            >
              Semua
            </button>
            {categories.map(category => (
              <button
                key={`cat-${category}`}
                onClick={() => setSelectedCategory(category!)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all ${
                  selectedCategory === category
                    ? 'text-white border-transparent'
                    : 'bg-white text-[#4B5A4B] border-[#DCE7D6] hover:bg-[#EEF3E8]'
                }`}
                style={selectedCategory === category ? { backgroundColor: storefront.theme_color } : {}}
              >
                {category}
              </button>
            ))}
          </div>
        )}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-xl text-gray-600 mb-2">
              {searchQuery ? 'Produk tidak ditemukan' : 'Belum ada produk'}
            </p>
            <p className="text-gray-400">
              {searchQuery ? 'Coba kata kunci lain' : 'Produk akan segera ditambahkan'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                themeColor={storefront.theme_color}
                onClick={() => {
                  setSelectedProduct(product);
                  trackEvent('product_click', product.id);
                }}
              />
            ))}
          </div>
        )}
        {highlightCategories.length > 0 && (
          <section className="mt-10">
            <div className="grid gap-4 sm:grid-cols-2">
              {highlightCategories.map((category, index) => (
                <div
                  key={`highlight-${category}`}
                  className={`rounded-2xl p-6 border shadow-sm ${index % 2 === 0 ? 'bg-[#E7EFE1] border-[#D4E0CE]' : 'bg-[#F2F4E8] border-[#E3E6D6]'}`}
                >
                  <div className="text-xs uppercase tracking-[0.2em] text-[#7C8C7A] mb-2">Category</div>
                  <h4 className="text-xl font-semibold text-[#243024] mb-3">{category}</h4>
                  <p className="text-sm text-[#5F6D5F] mb-4">Pilihan terbaik untuk gaya hidup sehat dan seimbang.</p>
                  <button
                    onClick={() => setSelectedCategory(category)}
                    className="px-4 py-2 rounded-full text-xs font-semibold bg-white text-[#4B5A4B] border border-[#C9D6C5] hover:bg-[#EEF3E8]"
                  >
                    Jelajahi Produk
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          themeColor={storefront.theme_color}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(quantity, variant, notes) =>
            addToCart(selectedProduct, quantity, variant, notes)
          }
        />
      )}

      {/* Shopping Cart */}
      <ShoppingCart
        cartItems={cartItems}
        themeColor={storefront.theme_color}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onCheckout={handleCheckout}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        cartItems={checkoutItems}
        totalAmount={checkoutItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
        themeColor={storefront.theme_color}
        storeName={storefront.store_name}
        storefrontSlug={slug}
        qrisImage={storefront.qris_image_url}
        businessBankAccount={
          storefront.bank_name && storefront.bank_account_number
            ? {
                bank_name: storefront.bank_name,
                account_number: storefront.bank_account_number,
                account_holder: storefront.bank_account_holder || storefront.store_name,
              }
            : undefined
        }
        onPaymentComplete={handlePaymentComplete}
      />

      {/* Floating Cart Button */}
      <FloatingCartButton
        cartItems={cartItems}
        themeColor={storefront.theme_color}
        onClick={() => setIsCartOpen(true)}
      />

      {/* Floating WhatsApp Button */}
      <FloatingWhatsApp
        whatsappNumber={storefront.whatsapp_number}
        storeName={storefront.store_name}
        themeColor={storefront.theme_color}
      />

      {/* Footer */}
      <footer className="bg-[#314031] text-[#E7EFE1] mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-[#C8D4C2]">About Us</div>
              <p className="text-sm text-[#E1E8DA] mt-3">
                {storefront.store_name} hadir dengan pilihan produk segar dan alami untuk gaya hidup sehat setiap hari.
              </p>
            </div>
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-[#C8D4C2]">Quick Links</div>
              <ul className="mt-3 space-y-2 text-sm text-[#E1E8DA]">
                <li><a className="hover:text-white" href="#">Home</a></li>
                <li><a className="hover:text-white" href="#">Shop</a></li>
                <li><a className="hover:text-white" href="#">About</a></li>
                <li><a className="hover:text-white" href="#">Contact</a></li>
              </ul>
            </div>
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-[#C8D4C2]">Follow Us</div>
              <div className="mt-3 flex items-center gap-3 text-[#E1E8DA]">
                <span className="w-9 h-9 rounded-full border border-[#4E5C4E] flex items-center justify-center">IG</span>
                <span className="w-9 h-9 rounded-full border border-[#4E5C4E] flex items-center justify-center">FB</span>
                <span className="w-9 h-9 rounded-full border border-[#4E5C4E] flex items-center justify-center">X</span>
              </div>
              {storefront.instagram_handle && (
                <div className="text-xs text-[#C8D4C2] mt-3">
                  @{storefront.instagram_handle.replace('@', '')}
                </div>
              )}
            </div>
          </div>
          <div className="mt-8 text-xs text-[#C8D4C2]">© {new Date().getFullYear()} {storefront.store_name}. Powered by Katalara.</div>
        </div>
      </footer>
      <ToastContainer />
    </div>
  );
}
