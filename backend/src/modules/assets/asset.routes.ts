import { Router, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { assetService } from './asset.service';
import { authenticate, authorize, AuthRequest } from '../../core/middleware/auth.middleware';
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
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
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
router.get('/:id', idValidation, async (req: AuthRequest, res: Response, next: NextFunction) => {
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
router.get('/:id/depreciation', idValidation, async (req: AuthRequest, res: Response, next: NextFunction) => {
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
router.post('/', authorize('admin', 'manager'), createAssetValidation, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const asset = await assetService.createAsset(req.body);
        ApiResponse.created(res, asset, 'Asset created successfully');
    } catch (error) {
        next(error);
    }
});

// Update asset - requires admin or manager role
router.put('/:id', authorize('admin', 'manager'), updateAssetValidation, async (req: AuthRequest, res: Response, next: NextFunction) => {
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
router.delete('/:id', authorize('admin'), idValidation, async (req: AuthRequest, res: Response, next: NextFunction) => {
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

// Assign asset to user - requires admin or manager role
router.post('/:id/assign', authorize('admin', 'manager'), idValidation, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { userId, notes } = req.body;

        if (!userId) {
            ApiResponse.badRequest(res, 'User ID is required');
            return;
        }

        if (!req.user?.id) {
            ApiResponse.unauthorized(res, 'Authentication required');
            return;
        }

        const asset = await assetService.assignAsset(req.params.id!, userId, req.user.id, notes);
        ApiResponse.success(res, asset, 'Asset assigned successfully');
    } catch (error) {
        next(error);
    }
});

// Return asset from user - requires admin or manager role
router.post('/:id/return', authorize('admin', 'manager'), idValidation, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { notes } = req.body;

        if (!req.user?.id) {
            ApiResponse.unauthorized(res, 'Authentication required');
            return;
        }

        const asset = await assetService.returnAsset(req.params.id!, req.user.id, notes);
        ApiResponse.success(res, asset, 'Asset returned successfully');
    } catch (error) {
        next(error);
    }
});

// Get asset assignment history - accessible by all authenticated users
router.get('/:id/assignment-history', idValidation, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const history = await assetService.getAssetAssignmentHistory(req.params.id!);
        ApiResponse.success(res, history);
    } catch (error) {
        next(error);
    }
});

// Get expiring warranties - accessible by all authenticated users
router.get('/warranties/expiring', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const days = req.query.days ? parseInt(req.query.days as string) : 30;
        const assets = await assetService.getExpiringWarranties(days);
        ApiResponse.success(res, assets);
    } catch (error) {
        next(error);
    }
});

// Get expired warranties - accessible by all authenticated users
router.get('/warranties/expired', async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const assets = await assetService.getExpiredWarranties();
        ApiResponse.success(res, assets);
    } catch (error) {
        next(error);
    }
});

// Get assets for a specific user - accessible by all authenticated users
router.get('/user/:userId', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const assets = await assetService.getUserAssets(req.params.userId!);
        ApiResponse.success(res, assets);
    } catch (error) {
        next(error);
    }
});

// Export assets to CSV - accessible by all authenticated users
router.get('/export/csv', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const filter = {
            ...(req.query.status && { status: req.query.status as string }),
            ...(req.query.category && { category: req.query.category as string }),
            ...(req.query.assignedTo && { assignedTo: req.query.assignedTo as string })
        };

        const csv = await assetService.exportToCSV(filter);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=assets-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (error) {
        next(error);
    }
});

// Bulk import assets from CSV - requires admin or manager role
router.post('/import/csv', authorize('admin', 'manager'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.body.csvData) {
            ApiResponse.badRequest(res, 'CSV data is required');
            return;
        }

        const result = await assetService.bulkImport(req.body.csvData);

        if (result.failed > 0) {
            ApiResponse.success(res, result, `Imported ${result.success} assets with ${result.failed} errors`);
        } else {
            ApiResponse.success(res, result, `Successfully imported ${result.success} assets`);
        }
    } catch (error) {
        next(error);
    }
});

export default router;
