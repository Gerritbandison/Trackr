import { Router } from 'express';
import { body, param } from 'express-validator';
import {
    getLicenses,
    getLicenseById,
    createLicense,
    updateLicense,
    deleteLicense,
    assignLicense,
    unassignLicense,
    getExpiringLicenses,
    getComplianceReport,
    getUtilizationStats,
    getLicenseAssignmentHistory,
    getUserLicenses
} from './license.controller';
import { authenticate, authorize } from '../../core/middleware/auth.middleware';

const router = Router();

// Validation rules
const createLicenseValidation = [
    body('name').trim().notEmpty().withMessage('License name is required'),
    body('vendor').trim().notEmpty().withMessage('Vendor is required'),
    body('type').isIn(['perpetual', 'subscription', 'trial']).withMessage('Invalid license type'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('totalSeats').isInt({ min: 1 }).withMessage('Total seats must be at least 1'),
    body('purchaseDate').isISO8601().withMessage('Invalid purchase date'),
    body('purchaseCost').isNumeric().withMessage('Purchase cost must be a number'),
    body('expirationDate').optional().isISO8601().withMessage('Invalid expiration date'),
    body('annualCost').optional().isNumeric().withMessage('Annual cost must be a number')
];

const updateLicenseValidation = [
    param('id').isMongoId().withMessage('Invalid license ID'),
    body('name').optional().trim().notEmpty().withMessage('License name cannot be empty'),
    body('vendor').optional().trim().notEmpty().withMessage('Vendor cannot be empty'),
    body('type').optional().isIn(['perpetual', 'subscription', 'trial']).withMessage('Invalid license type'),
    body('totalSeats').optional().isInt({ min: 1 }).withMessage('Total seats must be at least 1'),
    body('purchaseCost').optional().isNumeric().withMessage('Purchase cost must be a number')
];

const idValidation = [
    param('id').isMongoId().withMessage('Invalid license ID')
];

// All routes require authentication
router.use(authenticate);

// Get all licenses - accessible by all authenticated users
router.get('/', getLicenses);

// Get compliance report - accessible by admin and manager
router.get('/reports/compliance', authorize('admin', 'manager'), getComplianceReport);

// Get utilization stats - accessible by admin and manager
router.get('/reports/utilization', authorize('admin', 'manager'), getUtilizationStats);

// Get expiring licenses - accessible by all authenticated users
router.get('/expiring', getExpiringLicenses);

// Get license by ID - accessible by all authenticated users
router.get('/:id', idValidation, getLicenseById);

// Create license - requires admin or manager role
router.post('/', authorize('admin', 'manager'), createLicenseValidation, createLicense);

// Update license - requires admin or manager role
router.put('/:id', authorize('admin', 'manager'), updateLicenseValidation, updateLicense);

// Delete license - requires admin role only
router.delete('/:id', authorize('admin'), idValidation, deleteLicense);

// Assign license to user - requires admin or manager role
router.post('/:id/assign', authorize('admin', 'manager'), idValidation, assignLicense);

// Unassign license from user - requires admin or manager role
router.post('/:id/unassign', authorize('admin', 'manager'), idValidation, unassignLicense);

// Get license assignment history - accessible by all authenticated users
router.get('/:id/assignment-history', idValidation, getLicenseAssignmentHistory);

// Get licenses for a specific user - accessible by all authenticated users
router.get('/user/:userId', [param('userId').isMongoId().withMessage('Invalid user ID')], getUserLicenses);

export default router;
