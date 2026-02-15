/**
 * Zod validation schemas for Notification endpoints
 * Comprehensive validation for notification management with preferences and delivery
 */
import { z } from 'zod';

// MongoDB ObjectId regex pattern
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid ObjectId format');

// ============================================
// Enum Schemas
// ============================================

export const notificationTypeEnum = z.enum([
    'info',
    'warning', 
    'error',
    'success',
    'alert',
    'reminder',
    'system'
]);

export const notificationCategoryEnum = z.enum([
    'asset',
    'license',
    'warranty',
    'maintenance',
    'security',
    'user',
    'system',
    'report',
    'other'
]);

export const deliveryChannelEnum = z.enum([
    'in_app',
    'email',
    'webhook',
    'sms',
    'slack',
    'teams'
]);

export const priorityEnum = z.enum(['low', 'normal', 'high', 'urgent']);

// ============================================
// Notification Preferences Sub-Schema
// ============================================

export const channelPreferenceSchema = z.object({
    enabled: z.boolean().default(true),
    categories: z.array(notificationCategoryEnum).optional(), // If empty, all categories
    minPriority: priorityEnum.default('low'),
    quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)').optional(),
    quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)').optional(),
    timezone: z.string().max(50).optional()
});

export const notificationPreferencesSchema = z.object({
    inApp: channelPreferenceSchema.optional(),
    email: channelPreferenceSchema.extend({
        digestFrequency: z.enum(['immediate', 'hourly', 'daily', 'weekly']).default('immediate')
    }).optional(),
    webhook: z.object({
        enabled: z.boolean().default(false),
        url: z.string().url('Invalid webhook URL').optional(),
        secret: z.string().max(100).optional(), // For signing payloads
        categories: z.array(notificationCategoryEnum).optional(),
        minPriority: priorityEnum.default('normal')
    }).optional(),
    slack: z.object({
        enabled: z.boolean().default(false),
        webhookUrl: z.string().url().optional(),
        channel: z.string().max(100).optional(),
        categories: z.array(notificationCategoryEnum).optional()
    }).optional(),
    teams: z.object({
        enabled: z.boolean().default(false),
        webhookUrl: z.string().url().optional(),
        categories: z.array(notificationCategoryEnum).optional()
    }).optional()
});

// ============================================
// Create Notification Schema
// ============================================

export const createNotificationSchema = z.object({
    // Required fields
    userId: objectIdSchema,
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),

    // Classification
    type: notificationTypeEnum.default('info'),
    category: notificationCategoryEnum.default('other'),
    priority: priorityEnum.default('normal'),

    // Links and actions
    link: z.string().url().optional().or(z.string().startsWith('/')), // Internal or external link
    actionLabel: z.string().max(50).optional(),
    actionUrl: z.string().optional(),

    // References
    relatedEntity: z.object({
        type: z.enum(['asset', 'license', 'user', 'vendor', 'department', 'location', 'other']),
        id: objectIdSchema,
        name: z.string().max(200).optional()
    }).optional(),

    // Delivery
    channels: z.array(deliveryChannelEnum).default(['in_app']),
    
    // Scheduling
    scheduledFor: z.string().datetime().or(z.date()).optional(),
    expiresAt: z.string().datetime().or(z.date()).optional(),

    // Metadata
    metadata: z.record(z.unknown()).optional()
});

// ============================================
// Bulk Create Notifications Schema
// ============================================

export const bulkCreateNotificationSchema = z.object({
    // Send to multiple users
    userIds: z.array(objectIdSchema).min(1).max(1000, 'Maximum 1000 recipients'),
    
    // Notification content (same for all)
    title: z.string().min(1).max(200),
    message: z.string().min(1).max(2000),
    type: notificationTypeEnum.default('info'),
    category: notificationCategoryEnum.default('other'),
    priority: priorityEnum.default('normal'),
    link: z.string().optional(),
    relatedEntity: z.object({
        type: z.enum(['asset', 'license', 'user', 'vendor', 'department', 'location', 'other']),
        id: objectIdSchema,
        name: z.string().max(200).optional()
    }).optional(),
    channels: z.array(deliveryChannelEnum).default(['in_app']),
    expiresAt: z.string().datetime().or(z.date()).optional()
});

// ============================================
// Update Preferences Schema
// ============================================

export const updatePreferencesSchema = notificationPreferencesSchema;

// ============================================
// Query Schemas
// ============================================

export const notificationQuerySchema = z.object({
    page: z.string().or(z.number()).transform(val => Number(val)).pipe(z.number().int().min(1)).optional(),
    limit: z.string().or(z.number()).transform(val => Number(val)).pipe(z.number().int().min(1).max(100)).optional(),
    unreadOnly: z.string().transform(val => val === 'true').or(z.boolean()).optional(),
    type: notificationTypeEnum.optional(),
    category: notificationCategoryEnum.optional(),
    priority: priorityEnum.optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
});

export const notificationIdParamSchema = z.object({
    id: objectIdSchema
});

// ============================================
// Bulk Operations Schemas
// ============================================

export const bulkMarkReadSchema = z.object({
    ids: z.array(objectIdSchema).min(1).max(100, 'Maximum 100 notifications')
});

export const bulkDeleteSchema = z.object({
    ids: z.array(objectIdSchema).min(1).max(100, 'Maximum 100 notifications'),
    olderThan: z.string().datetime().optional() // Alternative: delete all older than date
});

// ============================================
// Webhook Delivery Schema (internal use)
// ============================================

export const webhookPayloadSchema = z.object({
    event: z.string(),
    notification: z.object({
        id: z.string(),
        title: z.string(),
        message: z.string(),
        type: notificationTypeEnum,
        category: notificationCategoryEnum,
        priority: priorityEnum,
        createdAt: z.string().datetime(),
        relatedEntity: z.object({
            type: z.string(),
            id: z.string(),
            name: z.string().optional()
        }).optional()
    }),
    timestamp: z.string().datetime(),
    signature: z.string().optional()
});

// ============================================
// Type Exports
// ============================================

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type BulkCreateNotificationInput = z.infer<typeof bulkCreateNotificationSchema>;
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
export type NotificationQuery = z.infer<typeof notificationQuerySchema>;
export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;
