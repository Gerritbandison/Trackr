import { Router, Response } from 'express';
import Department from './department.model';
import { authenticate, authorize, AuthRequest } from '../../core/middleware/auth.middleware';
import { validate, validateQuery, validateParams } from '../../core/middleware/validate.middleware';
import { ApiResponse } from '../../core/utils/response';
import { parsePaginationParams } from '../../core/utils/pagination';
import {
    createDepartmentSchema,
    updateDepartmentSchema,
    departmentQuerySchema,
    departmentIdParamSchema,
    updateBudgetSchema,
    addBudgetAllocationSchema,
    recordExpenditureSchema,
    moveDepartmentSchema,
    bulkUpdateDepartmentsSchema
} from '../../core/schemas/department.schemas';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// ============================================
// List & Search
// ============================================

// Get all departments (flat list or tree)
router.get('/',
    validateQuery(departmentQuerySchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const { isActive, parentDepartment, manager, costCenter, search, includeInactive, flat } = req.query;
            const filter: Record<string, any> = {};

            // Only include active by default
            if (includeInactive !== 'true') {
                filter.isActive = true;
            }
            if (isActive !== undefined) {
                filter.isActive = isActive === 'true';
            }
            if (parentDepartment) filter.parentDepartment = parentDepartment;
            if (manager) filter.manager = manager;
            if (costCenter) filter.costCenter = costCenter;

            // Text search
            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { code: { $regex: search, $options: 'i' } }
                ];
            }

            const { page, limit, sort } = parsePaginationParams(req.query);
            const skip = (page! - 1) * limit!;

            // Return tree structure if not flat
            if (flat !== 'true' && !parentDepartment && !search) {
                const tree = await (Department as any).getTree();
                return ApiResponse.success(res, tree);
            }

            const [data, total] = await Promise.all([
                Department.find(filter)
                    .select('-__v')
                    .populate('manager', 'name email')
                    .populate('parentDepartment', 'name code')
                    .populate('location', 'name code')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit!)
                    .lean(),
                Department.countDocuments(filter)
            ]);

            return ApiResponse.paginated(res, data, total, page!, limit!);
        } catch (error) {
            return ApiResponse.error(res, 'Error fetching departments', error instanceof Error ? error.message : 'Unknown error');
        }
    }
);

// Get department tree (hierarchical view)
router.get('/tree', async (req: AuthRequest, res: Response) => {
    try {
        const { rootId } = req.query;
        const tree = await (Department as any).getTree(rootId as string);
        return ApiResponse.success(res, tree);
    } catch (error) {
        return ApiResponse.error(res, 'Error fetching department tree', error instanceof Error ? error.message : 'Unknown error');
    }
});

// ============================================
// Single Department Operations
// ============================================

// Get department by ID
router.get('/:id',
    validateParams(departmentIdParamSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const department = await Department.findById(req.params.id)
                .select('-__v')
                .populate('manager', 'name email department')
                .populate('parentDepartment', 'name code')
                .populate('location', 'name code type')
                .populate('budget.approvedBy', 'name email')
                .lean();

            if (!department) {
                return ApiResponse.notFound(res, 'Department not found');
            }

            return ApiResponse.success(res, department);
        } catch (error) {
            return ApiResponse.error(res, 'Error fetching department', error instanceof Error ? error.message : 'Unknown error');
        }
    }
);

// Get department children
router.get('/:id/children',
    validateParams(departmentIdParamSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const children = await Department.find({ 
                parentDepartment: req.params.id,
                isActive: true 
            })
                .populate('manager', 'name email')
                .lean();

            return ApiResponse.success(res, children);
        } catch (error) {
            return ApiResponse.error(res, 'Error fetching children', error instanceof Error ? error.message : 'Unknown error');
        }
    }
);

// Get department ancestors (path to root)
router.get('/:id/ancestors',
    validateParams(departmentIdParamSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const department = await Department.findById(req.params.id);
            if (!department) {
                return ApiResponse.notFound(res, 'Department not found');
            }

            const ancestors = await department.getAncestors();
            return ApiResponse.success(res, ancestors);
        } catch (error) {
            return ApiResponse.error(res, 'Error fetching ancestors', error instanceof Error ? error.message : 'Unknown error');
        }
    }
);

