/**
 * Zod validation schemas for Vendor endpoints
 * Comprehensive validation for vendor management with contracts and contacts
 */
import { z } from 'zod';

// MongoDB ObjectId regex pattern
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid ObjectId format');

// ============================================
// Enum Schemas
// ============================================

export const vendorStatusEnum = z.enum(['active', 'inactive', 'pending', 'suspended']);
export const vendorCategoryEnum = z.enum([
  'Hardware',
  'Software',
  'Services',
  'Cloud',
  'Telecom',
  'Office Supplies',
  'Maintenance',
  'Consulting',
  'Other'
]);
export const contractStatusEnum = z.enum(['draft', 'active', 'expired', 'terminated', 'renewal_pending']);
export const paymentTermsEnum = z.enum(['net_15', 'net_30', 'net_45', 'net_60', 'net_90', 'due_on_receipt']);

// ============================================
// Contact Sub-Schema
// ============================================

export const vendorContactSchema = z.object({
  name: z.string().min(1, 'Contact name is required').max(100),
  title: z.string().max(100).optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().max(30).optional(),
  mobile: z.string().max(30).optional(),
  isPrimary: z.boolean().default(false),
  department: z.string().max(100).optional(),
  notes: z.string().max(500).optional()
});

// ============================================
// Contract Sub-Schema
// ============================================

export const vendorContractSchema = z.object({
  contractNumber: z.string().min(1, 'Contract number is required').max(50),
  name: z.string().min(1, 'Contract name is required').max(200),
  description: z.string().max(1000).optional(),
  status: contractStatusEnum.default('draft'),
  startDate: z.string().datetime().or(z.date()).or(z.string().transform(val => new Date(val))),
  endDate: z.string().datetime().or(z.date()).or(z.string().transform(val => new Date(val))),
  value: z.number().min(0, 'Contract value must be non-negative').optional(),
  paymentTerms: paymentTermsEnum.optional(),
  autoRenewal: z.boolean().default(false),
  renewalNoticeDays: z.number().int().min(0).max(365).optional(),
  documentUrl: z.string().url().optional(),
  notes: z.string().max(2000).optional()
});

// ============================================
// Address Sub-Schema
// ============================================

export const vendorAddressSchema = z.object({
  street: z.string().max(200).optional(),
  street2: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  country: z.string().max(100).optional()
});

// ============================================
// Create Vendor Schema
// ============================================

export const createVendorSchema = z.object({
  // Required fields
  name: z.string().min(1, 'Vendor name is required').max(200, 'Vendor name too long'),

  // Basic info
  category: vendorCategoryEnum.optional(),
  status: vendorStatusEnum.default('active'),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  taxId: z.string().max(50).optional(),
  accountNumber: z.string().max(50).optional(),

  // Address
  address: vendorAddressSchema.optional(),

  // Financial
  paymentTerms: paymentTermsEnum.optional(),
  creditLimit: z.number().min(0).optional(),
  
  // Contacts (array of contacts)
  contacts: z.array(vendorContactSchema).optional(),

  // Contracts (array of contracts)
  contracts: z.array(vendorContractSchema).optional(),

  // Tags and notes
  tags: z.array(z.string().max(50)).max(20, 'Maximum 20 tags allowed').optional(),
  notes: z.string().max(5000, 'Notes too long').optional(),

  // Rating
  rating: z.number().min(1).max(5).optional()
});

// ============================================
// Update Vendor Schema
// ============================================

export const updateVendorSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: vendorCategoryEnum.optional(),
  status: vendorStatusEnum.optional(),
  website: z.string().url().optional().or(z.literal('')),
  taxId: z.string().max(50).optional(),
  accountNumber: z.string().max(50).optional(),
  address: vendorAddressSchema.optional(),
  paymentTerms: paymentTermsEnum.optional(),
  creditLimit: z.number().min(0).optional(),
  contacts: z.array(vendorContactSchema).optional(),
  contracts: z.array(vendorContractSchema).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  notes: z.string().max(5000).optional(),
  rating: z.number().min(1).max(5).optional()
});

// ============================================
// Query & Params Schemas
// ============================================

export const vendorQuerySchema = z.object({
  page: z.string().or(z.number()).transform(val => Number(val)).pipe(z.number().int().min(1)).optional(),
  limit: z.string().or(z.number()).transform(val => Number(val)).pipe(z.number().int().min(1).max(100)).optional(),
  sort: z.string().optional(),
  status: vendorStatusEnum.optional(),
  category: vendorCategoryEnum.optional(),
  search: z.string().optional(),
  hasActiveContract: z.string().transform(val => val === 'true').or(z.boolean()).optional(),
  includeDeleted: z.string().transform(val => val === 'true').or(z.boolean()).optional()
});

export const vendorIdParamSchema = z.object({
  id: objectIdSchema
});

// ============================================
// Contract Operations Schemas
// ============================================

export const addContractSchema = vendorContractSchema;

export const updateContractSchema = z.object({
  contractId: objectIdSchema,
  data: vendorContractSchema.partial()
});

// ============================================
// Contact Operations Schemas
// ============================================

export const addContactSchema = vendorContactSchema;

export const updateContactSchema = z.object({
  contactId: objectIdSchema,
  data: vendorContactSchema.partial()
});

// ============================================
// Bulk Operations Schemas
// ============================================

export const bulkUpdateVendorStatusSchema = z.object({
  ids: z.array(objectIdSchema).min(1).max(100, 'Maximum 100 vendors per bulk operation'),
  status: vendorStatusEnum
});

export const bulkDeleteVendorsSchema = z.object({
  ids: z.array(objectIdSchema).min(1).max(100, 'Maximum 100 vendors per bulk operation'),
  permanent: z.boolean().default(false)
});

// ============================================
// Contract Expiry Query Schema
// ============================================

export const expiringContractsQuerySchema = z.object({
  days: z.string().or(z.number()).transform(val => Number(val)).pipe(z.number().int().min(1).max(365)).default(30)
});

// ============================================
// Type Exports
// ============================================

export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
export type VendorQuery = z.infer<typeof vendorQuerySchema>;
export type VendorContact = z.infer<typeof vendorContactSchema>;
export type VendorContract = z.infer<typeof vendorContractSchema>;
export type VendorAddress = z.infer<typeof vendorAddressSchema>;
