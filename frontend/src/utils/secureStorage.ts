/**
 * Secure Storage Utility
 * 
 * Provides environment-based token storage with options for
 * localStorage (development) or httpOnly cookies (production)
 */

/**
 * Storage mode type
 */
type StorageMode = 'localStorage' | 'memory' | 'cookie';

/**
 * Get storage mode based on environment
 */
const getStorageMode = (): StorageMode => {
  // In production, prefer cookies for security
  // In development, use localStorage for convenience
  if (import.meta.env.PROD && import.meta.env.VITE_USE_COOKIES === 'true') {
    return 'cookie';
  }
  if (import.meta.env.VITE_USE_MEMORY_STORAGE === 'true') {
    return 'memory';
  }
  return 'localStorage';
};

/**
 * In-memory storage for token (most secure, but lost on refresh)
 */
const memoryStorage: Map<string, string> = new Map();

/**
 * Secure storage interface
 */
export const secureStorage = {
  /**
   * Set item in secure storage
   */
  setItem: (key: string, value: string): void => {
    const mode = getStorageMode();
    
    switch (mode) {
      case 'memory':
        memoryStorage.set(key, value);
        break;
      case 'cookie':
        // For cookies, the backend should handle setting httpOnly cookies
        // This is a fallback for client-side cookie setting (not recommended for tokens)
        document.cookie = `${key}=${value}; path=/; SameSite=Strict; ${import.meta.env.PROD ? 'Secure;' : ''}`;
        break;
      case 'localStorage':
      default:
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          // Fallback to memory if localStorage fails
          memoryStorage.set(key, value);
        }
        break;
    }
  },

  /**
   * Get item from secure storage
   */
  getItem: (key: string): string | null => {
    const mode = getStorageMode();
    
    switch (mode) {
      case 'memory':
        return memoryStorage.get(key) || null;
      case 'cookie':
        // For cookies, the backend should handle reading httpOnly cookies
        // This is a fallback for client-side cookie reading
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [cookieKey, cookieValue] = cookie.trim().split('=');
          if (cookieKey === key) {
            return cookieValue || null;
          }
        }
        return null;
      case 'localStorage':
      default:
        try {
          return localStorage.getItem(key);
        } catch (error) {
          return memoryStorage.get(key) || null;
        }
    }
  },

  /**
   * Remove item from secure storage
   */
  removeItem: (key: string): void => {
    const mode = getStorageMode();
    
    switch (mode) {
      case 'memory':
        memoryStorage.delete(key);
        break;
      case 'cookie':
        // Remove cookie by setting expiration date in the past
        document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        break;
      case 'localStorage':
      default:
        try {
          localStorage.removeItem(key);
        } catch (error) {
          memoryStorage.delete(key);
        }
        break;
    }
  },

  /**
   * Clear all items from secure storage
   */
  clear: (): void => {
    const mode = getStorageMode();
    
    switch (mode) {
      case 'memory':
        memoryStorage.clear();
        break;
      case 'cookie':
        // Clear all cookies (this is a simplified approach)
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [key] = cookie.trim().split('=');
          document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
        break;
      case 'localStorage':
      default:
        try {
          localStorage.clear();
        } catch (error) {
          memoryStorage.clear();
        }
        break;
    }
  },

  /**
   * Get current storage mode
   */
  getMode: (): StorageMode => {
    return getStorageMode();
  },
};

export default secureStorage;


