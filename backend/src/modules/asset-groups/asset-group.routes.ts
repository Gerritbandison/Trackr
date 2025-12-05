import { Router } from 'express';
import { body, param } from 'express-validator';
import { getAll, getById, create, update, deleteGroup, getLowStockAlerts, addAssets, removeAssets } from './asset-group.controller';
import { authenticate, authorize } from '../../core/middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all asset groups
router.get('/', getAll);

// Get low stock alerts
router.get('/alerts/low-stock', getLowStockAlerts);

// Get asset group by ID
router.get('/:id', [
    param('id').isMongoId().withMessage('Invalid asset group ID')
], getById);

// Create asset group (admin/manager only)
router.post('/', authorize('admin', 'manager'), [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('currentStock').optional().isNumeric().withMessage('Current stock must be a number'),
    body('minStock').optional().isNumeric().withMessage('Minimum stock must be a number')
], create);

// Update asset group (admin/manager only)
router.put('/:id', authorize('admin', 'manager'), [
    param('id').isMongoId().withMessage('Invalid asset group ID')
], update);

// Delete asset group (admin only)
router.delete('/:id', authorize('admin'), [
    param('id').isMongoId().withMessage('Invalid asset group ID')
], deleteGroup);

// Add assets to group (admin/manager only)
router.post('/:id/assets', authorize('admin', 'manager'), [
    param('id').isMongoId().withMessage('Invalid asset group ID'),
    body('assetIds').isArray().withMessage('Asset IDs must be an array')
], addAssets);

// Remove assets from group (admin/manager only)
router.delete('/:id/assets', authorize('admin', 'manager'), [
    param('id').isMongoId().withMessage('Invalid asset group ID'),
    body('assetIds').isArray().withMessage('Asset IDs must be an array')
], removeAssets);

export default router;
