/**
 * Tests for error handler utility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleError, ErrorType, extractValidationErrors } from '../../utils/errorHandler';

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
  },
}));

// Mock accessibility
vi.mock('../../utils/accessibility', () => ({
  announceToScreenReader: vi.fn(),
}));

describe('errorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleError', () => {
    it('should handle network errors', () => {
      const error = {
        code: 'ERR_NETWORK',
        message: 'Network Error',
      };

      const result = handleError(error);

      expect(result.type).toBe(ErrorType.NETWORK);
      expect(result.message).toContain('connect to the server');
    });

    it('should handle validation errors', () => {
      const error = {
        response: {
          status: 400,
          data: {
            errors: {
              email: 'Invalid email',
              password: 'Password too short',
            },
          },
        },
      };

      const result = handleError(error);

      expect(result.type).toBe(ErrorType.VALIDATION);
      expect(result.validationErrors).toHaveProperty('email');
      expect(result.validationErrors).toHaveProperty('password');
    });

    it('should handle authentication errors', () => {
      const error = {
        response: {
          status: 401,
          data: {
            message: 'Invalid token',
          },
        },
      };

      const result = handleError(error);

      expect(result.type).toBe(ErrorType.AUTHENTICATION);
      expect(result.message).toContain('session has expired');
    });

    it('should handle authorization errors', () => {
      const error = {
        response: {
          status: 403,
          data: {
            message: 'Forbidden',
          },
        },
      };

      const result = handleError(error);

      expect(result.type).toBe(ErrorType.AUTHORIZATION);
      expect(result.message).toContain('permission');
    });

    it('should handle server errors', () => {
      const error = {
        response: {
          status: 500,
          data: {
            message: 'Internal Server Error',
          },
        },
      };

      const result = handleError(error);

      expect(result.type).toBe(ErrorType.SERVER);
    });

    it('should use custom message when provided', () => {
      const error = new Error('Test error');

      const result = handleError(error, {
        customMessage: 'Custom error message',
      });

      expect(result.message).toBe('Custom error message');
    });

    it('should not show toast when showToast is false', async () => {
      const toast = await import('react-hot-toast');
      const error = new Error('Test error');

      handleError(error, { showToast: false });

      expect(toast.default.error).not.toHaveBeenCalled();
    });
  });

  describe('extractValidationErrors', () => {
    it('should extract validation errors from array format', () => {
      const error = {
        response: {
          data: {
            errors: [
              { field: 'email', msg: 'Invalid email' },
              { field: 'password', msg: 'Required' },
            ],
          },
        },
      };

      const errors = extractValidationErrors(error);

      expect(errors).toHaveProperty('email');
      expect(errors).toHaveProperty('password');
      expect(errors.email).toBe('Invalid email');
      expect(errors.password).toBe('Required');
    });

    it('should extract validation errors from object format', () => {
      const error = {
        response: {
          data: {
            errors: {
              email: 'Invalid email',
              password: 'Required',
            },
          },
        },
      };

      const errors = extractValidationErrors(error);

      expect(errors).toHaveProperty('email');
      expect(errors).toHaveProperty('password');
    });

    it('should return empty object when no validation errors', () => {
      const error = {
        response: {
          data: {
            message: 'Generic error',
          },
        },
      };

      const errors = extractValidationErrors(error);

      expect(errors).toEqual({});
    });
  });
});

