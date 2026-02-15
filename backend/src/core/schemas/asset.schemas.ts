/**
 * Zod validation schemas for Asset endpoints
 * Comprehensive validation for all asset operations
 */
import { z } from 'zod';

// MongoDB ObjectId regex pattern
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid ObjectId format');

// ============================================
// Shared Sub-Schemas
// ============================================

export const warrantySchema = z.object({
  provider: z.string().min(1, 'Warranty provider is required'),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  warrantyNumber: z.string().optional(),
  supportPhone: z.string().optional()
}).optional();

export const customFieldSchema = z.object({
  key: z.string().min(1, 'Custom field key is required'),
  value: z.union([z.string(), z.number(), z.boolean(), z.date()]),
  type: z.enum(['string', 'number', 'boolean', 'date']).optional()
});

export const assignmentHistorySchema = z.object({
  userId: objectIdSchema,
  assignedDate: z.string().datetime().or(z.date()),
  returnedDate: z.string().datetime().or(z.date()).optional(),
  assignedBy: objectIdSchema,
  notes: z.string().optional()
});

export const locationHistorySchema = z.object({
  locationId: objectIdSchema,
  movedDate: z.string().datetime().or(z.date()),
  movedBy: objectIdSchema,
  reason: z.string().optional()
});

// ============================================
// Enum Schemas
// ============================================

export const assetStatusEnum = z.enum(['Active', 'Retired', 'Repair', 'In Stock']);
export const depreciationTypeEnum = z.enum(['Straight Line', 'Double Declining', 'Sum of Years']);
export const conditionEnum = z.enum(['Excellent', 'Good', 'Fair', 'Poor', 'Damaged']);
export const managementAgentEnum = z.enum(['intune', 'configmgr', 'easmdm', 'manual']);
export const complianceStateEnum = z.enum(['compliant', 'noncompliant', 'inGracePeriod', 'unknown']);

// ============================================
// Create Asset Schema
// ============================================

export const createAssetSchema = z.object({
  // Required fields
  name: z.string().min(1, 'Asset name is required').max(200, 'Asset name too long'),
  serialNumber: z.string().min(1, 'Serial number is required').max(100, 'Serial number too long'),
  assetTag: z.string().min(1, 'Asset tag is required').max(50, 'Asset tag too long'),
  purchaseDate: z.string().datetime().or(z.date()).or(z.string().transform(val => new Date(val))),
  purchasePrice: z.number().min(0, 'Purchase price must be non-negative'),
  category: z.string().min(1, 'Category is required'),

  // Optional basic fields
  description: z.string().max(2000, 'Description too long').optional(),
  manufacturer: z.string().max(100, 'Manufacturer name too long').optional(),
  modelNumber: z.string().max(100, 'Model number too long').optional(),

  // Depreciation fields
  depreciationType: depreciationTypeEnum.default('Straight Line'),
  usefulLife: z.number().int().min(1, 'Useful life must be at least 1 year').max(50, 'Useful life too long').default(5),
  salvageValue: z.number().min(0, 'Salvage value must be non-negative').default(0),

  // Status and condition
  status: assetStatusEnum.default('In Stock'),
  condition: conditionEnum.default('Excellent'),
  conditionNotes: z.string().max(500, 'Condition notes too long').optional(),

  // Location and assignment
  location: objectIdSchema.optional(),
  assignedTo: objectIdSchema.optional(),

  // Warranty
  warranty: warrantySchema,

  // Custom fields support
  customFields: z.array(customFieldSchema).optional(),

  // Intune/Azure AD fields (typically set by sync, but allow manual entry)
  intuneDeviceId: z.string().optional(),
  managementAgent: managementAgentEnum.optional(),
  enrollmentDate: z.string().datetime().or(z.date()).optional(),
  complianceState: complianceStateEnum.optional(),
  operatingSystem: z.string().max(100).optional(),
  osVersion: z.string().max(50).optional(),
  azureAdDeviceId: z.string().optional(),
  isEntraJoined: z.boolean().optional(),
  isEntraRegistered: z.boolean().optional(),

  // Hardware details
  imei: z.string().max(20).optional(),
  meid: z.string().max(20).optional(),
  wifiMacAddress: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'Invalid MAC address format').optional(),
  ethernetMacAddress: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'Invalid MAC address format').optional(),
  storageTotal: z.number().min(0).optional(),
  storageFree: z.number().min(0).optional(),
  memoryTotal: z.number().min(0).optional()
});

// ============================================
// Update Asset Schema
// ============================================

