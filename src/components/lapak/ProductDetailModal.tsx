'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { StorefrontProduct, calculateDiscountPercentage, isProductInStock } from '@/types/lapak';

interface ProductDetailModalProps {
  product: StorefrontProduct;
  themeColor: string;
  onClose: () => void;
  onAddToCart: (quantity: number, variant?: string, notes?: string) => void;
}

export default function ProductDetailModal({ 
  product, 
  themeColor, 
  onClose, 
  onAddToCart 
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const inStock = isProductInStock(product);
  const discountPercentage = calculateDiscountPercentage(product.price, product.compare_at_price);
  
  // Get all images (main + additional)
  const allImages = product.image_url 
    ? [product.image_url, ...(product.image_urls || [])]
    : product.image_urls || [];

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity < 1) return;
    if (product.track_inventory && newQuantity > product.stock_quantity) return;
    setQuantity(newQuantity);
  };

  const handleVariantChange = (variantName: string, option: string) => {
    setSelectedVariants(prev => ({ ...prev, [variantName]: option }));
  };

  const handleAddToCart = () => {
    const variantString = product.variants && product.variants.length > 0
      ? Object.entries(selectedVariants).map(([name, value]) => `${name}: ${value}`).join(', ')
      : undefined;
    
    onAddToCart(quantity, variantString, notes);
  };

  const isVariantComplete = () => {
    if (!product.variants || product.variants.length === 0) return true;
    return product.variants.every(v => selectedVariants[v.name]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header with Close Button */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">Detail Produk</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid md:grid-cols-2 gap-6 p-6">
            {/* Left Column - Images */}
            <div>
              {/* Main Image */}
              <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4">
                {allImages.length > 0 ? (
                  <Image
                    src={allImages[currentImageIndex]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-24 h-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Discount Badge */}
                {discountPercentage > 0 && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-lg shadow-lg">
                      -{discountPercentage}%
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnail Navigation */}
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {allImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                        currentImageIndex === index 
                          ? 'border-current scale-105' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={currentImageIndex === index ? { borderColor: themeColor } : {}}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Product Info */}
            <div className="flex flex-col">
              {/* Category */}
              {product.category && (
                <span 
                  className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white mb-3 w-fit"
                  style={{ backgroundColor: themeColor }}
                >
                  {product.category}
                </span>
              )}

              {/* Product Name */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-bold text-gray-900">
                  Rp {product.price.toLocaleString('id-ID')}
                </span>
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <span className="text-lg text-gray-400 line-through">
                    Rp {product.compare_at_price.toLocaleString('id-ID')}
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                {inStock ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Tersedia</span>
                    {product.track_inventory && (
                      <span className="text-gray-500">({product.stock_quantity} stok)</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Stok Habis</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Deskripsi</h3>
                  <p className="text-gray-600 whitespace-pre-line">{product.description}</p>
                </div>
              )}

              {/* Variants */}
              {product.variants && product.variants.length > 0 && (
                <div className="mb-6 space-y-4">
                  {product.variants.map((variant) => (
                    <div key={variant.name}>
                      <label className="block font-semibold text-gray-900 mb-2">
                        {variant.name}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {variant.options.map((option) => (
                          <button
                            key={option}
                            onClick={() => handleVariantChange(variant.name, option)}
                            className={`px-4 py-2 border-2 rounded-lg font-medium transition-all ${
                              selectedVariants[variant.name] === option
                                ? 'text-white'
                                : 'border-gray-300 text-gray-700 hover:border-gray-400'
                            }`}
                            style={
                              selectedVariants[variant.name] === option
                                ? { backgroundColor: themeColor, borderColor: themeColor }
                                : {}
                            }
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity Selector */}
              {inStock && (
                <div className="mb-6">
                  <label className="block font-semibold text-gray-900 mb-2">Jumlah</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold text-xl"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        if (product.track_inventory && val > product.stock_quantity) return;
                        setQuantity(Math.max(1, val));
                      }}
                      className="w-20 h-10 text-center border-2 border-gray-300 rounded-lg font-semibold text-lg"
                    />
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={product.track_inventory && quantity >= product.stock_quantity}
                      className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold text-xl"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Notes */}
              {inStock && (
                <div className="mb-6">
                  <label className="block font-semibold text-gray-900 mb-2">Catatan (Opsional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Tulisan di kue 'Happy Birthday'"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-current focus:outline-none resize-none"
                    rows={3}
                    style={{ borderColor: notes ? themeColor : undefined }}
                  />
                </div>
              )}

              {/* Add to Cart Button */}
              {inStock && (
                <button
                  onClick={handleAddToCart}
                  disabled={!isVariantComplete()}
                  className="w-full py-4 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-lg"
                  style={{ backgroundColor: themeColor }}
                >
                  {isVariantComplete() 
                    ? `Tambah ke Keranjang - Rp ${(product.price * quantity).toLocaleString('id-ID')}`
                    : 'Pilih varian terlebih dahulu'
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
