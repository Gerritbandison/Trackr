/**
 * Zod validation schemas for License endpoints
 * Comprehensive validation for all license operations
 */
import { z } from 'zod';

// MongoDB ObjectId regex pattern
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid ObjectId format');

// ============================================
// Enum Schemas
// ============================================

export const licenseTypeEnum = z.enum(['perpetual', 'subscription', 'trial', 'site', 'volume', 'oem']);
export const licenseStatusEnum = z.enum(['active', 'expiring', 'expired', 'cancelled', 'suspended']);
export const complianceStatusEnum = z.enum(['compliant', 'overAllocated', 'underUtilized', 'at-risk']);
export const licenseCategoryEnum = z.enum([
  'Productivity',
  'Development',
  'Design',
  'Communication',
  'Security',
  'Database',
  'Cloud',
  'Operating System',
  'Analytics',
  'Project Management',
  'Storage',
  'Networking',
  'Other'
]);
export const billingCycleEnum = z.enum(['monthly', 'quarterly', 'annual', 'one-time', 'multi-year']);
export const renewalStatusEnum = z.enum(['pending', 'approved', 'rejected', 'auto-renewing', 'not-applicable']);

// ============================================
// Shared Sub-Schemas
// ============================================

export const licenseAssignmentHistorySchema = z.object({
  userId: objectIdSchema,
  assignedDate: z.string().datetime().or(z.date()),
  unassignedDate: z.string().datetime().or(z.date()).optional(),
  assignedBy: objectIdSchema,
  reason: z.string().max(500).optional()
});

export const renewalReminderSchema = z.object({
  daysBefore: z.number().int().min(1).max(365),
  sent: z.boolean().default(false),
  sentAt: z.string().datetime().or(z.date()).optional()
});

export const costAllocationSchema = z.object({
  departmentId: objectIdSchema.optional(),
  costCenter: z.string().max(50).optional(),
  percentage: z.number().min(0).max(100),
  amount: z.number().min(0).optional()
});

// ============================================
// Create License Schema
// ============================================

export const createLicenseSchema = z.object({
  // Required fields
  name: z.string().min(1, 'License name is required').max(200, 'License name too long').trim(),
  vendor: z.string().min(1, 'Vendor is required').max(100, 'Vendor name too long').trim(),
  type: licenseTypeEnum,
  category: z.string().min(1, 'Category is required').trim(),
  totalSeats: z.number().int().min(1, 'Total seats must be at least 1').max(1000000, 'Total seats too high'),
  purchaseDate: z.string().datetime().or(z.date()).or(z.string().transform(val => new Date(val))),
  purchaseCost: z.number().min(0, 'Purchase cost must be non-negative'),

  // Optional fields
  licenseKey: z.string().max(500, 'License key too long').trim().optional(),
  productKey: z.string().max(500, 'Product key too long').trim().optional(),
  description: z.string().max(2000, 'Description too long').optional(),
  
  // Expiration and renewal
  expirationDate: z.string().datetime().or(z.date()).optional(),
  renewalDate: z.string().datetime().or(z.date()).optional(),
  
  // Costs
  annualCost: z.number().min(0, 'Annual cost must be non-negative').optional(),
  monthlyEstimate: z.number().min(0).optional(),
  costPerSeat: z.number().min(0).optional(),
  billingCycle: billingCycleEnum.optional(),
  
  // Renewal settings
  autoRenew: z.boolean().default(false),
  renewalNotificationDays: z.number().int().min(1).max(365).default(30),
  renewalStatus: renewalStatusEnum.optional(),
  renewalReminders: z.array(renewalReminderSchema).optional(),
  
  // Cost allocation
  costAllocations: z.array(costAllocationSchema).optional(),
  
  // Notes and metadata
  notes: z.string().max(5000, 'Notes too long').trim().optional(),
  tags: z.array(z.string().max(50)).max(20, 'Maximum 20 tags allowed').optional(),
  
  // Vendor contact
  vendorContactName: z.string().max(100).optional(),
  vendorContactEmail: z.string().email('Invalid email format').optional(),
  vendorContactPhone: z.string().max(30).optional(),
  supportUrl: z.string().url('Invalid URL format').optional(),
  documentationUrl: z.string().url('Invalid URL format').optional(),
  
  // Agreement info
  agreementNumber: z.string().max(100).optional(),
  poNumber: z.string().max(100).optional()
});

