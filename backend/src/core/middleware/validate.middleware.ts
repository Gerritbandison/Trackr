import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Extract error details from Zod error
 */
const extractErrorDetails = (error: z.ZodError): Array<{ path: string; message: string }> => {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message
  }));
};

/**
 * Zod validation middleware
 * Validates request body against a Zod schema
 */
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: extractErrorDetails(error)
        });
        return;
      }
      next(error);
    }
  };
};

/**
 * Validate query parameters
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Query validation failed',
          details: extractErrorDetails(error)
        });
        return;
      }
      next(error);
    }
  };
};

/**
 * Validate route parameters
 */
export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Parameter validation failed',
          details: extractErrorDetails(error)
        });
        return;
      }
      next(error);
    }
  };
};
