import { Router, Request, Response, NextFunction } from 'express';
import { OnboardingKit, KitAssignment } from './onboarding-kit.model';
import { authenticate, authorize, AuthRequest } from '../../core/middleware/auth.middleware';
import { validate, validateQuery, validateParams } from '../../core/middleware/validate.middleware';
import { ApiResponse } from '../../core/utils/response';
import { parsePaginationParams } from '../../core/utils/pagination';
import {
    createOnboardingKitSchema,
    updateOnboardingKitSchema,
    onboardingKitQuerySchema,
    kitIdParamSchema,
    applyKitSchema,
    updateAssignmentStatusSchema,
    bulkUpdateAssignmentStatusSchema,
    recommendedKitsQuerySchema,
    bulkApplyKitSchema,
    cloneKitSchema,
    assignmentQuerySchema
} from '../../core/schemas/onboarding-kit.schemas';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// List & Search Kits
// ============================================

// Get all onboarding kits
router.get('/',
    validateQuery(onboardingKitQuerySchema),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { status, department, role, isTemplate, search, isActive } = req.query;
            const filter: any = {};

            if (status) filter.status = status;
            if (department) filter.department = department;
            if (role) filter.role = { $regex: role, $options: 'i' };
            if (isTemplate !== undefined) filter.isTemplate = isTemplate === 'true';
            if (isActive !== undefined) filter.isActive = isActive === 'true';

            // Text search
            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { tags: { $in: [new RegExp(search as string, 'i')] } }
                ];
            }

            const { page, limit, sort } = parsePaginationParams(req.query);
            const skip = (page! - 1) * limit!;

            const [data, total] = await Promise.all([
                OnboardingKit.find(filter)
                    .populate('createdBy', 'name email')
                    .populate('department', 'name')
                    .sort(sort || { createdAt: -1 })
                    .skip(skip)
                    .limit(limit!)
                    .lean(),
                OnboardingKit.countDocuments(filter)
            ]);

            return ApiResponse.paginated(res, data, total, page!, limit!);
        } catch (error) {
            next(error);
        }
    }
);

// Get templates only
router.get('/templates',
    validateQuery(onboardingKitQuerySchema),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { department, role, search } = req.query;
            const filter: any = { isTemplate: true, status: 'active', isActive: true };

            if (department) filter.department = department;
            if (role) filter.role = { $regex: role, $options: 'i' };
            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            const templates = await OnboardingKit.find(filter)
                .populate('department', 'name')
                .sort('name')
                .lean();

            return ApiResponse.success(res, templates);
        } catch (error) {
            next(error);
        }
    }
);

// Get recommended kits based on criteria
router.get('/recommended',
    validateQuery(recommendedKitsQuerySchema),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { department, departmentName, role, employeeType, limit } = req.query;

            const filter: any = { isTemplate: true, status: 'active', isActive: true };
            if (department) filter.department = department;
            if (departmentName) filter.departmentName = { $regex: departmentName, $options: 'i' };
            if (role) filter.role = { $regex: role, $options: 'i' };
            if (employeeType) filter.employeeType = employeeType;

            const kits = await OnboardingKit.find(filter)
                .populate('department', 'name')
                .limit(parseInt(limit as string) || 5)
                .lean();

            return ApiResponse.success(res, kits);
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// Single Kit Operations
// ============================================

// Get kit by ID
router.get('/:id',
    validateParams(kitIdParamSchema),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const kit = await OnboardingKit.findById(req.params.id)
                .populate('createdBy', 'name email')
                .populate('department', 'name')
                .populate('assets')
                .populate('licenses')
                .lean();

            if (!kit) {
                return ApiResponse.notFound(res, 'Onboarding kit not found');
            }

            return ApiResponse.success(res, kit);
        } catch (error) {
            next(error);
        }
    }
);

// Create kit (admin/manager only)
router.post('/',
    authorize('admin', 'manager'),
    validate(createOnboardingKitSchema),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return ApiResponse.unauthorized(res, 'Not authenticated');
            }

            const kit = new OnboardingKit({
                ...req.body,
                createdBy: req.user._id
            });

            await kit.save();

            const populated = await OnboardingKit.findById(kit._id)
                .populate('createdBy', 'name email')
                .populate('department', 'name');

            return ApiResponse.created(res, populated, 'Onboarding kit created successfully');
        } catch (error) {
            next(error);
        }
    }
);

// Update kit (admin/manager only)
router.put('/:id',
    authorize('admin', 'manager'),
    validateParams(kitIdParamSchema),
    validate(updateOnboardingKitSchema),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const kit = await OnboardingKit.findByIdAndUpdate(
                req.params.id,
                { $set: req.body },
                { new: true, runValidators: true }
            )
                .populate('createdBy', 'name email')
                .populate('department', 'name');

            if (!kit) {
                return ApiResponse.notFound(res, 'Onboarding kit not found');
            }

            return ApiResponse.success(res, kit, 'Onboarding kit updated successfully');
        } catch (error) {
            next(error);
        }
    }
);

