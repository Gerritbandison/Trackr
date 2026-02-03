/**
 * Zod validation schemas for Asset endpoints
 * Example implementation for input validation
 */
import { z } from 'zod';

export const createAssetSchema = z.object({
  name: z.string().min(1, 'Asset name is required'),
  description: z.string().optional(),
  serialNumber: z.string().min(1, 'Serial number is required'),
  assetTag: z.string().min(1, 'Asset tag is required'),
  manufacturer: z.string().optional(),
  modelNumber: z.string().optional(),
  purchaseDate: z.string().or(z.date()),
  purchasePrice: z.number().min(0, 'Purchase price must be non-negative'),
  depreciationType: z.enum(['Straight Line', 'Double Declining', 'Sum of Years']).optional(),
  usefulLife: z.number().min(1).optional(),
  salvageValue: z.number().min(0).optional(),
  status: z.enum(['Active', 'Retired', 'Repair', 'In Stock']).optional(),
  category: z.string().min(1, 'Category is required'),
  condition: z.enum(['Excellent', 'Good', 'Fair', 'Poor', 'Damaged']).optional()
});

export const updateAssetSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  manufacturer: z.string().optional(),
  modelNumber: z.string().optional(),
  status: z.enum(['Active', 'Retired', 'Repair', 'In Stock']).optional(),
  condition: z.enum(['Excellent', 'Good', 'Fair', 'Poor', 'Damaged']).optional(),
  conditionNotes: z.string().optional()
});

export const assetQuerySchema = z.object({
  page: z.string().or(z.number()).optional(),
  limit: z.string().or(z.number()).optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  assignedTo: z.string().optional()
});

export const assetIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid asset ID format')
});
