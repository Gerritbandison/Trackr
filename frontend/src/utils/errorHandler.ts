/**
 * Centralized Error Handling Utility
 * 
 * Provides consistent error handling and user-friendly error messages
 * across the application.
 */

import toast from 'react-hot-toast';
import { announceToScreenReader } from './accessibility';

/**
 * Error types enum
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Error response structure from API
 */
interface ApiErrorResponse {
  message?: string;
  error?: string;
  errors?: Record<string, string | { msg?: string; message?: string }> | Array<{ field?: string; path?: string; msg?: string; message?: string }>;
}

/**
 * Axios error structure
 */
interface AxiosError {
  code?: string;
  message?: string;
  response?: {
    status?: number;
    data?: ApiErrorResponse;
  };
}

/**
 * Error handling options
 */
export interface ErrorHandlingOptions {
  showToast?: boolean;
  announceToScreenReader?: boolean;
  onError?: (error: unknown, info: ErrorInfo) => void;
  customMessage?: string;
}

/**
 * Error information returned by handleError
 */
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  validationErrors: Record<string, string>;
  originalError: unknown;
}

/**
 * Maps HTTP status codes to error types
 */
const statusCodeToErrorType = (status: number): ErrorType => {
  switch (status) {
    case 400:
      return ErrorType.VALIDATION;
    case 401:
      return ErrorType.AUTHENTICATION;
    case 403:
      return ErrorType.AUTHORIZATION;
    case 404:
      return ErrorType.NOT_FOUND;
    case 500:
    case 502:
    case 503:
    case 504:
      return ErrorType.SERVER;
    default:
      return ErrorType.UNKNOWN;
  }
};

/**
 * Extracts a user-friendly error message from various error formats
 * 
 * Handles Axios errors, network errors, API responses, and generic errors.
 * 
 * @param {unknown} error - Error object of any type
 * @returns {string} User-friendly error message
 */
const extractErrorMessage = (error: unknown): string => {
  const err = error as AxiosError;
  
  // Network errors
  if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  // Axios errors with response
  if (err.response?.data) {
    const errorData = err.response.data;
    
    // Handle validation errors object
    if (errorData.errors) {
      const errors = errorData.errors;
      
      if (Array.isArray(errors) && errors.length > 0) {
        const firstError = errors[0];
        if (typeof firstError === 'object' && firstError !== null) {
          return firstError.msg || firstError.message || 'Validation error';
        }
        return String(firstError);
      }
      
      if (typeof errors === 'object' && !Array.isArray(errors)) {
        const firstKey = Object.keys(errors)[0];
        if (!firstKey) return 'Validation error';
        const firstError = errors[firstKey];
        if (typeof firstError === 'string') {
          return firstError;
        }
        if (typeof firstError === 'object' && firstError !== null) {
          return firstError.msg || firstError.message || `${firstKey}: Invalid value`;
        }
      }
      
      return String(errors);
    }
    
    // Handle direct message/error fields
    if (errorData.message) {
      return errorData.message;
    }
    
    if (errorData.error) {
      return errorData.error;
    }
  }

  // Generic error message
  if (err.message) {
    return err.message;
  }

  return 'An unexpected error occurred. Please try again.';
};

/**
 * Extracts validation errors from an error response
 * 
 * Parses validation errors from API responses in various formats:
 * - Array format: [{ field: 'email', msg: 'Invalid email' }]
 * - Object format: { email: 'Invalid email', password: 'Required' }
 * 
 * @param {unknown} error - Error object containing validation errors
 * @returns {Record<string, string>} Object mapping field names to error messages
 * @example
 * ```typescript
 * const errors = extractValidationErrors(error);
 * // Returns: { email: 'Invalid email', password: 'Password is required' }
 * ```
 */
export const extractValidationErrors = (error: unknown): Record<string, string> => {
  const validationErrors: Record<string, string> = {};
  const err = error as AxiosError;
  
  if (err.response?.data?.errors) {
    const errors = err.response.data.errors;
    
    if (Array.isArray(errors)) {
      // Array format: [{ field: 'email', msg: 'Invalid email' }]
      errors.forEach((err) => {
        if (typeof err === 'object' && err !== null) {
          const field = err.field || err.path;
          if (field) {
            validationErrors[field] = err.msg || err.message || String(err);
          }
        }
      });
    } else if (typeof errors === 'object' && !Array.isArray(errors)) {
      // Object format: { email: 'Invalid email', password: 'Required' }
      Object.keys(errors).forEach((key) => {
        const value = errors[key];
        if (typeof value === 'string') {
          validationErrors[key] = value;
        } else if (typeof value === 'object' && value !== null) {
          validationErrors[key] = value.msg || value.message || String(value);
        }
      });
    }
  }
  
  return validationErrors;
};

/**
 * Determines the error type from an error object
 * 
 * Maps HTTP status codes and error codes to ErrorType enum values.
 * 
 * @param {unknown} error - Error object to analyze
 * @returns {ErrorType} The type of error
 * @example
 * ```typescript
 * const errorType = getErrorType(error);
 * // Returns: ErrorType.NETWORK, ErrorType.VALIDATION, etc.
 * ```
 */
