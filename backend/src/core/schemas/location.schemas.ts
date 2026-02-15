/**
 * Zod validation schemas for Location endpoints
 * Comprehensive validation for location management with hierarchy and capacity tracking
 */
import { z } from 'zod';

// MongoDB ObjectId regex pattern
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid ObjectId format');

// ============================================
// Enum Schemas
// ============================================

export const locationTypeEnum = z.enum([
    'Building',
    'Floor', 
    'Room',
    'Storage',
    'Data Center',
    'Warehouse',
    'Remote',
    'Other'
]);

// ============================================
// Address Sub-Schema
// ============================================

export const addressSchema = z.object({
    street: z.string().max(200).optional(),
    street2: z.string().max(200).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    zipCode: z.string().max(20).optional(),
    country: z.string().max(100).optional(),
    coordinates: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180)
    }).optional()
});

// ============================================
// Capacity Sub-Schema
// ============================================

export const capacitySchema = z.object({
    maxAssets: z.number().int().min(0).optional(),
    maxPeople: z.number().int().min(0).optional(),
    squareFeet: z.number().min(0).optional(),
    squareMeters: z.number().min(0).optional(),
    powerCapacity: z.number().min(0).optional(), // in watts/kW
    coolingCapacity: z.number().min(0).optional(), // for data centers
    networkPorts: z.number().int().min(0).optional()
});

// ============================================
// Create Location Schema
// ============================================

export const createLocationSchema = z.object({
    // Required fields
    name: z.string().min(1, 'Location name is required').max(200, 'Name too long'),
    code: z.string().min(1, 'Location code is required').max(50, 'Code too long')
        .transform(val => val.toUpperCase()),
    type: locationTypeEnum,

    // Hierarchy
    parentLocation: objectIdSchema.optional(),

    // Address
    address: addressSchema.optional(),

    // Details
    description: z.string().max(1000, 'Description too long').optional(),
    
    // Capacity tracking
    capacity: capacitySchema.optional(),

    // Contact info
    contactPerson: z.string().max(100).optional(),
    contactEmail: z.string().email('Invalid email').optional(),
    contactPhone: z.string().max(30).optional(),

    // Operational
    operatingHours: z.string().max(200).optional(), // e.g., "Mon-Fri 9AM-5PM"
    timezone: z.string().max(50).optional(),
    accessInstructions: z.string().max(1000).optional(),

    // Status
    isActive: z.boolean().default(true),

    // Metadata
    tags: z.array(z.string().max(50)).max(20, 'Maximum 20 tags').optional(),
    metadata: z.record(z.unknown()).optional()
});

// ============================================
// Update Location Schema
// ============================================

export const updateLocationSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    code: z.string().min(1).max(50).transform(val => val.toUpperCase()).optional(),
    type: locationTypeEnum.optional(),
    parentLocation: objectIdSchema.nullable().optional(),
    address: addressSchema.optional(),
    description: z.string().max(1000).optional(),
    capacity: capacitySchema.optional(),
    contactPerson: z.string().max(100).optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().max(30).optional(),
    operatingHours: z.string().max(200).optional(),
    timezone: z.string().max(50).optional(),
    accessInstructions: z.string().max(1000).optional(),
    isActive: z.boolean().optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    metadata: z.record(z.unknown()).optional()
});

// ============================================
// Query & Params Schemas
// ============================================

export const locationQuerySchema = z.object({
    page: z.string().or(z.number()).transform(val => Number(val)).pipe(z.number().int().min(1)).optional(),
    limit: z.string().or(z.number()).transform(val => Number(val)).pipe(z.number().int().min(1).max(100)).optional(),
    sort: z.string().optional(),
    type: locationTypeEnum.optional(),
    parentLocation: objectIdSchema.optional(),
    isActive: z.string().transform(val => val === 'true').or(z.boolean()).optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    search: z.string().optional(),
    hasCapacity: z.string().transform(val => val === 'true').or(z.boolean()).optional(),
    flat: z.string().transform(val => val === 'true').or(z.boolean()).optional()
});

export const locationIdParamSchema = z.object({
    id: objectIdSchema
});

// ============================================
// Hierarchy Operations
// ============================================

export const moveLocationSchema = z.object({
    newParentId: objectIdSchema.nullable()
});

// ============================================
// Capacity Operations
// ============================================

export const updateCapacitySchema = capacitySchema;

export const checkCapacitySchema = z.object({
    assetCount: z.number().int().min(0).optional()
});

// ============================================
// Bulk Operations Schemas
// ============================================

export const bulkUpdateLocationsSchema = z.object({
    ids: z.array(objectIdSchema).min(1).max(100, 'Maximum 100 locations per operation'),
    data: z.object({
        isActive: z.boolean().optional(),
        type: locationTypeEnum.optional(),
        contactPerson: z.string().max(100).optional(),
        contactEmail: z.string().email().optional()
    })
});

export const bulkMoveLocationsSchema = z.object({
    ids: z.array(objectIdSchema).min(1).max(50),
    newParentId: objectIdSchema.nullable()
});

// ============================================
// Import Schema
// ============================================

export const importLocationsSchema = z.object({
    locations: z.array(createLocationSchema.omit({ parentLocation: true }).extend({
        parentCode: z.string().optional() // Reference parent by code for imports
    })).min(1).max(500, 'Maximum 500 locations per import')
});

// ============================================
// Stats Query Schema
// ============================================

export const locationStatsQuerySchema = z.object({
    includeChildren: z.string().transform(val => val === 'true').or(z.boolean()).default(false)
});

// ============================================
// Type Exports
// ============================================

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type LocationQuery = z.infer<typeof locationQuerySchema>;
export type LocationAddress = z.infer<typeof addressSchema>;
export type LocationCapacity = z.infer<typeof capacitySchema>;
