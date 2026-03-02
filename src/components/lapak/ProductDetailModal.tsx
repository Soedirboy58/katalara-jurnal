'use client';

import React, { useEffect, useState } from 'react';
import NextImage from 'next/image';
import { StorefrontProduct, calculateDiscountPercentage, isProductInStock, isProductPreOrder } from '@/types/lapak';

interface ProductDetailModalProps {
  product: StorefrontProduct;
  themeColor: string;
  storeName: string;
  storefrontSlug: string;
  storeLogoUrl?: string;
  initialShareOpen?: boolean;
  onClose: () => void;
  onAddToCart: (quantity: number, variant?: string, notes?: string) => void;
}

export default function ProductDetailModal({ 
  product, 
  themeColor, 
  storeName,
  storefrontSlug,
  storeLogoUrl,
  initialShareOpen = false,
  onClose, 
  onAddToCart 
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isShareOpen, setIsShareOpen] = useState(initialShareOpen);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);

  const inStock = isProductInStock(product);
  const isPreOrder = isProductPreOrder(product);
  const discountPercentage = calculateDiscountPercentage(product.price, product.compare_at_price);
  
  // Get all images (main + additional)
  const allImages = product.image_url 
    ? [product.image_url, ...(product.image_urls || [])]
    : product.image_urls || [];

  useEffect(() => {
    setIsShareOpen(initialShareOpen);
    setShareStatus(null);
  }, [initialShareOpen, product.id]);

  const buildStorefrontUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/lapak/${storefrontSlug}`;
  };

  const mixHexColors = (hexA: string, hexB: string, amount: number) => {
    const normalize = (hex: string) => hex.replace('#', '');
    const a = normalize(hexA);
    const b = normalize(hexB);
    if (a.length !== 6 || b.length !== 6) return hexA;

    const toRgb = (hex: string) => ({
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    });

    const left = toRgb(a);
    const right = toRgb(b);
    const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
    const mix = (start: number, end: number) => clamp(start + (end - start) * amount);
    const r = mix(left.r, right.r).toString(16).padStart(2, '0');
    const g = mix(left.g, right.g).toString(16).padStart(2, '0');
    const bVal = mix(left.b, right.b).toString(16).padStart(2, '0');
    return `#${r}${g}${bVal}`;
  };

  const loadImage = (src: string) => new Promise<HTMLImageElement | null>((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

  const getAverageColor = (img: HTMLImageElement) => {
    const sampleCanvas = document.createElement('canvas');
    const sampleCtx = sampleCanvas.getContext('2d');
    if (!sampleCtx) return null;

    sampleCanvas.width = 20;
    sampleCanvas.height = 20;

    try {
      sampleCtx.drawImage(img, 0, 0, sampleCanvas.width, sampleCanvas.height);
      const data = sampleCtx.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
      let r = 0;
      let g = 0;
      let b = 0;
      const pixelCount = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }
      const toHex = (value: number) => Math.round(value / pixelCount).toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    } catch {
      return null;
    }
  };

  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  };

  const drawCoverImage = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) => {
    const scale = Math.max(w / img.width, h / img.height);
    const width = img.width * scale;
    const height = img.height * scale;
    const offsetX = x + (w - width) / 2;
    const offsetY = y + (h - height) / 2;
    ctx.drawImage(img, offsetX, offsetY, width, height);
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) => {
    const words = text.split(' ');
    let line = '';
    let lineCount = 0;
    let cursorY = y;

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, x, cursorY);
        lineCount += 1;
        cursorY += lineHeight;
        line = word;
        if (lineCount >= maxLines - 1) break;
      } else {
        line = testLine;
      }
    }

    if (line && lineCount < maxLines) {
      ctx.fillText(line, x, cursorY);
    }
  };

  const generateShareImage = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const mainImage = await loadImage(allImages[0] || '');
    const dominantColor = mainImage ? getAverageColor(mainImage) : null;
    const baseColor = dominantColor || themeColor || '#1f2937';
    const topColor = mixHexColors(baseColor, '#ffffff', 0.25);
    const bottomColor = mixHexColors(baseColor, '#000000', 0.2);
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(1, bottomColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cardX = 90;
    const cardY = 220;
    const cardWidth = canvas.width - 180;
    const cardHeight = 1220;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 48);
    ctx.fill();

    const imageSize = cardWidth - 120;
    const imageX = cardX + 60;
    const imageY = cardY + 60;

    ctx.save();
    drawRoundedRect(ctx, imageX, imageY, imageSize, imageSize, 36);
    ctx.clip();

    if (mainImage) {
      drawCoverImage(ctx, mainImage, imageX, imageY, imageSize, imageSize);
    } else {
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(imageX, imageY, imageSize, imageSize);
    }
    ctx.restore();

    const textX = cardX + 70;
    let textY = imageY + imageSize + 80;
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 64px ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif';
    wrapText(ctx, product.name, textX, textY, cardWidth - 140, 72, 2);
    textY += 150;

    ctx.font = '600 48px ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.fillStyle = '#1f2937';
    ctx.fillText(`Rp ${product.price.toLocaleString('id-ID')}`, textX, textY);
    textY += 90;

    ctx.font = '500 36px ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.fillStyle = '#475569';
    wrapText(ctx, `Tersedia di ${storeName}`, textX, textY, cardWidth - 140, 46, 2);
    textY += 120;

    const logoImage = await loadImage(storeLogoUrl || '');
    const logoSize = 120;
    const logoX = cardX + cardWidth - logoSize - 50;
    const logoY = cardY + 40;
    ctx.save();
    drawRoundedRect(ctx, logoX, logoY, logoSize, logoSize, logoSize / 2);
    ctx.clip();
    if (logoImage) {
      drawCoverImage(ctx, logoImage, logoX, logoY, logoSize, logoSize);
    } else {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(logoX, logoY, logoSize, logoSize);
      ctx.fillStyle = '#64748b';
      ctx.font = '700 42px ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(storeName.charAt(0).toUpperCase(), logoX + logoSize / 2, logoY + logoSize / 2);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
    ctx.restore();

    try {
      return canvas.toDataURL('image/png');
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!isShareOpen) return;
    let cancelled = false;
    const run = async () => {
      setIsGeneratingShare(true);
      const imageUrl = await generateShareImage();
      if (!cancelled) {
        setShareImageUrl(imageUrl);
        setIsGeneratingShare(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [isShareOpen, product.id, themeColor, storeName, storeLogoUrl, storefrontSlug]);

  const storefrontUrl = buildStorefrontUrl();
  const shareText = `${product.name} - ${storeName}`;
  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storefrontUrl)}`;

  const handleDownloadShareImage = () => {
    if (!shareImageUrl) {
      setShareStatus('Gambar belum siap. Coba beberapa saat lagi.');
      return;
    }

    const safeName = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const link = document.createElement('a');
    link.href = shareImageUrl;
    link.download = `${safeName || 'produk'}-share.png`;
    link.click();
    setShareStatus('Gambar siap diunduh. Unggah ke story/status.');
  };

  const dataUrlToFile = async (dataUrl: string, filename: string) => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type || 'image/png' });
  };

  const handleCopyLink = async () => {
    if (!storefrontUrl) return;
    try {
      await navigator.clipboard.writeText(storefrontUrl);
      setShareStatus('Link lapak tersalin.');
    } catch {
      setShareStatus('Gagal menyalin link.');
    }
  };

  const handleInstagramShare = async () => {
    if (!shareImageUrl) {
      setShareStatus('Gambar belum siap. Coba beberapa saat lagi.');
      return;
    }

    const safeName = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

    if (canShare) {
      try {
        const file = await dataUrlToFile(shareImageUrl, `${safeName || 'produk'}-share.png`);
        const payload = {
          files: [file],
          title: product.name,
          text: shareText,
        } as ShareData;

        if (navigator.canShare && !navigator.canShare(payload)) {
          throw new Error('unsupported');
        }

        await navigator.share(payload);
        setShareStatus('Silakan pilih Instagram dari menu berbagi.');
        return;
      } catch {
        // Fall through to download
      }
    }

    handleDownloadShareImage();
    setShareStatus('Perangkat belum mendukung share langsung. Gambar diunduh untuk diunggah ke Instagram.');
  };

  const handleWhatsappShare = async () => {
    if (!shareImageUrl) {
      setShareStatus('Gambar belum siap. Coba beberapa saat lagi.');
      return;
    }

    const safeName = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

    if (canShare) {
      try {
        const file = await dataUrlToFile(shareImageUrl, `${safeName || 'produk'}-share.png`);
        const payload = {
          files: [file],
          title: product.name,
          text: shareText,
        } as ShareData;

        if (navigator.canShare && !navigator.canShare(payload)) {
          throw new Error('unsupported');
        }

        await navigator.share(payload);
        setShareStatus('Silakan pilih WhatsApp untuk membagikan gambar, lalu tempelkan tautan lapak.');
        return;
      } catch {
        // Fall through to download
      }
    }

    handleDownloadShareImage();
    setShareStatus('Perangkat belum mendukung share langsung. Gambar diunduh untuk diunggah ke status WhatsApp, lalu tempelkan tautan lapak.');
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity < 1) return;
    if (product.track_inventory && !isPreOrder && newQuantity > product.stock_quantity) return;
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
                  <NextImage
                    src={allImages[currentImageIndex]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    unoptimized
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
                      <NextImage
                        src={img}
                        alt={`${product.name} ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                        unoptimized
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
                  <div className={`flex items-center gap-2 ${isPreOrder ? 'text-amber-600' : 'text-green-600'}`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      {isPreOrder ? (
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v5.25l3.5 2.1a1 1 0 001-1.72L11 10.75V6z" />
                      ) : (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      )}
                    </svg>
                    <span className="font-medium">{isPreOrder ? 'Pre Order' : 'Tersedia'}</span>
                    {product.track_inventory && !isPreOrder && (
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
                {isPreOrder && (
                  <p className="text-xs text-amber-600 mt-2">
                    Pesanan akan diproses setelah produk siap.
                  </p>
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
                        if (product.track_inventory && !isPreOrder && val > product.stock_quantity) return;
                        setQuantity(Math.max(1, val));
                      }}
                      className="w-20 h-10 text-center border-2 border-gray-300 rounded-lg font-semibold text-lg"
                    />
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={product.track_inventory && !isPreOrder && quantity >= product.stock_quantity}
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

              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsShareOpen(true);
                    setShareStatus(null);
                  }}
                  className="w-full py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  Bagikan Produk
                </button>
              </div>

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

      {isShareOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70">
          <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Bagikan Produk</h3>
              <button
                onClick={() => setIsShareOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Tutup"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="aspect-[9/16] bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                {shareImageUrl ? (
                  <img src={shareImageUrl} alt="Preview share" className="w-full h-full object-cover" />
                ) : isGeneratingShare ? (
                  <div className="text-sm text-gray-500">Menyiapkan gambar...</div>
                ) : (
                  <div className="text-sm text-gray-500">Gambar tidak tersedia.</div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={handleWhatsappShare}
                  className="h-12 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 flex items-center justify-center"
                  aria-label="Bagikan ke WhatsApp"
                >
                  <span className="w-8 h-8 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center">WA</span>
                </button>
                <button
                  type="button"
                  onClick={handleInstagramShare}
                  className="h-12 rounded-lg border border-pink-200 text-pink-600 hover:bg-pink-50 flex items-center justify-center"
                  aria-label="Bagikan ke Instagram"
                >
                  <span className="w-8 h-8 rounded-full bg-pink-500 text-white text-[11px] font-bold flex items-center justify-center">IG</span>
                </button>
                <a
                  href={fbShareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="h-12 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 flex items-center justify-center"
                  aria-label="Bagikan ke Facebook"
                >
                  <span className="w-8 h-8 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">FB</span>
                </a>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-700 mb-1">Tautan lapak</div>
                    <div className="break-all text-gray-800">{storefrontUrl || '-'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="shrink-0 h-9 w-9 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 flex items-center justify-center"
                    aria-label="Salin tautan"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 8h9a2 2 0 012 2v9a2 2 0 01-2 2H8a2 2 0 01-2-2v-9a2 2 0 012-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 text-sm">
                <button
                  type="button"
                  onClick={handleDownloadShareImage}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50"
                >
                  Unduh Gambar
                </button>
              </div>

              {shareStatus && (
                <div className="text-xs text-gray-500">{shareStatus}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