export const updateAssetSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  serialNumber: z.string().min(1).max(100).optional(),
  assetTag: z.string().min(1).max(50).optional(),
  manufacturer: z.string().max(100).optional(),
  modelNumber: z.string().max(100).optional(),
  purchaseDate: z.string().datetime().or(z.date()).optional(),
  purchasePrice: z.number().min(0).optional(),
  depreciationType: depreciationTypeEnum.optional(),
  usefulLife: z.number().int().min(1).max(50).optional(),
  salvageValue: z.number().min(0).optional(),
  status: assetStatusEnum.optional(),
  category: z.string().min(1).optional(),
  condition: conditionEnum.optional(),
  conditionNotes: z.string().max(500).optional(),
  warranty: warrantySchema,
  customFields: z.array(customFieldSchema).optional(),

  // Intune/Azure AD fields
  intuneDeviceId: z.string().optional(),
  managementAgent: managementAgentEnum.optional(),
  complianceState: complianceStateEnum.optional(),
  operatingSystem: z.string().max(100).optional(),
  osVersion: z.string().max(50).optional(),
  azureAdDeviceId: z.string().optional(),
  isEntraJoined: z.boolean().optional(),
  isEntraRegistered: z.boolean().optional(),

  // Hardware details
  imei: z.string().max(20).optional(),
  meid: z.string().max(20).optional(),
  wifiMacAddress: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/).optional(),
  ethernetMacAddress: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/).optional(),
  storageTotal: z.number().min(0).optional(),
  storageFree: z.number().min(0).optional(),
  memoryTotal: z.number().min(0).optional()
});

// ============================================
// Query & Params Schemas
// ============================================

export const assetQuerySchema = z.object({
  page: z.string().or(z.number()).transform(val => Number(val)).pipe(z.number().int().min(1)).optional(),
  limit: z.string().or(z.number()).transform(val => Number(val)).pipe(z.number().int().min(1).max(100)).optional(),
  sort: z.string().optional(),
  status: assetStatusEnum.optional(),
  category: z.string().optional(),
  assignedTo: objectIdSchema.optional(),
  location: objectIdSchema.optional(),
  condition: conditionEnum.optional(),
  search: z.string().optional(),
  includeArchived: z.string().transform(val => val === 'true').or(z.boolean()).optional()
});

export const assetIdParamSchema = z.object({
  id: objectIdSchema
});

export const userIdParamSchema = z.object({
  userId: objectIdSchema
});

export const locationIdParamSchema = z.object({
  locationId: objectIdSchema
});

// ============================================
// Bulk Operations Schemas
// ============================================

export const bulkCreateAssetSchema = z.object({
  assets: z.array(createAssetSchema).min(1, 'At least one asset is required').max(100, 'Maximum 100 assets per bulk operation')
});

export const bulkUpdateAssetSchema = z.object({
  updates: z.array(z.object({
    id: objectIdSchema,
    data: updateAssetSchema
  })).min(1, 'At least one update is required').max(100, 'Maximum 100 updates per bulk operation')
});

export const bulkArchiveAssetSchema = z.object({
  ids: z.array(objectIdSchema).min(1, 'At least one asset ID is required').max(100, 'Maximum 100 assets per bulk archive'),
  reason: z.string().max(500, 'Archive reason too long').optional()
});

export const bulkIdsSchema = z.object({
  ids: z.array(objectIdSchema).min(1, 'At least one ID is required').max(100, 'Maximum 100 IDs')
});

// ============================================
// Assignment & Transfer Schemas
// ============================================

export const assignAssetSchema = z.object({
  userId: objectIdSchema,
  notes: z.string().max(500, 'Notes too long').optional()
});

export const returnAssetSchema = z.object({
  notes: z.string().max(500, 'Notes too long').optional()
});

export const transferAssetSchema = z.object({
  locationId: objectIdSchema,
  reason: z.string().max(500, 'Reason too long').optional()
});

// ============================================
// Import/Export Schemas
// ============================================

export const importCsvSchema = z.object({
  csvData: z.string().min(1, 'CSV data is required')
});

export const expiringWarrantiesQuerySchema = z.object({
  days: z.string().or(z.number()).transform(val => Number(val)).pipe(z.number().int().min(1).max(365)).optional()
});

// ============================================
// QR Code Schema
// ============================================

export const qrCodeQuerySchema = z.object({
  format: z.enum(['json', 'url', 'full']).default('json'),
  size: z.string().or(z.number()).transform(val => Number(val)).pipe(z.number().int().min(100).max(1000)).optional()
});

// ============================================
// Type Exports
// ============================================

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type AssetQuery = z.infer<typeof assetQuerySchema>;
export type BulkCreateAssetInput = z.infer<typeof bulkCreateAssetSchema>;
export type BulkUpdateAssetInput = z.infer<typeof bulkUpdateAssetSchema>;
export type BulkArchiveAssetInput = z.infer<typeof bulkArchiveAssetSchema>;
export type AssignAssetInput = z.infer<typeof assignAssetSchema>;
export type ReturnAssetInput = z.infer<typeof returnAssetSchema>;
export type TransferAssetInput = z.infer<typeof transferAssetSchema>;