// ============================================
// Update License Schema
// ============================================

export const updateLicenseSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  vendor: z.string().min(1).max(100).trim().optional(),
  type: licenseTypeEnum.optional(),
  category: z.string().min(1).trim().optional(),
  totalSeats: z.number().int().min(1).max(1000000).optional(),
  
  licenseKey: z.string().max(500).trim().optional(),
  productKey: z.string().max(500).trim().optional(),
  description: z.string().max(2000).optional(),
  
  purchaseDate: z.string().datetime().or(z.date()).optional(),
  purchaseCost: z.number().min(0).optional(),
  expirationDate: z.string().datetime().or(z.date()).nullable().optional(),
  renewalDate: z.string().datetime().or(z.date()).nullable().optional(),
  
  annualCost: z.number().min(0).optional(),
  monthlyEstimate: z.number().min(0).optional(),
  costPerSeat: z.number().min(0).optional(),
  billingCycle: billingCycleEnum.optional(),
  
  autoRenew: z.boolean().optional(),
  renewalNotificationDays: z.number().int().min(1).max(365).optional(),
  renewalStatus: renewalStatusEnum.optional(),
  renewalReminders: z.array(renewalReminderSchema).optional(),
  
  status: licenseStatusEnum.optional(),
  
  notes: z.string().max(5000).trim().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  
  vendorContactName: z.string().max(100).optional(),
  vendorContactEmail: z.string().email().optional(),
  vendorContactPhone: z.string().max(30).optional(),
  supportUrl: z.string().url().optional(),
  documentationUrl: z.string().url().optional(),
  
  agreementNumber: z.string().max(100).optional(),
  poNumber: z.string().max(100).optional(),
  
  costAllocations: z.array(costAllocationSchema).optional()
});

// ============================================
// Query & Params Schemas
// ============================================

export const licenseQuerySchema = z.object({
  page: z.string().or(z.number()).transform(val => Number(val)).pipe(z.number().int().min(1)).optional(),
  limit: z.string().or(z.number()).transform(val => Number(val)).pipe(z.number().int().min(1).max(100)).optional(),
  sort: z.string().optional(),
  vendor: z.string().optional(),
  type: licenseTypeEnum.optional(),
  status: licenseStatusEnum.optional(),
  category: z.string().optional(),
  complianceStatus: complianceStatusEnum.optional(),
  search: z.string().optional(),
  includeArchived: z.string().transform(val => val === 'true').or(z.boolean()).optional(),
  expiringWithin: z.string().or(z.number()).transform(val => Number(val)).pipe(z.number().int().min(1).max(365)).optional(),
  minUtilization: z.string().or(z.number()).transform(val => Number(val)).pipe(z.number().min(0).max(100)).optional(),
  maxUtilization: z.string().or(z.number()).transform(val => Number(val)).pipe(z.number().min(0).max(100)).optional()
});

export const licenseIdParamSchema = z.object({
  id: objectIdSchema
});

export const userIdParamSchema = z.object({
  userId: objectIdSchema
});

// ============================================
// Bulk Operations Schemas
// ============================================

export const bulkCreateLicenseSchema = z.object({
  licenses: z.array(createLicenseSchema).min(1, 'At least one license is required').max(100, 'Maximum 100 licenses per bulk operation')
});

export const bulkUpdateLicenseSchema = z.object({
  updates: z.array(z.object({
    id: objectIdSchema,
    data: updateLicenseSchema
  })).min(1, 'At least one update is required').max(100, 'Maximum 100 updates per bulk operation')
});

export const bulkArchiveLicenseSchema = z.object({
  ids: z.array(objectIdSchema).min(1, 'At least one license ID is required').max(100, 'Maximum 100 licenses per bulk archive'),
  reason: z.string().max(500, 'Archive reason too long').optional()
});

