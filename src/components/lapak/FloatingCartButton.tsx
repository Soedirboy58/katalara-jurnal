'use client';

import React, { useState, useEffect } from 'react';
import { CartItem } from '@/types/lapak';

interface FloatingCartButtonProps {
  cartItems: CartItem[];
  themeColor: string;
  onClick: () => void;
}

export default function FloatingCartButton({ cartItems, themeColor, onClick }: FloatingCartButtonProps) {
  const [bounce, setBounce] = useState(false);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Bounce animation when cart is updated
  useEffect(() => {
    if (totalItems > 0) {
      setBounce(true);
      const timer = setTimeout(() => setBounce(false), 500);
      return () => clearTimeout(timer);
    }
  }, [totalItems]);

  if (totalItems === 0) return null;

  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-40 shadow-2xl rounded-full p-4 text-white flex items-center gap-3 hover:scale-105 transition-all ${
        bounce ? 'animate-bounce' : ''
      }`}
      style={{ backgroundColor: themeColor }}
    >
      {/* Cart Icon */}
      <div className="relative">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        
        {/* Badge with item count */}
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      </div>

      {/* Price (hidden on mobile) */}
      <div className="hidden sm:flex flex-col items-start">
        <span className="text-xs opacity-90">{totalItems} Item</span>
        <span className="font-bold">Rp {totalPrice.toLocaleString('id-ID')}</span>
      </div>
    </button>
  );
}
