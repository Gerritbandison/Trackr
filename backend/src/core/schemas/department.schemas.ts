/**
 * Zod validation schemas for Department endpoints
 * Comprehensive validation for department management with hierarchy and budget tracking
 */
import { z } from 'zod';

// MongoDB ObjectId regex pattern
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid ObjectId format');

// ============================================
// Budget Sub-Schema
// ============================================

export const budgetAllocationSchema = z.object({
  category: z.string().min(1, 'Category is required').max(100),
  amount: z.number().min(0, 'Amount must be non-negative'),
  fiscalYear: z.number().int().min(2000).max(2100),
  spent: z.number().min(0).default(0),
  notes: z.string().max(500).optional()
});

export const budgetSchema = z.object({
  annualBudget: z.number().min(0, 'Annual budget must be non-negative').optional(),
  fiscalYear: z.number().int().min(2000).max(2100).optional(),
  currency: z.string().length(3, 'Currency must be 3-letter code').default('USD'),
  allocations: z.array(budgetAllocationSchema).optional(),
  approvedBy: objectIdSchema.optional(),
  approvedAt: z.string().datetime().or(z.date()).optional()
});

// ============================================
// Create Department Schema
// ============================================

export const createDepartmentSchema = z.object({
  // Required fields
  name: z.string().min(1, 'Department name is required').max(100, 'Department name too long'),

  // Hierarchy
  parentDepartment: objectIdSchema.optional(),

  // Basic info
  code: z.string().max(20, 'Code too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  
  // Management
  manager: objectIdSchema.optional(),
  headCount: z.number().int().min(0).optional(),

  // Cost center & budget
  costCenter: z.string().max(50, 'Cost center code too long').optional(),
  budget: budgetSchema.optional(),

  // Location
  location: objectIdSchema.optional(),
  locationName: z.string().max(200).optional(), // For display/legacy support

  // Contact info
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().max(30).optional(),
  slackChannel: z.string().max(100).optional(),

  // Status
  isActive: z.boolean().default(true),

  // Metadata
  tags: z.array(z.string().max(50)).max(20, 'Maximum 20 tags').optional(),
  metadata: z.record(z.unknown()).optional()
});

// ============================================
// Update Department Schema
// ============================================

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  parentDepartment: objectIdSchema.nullable().optional(),
  code: z.string().max(20).optional(),
  description: z.string().max(1000).optional(),
  manager: objectIdSchema.nullable().optional(),
  headCount: z.number().int().min(0).optional(),
  costCenter: z.string().max(50).optional(),
  budget: budgetSchema.optional(),
  location: objectIdSchema.nullable().optional(),
  locationName: z.string().max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  slackChannel: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  metadata: z.record(z.unknown()).optional()
});

// ============================================
// Query & Params Schemas
// ============================================

export const departmentQuerySchema = z.object({
  page: z.string().or(z.number()).transform(val => Number(val)).pipe(z.number().int().min(1)).optional(),
  limit: z.string().or(z.number()).transform(val => Number(val)).pipe(z.number().int().min(1).max(100)).optional(),
  sort: z.string().optional(),
  isActive: z.string().transform(val => val === 'true').or(z.boolean()).optional(),
  parentDepartment: objectIdSchema.optional(),
  manager: objectIdSchema.optional(),
  costCenter: z.string().optional(),
  search: z.string().optional(),
  includeInactive: z.string().transform(val => val === 'true').or(z.boolean()).optional(),
  flat: z.string().transform(val => val === 'true').or(z.boolean()).optional() // Return flat list vs tree
});

export const departmentIdParamSchema = z.object({
  id: objectIdSchema
});

// ============================================
// Budget Operations Schemas
// ============================================

export const updateBudgetSchema = budgetSchema;

export const addBudgetAllocationSchema = budgetAllocationSchema;

export const updateBudgetAllocationSchema = z.object({
  allocationId: objectIdSchema,
  data: budgetAllocationSchema.partial()
});

export const recordExpenditureSchema = z.object({
  allocationId: objectIdSchema.optional(), // If not provided, deduct from general budget
  amount: z.number().positive('Amount must be positive'),
  description: z.string().max(500).optional(),
  reference: z.string().max(100).optional() // PO number, invoice, etc.
});

// ============================================
// Hierarchy Operations
// ============================================

export const moveDepartmentSchema = z.object({
  newParentId: objectIdSchema.nullable() // null = move to root level
});

export const bulkMoveSchema = z.object({
  departmentIds: z.array(objectIdSchema).min(1).max(50),
  newParentId: objectIdSchema.nullable()
});

// ============================================
// Bulk Operations Schemas
// ============================================

export const bulkUpdateDepartmentsSchema = z.object({
  ids: z.array(objectIdSchema).min(1).max(100, 'Maximum 100 departments per operation'),
  data: z.object({
    isActive: z.boolean().optional(),
    manager: objectIdSchema.nullable().optional(),
    costCenter: z.string().max(50).optional()
  })
});

export const bulkDeleteDepartmentsSchema = z.object({
  ids: z.array(objectIdSchema).min(1).max(100),
  reassignTo: objectIdSchema.optional() // Reassign children to this department
});

// ============================================
// Type Exports
// ============================================

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type DepartmentQuery = z.infer<typeof departmentQuerySchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type BudgetAllocationInput = z.infer<typeof budgetAllocationSchema>;