export const bulkIdsSchema = z.object({
  ids: z.array(objectIdSchema).min(1, 'At least one ID is required').max(100, 'Maximum 100 IDs')
});

// ============================================
// Seat Allocation Schemas
// ============================================

export const allocateSeatSchema = z.object({
  userId: objectIdSchema,
  reason: z.string().max(500, 'Reason too long').optional(),
  notifyUser: z.boolean().default(false)
});

export const deallocateSeatSchema = z.object({
  userId: objectIdSchema,
  reason: z.string().max(500, 'Reason too long').optional(),
  notifyUser: z.boolean().default(false)
});

export const bulkAllocateSeatsSchema = z.object({
  userIds: z.array(objectIdSchema).min(1, 'At least one user ID required').max(100, 'Maximum 100 users'),
  reason: z.string().max(500).optional()
});

// ============================================
// Assignment Schemas (legacy compatibility)
// ============================================

export const assignLicenseSchema = z.object({
  userId: objectIdSchema,
  reason: z.string().max(500, 'Reason too long').optional()
});

export const unassignLicenseSchema = z.object({
  userId: objectIdSchema,
  reason: z.string().max(500, 'Reason too long').optional()
});

// ============================================
// Renewal & Compliance Schemas
// ============================================

export const renewalQuerySchema = z.object({
  days: z.string().or(z.number()).transform(val => Number(val)).pipe(z.number().int().min(1).max(365)).optional(),
  includeAutoRenew: z.string().transform(val => val === 'true').or(z.boolean()).optional(),
  status: renewalStatusEnum.optional()
});

export const complianceQuerySchema = z.object({
  status: complianceStatusEnum.optional(),
  includeArchived: z.string().transform(val => val === 'true').or(z.boolean()).optional()
});

export const optimizationQuerySchema = z.object({
  underutilizationThreshold: z.string().or(z.number()).transform(val => Number(val)).pipe(z.number().min(0).max(100)).default(30),
  includeRecommendations: z.string().transform(val => val === 'true').or(z.boolean()).default(true)
});

export const statisticsQuerySchema = z.object({
  groupBy: z.enum(['vendor', 'category', 'type', 'status', 'complianceStatus']).optional(),
  includeArchived: z.string().transform(val => val === 'true').or(z.boolean()).optional()
});

// ============================================
// Archive/Restore Schemas
// ============================================

export const archiveLicenseSchema = z.object({
  reason: z.string().max(500, 'Archive reason too long').optional()
});

export const restoreLicenseSchema = z.object({
  reason: z.string().max(500, 'Restore reason too long').optional()
});

// ============================================
// Import/Export Schemas
// ============================================

export const importCsvSchema = z.object({
  csvData: z.string().min(1, 'CSV data is required')
});

export const expiringLicensesQuerySchema = z.object({
  days: z.string().or(z.number()).transform(val => Number(val)).pipe(z.number().int().min(1).max(365)).default(30)
});

// ============================================
// Type Exports
// ============================================

export type CreateLicenseInput = z.infer<typeof createLicenseSchema>;
export type UpdateLicenseInput = z.infer<typeof updateLicenseSchema>;
export type LicenseQuery = z.infer<typeof licenseQuerySchema>;
export type BulkCreateLicenseInput = z.infer<typeof bulkCreateLicenseSchema>;
export type BulkUpdateLicenseInput = z.infer<typeof bulkUpdateLicenseSchema>;
export type BulkArchiveLicenseInput = z.infer<typeof bulkArchiveLicenseSchema>;
export type AllocateSeatInput = z.infer<typeof allocateSeatSchema>;
export type DeallocateSeatInput = z.infer<typeof deallocateSeatSchema>;
export type AssignLicenseInput = z.infer<typeof assignLicenseSchema>;
export type UnassignLicenseInput = z.infer<typeof unassignLicenseSchema>;
export type RenewalQuery = z.infer<typeof renewalQuerySchema>;
export type ComplianceQuery = z.infer<typeof complianceQuerySchema>;
export type OptimizationQuery = z.infer<typeof optimizationQuerySchema>;
export type StatisticsQuery = z.infer<typeof statisticsQuerySchema>;
