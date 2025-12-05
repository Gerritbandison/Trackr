import { Router, Response } from 'express';
import { body, param } from 'express-validator';
import { validationResult } from 'express-validator';
import Vendor from './vendor.model';
import { authenticate, authorize, AuthRequest } from '../../core/middleware/auth.middleware';
import { ApiResponse } from '../../core/utils/response';
import { parsePaginationParams } from '../../core/utils/pagination';
import mongoose from 'mongoose';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all vendors
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const { status, category } = req.query;
        const filter: Record<string, string> = {};
        if (status) filter.status = status as string;
        if (category) filter.category = category as string;

        const { page, limit, sort } = parsePaginationParams(req.query);
        const skip = (page! - 1) * limit!;

        const [data, total] = await Promise.all([
            Vendor.find(filter)
                .select('-__v')
                .sort(sort)
                .skip(skip)
                .limit(limit!)
                .lean(),
            Vendor.countDocuments(filter)
        ]);

        return ApiResponse.paginated(res, data, total, page!, limit!);
    } catch (error) {
        return ApiResponse.error(res, 'Error fetching vendors', error instanceof Error ? error.message : 'Unknown error');
    }
});

// Get vendor by ID
router.get('/:id', param('id').isMongoId(), async (req: AuthRequest, res: Response) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id!)) {
            return ApiResponse.badRequest(res, 'Invalid vendor ID');
        }

        const vendor = await Vendor.findById(req.params.id!).select('-__v').lean();
        if (!vendor) {
            return ApiResponse.notFound(res, 'Vendor not found');
        }

        return ApiResponse.success(res, vendor);
    } catch (error) {
        return ApiResponse.error(res, 'Error fetching vendor', error instanceof Error ? error.message : 'Unknown error');
    }
});

// Create vendor (admin/manager)
router.post('/',
    authorize('admin', 'manager'),
    [
        body('name').trim().notEmpty().withMessage('Vendor name is required'),
        body('email').optional().isEmail().withMessage('Invalid email address')
    ],
    async (req: AuthRequest, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return ApiResponse.badRequest(res, 'Validation failed', errors.array());
            }

            const vendor = new Vendor(req.body);
            await vendor.save();

            return ApiResponse.created(res, vendor, 'Vendor created successfully');
        } catch (error) {
            return ApiResponse.error(res, 'Error creating vendor', error instanceof Error ? error.message : 'Unknown error', 400);
        }
    }
);

// Update vendor (admin/manager)
router.put('/:id',
    authorize('admin', 'manager'),
    [
        param('id').isMongoId(),
        body('name').optional().trim().notEmpty(),
        body('email').optional().isEmail()
    ],
    async (req: AuthRequest, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return ApiResponse.badRequest(res, 'Validation failed', errors.array());
            }

            const vendor = await Vendor.findByIdAndUpdate(req.params.id!, req.body, { new: true, runValidators: true });
            if (!vendor) {
                return ApiResponse.notFound(res, 'Vendor not found');
            }

            return ApiResponse.success(res, vendor, 'Vendor updated successfully');
        } catch (error) {
            return ApiResponse.error(res, 'Error updating vendor', error instanceof Error ? error.message : 'Unknown error', 400);
        }
    }
);

// Delete vendor (admin only)
router.delete('/:id',
    authorize('admin'),
    param('id').isMongoId(),
    async (req: AuthRequest, res: Response) => {
        try {
            const vendor = await Vendor.findByIdAndDelete(req.params.id!);
            if (!vendor) {
                return ApiResponse.notFound(res, 'Vendor not found');
            }

            return ApiResponse.deleted(res, 'Vendor deleted successfully');
        } catch (error) {
            return ApiResponse.error(res, 'Error deleting vendor', error instanceof Error ? error.message : 'Unknown error');
        }
    }
);

export default router;
