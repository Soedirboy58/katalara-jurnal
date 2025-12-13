/**
 * Window interface extensions for global functions
 */

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Window {
  /**
   * Global toast notification function
   * @param message - The message to display in the toast
   * @param type - The type of toast (success, error, warning, info)
   */
  showToast?: (message: string, type?: ToastType) => void
}
