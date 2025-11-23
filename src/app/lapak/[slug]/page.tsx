'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProductCard from '@/components/lapak/ProductCard';
import ProductDetailModal from '@/components/lapak/ProductDetailModal';
import FloatingCartButton from '@/components/lapak/FloatingCartButton';
import FloatingWhatsApp from '@/components/lapak/FloatingWhatsApp';
import ShoppingCart from '@/components/lapak/ShoppingCart';
import PaymentModal from '@/components/lapak/PaymentModal';
import { Storefront, StorefrontProduct, CartItem, formatWhatsAppMessage } from '@/types/lapak';

interface StorefrontPageProps {
  params: Promise<{ slug: string }>;
}

export default function StorefrontPage({ params }: StorefrontPageProps) {
  const router = useRouter();
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
  const trackEvent = async (eventType: string, productId?: string, metadata?: any) => {
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

  const handlePaymentComplete = async (method: 'qris' | 'transfer' | 'cash') => {
    if (!storefront) return;

    // Calculate total
    const total = checkoutItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Format WhatsApp message with payment method
    const paymentMethodText = 
      method === 'qris' ? 'QRIS (Sudah Dibayar)' :
      method === 'transfer' ? 'Transfer Bank (Sudah Dibayar)' :
      'Tunai (Bayar di Tempat)';

    const message = formatWhatsAppMessage({
      storefront_name: storefront.store_name,
      customer_name: 'Pembeli',
      customer_phone: '-',
      customer_address: '-',
      delivery_method: 'Akan dikonfirmasi',
      items: checkoutItems,
      total_amount: total,
      payment_method: paymentMethodText,
    });

    // Track order to database
    try {
      await fetch(`/api/storefront/${slug}/orders`, {
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
        }),
      });
    } catch (err) {
      console.error('Error tracking order:', err);
    }

    // Track WhatsApp click
    trackEvent('whatsapp_click');

    // Open WhatsApp
    const url = `https://wa.me/${storefront.whatsapp_number}?text=${message}`;
    window.open(url, '_blank');

    // Remove checked out items from cart
    setCartItems(prev => 
      prev.filter(item => !checkoutItems.find(ci => ci.product_id === item.product_id))
    );

    // Close modal
    setIsPaymentModalOpen(false);
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
    <div className="min-h-screen bg-gray-50">
      {/* Cover Image */}
      {storefront.cover_image_url && (
        <div className="relative h-48 sm:h-64 bg-gray-200">
          <img
            src={storefront.cover_image_url}
            alt={storefront.store_name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
        </div>
      )}

      {/* Store Header - Mobile Optimized */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-start sm:items-center gap-3">
            {/* Store Logo */}
            {storefront.logo_url && (
              <img
                src={storefront.logo_url}
                alt={storefront.store_name}
                className="w-14 h-14 sm:w-20 sm:h-20 rounded-full border-2 sm:border-4 border-white shadow-lg object-cover flex-shrink-0"
              />
            )}

            {/* Store Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-3xl font-bold text-gray-900 leading-tight">
                {storefront.store_name}
              </h1>
              {storefront.description && (
                <p className="text-xs sm:text-base text-gray-600 mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-2">{storefront.description}</p>
              )}
              {storefront.location_text && (
                <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">{storefront.location_text}</span>
                </p>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-3 sm:mt-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari produk..."
                className="w-full px-3 sm:px-4 py-2 sm:py-3 pl-9 sm:pl-11 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-current focus:border-transparent"
                style={{ '--tw-ring-color': storefront.theme_color } as any}
              />
              <svg className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3.5 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="mt-2 sm:mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === 'all'
                    ? 'text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={selectedCategory === 'all' ? { backgroundColor: storefront.theme_color } : {}}
              >
                Semua
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category!)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === category
                      ? 'text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={selectedCategory === category ? { backgroundColor: storefront.theme_color } : {}}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
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
      </div>

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
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 mb-2">© {new Date().getFullYear()} {storefront.store_name}</p>
            {storefront.instagram_handle && (
              <a
                href={`https://instagram.com/${storefront.instagram_handle.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-pink-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                @{storefront.instagram_handle.replace('@', '')}
              </a>
            )}
            <p className="text-sm text-gray-400 mt-4">
              Powered by <span className="font-semibold" style={{ color: storefront.theme_color }}>Katalara</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
