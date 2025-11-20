'use client';

import React, { useState } from 'react';
import { CartItem } from '@/types/lapak';

interface ShoppingCartProps {
  cartItems: CartItem[];
  themeColor: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: (selectedItems: CartItem[]) => void;
}

export default function ShoppingCart({
  cartItems,
  themeColor,
  isOpen,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: ShoppingCartProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(cartItems.map(item => item.product_id)));

  const handleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartItems.map(item => item.product_id)));
    }
  };

  const handleSelectItem = (productId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedItems(newSelected);
  };

  const getSelectedItems = () => {
    return cartItems.filter(item => selectedItems.has(item.product_id));
  };

  const selectedTotal = getSelectedItems().reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const selectedCount = getSelectedItems().reduce((sum, item) => sum + item.quantity, 0);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Cart Sidebar */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Keranjang Belanja</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6">
            <svg className="w-24 h-24 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-lg font-medium">Keranjang Kosong</p>
            <p className="text-sm mt-2">Mulai tambahkan produk ke keranjang</p>
          </div>
        ) : (
          <>
            {/* Select All */}
            <div className="px-6 py-3 border-b border-gray-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedItems.size === cartItems.length}
                  onChange={handleSelectAll}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: themeColor }}
                />
                <span className="font-medium text-gray-900">Pilih Semua ({cartItems.length})</span>
              </label>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.product_id} className="px-6 py-4 border-b border-gray-100">
                  <div className="flex gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.product_id)}
                      onChange={() => handleSelectItem(item.product_id)}
                      className="w-5 h-5 rounded mt-1 flex-shrink-0"
                      style={{ accentColor: themeColor }}
                    />

                    {/* Product Image */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      {item.product_image ? (
                        <img 
                          src={item.product_image} 
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{item.product_name}</h3>
                      {item.variant && (
                        <p className="text-sm text-gray-500 mt-1">{item.variant}</p>
                      )}
                      {item.notes && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">Catatan: {item.notes}</p>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-gray-900">
                          Rp {item.price.toLocaleString('id-ID')}
                        </span>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="w-7 h-7 rounded border border-gray-300 hover:border-gray-400 disabled:opacity-50 flex items-center justify-center text-sm font-bold"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                            className="w-7 h-7 rounded border border-gray-300 hover:border-gray-400 flex items-center justify-center text-sm font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => onRemoveItem(item.product_id)}
                      className="flex-shrink-0 p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer - Checkout Section */}
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">Total ({selectedCount} item)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    Rp {selectedTotal.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => onCheckout(getSelectedItems())}
                disabled={selectedItems.size === 0}
                className="w-full py-4 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-lg"
                style={{ backgroundColor: themeColor }}
              >
                Checkout ({selectedCount} item)
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