// Clone kit
router.post('/:id/clone',
    authorize('admin', 'manager'),
    validateParams(kitIdParamSchema),
    validate(cloneKitSchema),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const kit = await OnboardingKit.findById(req.params.id);
            if (!kit) {
                return ApiResponse.notFound(res, 'Onboarding kit not found');
            }

            const { name, asTemplate } = req.body;
            const cloned = await (kit as any).clone(name, asTemplate);

            return ApiResponse.created(res, cloned, 'Kit cloned successfully');
        } catch (error) {
            next(error);
        }
    }
);

// Archive kit (soft delete)
router.delete('/:id',
    authorize('admin'),
    validateParams(kitIdParamSchema),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const kit = await OnboardingKit.findByIdAndUpdate(
                req.params.id,
                { $set: { status: 'archived', isActive: false } },
                { new: true }
            );

            if (!kit) {
                return ApiResponse.notFound(res, 'Onboarding kit not found');
            }

            return ApiResponse.success(res, kit, 'Onboarding kit archived successfully');
        } catch (error) {
            next(error);
        }
    }
);

// Activate kit
router.post('/:id/activate',
    authorize('admin', 'manager'),
    validateParams(kitIdParamSchema),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const kit = await OnboardingKit.findByIdAndUpdate(
                req.params.id,
                { $set: { status: 'active', isActive: true } },
                { new: true }
            );

            if (!kit) {
                return ApiResponse.notFound(res, 'Onboarding kit not found');
            }

            return ApiResponse.success(res, kit, 'Onboarding kit activated successfully');
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// Apply Kit to User
// ============================================

// Apply kit to user (admin/manager only)
router.post('/:id/apply',
    authorize('admin', 'manager'),
    validateParams(kitIdParamSchema),
    validate(applyKitSchema),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return ApiResponse.unauthorized(res, 'Not authenticated');
            }

            const kit = await OnboardingKit.findById(req.params.id);
            if (!kit) {
                return ApiResponse.notFound(res, 'Onboarding kit not found');
            }

            const { userId, startDate, customizations, notifyUser } = req.body;

            // Create assignment
            const assignment = new KitAssignment({
                kitId: kit._id,
                userId,
                assignedBy: req.body.assignedBy || req.user._id,
                startDate: startDate || new Date(),
                customizations
            });

            await assignment.save();

            // Populate for response
            const populated = await KitAssignment.findById(assignment._id)
                .populate('kitId', 'name description items')
                .populate('userId', 'name email')
                .populate('assignedBy', 'name email');

            // TODO: If notifyUser, send notification

            return ApiResponse.created(res, populated, 'Kit applied successfully');
        } catch (error) {
            next(error);
        }
    }
);

// Bulk apply kit to multiple users
router.post('/:id/apply-bulk',
    authorize('admin', 'manager'),
    validateParams(kitIdParamSchema),
    validate(bulkApplyKitSchema),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return ApiResponse.unauthorized(res, 'Not authenticated');
            }

            const kit = await OnboardingKit.findById(req.params.id);
            if (!kit) {
                return ApiResponse.notFound(res, 'Onboarding kit not found');
            }

            const { userIds, startDate, notifyUsers } = req.body;

            const assignments = userIds.map((userId: string) => ({
                kitId: kit._id,
                userId,
                assignedBy: req.user!._id,
                startDate: startDate || new Date()
            }));

            const result = await KitAssignment.insertMany(assignments);

            return ApiResponse.created(res, { 
                created: result.length,
                assignments: result 
            }, `Kit applied to ${result.length} users`);
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// Kit Assignments
// ============================================

// Get all assignments (admin/manager)
router.get('/assignments/all',
    authorize('admin', 'manager'),
    validateQuery(assignmentQuerySchema),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { userId, kitId, status, startDate, endDate } = req.query;
            const filter: any = {};

            if (userId) filter.userId = userId;
            if (kitId) filter.kitId = kitId;
            if (status) filter.status = status;
            if (startDate || endDate) {
                filter.startDate = {};
                if (startDate) filter.startDate.$gte = new Date(startDate as string);
                if (endDate) filter.startDate.$lte = new Date(endDate as string);
            }

            const { page, limit, sort } = parsePaginationParams(req.query);
            const skip = (page! - 1) * limit!;

            const [data, total] = await Promise.all([
                KitAssignment.find(filter)
                    .populate('kitId', 'name description')
                    .populate('userId', 'name email')
                    .populate('assignedBy', 'name email')
                    .sort(sort || { createdAt: -1 })
                    .skip(skip)
                    .limit(limit!)
                    .lean(),
                KitAssignment.countDocuments(filter)
            ]);

            return ApiResponse.paginated(res, data, total, page!, limit!);
        } catch (error) {
            next(error);
        }
    }
);

