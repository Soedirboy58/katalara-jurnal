'use client';

import React from 'react';
import Image from 'next/image';
import { StorefrontProduct, calculateDiscountPercentage, isProductInStock, isProductLowStock } from '@/types/lapak';

interface ProductCardProps {
  product: StorefrontProduct;
  themeColor: string;
  onClick: () => void;
}

export default function ProductCard({ product, themeColor, onClick }: ProductCardProps) {
  const inStock = isProductInStock(product);
  const lowStock = isProductLowStock(product);
  const discountPercentage = calculateDiscountPercentage(product.price, product.compare_at_price);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer group border border-gray-100"
    >
      {/* Product Image */}
      <div className="relative aspect-square bg-gray-100">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {!inStock && (
            <span className="px-2 py-1 bg-gray-800 text-white text-xs font-medium rounded">
              Habis
            </span>
          )}
          {inStock && lowStock && (
            <span className="px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded">
              Stok Terbatas
            </span>
          )}
          {product.is_featured && (
            <span 
              className="px-2 py-1 text-white text-xs font-medium rounded"
              style={{ backgroundColor: themeColor }}
            >
              Unggulan
            </span>
          )}
        </div>

        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
              -{discountPercentage}%
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3">
        {/* Category */}
        {product.category && (
          <p className="text-xs text-gray-500 mb-1 truncate">{product.category}</p>
        )}

        {/* Product Name */}
        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Price Section */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg font-bold text-gray-900">
            Rp {product.price.toLocaleString('id-ID')}
          </span>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-sm text-gray-400 line-through">
              Rp {product.compare_at_price.toLocaleString('id-ID')}
            </span>
          )}
        </div>

        {/* Stock Info */}
        {inStock && product.track_inventory && (
          <p className="text-xs text-gray-500 mt-2">
            Stok: {product.stock_quantity}
          </p>
        )}
      </div>

      {/* Hover Effect Border */}
      <div 
        className="h-1 w-0 group-hover:w-full transition-all duration-300"
        style={{ backgroundColor: themeColor }}
      />
    </div>
  );
}
