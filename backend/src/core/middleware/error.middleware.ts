import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import logger from '../utils/logger';

interface CustomError extends Error {
    statusCode?: number;
    code?: number;
    keyValue?: Record<string, unknown>;
}

export const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction): void => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Mongoose validation error
    if (err instanceof mongoose.Error.ValidationError) {
        statusCode = 400;
        const errors = Object.values(err.errors).map((e) => e.message);
        message = `Validation Error: ${errors.join(', ')}`;
    }

    // Mongoose duplicate key error
    if (err.code === 11000 && err.keyValue) {
        statusCode = 400;
        const field = Object.keys(err.keyValue)[0];
        message = `Duplicate value for field: ${field}`;
    }

    // Mongoose cast error (invalid ObjectId)
    if (err instanceof mongoose.Error.CastError) {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    }

    // Log error
    logger.error(`Error ${statusCode}: ${message}`, {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    res.status(statusCode).json({
        success: false,
        data: null,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};
