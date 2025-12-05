import { Router } from 'express';
import { body, param } from 'express-validator';
import {
    getLocations,
    getLocationById,
    createLocation,
    updateLocation,
    deleteLocation,
    getChildLocations,
    getLocationAssets,
    getLocationPath,
    getLocationStats
} from './location.controller';
import { authenticate, authorize } from '../../core/middleware/auth.middleware';

const router = Router();

// Validation rules
const createLocationValidation = [
    body('name').trim().notEmpty().withMessage('Location name is required'),
    body('code').trim().notEmpty().withMessage('Location code is required'),
    body('type').isIn(['Building', 'Floor', 'Room', 'Storage', 'Remote', 'Other']).withMessage('Invalid location type'),
    body('parentLocation').optional().isMongoId().withMessage('Invalid parent location ID')
];

const updateLocationValidation = [
    param('id').isMongoId().withMessage('Invalid location ID'),
    body('name').optional().trim().notEmpty().withMessage('Location name cannot be empty'),
    body('code').optional().trim().notEmpty().withMessage('Location code cannot be empty'),
    body('type').optional().isIn(['Building', 'Floor', 'Room', 'Storage', 'Remote', 'Other']).withMessage('Invalid location type')
];

const idValidation = [
    param('id').isMongoId().withMessage('Invalid location ID')
];

// All routes require authentication
router.use(authenticate);

// Get all locations - accessible by all authenticated users
router.get('/', getLocations);

// Get location by ID - accessible by all authenticated users
router.get('/:id', idValidation, getLocationById);

// Get child locations - accessible by all authenticated users
router.get('/:id/children', idValidation, getChildLocations);

// Get location assets - accessible by all authenticated users
router.get('/:id/assets', idValidation, getLocationAssets);

// Get location path (hierarchy) - accessible by all authenticated users
router.get('/:id/path', idValidation, getLocationPath);

// Get location statistics - accessible by all authenticated users
router.get('/:id/stats', idValidation, getLocationStats);

// Create location - requires admin or manager role
router.post('/', authorize('admin', 'manager'), createLocationValidation, createLocation);

// Update location - requires admin or manager role
router.put('/:id', authorize('admin', 'manager'), updateLocationValidation, updateLocation);

// Delete location - requires admin role only
router.delete('/:id', authorize('admin'), idValidation, deleteLocation);

export default router;
