'use client'

import { useState, useEffect } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  variant = 'danger',
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
    }
  }, [isOpen])

  if (!isOpen) return null

  const variantStyles = {
    danger: {
      icon: '⚠️',
      iconBg: 'bg-red-100',
      iconText: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    },
    warning: {
      icon: '⚡',
      iconBg: 'bg-yellow-100',
      iconText: 'text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
    },
    info: {
      icon: 'ℹ️',
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    }
  }

  const styles = variantStyles[variant]

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title" 
      role="dialog" 
      aria-modal="true"
    >
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-gray-900 transition-opacity duration-300 ${
          isAnimating ? 'bg-opacity-75' : 'bg-opacity-0'
        }`}
        onClick={onCancel}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div 
          className={`relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all duration-300 sm:my-8 sm:w-full sm:max-w-lg ${
            isAnimating ? 'opacity-100 translate-y-0 sm:scale-100' : 'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
          }`}
        >
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              {/* Icon */}
              <div className={`mx-auto flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full ${styles.iconBg} sm:mx-0 sm:h-14 sm:w-14`}>
                <span className={`text-3xl ${styles.iconText}`}>
                  {styles.icon}
                </span>
              </div>
              
              {/* Content */}
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                <h3 
                  className="text-xl font-bold leading-6 text-gray-900 mb-2" 
                  id="modal-title"
                >
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-3">
            <button
              type="button"
              className={`inline-flex w-full justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm ${styles.button} focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto transition-all duration-200 transform hover:scale-105`}
              onClick={() => {
                setIsAnimating(false)
                setTimeout(onConfirm, 150)
              }}
            >
              {confirmLabel}
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 sm:mt-0 sm:w-auto transition-all duration-200"
              onClick={() => {
                setIsAnimating(false)
                setTimeout(onCancel, 150)
              }}
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