export const getErrorType = (error: unknown): ErrorType => {
  const err = error as AxiosError;
  
  // Network errors
  if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
    return ErrorType.NETWORK;
  }

  // HTTP status codes
  if (err.response?.status) {
    return statusCodeToErrorType(err.response.status);
  }

  return ErrorType.UNKNOWN;
};

/**
 * Creates user-friendly error messages for common scenarios
 */
const makeUserFriendly = (message: string): string => {
  // Duplicate email
  if (message.includes('Duplicate') && message.includes('email')) {
    return 'This email address is already in use. Please use a different email.';
  }
  
  // Duplicate asset tag
  if (message.includes('Duplicate') && message.includes('assetTag')) {
    return 'This Asset Tag is already in use. Please use a different tag or leave it blank to auto-generate one.';
  }
  
  // Duplicate serial number
  if (message.includes('Duplicate') && message.includes('serialNumber')) {
    return 'This Serial Number is already in use. Each device must have a unique serial number.';
  }
  
  // Authentication errors
  if (message.includes('Unauthorized') || message.includes('Invalid token')) {
    return 'Your session has expired. Please log in again.';
  }
  
  // Permission errors
  if (message.includes('Forbidden') || message.includes('permission')) {
    return 'You do not have permission to perform this action.';
  }
  
  // Not found errors
  if (message.includes('Not Found') || message.includes('does not exist')) {
    return 'The requested resource could not be found.';
  }
  
  return message;
};

/**
 * Handles errors and displays appropriate notifications
 * 
 * Central error handling function that:
 * - Extracts user-friendly error messages
 * - Determines error type
 * - Displays toast notifications (optional)
 * - Announces errors to screen readers (optional)
 * - Calls custom error handlers (optional)
 * 
 * @param {unknown} error - Error object to handle
 * @param {ErrorHandlingOptions} [options={}] - Error handling options
 * @param {boolean} [options.showToast=true] - Whether to show toast notification
 * @param {boolean} [options.announceToScreenReader=true] - Whether to announce to screen readers
 * @param {Function} [options.onError] - Custom error handler callback
 * @param {string} [options.customMessage] - Custom error message to override default
 * @returns {ErrorInfo} Error information object
 * @example
 * ```typescript
 * const errorInfo = handleError(error, {
 *   showToast: true,
 *   customMessage: 'Custom error message',
 *   onError: (errorInfo) => {
 *     // Custom error handling
 *   }
 * });
 * ```
 */
export const handleError = (error: unknown, options: ErrorHandlingOptions = {}): ErrorInfo => {
  const {
    showToast = true,
    announceToScreenReader: announce = true,
    onError,
    customMessage,
  } = options;

  const errorType = getErrorType(error);
  const rawMessage = customMessage || extractErrorMessage(error);
  const userMessage = makeUserFriendly(rawMessage);
  const validationErrors = extractValidationErrors(error);

  // Create error info object
  const errorInfo: ErrorInfo = {
    type: errorType,
    message: userMessage,
    validationErrors,
    originalError: error,
  };

  // Call custom error handler if provided
  if (onError && typeof onError === 'function') {
    onError(error, errorInfo);
  }

  // Show toast notification
  if (showToast) {
    toast.error(userMessage);
  }

  // Announce to screen readers
  if (announce) {
    announceToScreenReader(userMessage, errorType === ErrorType.VALIDATION ? 'assertive' : 'polite');
  }

  // Log error for debugging (only in development)
  // @ts-expect-error - Vite provides env at runtime, types are defined in vite-env.d.ts
  const env = import.meta.env as any;
  if (env.DEV) {
    console.error('Error handled:', {
      type: errorType,
      message: userMessage,
      originalError: error,
      validationErrors,
    });
  }

  return {
    type: errorType,
    message: userMessage,
    validationErrors,
    originalError: error,
  };
};

/**
 * Handles validation errors and shows field-specific messages
 */
export const handleValidationErrors = (
  error: unknown,
  setFieldError: ((field: string, error: { type: string; message: string }) => void) | null = null,
  options: ErrorHandlingOptions = {}
): Record<string, string> => {
  const validationErrors = extractValidationErrors(error);
  
  // Set field errors if setFieldError function provided
  if (setFieldError && typeof setFieldError === 'function') {
    Object.keys(validationErrors).forEach((field) => {
      const errorMessage = validationErrors[field];
      if (errorMessage) {
        setFieldError(field, { type: 'server', message: errorMessage });
      }
    });
  }
  
  // Show toast for general validation message
  handleError(error, {
    ...options,
    customMessage: Object.keys(validationErrors).length > 0
      ? `Please correct the following errors: ${Object.keys(validationErrors).join(', ')}`
      : undefined,
  });
  
  return validationErrors;
};

/**
 * Wraps async functions with error handling
 */
export const withErrorHandling = <T extends (...args: unknown[]) => Promise<unknown>>(
  asyncFn: T,
  options: ErrorHandlingOptions = {}
): T => {
  return (async (...args: Parameters<T>) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      handleError(error, options);
      throw error; // Re-throw for caller to handle if needed
    }
  }) as T;
};

export default {
  ErrorType,
  handleError,
  handleValidationErrors,
  extractValidationErrors,
  getErrorType,
  withErrorHandling,
};

