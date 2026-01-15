import { toast as sonnerToast } from 'sonner'

/**
 * Toast notification utilities for StarKids
 *
 * Usage:
 *   import { toast } from '@/lib/toast'
 *
 *   toast.success('Gig approved!')
 *   toast.error('Failed to save')
 *   toast.loading('Saving...')
 *   toast.promise(fetchData(), { loading: 'Loading...', success: 'Done!', error: 'Failed' })
 */

export const toast = {
  /**
   * Show a success toast
   */
  success: (message: string, options?: { description?: string }) => {
    return sonnerToast.success(message, {
      description: options?.description,
      duration: 3000,
    })
  },

  /**
   * Show an error toast
   */
  error: (message: string, options?: { description?: string }) => {
    return sonnerToast.error(message, {
      description: options?.description,
      duration: 5000,
    })
  },

  /**
   * Show a warning toast
   */
  warning: (message: string, options?: { description?: string }) => {
    return sonnerToast.warning(message, {
      description: options?.description,
      duration: 4000,
    })
  },

  /**
   * Show an info toast
   */
  info: (message: string, options?: { description?: string }) => {
    return sonnerToast.info(message, {
      description: options?.description,
      duration: 3000,
    })
  },

  /**
   * Show a loading toast (stays until dismissed)
   */
  loading: (message: string) => {
    return sonnerToast.loading(message, {
      duration: Infinity,
    })
  },

  /**
   * Dismiss a specific toast or all toasts
   */
  dismiss: (toastId?: string | number) => {
    return sonnerToast.dismiss(toastId)
  },

  /**
   * Handle async operations with loading/success/error states
   *
   * Usage:
   *   toast.promise(
   *     fetch('/api/save'),
   *     {
   *       loading: 'Saving...',
   *       success: 'Saved!',
   *       error: 'Failed to save'
   *     }
   *   )
   */
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: Error) => string)
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    })
  },

  /**
   * Show a custom toast with actions
   *
   * Usage:
   *   toast.action('Item deleted', {
   *     action: {
   *       label: 'Undo',
   *       onClick: () => restoreItem()
   *     }
   *   })
   */
  action: (
    message: string,
    options: {
      description?: string
      action: {
        label: string
        onClick: () => void
      }
    }
  ) => {
    return sonnerToast(message, {
      description: options.description,
      duration: 5000,
      action: {
        label: options.action.label,
        onClick: options.action.onClick,
      },
    })
  },
}

// Re-export the raw toast for advanced usage
export { sonnerToast as rawToast }
