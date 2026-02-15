import { Router, Response, NextFunction } from 'express';
import { Notification, NotificationPreferences } from './notification.model';
import { authenticate, authorize, AuthRequest } from '../../core/middleware/auth.middleware';
import { validate, validateQuery, validateParams } from '../../core/middleware/validate.middleware';
import { ApiResponse } from '../../core/utils/response';
import { parsePaginationParams } from '../../core/utils/pagination';
import {
    createNotificationSchema,
    bulkCreateNotificationSchema,
    notificationQuerySchema,
    notificationIdParamSchema,
    updatePreferencesSchema,
    bulkMarkReadSchema,
    bulkDeleteSchema
} from '../../core/schemas/notification.schemas';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// Get Notifications
// ============================================

// Get all notifications for current user
router.get('/',
    validateQuery(notificationQuerySchema),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return ApiResponse.unauthorized(res, 'Not authenticated');
            }

            const { unreadOnly, type, category, priority, startDate, endDate } = req.query;
            const filter: any = { userId: req.user._id };

            if (unreadOnly === 'true') filter.read = false;
            if (type) filter.type = type;
            if (category) filter.category = category;
            if (priority) filter.priority = priority;

            // Date range filter
            if (startDate || endDate) {
                filter.createdAt = {};
                if (startDate) filter.createdAt.$gte = new Date(startDate as string);
                if (endDate) filter.createdAt.$lte = new Date(endDate as string);
            }

            const { page, limit, sort } = parsePaginationParams(req.query);
            const skip = (page! - 1) * limit!;

            const [data, total, unreadCount] = await Promise.all([
                Notification.find(filter)
                    .sort(sort || { createdAt: -1 })
                    .skip(skip)
                    .limit(limit!)
                    .lean(),
                Notification.countDocuments(filter),
                Notification.countDocuments({ userId: req.user._id, read: false })
            ]);

            return ApiResponse.paginated(res, data, total, page!, limit!, { unreadCount });
        } catch (error) {
            next(error);
        }
    }
);

// Get unread count
router.get('/unread-count', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return ApiResponse.unauthorized(res, 'Not authenticated');
        }

        const count = await Notification.countDocuments({ userId: req.user._id, read: false });
        return ApiResponse.success(res, { unreadCount: count });
    } catch (error) {
        next(error);
    }
});

// Get notification by ID
router.get('/:id',
    validateParams(notificationIdParamSchema),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return ApiResponse.unauthorized(res, 'Not authenticated');
            }

            const notification = await Notification.findOne({
                _id: req.params.id,
                userId: req.user._id
            }).lean();

            if (!notification) {
                return ApiResponse.notFound(res, 'Notification not found');
            }

            return ApiResponse.success(res, notification);
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// Create Notifications (Admin/System)
// ============================================

// Create notification for a user (admin/manager)
router.post('/',
    authorize('admin', 'manager'),
    validate(createNotificationSchema),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const notification = new Notification({
                ...req.body,
                deliveryStatus: req.body.channels?.map((channel: string) => ({
                    channel,
                    status: 'pending',
                    attempts: 0
                })) || [{ channel: 'in_app', status: 'delivered', attempts: 1, deliveredAt: new Date() }]
            });

            await notification.save();
            return ApiResponse.created(res, notification, 'Notification created successfully');
        } catch (error) {
            next(error);
        }
    }
);

// Bulk create notifications (admin only)
router.post('/bulk',
    authorize('admin'),
    validate(bulkCreateNotificationSchema),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { userIds, channels, ...notificationData } = req.body;

            const notifications = userIds.map((userId: string) => ({
                ...notificationData,
                userId,
                deliveryStatus: (channels || ['in_app']).map((channel: string) => ({
                    channel,
                    status: channel === 'in_app' ? 'delivered' : 'pending',
                    attempts: channel === 'in_app' ? 1 : 0,
                    deliveredAt: channel === 'in_app' ? new Date() : undefined
                }))
            }));

            const result = await Notification.insertMany(notifications);
            return ApiResponse.created(res, { created: result.length }, `${result.length} notifications created`);
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// Mark as Read
// ============================================

// Mark notification as read
router.put('/:id/read',
    validateParams(notificationIdParamSchema),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return ApiResponse.unauthorized(res, 'Not authenticated');
            }

            const notification = await Notification.findOneAndUpdate(
                { _id: req.params.id, userId: req.user._id },
                { $set: { read: true, readAt: new Date() } },
                { new: true }
            ).lean();

            if (!notification) {
                return ApiResponse.notFound(res, 'Notification not found');
            }

            return ApiResponse.success(res, notification);
        } catch (error) {
            next(error);
        }
    }
);

// Mark all notifications as read
router.put('/read-all', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return ApiResponse.unauthorized(res, 'Not authenticated');
        }

        const result = await Notification.updateMany(
            { userId: req.user._id, read: false },
            { $set: { read: true, readAt: new Date() } }
        );

        return ApiResponse.success(res, { marked: result.modifiedCount }, 'All notifications marked as read');
    } catch (error) {
        next(error);
    }
});

