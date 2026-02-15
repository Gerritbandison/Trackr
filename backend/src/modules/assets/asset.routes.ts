import { Router, Response, NextFunction } from 'express';
import { assetService } from './asset.service';
import { authenticate, authorize, AuthRequest } from '../../core/middleware/auth.middleware';
import { validate, validateParams, validateQuery } from '../../core/middleware/validate.middleware';
import { ApiResponse } from '../../core/utils/response';
import { getPaginationParams } from '../../core/utils/pagination';
import {
    createAssetSchema,
    updateAssetSchema,
    assetQuerySchema,
    assetIdParamSchema,
    userIdParamSchema,
    locationIdParamSchema,
    bulkCreateAssetSchema,
    bulkUpdateAssetSchema,
    bulkArchiveAssetSchema,
    assignAssetSchema,
    returnAssetSchema,
    transferAssetSchema,
    importCsvSchema,
    expiringWarrantiesQuerySchema,
    qrCodeQuerySchema
} from '../../core/schemas/asset.schemas';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// Static routes (must come before :id routes)
// ============================================

// Get asset statistics - accessible by all authenticated users
router.get('/statistics', async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const stats = await assetService.getAssetStatistics();
        ApiResponse.success(res, stats);
    } catch (error) {
        next(error);
    }
});