// Get all descendants
router.get('/:id/descendants',
    validateParams(departmentIdParamSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const descendants = await (Department as any).getDescendants(req.params.id);
            return ApiResponse.success(res, descendants);
        } catch (error) {
            return ApiResponse.error(res, 'Error fetching descendants', error instanceof Error ? error.message : 'Unknown error');
        }
    }
);

// Create department (admin only)
router.post('/',
    authorize('admin'),
    validate(createDepartmentSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const department = new Department(req.body);
            await department.save();

            const populated = await Department.findById(department._id)
                .populate('manager', 'name email')
                .populate('parentDepartment', 'name code');

            return ApiResponse.created(res, populated, 'Department created successfully');
        } catch (error) {
            if ((error as any).code === 11000) {
                return ApiResponse.badRequest(res, 'Department with this name or code already exists');
            }
            return ApiResponse.error(res, 'Error creating department', error instanceof Error ? error.message : 'Unknown error', 400);
        }
    }
);

// Update department (admin only)
router.put('/:id',
    authorize('admin'),
    validateParams(departmentIdParamSchema),
    validate(updateDepartmentSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            // Handle null values for clearing references
            const updateData = { ...req.body };
            if (updateData.parentDepartment === null) {
                updateData.parentDepartment = null;
            }
            if (updateData.manager === null) {
                updateData.manager = null;
            }
            if (updateData.location === null) {
                updateData.location = null;
            }

            const department = await Department.findByIdAndUpdate(
                req.params.id,
                updateData,
                { new: true, runValidators: true }
            )
                .populate('manager', 'name email')
                .populate('parentDepartment', 'name code');

            if (!department) {
                return ApiResponse.notFound(res, 'Department not found');
            }

            return ApiResponse.success(res, department, 'Department updated successfully');
        } catch (error) {
            if ((error as any).code === 11000) {
                return ApiResponse.badRequest(res, 'Department with this name or code already exists');
            }
            if ((error as any).message?.includes('circular')) {
                return ApiResponse.badRequest(res, (error as Error).message);
            }
            return ApiResponse.error(res, 'Error updating department', error instanceof Error ? error.message : 'Unknown error', 400);
        }
    }
);

// Deactivate department (soft delete)
router.delete('/:id',
    authorize('admin'),
    validateParams(departmentIdParamSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const department = await Department.findByIdAndUpdate(
                req.params.id,
                { isActive: false },
                { new: true }
            );

            if (!department) {
                return ApiResponse.notFound(res, 'Department not found');
            }

            return ApiResponse.success(res, department, 'Department deactivated successfully');
        } catch (error) {
            return ApiResponse.error(res, 'Error deactivating department', error instanceof Error ? error.message : 'Unknown error');
        }
    }
);

// Reactivate department
router.post('/:id/activate',
    authorize('admin'),
    validateParams(departmentIdParamSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const department = await Department.findByIdAndUpdate(
                req.params.id,
                { isActive: true },
                { new: true }
            );

            if (!department) {
                return ApiResponse.notFound(res, 'Department not found');
            }

            return ApiResponse.success(res, department, 'Department activated successfully');
        } catch (error) {
            return ApiResponse.error(res, 'Error activating department', error instanceof Error ? error.message : 'Unknown error');
        }
    }
);

// ============================================
// Hierarchy Operations
// ============================================

// Move department to new parent
router.post('/:id/move',
    authorize('admin'),
    validateParams(departmentIdParamSchema),
    validate(moveDepartmentSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const { newParentId } = req.body;

            const department = await Department.findById(req.params.id);
            if (!department) {
                return ApiResponse.notFound(res, 'Department not found');
            }

            department.parentDepartment = newParentId;
            await department.save(); // Triggers circular check

            const updated = await Department.findById(req.params.id)
                .populate('manager', 'name email')
                .populate('parentDepartment', 'name code');

            return ApiResponse.success(res, updated, 'Department moved successfully');
        } catch (error) {
            if ((error as any).message?.includes('circular') || (error as any).message?.includes('parent')) {
                return ApiResponse.badRequest(res, (error as Error).message);
            }
            return ApiResponse.error(res, 'Error moving department', error instanceof Error ? error.message : 'Unknown error');
        }
    }
);

// ============================================
// Budget Operations
// ============================================

