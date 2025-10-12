'use client';

import { useState } from 'react';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  productType?: string;
  isAvailable: boolean;
  imageUrl?: string;
}

interface CartConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  menuItem: MenuItem | null;
  quantity: number;
}

export default function CartConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  menuItem,
  quantity
}: CartConfirmationModalProps) {
  if (!isOpen || !menuItem) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">確認加入購物車</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Product Info */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            {menuItem.imageUrl ? (
              <img
                src={menuItem.imageUrl}
                alt={menuItem.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            )}
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{menuItem.name}</h4>
              <p className="text-sm text-gray-600">NT$ {menuItem.price.toFixed(0)}</p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">數量：</span>
              <span className="font-medium text-gray-900">{quantity}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-700">小計：</span>
              <span className="font-bold text-blue-600">NT$ {(menuItem.price * quantity).toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            確認加入
          </button>
        </div>
      </div>
    </div>
  );
}

