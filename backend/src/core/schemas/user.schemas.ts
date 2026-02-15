/**
 * Zod validation schemas for User endpoints
 */
import { z } from 'zod';

// MongoDB ObjectId regex pattern
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid ObjectId format');

// Password validation regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

// Phone number regex (optional, flexible international format)
const phoneRegex = /^[+]?[\d\s\-().]{7,20}$/;

// ============================================
// Enum Schemas
// ============================================

export const userRoleEnum = z.enum(['admin', 'manager', 'staff']);
export const authProviderEnum = z.enum(['local', 'azure-ad']);

// ============================================
// Create User Schema (Admin creating user)
// ============================================

export const createUserSchema = z.object({
  email: z.string()
    .email('Please provide a valid email address')
    .transform(val => val.toLowerCase().trim()),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must not exceed 128 characters')
    .regex(passwordRegex, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim(),
  role: userRoleEnum.default('staff'),
  department: z.string()
    .max(100, 'Department must not exceed 100 characters')
    .trim()
    .optional(),
  jobTitle: z.string()
    .max(100, 'Job title must not exceed 100 characters')
    .trim()
    .optional(),
  officeLocation: z.string()
    .max(200, 'Office location must not exceed 200 characters')
    .trim()
    .optional(),
  mobilePhone: z.string()
    .regex(phoneRegex, 'Please provide a valid phone number')
    .optional()
    .or(z.literal(''))
});

// ============================================
// Update User Schema
// ============================================

export const updateUserSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim()
    .optional(),
  role: userRoleEnum.optional(),
  department: z.string()
    .max(100, 'Department must not exceed 100 characters')
    .trim()
    .optional(),
  jobTitle: z.string()
    .max(100, 'Job title must not exceed 100 characters')
    .trim()
    .optional(),
  officeLocation: z.string()
    .max(200, 'Office location must not exceed 200 characters')
    .trim()
    .optional(),
  mobilePhone: z.string()
    .regex(phoneRegex, 'Please provide a valid phone number')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().optional()
});

// ============================================
// Update Profile Schema (Self-update)
// ============================================

export const updateProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim()
    .optional(),
  department: z.string()
    .max(100, 'Department must not exceed 100 characters')
    .trim()
    .optional(),
  jobTitle: z.string()
    .max(100, 'Job title must not exceed 100 characters')
    .trim()
    .optional(),
  mobilePhone: z.string()
    .regex(phoneRegex, 'Please provide a valid phone number')
    .optional()
    .or(z.literal(''))
});

// ============================================
// Query Schemas
// ============================================

export const userQuerySchema = z.object({
  page: z.string().or(z.number()).transform(val => Number(val)).pipe(z.number().int().min(1)).optional(),
  limit: z.string().or(z.number()).transform(val => Number(val)).pipe(z.number().int().min(1).max(100)).optional(),
  sort: z.string().optional(),
  role: userRoleEnum.optional(),
  department: z.string().optional(),
  isActive: z.string().transform(val => val === 'true').or(z.boolean()).optional(),
  search: z.string().optional(),
  authProvider: authProviderEnum.optional()
});

export const userIdParamSchema = z.object({
  id: objectIdSchema
});

export const roleParamSchema = z.object({
  role: userRoleEnum
});

export const departmentParamSchema = z.object({
  department: z.string().min(1, 'Department is required')
});

// ============================================
// Bulk Operations Schemas
// ============================================

export const bulkUpdateUsersSchema = z.object({
  updates: z.array(z.object({
    id: objectIdSchema,
    data: updateUserSchema
  })).min(1, 'At least one update is required').max(50, 'Maximum 50 updates per bulk operation')
});

export const bulkDeactivateUsersSchema = z.object({
  ids: z.array(objectIdSchema).min(1, 'At least one user ID is required').max(50, 'Maximum 50 users per bulk operation'),
  reason: z.string().max(500, 'Reason must not exceed 500 characters').optional()
});

// ============================================
// Type Exports
// ============================================

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;
export type BulkUpdateUsersInput = z.infer<typeof bulkUpdateUsersSchema>;
export type BulkDeactivateUsersInput = z.infer<typeof bulkDeactivateUsersSchema>;
