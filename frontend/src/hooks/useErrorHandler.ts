import { useCallback } from 'react';
import { handleError, ErrorInfo, extractValidationErrors } from '../utils/errorHandler';
import { AxiosError } from 'axios';

/**
 * Custom hook for standardized error handling
 * 
 * Provides consistent error handling methods for components.
 * All methods are memoized with useCallback for performance.
 * 
 * @returns {Object} Error handling methods
 * @returns {Function} returns.handleApiError - Handle general API errors
 * @returns {Function} returns.handleValidationError - Extract validation errors
 * @returns {Function} returns.handleMutationError - Handle React Query mutation errors
 * 
 * @example
 * ```typescript
 * const { handleApiError, handleMutationError } = useErrorHandler();
 * 
 * // In a mutation
 * mutation.mutate(data, {
 *   onError: (error) => handleMutationError(error)
 * });
 * ```
 */
export const useErrorHandler = () => {
  /**
   * Handle API errors with consistent error handling
   * 
   * @param {unknown} error - Error object
   * @param {Object} [options] - Error handling options
   * @param {boolean} [options.showToast] - Whether to show toast
   * @param {string} [options.customMessage] - Custom error message
   * @param {Function} [options.onError] - Custom error handler
   * @returns {ErrorInfo} Error information
   */
  const handleApiError = useCallback((error: unknown, options?: {
    showToast?: boolean;
    customMessage?: string;
    onError?: (errorInfo: ErrorInfo) => void;
  }): ErrorInfo => {
    return handleError(error, options);
  }, []);

  /**
   * Handle validation errors and return field errors
   * 
   * @param {unknown} error - Error object containing validation errors
   * @returns {Record<string, string>} Object mapping field names to error messages
   */
  const handleValidationError = useCallback((error: unknown): Record<string, string> => {
    return extractValidationErrors(error);
  }, []);

  /**
   * Handle mutation errors (for React Query mutations)
   * 
   * Automatically shows toast notifications for mutation errors.
   * 
   * @param {unknown} error - Error object
   * @param {Object} [options] - Error handling options
   * @param {string} [options.customMessage] - Custom error message
   * @param {Function} [options.onError] - Custom error handler
   * @returns {ErrorInfo} Error information
   */
  const handleMutationError = useCallback((error: unknown, options?: {
    customMessage?: string;
    onError?: (errorInfo: ErrorInfo) => void;
  }): ErrorInfo => {
    return handleError(error, {
      showToast: true,
      ...options,
    });
  }, []);

  return {
    handleApiError,
    handleValidationError,
    handleMutationError,
  };
};

export default useErrorHandler;