// Get expiring warranties - accessible by all authenticated users
router.get('/warranties/expiring', validateQuery(expiringWarrantiesQuerySchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
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

// Export assets to CSV - accessible by all authenticated users
router.get('/export/csv', validateQuery(assetQuerySchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const filter = {
            ...(req.query.status && { status: req.query.status as string }),
            ...(req.query.category && { category: req.query.category as string }),
            ...(req.query.assignedTo && { assignedTo: req.query.assignedTo as string }),
            ...(req.query.includeArchived === 'true' && { isArchived: undefined })
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
router.post('/import/csv', authorize('admin', 'manager'), validate(importCsvSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
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

// ============================================
// Bulk Operations
// ============================================

// Bulk create assets - requires admin or manager role
router.post('/bulk', authorize('admin', 'manager'), validate(bulkCreateAssetSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const result = await assetService.bulkCreate(req.body.assets);

        if (result.failed > 0) {
            ApiResponse.success(res, result, `Created ${result.success} assets with ${result.failed} errors`);
        } else {
            ApiResponse.created(res, result, `Successfully created ${result.success} assets`);
        }
    } catch (error) {
        next(error);
    }
});

// Bulk update assets - requires admin or manager role
router.patch('/bulk', authorize('admin', 'manager'), validate(bulkUpdateAssetSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const result = await assetService.bulkUpdate(req.body.updates);

        if (result.failed > 0) {
            ApiResponse.success(res, result, `Updated ${result.success} assets with ${result.failed} errors`);
        } else {
            ApiResponse.success(res, result, `Successfully updated ${result.success} assets`);
        }
    } catch (error) {
        next(error);
    }
});

// Bulk archive assets - requires admin or manager role
router.post('/bulk/archive', authorize('admin', 'manager'), validate(bulkArchiveAssetSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) {
            ApiResponse.unauthorized(res, 'Authentication required');
            return;
        }

        const result = await assetService.bulkArchive(req.body.ids, req.user.id, req.body.reason);

        if (result.failed > 0) {
            ApiResponse.success(res, result, `Archived ${result.success} assets with ${result.failed} errors`);
        } else {
            ApiResponse.success(res, result, `Successfully archived ${result.success} assets`);
        }
    } catch (error) {
        next(error);
    }
});

// ============================================
// User and Location based queries
// ============================================

// Get assets for a specific user - accessible by all authenticated users
router.get('/user/:userId', validateParams(userIdParamSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const assets = await assetService.getUserAssets(req.params.userId!);
        ApiResponse.success(res, assets);
    } catch (error) {
        next(error);
    }
});

// Get assets by location - accessible by all authenticated users
router.get('/location/:locationId', validateParams(locationIdParamSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const assets = await assetService.getAssetsByLocation(req.params.locationId!);
        ApiResponse.success(res, assets);
    } catch (error) {
        next(error);
    }
});

// ============================================
// Main CRUD Operations
// ============================================

// Get all assets with pagination - accessible by all authenticated users
router.get('/', validateQuery(assetQuerySchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { page, limit } = getPaginationParams(req.query);
        const sort = req.query.sort as string || '-createdAt';
        const filter: Record<string, any> = {};

        if (req.query.status) filter.status = req.query.status as string;
        if (req.query.category) filter.category = req.query.category as string;
        if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo as string;
        if (req.query.location) filter.location = req.query.location as string;
        if (req.query.condition) filter.condition = req.query.condition as string;
        if (req.query.includeArchived === 'true') filter.isArchived = undefined;

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

// Create asset - requires admin or manager role
router.post('/', authorize('admin', 'manager'), validate(createAssetSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const asset = await assetService.createAsset(req.body);
        ApiResponse.created(res, asset, 'Asset created successfully');
    } catch (error) {
        next(error);
    }
});

// ============================================
// Single Asset Operations (by ID)
// ============================================

// Get asset by ID - accessible by all authenticated users
router.get('/:id', validateParams(assetIdParamSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const includeArchived = req.query.includeArchived === 'true';
        const asset = await assetService.getAssetById(req.params.id!, includeArchived);
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
router.get('/:id/depreciation', validateParams(assetIdParamSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
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

// Get QR code data for an asset - accessible by all authenticated users
router.get('/:id/qr', validateParams(assetIdParamSchema), validateQuery(qrCodeQuerySchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Get base URL from request or environment
        const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;
        const qrData = await assetService.generateQRCodeData(req.params.id!, baseUrl);
        
        const format = req.query.format as string || 'json';
        
        if (format === 'url') {
            ApiResponse.success(res, { url: qrData.url });
        } else if (format === 'full') {
            ApiResponse.success(res, qrData);
        } else {
            // Default JSON format - minimal data for QR encoding
            ApiResponse.success(res, {
                id: qrData.assetId,
                tag: qrData.assetTag,
                sn: qrData.serialNumber,
                url: qrData.url
            });
        }
    } catch (error) {
        next(error);
    }
});

// Update asset - requires admin or manager role
router.put('/:id', authorize('admin', 'manager'), validateParams(assetIdParamSchema), validate(updateAssetSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
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

// Archive (soft delete) asset - requires admin or manager role
router.post('/:id/archive', authorize('admin', 'manager'), validateParams(assetIdParamSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) {
            ApiResponse.unauthorized(res, 'Authentication required');
            return;
        }

        const asset = await assetService.archiveAsset(req.params.id!, req.user.id, req.body.reason);
        ApiResponse.success(res, asset, 'Asset archived successfully');
    } catch (error) {
        next(error);
    }
});

// Restore archived asset - requires admin or manager role
router.post('/:id/restore', authorize('admin', 'manager'), validateParams(assetIdParamSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const asset = await assetService.restoreAsset(req.params.id!);
        ApiResponse.success(res, asset, 'Asset restored successfully');
    } catch (error) {
        next(error);
    }
});

// Hard delete asset - requires admin role only
router.delete('/:id', authorize('admin'), validateParams(assetIdParamSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
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

// ============================================
// Assignment Operations
// ============================================

// Assign asset to user - requires admin or manager role
router.post('/:id/assign', authorize('admin', 'manager'), validateParams(assetIdParamSchema), validate(assignAssetSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) {
            ApiResponse.unauthorized(res, 'Authentication required');
            return;
        }

        const asset = await assetService.assignAsset(req.params.id!, req.body.userId, req.user.id, req.body.notes);
        ApiResponse.success(res, asset, 'Asset assigned successfully');
    } catch (error) {
        next(error);
    }
});

// Return asset from user - requires admin or manager role
router.post('/:id/return', authorize('admin', 'manager'), validateParams(assetIdParamSchema), validate(returnAssetSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) {
            ApiResponse.unauthorized(res, 'Authentication required');
            return;
        }

        const asset = await assetService.returnAsset(req.params.id!, req.user.id, req.body.notes);
        ApiResponse.success(res, asset, 'Asset returned successfully');
    } catch (error) {
        next(error);
    }
});

// Get asset assignment history - accessible by all authenticated users
router.get('/:id/assignment-history', validateParams(assetIdParamSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const history = await assetService.getAssetAssignmentHistory(req.params.id!);
        ApiResponse.success(res, history);
    } catch (error) {
        next(error);
    }
});

// ============================================
// Location Operations
// ============================================

// Transfer asset to new location - requires admin or manager role
router.post('/:id/transfer', authorize('admin', 'manager'), validateParams(assetIdParamSchema), validate(transferAssetSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) {
            ApiResponse.unauthorized(res, 'Authentication required');
            return;
        }

        const asset = await assetService.transferAsset(req.params.id!, req.body.locationId, req.user.id, req.body.reason);
        ApiResponse.success(res, asset, 'Asset transferred successfully');
    } catch (error) {
        next(error);
    }
});

// Get asset location history - accessible by all authenticated users
router.get('/:id/location-history', validateParams(assetIdParamSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const history = await assetService.getAssetLocationHistory(req.params.id!);
        ApiResponse.success(res, history);
    } catch (error) {
        next(error);
    }
});

export default router;
