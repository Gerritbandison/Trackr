import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import type { Express } from 'express';

/**
 * Initialize Sentry for error tracking and performance monitoring
 *
 * Note: In production, set SENTRY_DSN environment variable with your Sentry DSN
 * Get your DSN from: https://sentry.io/settings/[organization]/projects/[project]/keys/
 */
export function initializeSentry(app: Express): void {
    const dsn = process.env.SENTRY_DSN;
    const environment = process.env.NODE_ENV || 'development';

    // Only initialize Sentry if DSN is provided
    if (!dsn) {
        if (environment === 'production') {
            console.warn('⚠️  SENTRY_DSN not configured. Error tracking disabled.');
        }
        return;
    }

    Sentry.init({
        dsn,
        environment,

        // Enable profiling in production for performance insights
        integrations: [
            nodeProfilingIntegration(),
        ],

        // Sample rate for performance monitoring (10% in production)
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

        // Sample rate for profiling (10% in production)
        profilesSampleRate: environment === 'production' ? 0.1 : 1.0,

        // Enable debug mode in development
        debug: environment === 'development',

        // Release tracking
        release: process.env.npm_package_version,

        // Custom before send hook to filter sensitive data
        beforeSend(event) {
            // Filter out sensitive data from error events
            if (event.request?.headers) {
                // Remove Authorization header
                delete event.request.headers['authorization'];
                delete event.request.headers['cookie'];
            }

            // Filter sensitive data from request body
            if (event.request?.data) {
                const data = event.request.data;
                if (typeof data === 'object') {
                    // Remove password fields
                    if ('password' in data) delete data.password;
                    if ('newPassword' in data) delete data.newPassword;
                    if ('oldPassword' in data) delete data.oldPassword;
                }
            }

            return event;
        },
    });

    // Setup Sentry request instrumentation - must be first middleware
    Sentry.setupExpressErrorHandler(app);

    console.log(`✓ Sentry initialized for ${environment} environment`);
}

/**
 * Sentry error handler - captures errors
 * Must be before other error handlers but after all routes
 */
export const sentryErrorHandler: ErrorRequestHandler = (
    err: Error & { status?: number },
    _req: Request,
    _res: Response,
    next: NextFunction
) => {
    // Capture all errors with status code >= 500
    // Skip 4xx errors as they are client errors
    if (!err.status || err.status >= 500) {
        Sentry.captureException(err);
    }

    next(err);
};

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, any>): void {
    Sentry.captureException(error, {
        contexts: context,
    });
}

/**
 * Capture message manually
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

export default Sentry;
