import { Router, Response } from 'express';
import { body, param } from 'express-validator';
import { validationResult } from 'express-validator';
import Department from './department.model';
import { authenticate, authorize, AuthRequest } from '../../core/middleware/auth.middleware';
import { ApiResponse } from '../../core/utils/response';
import { parsePaginationParams } from '../../core/utils/pagination';
import mongoose from 'mongoose';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all departments
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const { isActive } = req.query;
        const filter: Record<string, boolean> = {};
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const { page, limit, sort } = parsePaginationParams(req.query);
        const skip = (page! - 1) * limit!;

        const [data, total] = await Promise.all([
            Department.find(filter)
                .select('-__v')
                .populate('manager', 'name email')
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
});

// Get department by ID
router.get('/:id', param('id').isMongoId(), async (req: AuthRequest, res: Response) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id!)) {
            return ApiResponse.badRequest(res, 'Invalid department ID');
        }

        const department = await Department.findById(req.params.id!)
            .select('-__v')
            .populate('manager', 'name email department')
            .lean();
        if (!department) {
            return ApiResponse.notFound(res, 'Department not found');
        }

        return ApiResponse.success(res, department);
    } catch (error) {
        return ApiResponse.error(res, 'Error fetching department', error instanceof Error ? error.message : 'Unknown error');
    }
});

// Create department (admin only)
router.post('/',
    authorize('admin'),
    [
        body('name').trim().notEmpty().withMessage('Department name is required'),
        body('budget').optional().isNumeric().withMessage('Budget must be a number')
    ],
    async (req: AuthRequest, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return ApiResponse.badRequest(res, 'Validation failed', errors.array());
            }

            const department = new Department(req.body);
            await department.save();

            return ApiResponse.created(res, department, 'Department created successfully');
        } catch (error) {
            return ApiResponse.error(res, 'Error creating department', error instanceof Error ? error.message : 'Unknown error', 400);
        }
    }
);

// Update department (admin only)
router.put('/:id',
    authorize('admin'),
    [
        param('id').isMongoId(),
        body('name').optional().trim().notEmpty(),
        body('budget').optional().isNumeric()
    ],
    async (req: AuthRequest, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return ApiResponse.badRequest(res, 'Validation failed', errors.array());
            }

            const department = await Department.findByIdAndUpdate(req.params.id!, req.body, { new: true, runValidators: true });
            if (!department) {
                return ApiResponse.notFound(res, 'Department not found');
            }

            return ApiResponse.success(res, department, 'Department updated successfully');
        } catch (error) {
            return ApiResponse.error(res, 'Error updating department', error instanceof Error ? error.message : 'Unknown error', 400);
        }
    }
);

// Delete department (admin only)
router.delete('/:id',
    authorize('admin'),
    param('id').isMongoId(),
    async (req: AuthRequest, res: Response) => {
        try {
            const department = await Department.findByIdAndUpdate(req.params.id!, { isActive: false }, { new: true });
            if (!department) {
                return ApiResponse.notFound(res, 'Department not found');
            }

            return ApiResponse.success(res, department, 'Department deactivated successfully');
        } catch (error) {
            return ApiResponse.error(res, 'Error deleting department', error instanceof Error ? error.message : 'Unknown error');
        }
    }
);

export default router;
