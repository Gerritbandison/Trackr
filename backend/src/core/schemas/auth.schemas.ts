/**
 * Zod validation schemas for Authentication endpoints
 */
import { z } from 'zod';

// Password validation regex - at least one uppercase, lowercase, and digit
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

// ============================================
// Register Schema
// ============================================

export const registerSchema = z.object({
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
  role: z.enum(['admin', 'manager', 'staff']).default('staff'),
  department: z.string()
    .max(100, 'Department must not exceed 100 characters')
    .trim()
    .optional()
});

// ============================================
// Login Schema
// ============================================

export const loginSchema = z.object({
  email: z.string()
    .email('Please provide a valid email address')
    .transform(val => val.toLowerCase().trim()),
  password: z.string()
    .min(1, 'Password is required')
});

// ============================================
// Update Password Schema
// ============================================

export const updatePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters long')
    .max(128, 'New password must not exceed 128 characters')
    .regex(passwordRegex, 'New password must contain at least one uppercase letter, one lowercase letter, and one number')
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword']
});

// ============================================
// Password Reset Request Schema
// ============================================

export const forgotPasswordSchema = z.object({
  email: z.string()
    .email('Please provide a valid email address')
    .transform(val => val.toLowerCase().trim())
});

// ============================================
// Password Reset Schema
// ============================================

export const resetPasswordSchema = z.object({
  token: z.string()
    .min(1, 'Reset token is required'),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters long')
    .max(128, 'New password must not exceed 128 characters')
    .regex(passwordRegex, 'New password must contain at least one uppercase letter, one lowercase letter, and one number')
});

// ============================================
// Two-Factor Setup Schema
// ============================================

export const setup2FASchema = z.object({
  password: z.string()
    .min(1, 'Password is required to enable 2FA')
});

// ============================================
// Two-Factor Verify Schema
// ============================================

export const verify2FASchema = z.object({
  code: z.string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must be 6 digits')
});

// ============================================
// Login with 2FA Schema
// ============================================

export const loginWith2FASchema = z.object({
  email: z.string()
    .email('Please provide a valid email address')
    .transform(val => val.toLowerCase().trim()),
  password: z.string()
    .min(1, 'Password is required'),
  code: z.string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must be 6 digits')
    .optional()
});

// ============================================
// Type Exports
// ============================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type Setup2FAInput = z.infer<typeof setup2FASchema>;
export type Verify2FAInput = z.infer<typeof verify2FASchema>;
export type LoginWith2FAInput = z.infer<typeof loginWith2FASchema>;