// Get current user's assignments
router.get('/assignments/me', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return ApiResponse.unauthorized(res, 'Not authenticated');
        }

        const assignments = await KitAssignment.find({ userId: req.user._id })
            .populate('kitId', 'name description items estimatedCompletionDays')
            .populate('assignedBy', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        return ApiResponse.success(res, assignments);
    } catch (error) {
        next(error);
    }
});

// Get assignment by ID
router.get('/assignments/:assignmentId', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return ApiResponse.unauthorized(res, 'Not authenticated');
        }

        const assignment = await KitAssignment.findById(req.params.assignmentId)
            .populate('kitId')
            .populate('userId', 'name email')
            .populate('assignedBy', 'name email')
            .populate('itemStatuses.completedBy', 'name email')
            .lean();

        if (!assignment) {
            return ApiResponse.notFound(res, 'Assignment not found');
        }

        // Check access - user can see their own, admin/manager can see all
        const isOwner = assignment.userId._id.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin' || req.user.role === 'manager';
        
        if (!isOwner && !isAdmin) {
            return ApiResponse.forbidden(res, 'Access denied');
        }

        return ApiResponse.success(res, assignment);
    } catch (error) {
        next(error);
    }
});

// Update assignment item status
router.put('/assignments/:assignmentId/items',
    validate(updateAssignmentStatusSchema),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return ApiResponse.unauthorized(res, 'Not authenticated');
            }

            const assignment = await KitAssignment.findById(req.params.assignmentId);
            if (!assignment) {
                return ApiResponse.notFound(res, 'Assignment not found');
            }

            // Check access
            const isOwner = assignment.userId.toString() === req.user._id.toString();
            const isAdmin = req.user.role === 'admin' || req.user.role === 'manager';
            
            if (!isOwner && !isAdmin) {
                return ApiResponse.forbidden(res, 'Access denied');
            }

            const { itemIndex, status, notes, blockedReason } = req.body;
            
            await (assignment as any).updateItemStatus(itemIndex, status, req.user._id, notes);
            
            if (blockedReason) {
                const itemStatus = assignment.itemStatuses.find(i => i.itemIndex === itemIndex);
                if (itemStatus) itemStatus.blockedReason = blockedReason;
                await assignment.save();
            }

            const updated = await KitAssignment.findById(assignment._id)
                .populate('kitId', 'name items');

            return ApiResponse.success(res, updated, 'Item status updated');
        } catch (error) {
            next(error);
        }
    }
);

// Bulk update assignment item statuses
router.put('/assignments/:assignmentId/items/bulk',
    validate(bulkUpdateAssignmentStatusSchema),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return ApiResponse.unauthorized(res, 'Not authenticated');
            }

            const assignment = await KitAssignment.findById(req.params.assignmentId);
            if (!assignment) {
                return ApiResponse.notFound(res, 'Assignment not found');
            }

            const isOwner = assignment.userId.toString() === req.user._id.toString();
            const isAdmin = req.user.role === 'admin' || req.user.role === 'manager';
            
            if (!isOwner && !isAdmin) {
                return ApiResponse.forbidden(res, 'Access denied');
            }

            for (const update of req.body.updates) {
                const itemStatus = assignment.itemStatuses.find(i => i.itemIndex === update.itemIndex);
                if (itemStatus) {
                    itemStatus.status = update.status;
                    if (update.status === 'completed') {
                        itemStatus.completedAt = new Date();
                        itemStatus.completedBy = req.user._id;
                    }
                    if (update.notes) itemStatus.notes = update.notes;
                    if (update.blockedReason) itemStatus.blockedReason = update.blockedReason;
                }
            }

            (assignment as any).updateProgress();
            await assignment.save();

            return ApiResponse.success(res, assignment, 'Item statuses updated');
        } catch (error) {
            next(error);
        }
    }
);

// Cancel assignment
router.post('/assignments/:assignmentId/cancel',
    authorize('admin', 'manager'),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const assignment = await KitAssignment.findByIdAndUpdate(
                req.params.assignmentId,
                { $set: { status: 'cancelled' } },
                { new: true }
            );

            if (!assignment) {
                return ApiResponse.notFound(res, 'Assignment not found');
            }

            return ApiResponse.success(res, assignment, 'Assignment cancelled');
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// Statistics
// ============================================

// Get kit statistics
router.get('/:id/stats',
    validateParams(kitIdParamSchema),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const kitId = req.params.id;

            const [kit, stats, recentAssignments] = await Promise.all([
                OnboardingKit.findById(kitId).select('name items'),
                KitAssignment.aggregate([
                    { $match: { kitId: new (await import('mongoose')).Types.ObjectId(kitId) } },
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 },
                            avgProgress: { $avg: '$progress.percentage' }
                        }
                    }
                ]),
                KitAssignment.find({ kitId })
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .populate('userId', 'name email')
                    .lean()
            ]);

            if (!kit) {
                return ApiResponse.notFound(res, 'Kit not found');
            }

            return ApiResponse.success(res, {
                kit: { name: kit.name, itemCount: kit.items.length },
                statusBreakdown: stats,
                recentAssignments
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
