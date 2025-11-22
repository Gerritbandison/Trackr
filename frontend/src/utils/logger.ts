/**
 * Centralized Logger Utility
 * 
 * Provides conditional logging that can be disabled in production
 * and structured logging for better debugging.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  level?: LogLevel;
  context?: string;
  data?: unknown;
}

/**
 * Logger configuration
 */
// Type assertion for import.meta.env (Vite types)
// @ts-expect-error - Vite provides env at runtime, types are defined in vite-env.d.ts
const env = import.meta.env as any;

const LOG_CONFIG = {
  enabled: env.DEV || env.VITE_ENABLE_LOGGING === 'true',
  logLevel: (env.VITE_LOG_LEVEL as LogLevel) || 'debug',
  includeTimestamp: true,
};

/**
 * Log levels priority
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Should log this level?
 */
const shouldLog = (level: LogLevel): boolean => {
  if (!LOG_CONFIG.enabled) return false;
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_CONFIG.logLevel];
};

/**
 * Format log message
 */
const formatMessage = (message: string, context?: string): string => {
  let formatted = message;
  
  if (LOG_CONFIG.includeTimestamp) {
    const timestamp = new Date().toISOString();
    formatted = `[${timestamp}] ${formatted}`;
  }
  
  if (context) {
    formatted = `[${context}] ${formatted}`;
  }
  
  return formatted;
};

/**
 * Centralized Logger Object
 * 
 * Provides methods for logging at different levels with structured data.
 * All logging is conditional based on environment and log level configuration.
 * 
 * @example
 * ```typescript
 * logger.debug('Component initialized', { context: 'MyComponent', data: { id: 123 } });
 * logger.info('User logged in', { context: 'Auth' });
 * logger.warn('API response slow', { context: 'API', data: { duration: 5000 } });
 * logger.error('Failed to fetch data', { context: 'API', error: err });
 * ```
 */
export const logger = {
  /**
   * Log a debug message
   * 
   * @param {string} message - The message to log
   * @param {LogOptions} [options] - Optional logging options
   * @param {string} [options.context] - Context identifier for the log
   * @param {unknown} [options.data] - Additional data to log
   */
  debug: (message: string, options?: LogOptions): void => {
    if (!shouldLog('debug')) return;
    
    const formatted = formatMessage(message, options?.context);
    console.debug(formatted, options?.data || '');
  },

  /**
   * Log an info message
   * 
   * @param {string} message - The message to log
   * @param {LogOptions} [options] - Optional logging options
   */
  info: (message: string, options?: LogOptions): void => {
    if (!shouldLog('info')) return;
    
    const formatted = formatMessage(message, options?.context);
    console.info(formatted, options?.data || '');
  },

  /**
   * Log a warning message
   * 
   * @param {string} message - The message to log
   * @param {LogOptions} [options] - Optional logging options
   */
  warn: (message: string, options?: LogOptions): void => {
    if (!shouldLog('warn')) return;
    
    const formatted = formatMessage(message, options?.context);
    console.warn(formatted, options?.data || '');
  },

  /**
   * Log an error message
   * 
   * @param {string} message - The message to log
   * @param {LogOptions} [options] - Optional logging options
   */
  error: (message: string, options?: LogOptions): void => {
    if (!shouldLog('error')) return;
    
    const formatted = formatMessage(message, options?.context);
    console.error(formatted, options?.data || '');
  },

  /**
   * Log an API request
   * 
   * @param {string} method - HTTP method (GET, POST, etc.)
   * @param {string} url - API endpoint URL
   * @param {unknown} [data] - Request payload or query parameters
   */
  apiRequest: (method: string, url: string, data?: unknown): void => {
    if (!shouldLog('debug')) return;
    
    logger.debug(`API Request: ${method} ${url}`, {
      context: 'API',
      data: { method, url, data },
    });
  },

  /**
   * Log an API response
   * 
   * @param {string} method - HTTP method (GET, POST, etc.)
   * @param {string} url - API endpoint URL
   * @param {number} status - HTTP status code
   * @param {unknown} [data] - Response data
   */
  apiResponse: (method: string, url: string, status: number, data?: unknown): void => {
    if (!shouldLog('debug')) return;
    
    logger.debug(`API Response: ${method} ${url} ${status}`, {
      context: 'API',
      data: { method, url, status, data },
    });
  },

  /**
   * Log an API error
   * 
   * @param {string} method - HTTP method (GET, POST, etc.)
   * @param {string} url - API endpoint URL
   * @param {unknown} error - Error object or error message
   */
  apiError: (method: string, url: string, error: unknown): void => {
    logger.error(`API Error: ${method} ${url}`, {
      context: 'API',
      data: { method, url, error },
    });
  },

};

/**
 * Log a component render event
 * 
 * Useful for debugging component lifecycle and performance.
 * 
 * @param {string} componentName - Name of the component being rendered
 * @param {unknown} [props] - Component props (optional, for debugging)
 */
export const componentRender = (componentName: string, props?: unknown): void => {
  if (!shouldLog('debug')) return;
  
  logger.debug(`Component Render: ${componentName}`, {
    context: 'Component',
    data: props,
  });
};

export default logger;