// Bulk mark as read
router.put('/bulk/read',
    validate(bulkMarkReadSchema),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return ApiResponse.unauthorized(res, 'Not authenticated');
            }

            const result = await Notification.updateMany(
                { _id: { $in: req.body.ids }, userId: req.user._id },
                { $set: { read: true, readAt: new Date() } }
            );

            return ApiResponse.success(res, { marked: result.modifiedCount }, 'Notifications marked as read');
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// Delete Notifications
// ============================================

// Delete notification
router.delete('/:id',
    validateParams(notificationIdParamSchema),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return ApiResponse.unauthorized(res, 'Not authenticated');
            }

            const notification = await Notification.findOneAndDelete({
                _id: req.params.id,
                userId: req.user._id
            }).lean();

            if (!notification) {
                return ApiResponse.notFound(res, 'Notification not found');
            }

            return ApiResponse.deleted(res, 'Notification deleted successfully');
        } catch (error) {
            next(error);
        }
    }
);

// Bulk delete notifications
router.delete('/bulk',
    validate(bulkDeleteSchema),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return ApiResponse.unauthorized(res, 'Not authenticated');
            }

            const filter: any = { userId: req.user._id };
            
            if (req.body.ids?.length) {
                filter._id = { $in: req.body.ids };
            } else if (req.body.olderThan) {
                filter.createdAt = { $lt: new Date(req.body.olderThan) };
            } else {
                return ApiResponse.badRequest(res, 'Either ids or olderThan is required');
            }

            const result = await Notification.deleteMany(filter);
            return ApiResponse.success(res, { deleted: result.deletedCount }, 'Notifications deleted');
        } catch (error) {
            next(error);
        }
    }
);

// Delete all read notifications
router.delete('/read', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return ApiResponse.unauthorized(res, 'Not authenticated');
        }

        const result = await Notification.deleteMany({ userId: req.user._id, read: true });
        return ApiResponse.success(res, { deleted: result.deletedCount }, 'Read notifications deleted');
    } catch (error) {
        next(error);
    }
});

// ============================================
// Notification Preferences
// ============================================

// Get current user's preferences
router.get('/preferences/me', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return ApiResponse.unauthorized(res, 'Not authenticated');
        }

        let preferences = await NotificationPreferences.findOne({ userId: req.user._id }).lean();

        // Return defaults if no preferences exist
        if (!preferences) {
            preferences = {
                userId: req.user._id,
                inApp: { enabled: true, minPriority: 'low' },
                email: { enabled: true, minPriority: 'low', digestFrequency: 'immediate' },
                webhook: { enabled: false, minPriority: 'normal' },
                slack: { enabled: false },
                teams: { enabled: false }
            } as any;
        }

        return ApiResponse.success(res, preferences);
    } catch (error) {
        next(error);
    }
});

// Update current user's preferences
router.put('/preferences/me',
    validate(updatePreferencesSchema),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return ApiResponse.unauthorized(res, 'Not authenticated');
            }

            const preferences = await NotificationPreferences.findOneAndUpdate(
                { userId: req.user._id },
                { $set: req.body },
                { new: true, upsert: true, runValidators: true }
            ).lean();

            return ApiResponse.success(res, preferences, 'Preferences updated successfully');
        } catch (error) {
            next(error);
        }
    }
);

// Test webhook delivery (admin)
router.post('/preferences/test-webhook',
    authorize('admin', 'manager'),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return ApiResponse.unauthorized(res, 'Not authenticated');
            }

            const preferences = await NotificationPreferences.findOne({ userId: req.user._id });
            
            if (!preferences?.webhook?.enabled || !preferences?.webhook?.url) {
                return ApiResponse.badRequest(res, 'Webhook not configured');
            }

            // In a real implementation, you would send a test webhook here
            // For now, just return success
            return ApiResponse.success(res, { 
                message: 'Test webhook would be sent to: ' + preferences.webhook.url,
                note: 'Actual webhook delivery not implemented in this version'
            });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// Admin Routes
// ============================================

// Get all notifications (admin only)
router.get('/admin/all',
    authorize('admin'),
    validateQuery(notificationQuerySchema),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { type, category, priority, startDate, endDate } = req.query;
            const filter: any = {};

            if (type) filter.type = type;
            if (category) filter.category = category;
            if (priority) filter.priority = priority;

            if (startDate || endDate) {
                filter.createdAt = {};
                if (startDate) filter.createdAt.$gte = new Date(startDate as string);
                if (endDate) filter.createdAt.$lte = new Date(endDate as string);
            }

            const { page, limit, sort } = parsePaginationParams(req.query);
            const skip = (page! - 1) * limit!;

            const [data, total] = await Promise.all([
                Notification.find(filter)
                    .populate('userId', 'name email')
                    .sort(sort || { createdAt: -1 })
                    .skip(skip)
                    .limit(limit!)
                    .lean(),
                Notification.countDocuments(filter)
            ]);

            return ApiResponse.paginated(res, data, total, page!, limit!);
        } catch (error) {
            next(error);
        }
    }
);

// Cleanup expired notifications (admin only)
router.post('/admin/cleanup',
    authorize('admin'),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const result = await Notification.deleteMany({
                expiresAt: { $lt: new Date() }
            });

            return ApiResponse.success(res, { deleted: result.deletedCount }, 'Expired notifications cleaned up');
        } catch (error) {
            next(error);
        }
    }
);

export default router;
