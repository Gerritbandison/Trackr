import toast from 'react-hot-toast';

/**
 * Enhanced toast notifications with custom styles
 */

export const showSuccessToast = (message, options = {}) => {
  return toast.success(message, {
    duration: 3000,
    position: 'top-right',
    style: {
      background: '#10b981',
      color: '#fff',
      padding: '16px',
      borderRadius: '12px',
      fontWeight: '500',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#10b981',
    },
    ...options,
  });
};

export const showErrorToast = (message, options = {}) => {
  return toast.error(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#ef4444',
      color: '#fff',
      padding: '16px',
      borderRadius: '12px',
      fontWeight: '500',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#ef4444',
    },
    ...options,
  });
};

export const showLoadingToast = (message, options = {}) => {
  return toast.loading(message, {
    position: 'top-right',
    style: {
      background: '#3b82f6',
      color: '#fff',
      padding: '16px',
      borderRadius: '12px',
      fontWeight: '500',
    },
    ...options,
  });
};

export const showWarningToast = (message, options = {}) => {
  return toast(message, {
    duration: 3500,
    position: 'top-right',
    icon: '⚠️',
    style: {
      background: '#f59e0b',
      color: '#fff',
      padding: '16px',
      borderRadius: '12px',
      fontWeight: '500',
    },
    ...options,
  });
};

export const showInfoToast = (message, options = {}) => {
  return toast(message, {
    duration: 3000,
    position: 'top-right',
    icon: 'ℹ️',
    style: {
      background: '#6366f1',
      color: '#fff',
      padding: '16px',
      borderRadius: '12px',
      fontWeight: '500',
    },
    ...options,
  });
};

// Promise-based toasts
export const showPromiseToast = (promise, messages) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading || 'Loading...',
      success: messages.success || 'Success!',
      error: messages.error || 'Error occurred',
    },
    {
      style: {
        padding: '16px',
        borderRadius: '12px',
        fontWeight: '500',
      },
    }
  );
};

export default {
  success: showSuccessToast,
  error: showErrorToast,
  loading: showLoadingToast,
  warning: showWarningToast,
  info: showInfoToast,
  promise: showPromiseToast,
};

