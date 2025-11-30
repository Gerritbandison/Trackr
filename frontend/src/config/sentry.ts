import * as Sentry from '@sentry/react';
import { useEffect } from 'react';
import {
    useLocation,
    useNavigationType,
    createRoutesFromChildren,
    matchRoutes,
} from 'react-router-dom';

/**
 * Initialize Sentry for error tracking and performance monitoring
 *
 * Note: Set VITE_SENTRY_DSN environment variable in .env file
 * Get your DSN from: https://sentry.io/settings/[organization]/projects/[project]/keys/
 */
export function initializeSentry(): void {
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    const environment = import.meta.env.MODE || 'development';

    // Only initialize Sentry if DSN is provided
    if (!dsn) {
        if (environment === 'production') {
            console.warn('⚠️  VITE_SENTRY_DSN not configured. Error tracking disabled.');
        }
        return;
    }

    Sentry.init({
        dsn,
        environment,

        // Set sample rates based on environment
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
        replaysSessionSampleRate: environment === 'production' ? 0.1 : 0.0,
        replaysOnErrorSampleRate: 1.0,

        integrations: [
            // Browser tracing integration
            Sentry.browserTracingIntegration(),

            // Session replay integration (helps debug issues)
            Sentry.replayIntegration({
                maskAllText: true, // Mask sensitive text
                blockAllMedia: true, // Block media files
            }),

            // React Router v6 integration
            Sentry.reactRouterV6BrowserTracingIntegration({
                useEffect,
                useLocation,
                useNavigationType,
                createRoutesFromChildren,
                matchRoutes,
            }),
        ],

        // Release tracking
        release: import.meta.env.VITE_APP_VERSION || 'unknown',

        // Filter out sensitive data before sending to Sentry
        beforeSend(event, hint) {
            // Filter sensitive data from request headers
            if (event.request?.headers) {
                delete event.request.headers['authorization'];
                delete event.request.headers['cookie'];
            }

            // Filter sensitive data from request body
            if (event.request?.data) {
                const data = event.request.data;
                if (typeof data === 'object') {
                    // Remove password and sensitive fields
                    const sensitiveFields = ['password', 'newPassword', 'oldPassword', 'token', 'apiKey'];
                    sensitiveFields.forEach(field => {
                        if (field in data) delete data[field];
                    });
                }
            }

            // Don't send events for development environment errors unless configured
            if (environment === 'development' && !import.meta.env.VITE_SENTRY_DEBUG) {
                return null;
            }

            return event;
        },

        // Ignore certain errors
        ignoreErrors: [
            // Browser extensions
            'top.GLOBALS',
            'chrome-extension://',
            'moz-extension://',

            // Network errors
            'NetworkError',
            'Network request failed',

            // Common non-critical errors
            'ResizeObserver loop limit exceeded',
            'ResizeObserver loop completed with undelivered notifications',

            // Cancelled requests
            'AbortError',
            'cancelled',
        ],

        // Denylist for URLs to ignore
        denyUrls: [
            // Chrome extensions
            /extensions\//i,
            /^chrome:\/\//i,
            /^moz-extension:\/\//i,
        ],
    });

    console.log(`✓ Sentry initialized for ${environment} environment`);
}

/**
 * Manually capture exception
 */
export function captureException(error: Error, context?: Record<string, any>): void {
    Sentry.captureException(error, {
        contexts: context,
    });
}

/**
 * Manually capture message
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
    Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>): void {
    Sentry.addBreadcrumb({
        message,
        category,
        data,
        level: 'info',
    });
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; username?: string } | null): void {
    Sentry.setUser(user);
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUser(): void {
    Sentry.setUser(null);
}

export default Sentry;
