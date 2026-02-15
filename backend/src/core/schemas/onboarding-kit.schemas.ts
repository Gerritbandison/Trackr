/**
 * Zod validation schemas for Onboarding Kit endpoints
 * Comprehensive validation for onboarding kit management with templates and checklists
 */
import { z } from 'zod';

// MongoDB ObjectId regex pattern
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid ObjectId format');

// ============================================
// Enum Schemas
// ============================================

export const kitStatusEnum = z.enum(['draft', 'active', 'archived']);
export const checklistItemStatusEnum = z.enum(['pending', 'in_progress', 'completed', 'skipped', 'blocked']);
export const itemTypeEnum = z.enum(['asset', 'license', 'access', 'training', 'document', 'task', 'other']);
export const priorityEnum = z.enum(['low', 'normal', 'high', 'critical']);

// ============================================
// Checklist Item Sub-Schema
// ============================================

export const checklistItemSchema = z.object({
    name: z.string().min(1, 'Item name is required').max(200),
    description: z.string().max(1000).optional(),
    type: itemTypeEnum.default('task'),
    priority: priorityEnum.default('normal'),
    
    // Reference to actual item (if type is asset/license)
    referenceId: objectIdSchema.optional(),
    referenceModel: z.enum(['Asset', 'License', 'AssetGroup']).optional(),
    
    // Quantity (for assets)
    quantity: z.number().int().min(1).default(1),
    
    // Completion tracking
    isRequired: z.boolean().default(true),
    estimatedMinutes: z.number().int().min(0).optional(),
    dueOffsetDays: z.number().int().min(0).optional(), // Days after kit assignment
    
    // Dependencies
    dependsOn: z.array(z.number().int().min(0)).optional(), // Index of other items this depends on
    
    // Instructions
    instructions: z.string().max(2000).optional(),
    documentUrl: z.string().url().optional()
});

// ============================================
// Template Item (for kit templates)
// ============================================

export const templateItemSchema = checklistItemSchema.extend({
    // Template-specific: what to provision
    assetCategory: z.string().max(100).optional(), // e.g., "Laptop", "Monitor"
    licenseType: z.string().max(100).optional(), // e.g., "Microsoft 365", "Slack"
    accessType: z.string().max(100).optional(), // e.g., "VPN", "Building Access"
    
    // Auto-assign settings
    autoAssign: z.boolean().default(false),
    assignFromPool: objectIdSchema.optional() // Reference to asset pool/group
});

// ============================================
// Create Onboarding Kit Schema
// ============================================

export const createOnboardingKitSchema = z.object({
    // Basic info
    name: z.string().min(1, 'Kit name is required').max(200, 'Name too long'),
    description: z.string().max(2000, 'Description too long').optional(),
    
    // Classification
    department: objectIdSchema.optional(),
    departmentName: z.string().max(100).optional(), // For display/legacy
    role: z.string().max(100).optional(),
    employeeType: z.enum(['full_time', 'part_time', 'contractor', 'intern', 'temporary']).optional(),
    
    // Template settings
    isTemplate: z.boolean().default(false),
    templateId: objectIdSchema.optional(), // If created from template
    
    // Status
    status: kitStatusEnum.default('draft'),
    
    // Checklist items
    items: z.array(templateItemSchema).optional(),
    
    // Asset and license references (legacy support)
    assets: z.array(objectIdSchema).optional(),
    licenses: z.array(objectIdSchema).optional(),
    
    // Timing
    estimatedCompletionDays: z.number().int().min(1).max(365).optional(),
    
    // Tags
    tags: z.array(z.string().max(50)).max(20, 'Maximum 20 tags').optional(),
    
    // Metadata
    metadata: z.record(z.unknown()).optional()
});

// ============================================
// Update Onboarding Kit Schema
// ============================================

export const updateOnboardingKitSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    department: objectIdSchema.nullable().optional(),
    departmentName: z.string().max(100).optional(),
    role: z.string().max(100).optional(),
    employeeType: z.enum(['full_time', 'part_time', 'contractor', 'intern', 'temporary']).optional(),
    isTemplate: z.boolean().optional(),
    status: kitStatusEnum.optional(),
    items: z.array(templateItemSchema).optional(),
    assets: z.array(objectIdSchema).optional(),
    licenses: z.array(objectIdSchema).optional(),
    estimatedCompletionDays: z.number().int().min(1).max(365).optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    metadata: z.record(z.unknown()).optional()
});

