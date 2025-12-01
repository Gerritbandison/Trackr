import { Router, Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { assetService } from './asset.service';
import { authenticate, authorize } from '../../core/middleware/auth.middleware';
import { ApiResponse } from '../../core/utils/response';
import { parsePaginationParams } from '../../core/utils/pagination';

const router = Router();

// Validation rules
const createAssetValidation = [
    body('assetTag').trim().notEmpty().withMessage('Asset tag is required'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('status').isIn(['available', 'in-use', 'maintenance', 'retired']).withMessage('Invalid status'),
    body('purchasePrice').optional().isNumeric().withMessage('Purchase price must be a number'),
    body('purchaseDate').optional().isISO8601().withMessage('Invalid purchase date'),
];

const updateAssetValidation = [
    param('id').isMongoId().withMessage('Invalid asset ID'),
    body('assetTag').optional().trim().notEmpty().withMessage('Asset tag cannot be empty'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('status').optional().isIn(['available', 'in-use', 'maintenance', 'retired']).withMessage('Invalid status'),
];

const idValidation = [
    param('id').isMongoId().withMessage('Invalid asset ID'),
];

// All routes require authentication
router.use(authenticate);

// Get all assets with pagination - accessible by all authenticated users
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit, sort } = parsePaginationParams(req.query);
        const filter = {
            ...(req.query.status && { status: req.query.status as string }),
            ...(req.query.category && { category: req.query.category as string }),
            ...(req.query.assignedTo && { assignedTo: req.query.assignedTo as string })
        };

        const result = await assetService.getAssets(filter, { page, limit, sort });

        ApiResponse.paginated(
            res,
            result.data,
            result.total,
            result.page,
            result.limit
        );
    } catch (error) {
        next(error);
    }
});

// Get asset by ID - accessible by all authenticated users
router.get('/:id', idValidation, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const asset = await assetService.getAssetById(req.params.id!);
        if (!asset) {
            ApiResponse.notFound(res, 'Asset not found');
            return;
        }

        ApiResponse.success(res, asset);
    } catch (error) {
        next(error);
    }
});

// Get asset depreciation - accessible by all authenticated users
router.get('/:id/depreciation', idValidation, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const depreciation = await assetService.calculateDepreciation(req.params.id!);
        if (!depreciation) {
            ApiResponse.notFound(res, 'Asset not found');
            return;
        }

        ApiResponse.success(res, depreciation);
    } catch (error) {
        next(error);
    }
});

// Create asset - requires admin or manager role
router.post('/', authorize('admin', 'manager'), createAssetValidation, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const asset = await assetService.createAsset(req.body);
        ApiResponse.created(res, asset, 'Asset created successfully');
    } catch (error) {
        next(error);
    }
});

// Update asset - requires admin or manager role
router.put('/:id', authorize('admin', 'manager'), updateAssetValidation, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const asset = await assetService.updateAsset(req.params.id!, req.body);
        if (!asset) {
            ApiResponse.notFound(res, 'Asset not found');
            return;
        }

        ApiResponse.success(res, asset, 'Asset updated successfully');
    } catch (error) {
        next(error);
    }
});

// Delete asset - requires admin role only
router.delete('/:id', authorize('admin'), idValidation, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const asset = await assetService.deleteAsset(req.params.id!);
        if (!asset) {
            ApiResponse.notFound(res, 'Asset not found');
            return;
        }

        ApiResponse.deleted(res, 'Asset deleted successfully');
    } catch (error) {
        next(error);
    }
});

export default router;
