import { Router } from 'express';
import {
    getLocations,
    getLocationTree,
    getLocationById,
    createLocation,
    updateLocation,
    deleteLocation,
    permanentDeleteLocation,
    activateLocation,
    moveLocation,
    getChildLocations,
    getDescendants,
    getLocationAssets,
    getLocationPath,
    getLocationStats,
    updateCapacity,
    findWithAvailableCapacity,
    bulkUpdateLocations
} from './location.controller';
import { authenticate, authorize } from '../../core/middleware/auth.middleware';
import { validate, validateQuery, validateParams } from '../../core/middleware/validate.middleware';
import {
    createLocationSchema,
    updateLocationSchema,
    locationQuerySchema,
    locationIdParamSchema,
    moveLocationSchema,
    updateCapacitySchema,
    bulkUpdateLocationsSchema
} from '../../core/schemas/location.schemas';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// List & Search Routes
// ============================================

// Get all locations (tree or flat list)
router.get('/', validateQuery(locationQuerySchema), getLocations);

// Get location tree (hierarchical view)
router.get('/tree', getLocationTree);

// Find locations with available capacity
router.get('/available-capacity', findWithAvailableCapacity);

// ============================================
// Single Location Routes
// ============================================

// Get location by ID
router.get('/:id', validateParams(locationIdParamSchema), getLocationById);

// Get child locations
router.get('/:id/children', validateParams(locationIdParamSchema), getChildLocations);

// Get all descendants
router.get('/:id/descendants', validateParams(locationIdParamSchema), getDescendants);

// Get location assets
router.get('/:id/assets', validateParams(locationIdParamSchema), getLocationAssets);

// Get location path (hierarchy)
router.get('/:id/path', validateParams(locationIdParamSchema), getLocationPath);

// Get location statistics
router.get('/:id/stats', validateParams(locationIdParamSchema), getLocationStats);

// ============================================
// Create, Update, Delete Routes
// ============================================

// Create location - requires admin or manager role
router.post('/',
    authorize('admin', 'manager'),
    validate(createLocationSchema),
    createLocation
);

// Update location - requires admin or manager role
router.put('/:id',
    authorize('admin', 'manager'),
    validateParams(locationIdParamSchema),
    validate(updateLocationSchema),
    updateLocation
);

// Move location to new parent
router.post('/:id/move',
    authorize('admin', 'manager'),
    validateParams(locationIdParamSchema),
    validate(moveLocationSchema),
    moveLocation
);

// Update capacity
router.put('/:id/capacity',
    authorize('admin', 'manager'),
    validateParams(locationIdParamSchema),
    validate(updateCapacitySchema),
    updateCapacity
);

// Deactivate location (soft delete)
router.delete('/:id',
    authorize('admin'),
    validateParams(locationIdParamSchema),
    deleteLocation
);

// Activate location
router.post('/:id/activate',
    authorize('admin'),
    validateParams(locationIdParamSchema),
    activateLocation
);

// Permanently delete location
router.delete('/:id/permanent',
    authorize('admin'),
    validateParams(locationIdParamSchema),
    permanentDeleteLocation
);

// ============================================
// Bulk Operations
// ============================================

// Bulk update locations
router.patch('/bulk',
    authorize('admin'),
    validate(bulkUpdateLocationsSchema),
    bulkUpdateLocations
);

export default router;