// Update department budget
router.put('/:id/budget',
    authorize('admin'),
    validateParams(departmentIdParamSchema),
    validate(updateBudgetSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const department = await Department.findById(req.params.id);
            if (!department) {
                return ApiResponse.notFound(res, 'Department not found');
            }

            department.budget = {
                ...department.budget,
                ...req.body,
                approvedBy: req.user?._id,
                approvedAt: new Date()
            };
            await department.save();

            return ApiResponse.success(res, department, 'Budget updated successfully');
        } catch (error) {
            return ApiResponse.error(res, 'Error updating budget', error instanceof Error ? error.message : 'Unknown error', 400);
        }
    }
);

// Add budget allocation
router.post('/:id/budget/allocations',
    authorize('admin'),
    validateParams(departmentIdParamSchema),
    validate(addBudgetAllocationSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const department = await Department.findById(req.params.id);
            if (!department) {
                return ApiResponse.notFound(res, 'Department not found');
            }

            if (!department.budget) {
                department.budget = { currency: 'USD', allocations: [] };
            }
            department.budget.allocations.push(req.body);
            await department.save();

            return ApiResponse.created(res, department, 'Budget allocation added successfully');
        } catch (error) {
            return ApiResponse.error(res, 'Error adding allocation', error instanceof Error ? error.message : 'Unknown error', 400);
        }
    }
);

// Record expenditure against budget
router.post('/:id/budget/expenditure',
    authorize('admin', 'manager'),
    validateParams(departmentIdParamSchema),
    validate(recordExpenditureSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const { allocationId, amount, description, reference } = req.body;

            const department = await Department.findById(req.params.id);
            if (!department) {
                return ApiResponse.notFound(res, 'Department not found');
            }

            if (!department.budget) {
                return ApiResponse.badRequest(res, 'Department has no budget configured');
            }

            if (allocationId) {
                // Find specific allocation
                const allocation = department.budget.allocations.find(
                    (a: any) => a._id?.toString() === allocationId
                );
                if (!allocation) {
                    return ApiResponse.notFound(res, 'Budget allocation not found');
                }
                allocation.spent = (allocation.spent || 0) + amount;
            }

            await department.save();

            return ApiResponse.success(res, department, 'Expenditure recorded successfully');
        } catch (error) {
            return ApiResponse.error(res, 'Error recording expenditure', error instanceof Error ? error.message : 'Unknown error', 400);
        }
    }
);

// Get budget summary
router.get('/:id/budget/summary',
    validateParams(departmentIdParamSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const department = await Department.findById(req.params.id)
                .populate('budget.approvedBy', 'name email');

            if (!department) {
                return ApiResponse.notFound(res, 'Department not found');
            }

            if (!department.budget) {
                return ApiResponse.success(res, { message: 'No budget configured' });
            }

            const totalAllocated = department.budget.allocations?.reduce(
                (sum, a) => sum + (a.amount || 0), 0
            ) || 0;
            
            const totalSpent = department.budget.allocations?.reduce(
                (sum, a) => sum + (a.spent || 0), 0
            ) || 0;

            const summary = {
                annualBudget: department.budget.annualBudget || 0,
                fiscalYear: department.budget.fiscalYear,
                currency: department.budget.currency,
                totalAllocated,
                totalSpent,
                remaining: (department.budget.annualBudget || 0) - totalSpent,
                utilizationPercent: department.budget.annualBudget 
                    ? Math.round((totalSpent / department.budget.annualBudget) * 100)
                    : 0,
                allocations: department.budget.allocations,
                approvedBy: department.budget.approvedBy,
                approvedAt: department.budget.approvedAt
            };

            return ApiResponse.success(res, summary);
        } catch (error) {
            return ApiResponse.error(res, 'Error fetching budget summary', error instanceof Error ? error.message : 'Unknown error');
        }
    }
);

// ============================================
// Bulk Operations
// ============================================

// Bulk update departments
router.patch('/bulk',
    authorize('admin'),
    validate(bulkUpdateDepartmentsSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const { ids, data } = req.body;

            const result = await Department.updateMany(
                { _id: { $in: ids } },
                { $set: data }
            );

            return ApiResponse.success(res, {
                modified: result.modifiedCount,
                matched: result.matchedCount
            }, 'Departments updated successfully');
        } catch (error) {
            return ApiResponse.error(res, 'Error updating departments', error instanceof Error ? error.message : 'Unknown error');
        }
    }
);

export default router;
