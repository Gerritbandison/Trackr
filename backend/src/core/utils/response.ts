import { Response } from 'express';

/**
 * Standardized API response utilities
 * Reduces code duplication and ensures consistent response format
 */
export class ApiResponse {
    /**
     * Send success response with data
     */
    static success<T>(res: Response, data: T, message?: string): Response {
        return res.json({
            success: true,
            data,
            ...(message && { message })
        });
    }

    /**
     * Send created response (201)
     */
    static created<T>(res: Response, data: T, message?: string): Response {
        return res.status(201).json({
            success: true,
            data,
            message: message || 'Resource created successfully'
        });
    }

    /**
     * Send not found response (404)
     */
    static notFound(res: Response, message = 'Resource not found'): Response {
        return res.status(404).json({
            success: false,
            error: message
        });
    }

    /**
     * Send bad request response (400)
     */
    static badRequest(res: Response, message: string, errors?: any): Response {
        return res.status(400).json({
            success: false,
            error: message,
            ...(errors && { errors })
        });
    }

    /**
     * Send unauthorized response (401)
     */
    static unauthorized(res: Response, message = 'Not authenticated'): Response {
        return res.status(401).json({
            success: false,
            error: message
        });
    }

    /**
     * Send forbidden response (403)
     */
    static forbidden(res: Response, message = 'Access forbidden'): Response {
        return res.status(403).json({
            success: false,
            error: message
        });
    }

    /**
     * Send error response (default 500)
     */
    static error(res: Response, message = 'Internal server error', details?: string, statusCode = 500): Response {
        return res.status(statusCode).json({
            success: false,
            error: message,
            ...(details && { details })
        });
    }

    /**
     * Send paginated response
     */
    static paginated<T>(
        res: Response,
        data: T[],
        total: number,
        page: number,
        limit: number,
        message?: string
    ): Response {
        return res.json({
            success: true,
            data,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            },
            ...(message && { message })
        });
    }

    /**
     * Send deleted response
     */
    static deleted(res: Response, message = 'Resource deleted successfully'): Response {
        return res.json({
            success: true,
            message
        });
    }
}
