'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  type: ToastType
  message: string
  onClose: () => void
}

function ToastItem({ type, message, onClose }: ToastProps) {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  }

  const colors = {
    success: 'bg-green-50 border-green-500 text-green-900',
    error: 'bg-red-50 border-red-500 text-red-900',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-900',
    info: 'bg-blue-50 border-blue-500 text-blue-900',
  }

  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-lg border-l-4 shadow-lg animate-slide-in-right',
      colors[type]
    )}>
      <span className="text-xl">{icons[type]}</span>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        ×
      </button>
    </div>
  )
}

export function ToastContainer() {
  const [toasts, setToasts] = React.useState<Array<{ id: number; type: ToastType; message: string }>>([])

  React.useEffect(() => {
    // Global function to show toast
    window.showToast = (message: string, type: ToastType = 'info') => {
      const id = Date.now()
      setToasts(prev => [...prev, { id, type, message }])
    }
  }, [])

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem
            type={toast.type}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  )
}

// Helper function
export function showToast(message: string, type: ToastType = 'info') {
  if (typeof window !== 'undefined' && window.showToast) {
    window.showToast(message, type)
  }
}