// ============================================
// Apply Kit Schema
// ============================================

export const applyKitSchema = z.object({
    userId: objectIdSchema,
    startDate: z.string().datetime().or(z.date()).optional(), // When to start the onboarding
    customizations: z.object({
        excludeItems: z.array(z.number().int().min(0)).optional(), // Indices to skip
        additionalItems: z.array(checklistItemSchema).optional(),
        notes: z.string().max(1000).optional()
    }).optional(),
    assignedBy: objectIdSchema.optional(),
    notifyUser: z.boolean().default(true)
});

// ============================================
// Kit Assignment (instance of kit for a user)
// ============================================

export const kitAssignmentItemStatusSchema = z.object({
    itemIndex: z.number().int().min(0),
    status: checklistItemStatusEnum,
    completedAt: z.string().datetime().or(z.date()).optional(),
    completedBy: objectIdSchema.optional(),
    assignedAssetId: objectIdSchema.optional(), // Actual asset assigned
    assignedLicenseId: objectIdSchema.optional(), // Actual license assigned
    notes: z.string().max(500).optional(),
    blockedReason: z.string().max(500).optional()
});

export const updateAssignmentStatusSchema = z.object({
    itemIndex: z.number().int().min(0),
    status: checklistItemStatusEnum,
    notes: z.string().max(500).optional(),
    blockedReason: z.string().max(500).optional()
});

export const bulkUpdateAssignmentStatusSchema = z.object({
    updates: z.array(updateAssignmentStatusSchema).min(1).max(50)
});

// ============================================
// Query Schemas
// ============================================

export const onboardingKitQuerySchema = z.object({
    page: z.string().or(z.number()).transform(val => Number(val)).pipe(z.number().int().min(1)).optional(),
    limit: z.string().or(z.number()).transform(val => Number(val)).pipe(z.number().int().min(1).max(100)).optional(),
    sort: z.string().optional(),
    status: kitStatusEnum.optional(),
    department: objectIdSchema.optional(),
    role: z.string().optional(),
    isTemplate: z.string().transform(val => val === 'true').or(z.boolean()).optional(),
    search: z.string().optional(),
    isActive: z.string().transform(val => val === 'true').or(z.boolean()).optional()
});

export const kitIdParamSchema = z.object({
    id: objectIdSchema
});

export const assignmentQuerySchema = z.object({
    userId: objectIdSchema.optional(),
    kitId: objectIdSchema.optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
});

// ============================================
// Recommended Kits Query
// ============================================

export const recommendedKitsQuerySchema = z.object({
    department: objectIdSchema.optional(),
    departmentName: z.string().optional(),
    role: z.string().optional(),
    employeeType: z.enum(['full_time', 'part_time', 'contractor', 'intern', 'temporary']).optional(),
    limit: z.string().or(z.number()).transform(val => Number(val)).pipe(z.number().int().min(1).max(10)).default(5)
});

// ============================================
// Bulk Operations
// ============================================

export const bulkApplyKitSchema = z.object({
    kitId: objectIdSchema,
    userIds: z.array(objectIdSchema).min(1).max(50, 'Maximum 50 users per bulk operation'),
    startDate: z.string().datetime().or(z.date()).optional(),
    notifyUsers: z.boolean().default(true)
});

export const cloneKitSchema = z.object({
    name: z.string().min(1).max(200),
    asTemplate: z.boolean().default(false)
});

// ============================================
// Type Exports
// ============================================

export type CreateOnboardingKitInput = z.infer<typeof createOnboardingKitSchema>;
export type UpdateOnboardingKitInput = z.infer<typeof updateOnboardingKitSchema>;
export type ApplyKitInput = z.infer<typeof applyKitSchema>;
export type ChecklistItem = z.infer<typeof checklistItemSchema>;
export type TemplateItem = z.infer<typeof templateItemSchema>;
export type OnboardingKitQuery = z.infer<typeof onboardingKitQuerySchema>;
