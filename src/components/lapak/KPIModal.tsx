'use client';

import React from 'react';

interface KPIModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: string;
  value: number;
  description: string;
  detailItems?: Array<{
    label: string;
    value: string | number;
    icon?: string;
  }>;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const colorStyles = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
    gradient: 'from-blue-50 to-blue-100',
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-200',
    gradient: 'from-green-50 to-green-100',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-200',
    gradient: 'from-purple-50 to-purple-100',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-200',
    gradient: 'from-orange-50 to-orange-100',
  },
};

export default function KPIModal({
  isOpen,
  onClose,
  title,
  icon,
  value,
  description,
  detailItems,
  color,
}: KPIModalProps) {
  if (!isOpen) return null;

  const styles = colorStyles[color];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className={`bg-gradient-to-r ${styles.gradient} border-b ${styles.border} p-6`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`${styles.bg} ${styles.text} text-3xl p-4 rounded-xl border ${styles.border}`}>
                {icon}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Value */}
        <div className="p-6 text-center border-b border-gray-200">
          <div className={`text-5xl font-bold ${styles.text} mb-2`}>
            {value.toLocaleString('id-ID')}
          </div>
          <p className="text-gray-600 text-sm">Total {title}</p>
        </div>

        {/* Detail Items */}
        {detailItems && detailItems.length > 0 && (
          <div className="p-6 space-y-3">
            <h4 className="font-semibold text-gray-900 mb-4">Detail Breakdown:</h4>
            {detailItems.map((item, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 ${styles.bg} border ${styles.border} rounded-lg hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center gap-3">
                  {item.icon && <span className="text-2xl">{item.icon}</span>}
                  <span className="font-medium text-gray-700">{item.label}</span>
                </div>
                <span className={`font-bold ${styles.text} text-lg`}>
                  {typeof item.value === 'number'
                    ? item.value.toLocaleString('id-ID')
                    : item.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className={`w-full py-3 ${styles.text} ${styles.bg} hover:opacity-80 rounded-lg font-semibold transition-all border ${styles.border}`}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
