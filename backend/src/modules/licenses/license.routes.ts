import { Router } from 'express';
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
    getUserLicenses,
    exportToCSV,
    bulkImport,
    // New controllers
    archiveLicense,
    restoreLicense,
    bulkCreateLicenses,
    bulkUpdateLicenses,
    bulkArchiveLicenses,
    allocateSeat,
    deallocateSeat,
    getUpcomingRenewals,
    getOptimizationRecommendations,
    getStatistics
} from './license.controller';
import { authenticate, authorize } from '../../core/middleware/auth.middleware';
import { validate, validateQuery, validateParams } from '../../core/middleware/validate.middleware';
import {
    createLicenseSchema,
    updateLicenseSchema,
    licenseQuerySchema,
    licenseIdParamSchema,
    userIdParamSchema,
    bulkCreateLicenseSchema,
    bulkUpdateLicenseSchema,
    bulkArchiveLicenseSchema,
    allocateSeatSchema,
    deallocateSeatSchema,
    assignLicenseSchema,
    unassignLicenseSchema,
    archiveLicenseSchema,
    renewalQuerySchema,
    optimizationQuerySchema,
    statisticsQuerySchema,
    expiringLicensesQuerySchema,
    importCsvSchema
} from '../../core/schemas/license.schemas';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// Statistics & Reports (placed before :id routes)
// ============================================

// GET /api/v1/licenses/statistics - License statistics
router.get(
    '/statistics',
    authorize('admin', 'manager'),
    validateQuery(statisticsQuerySchema),
    getStatistics
);

// GET /api/v1/licenses/compliance - Compliance report
router.get(
    '/compliance',
    authorize('admin', 'manager'),
    getComplianceReport
);

// GET /api/v1/licenses/renewals - Upcoming renewals
router.get(
    '/renewals',
    authorize('admin', 'manager'),
    validateQuery(renewalQuerySchema),
    getUpcomingRenewals
);

// GET /api/v1/licenses/optimization - Cost optimization suggestions
router.get(
    '/optimization',
    authorize('admin', 'manager'),
    validateQuery(optimizationQuerySchema),
    getOptimizationRecommendations
);

// GET /api/v1/licenses/expiring - Expiring licenses
router.get(
    '/expiring',
    validateQuery(expiringLicensesQuerySchema),
    getExpiringLicenses
);

// GET /api/v1/licenses/reports/compliance - Legacy compliance report
router.get(
    '/reports/compliance',
    authorize('admin', 'manager'),
    getComplianceReport
);

// GET /api/v1/licenses/reports/utilization - Utilization stats
router.get(
    '/reports/utilization',
    authorize('admin', 'manager'),
    getUtilizationStats
);

// ============================================
// Bulk Operations
// ============================================

// POST /api/v1/licenses/bulk - Bulk create licenses
router.post(
    '/bulk',
    authorize('admin', 'manager'),
    validate(bulkCreateLicenseSchema),
    bulkCreateLicenses
);

// PATCH /api/v1/licenses/bulk - Bulk update licenses
router.patch(
    '/bulk',
    authorize('admin', 'manager'),
    validate(bulkUpdateLicenseSchema),
    bulkUpdateLicenses
);

// POST /api/v1/licenses/bulk/archive - Bulk archive licenses
router.post(
    '/bulk/archive',
    authorize('admin', 'manager'),
    validate(bulkArchiveLicenseSchema),
    bulkArchiveLicenses
);

// ============================================
// Import/Export
// ============================================

// GET /api/v1/licenses/export/csv - Export licenses to CSV
router.get(
    '/export/csv',
    validateQuery(licenseQuerySchema),
    exportToCSV
);

// POST /api/v1/licenses/import/csv - Bulk import licenses from CSV
router.post(
    '/import/csv',
    authorize('admin', 'manager'),
    validate(importCsvSchema),
    bulkImport
);

// ============================================
// User Licenses
// ============================================

// GET /api/v1/licenses/user/:userId - Get licenses for a specific user
router.get(
    '/user/:userId',
    validateParams(userIdParamSchema),
    getUserLicenses
);

// ============================================
// CRUD Operations
// ============================================

// GET /api/v1/licenses - Get all licenses
router.get(
    '/',
    validateQuery(licenseQuerySchema),
    getLicenses
);

// POST /api/v1/licenses - Create license
router.post(
    '/',
    authorize('admin', 'manager'),
    validate(createLicenseSchema),
    createLicense
);

// GET /api/v1/licenses/:id - Get license by ID
router.get(
    '/:id',
    validateParams(licenseIdParamSchema),
    getLicenseById
);

// PUT /api/v1/licenses/:id - Update license
router.put(
    '/:id',
    authorize('admin', 'manager'),
    validateParams(licenseIdParamSchema),
    validate(updateLicenseSchema),
    updateLicense
);

// PATCH /api/v1/licenses/:id - Update license (partial)
router.patch(
    '/:id',
    authorize('admin', 'manager'),
    validateParams(licenseIdParamSchema),
    validate(updateLicenseSchema),
    updateLicense
);

// DELETE /api/v1/licenses/:id - Hard delete license (admin only)
router.delete(
    '/:id',
    authorize('admin'),
    validateParams(licenseIdParamSchema),
    deleteLicense
);

// ============================================
// Archive/Restore
// ============================================

// POST /api/v1/licenses/:id/archive - Archive single license
router.post(
    '/:id/archive',
    authorize('admin', 'manager'),
    validateParams(licenseIdParamSchema),
    validate(archiveLicenseSchema),
    archiveLicense
);

// POST /api/v1/licenses/:id/restore - Restore archived license
router.post(
    '/:id/restore',
    authorize('admin', 'manager'),
    validateParams(licenseIdParamSchema),
    restoreLicense
);

// ============================================
// Seat Allocation
// ============================================

// POST /api/v1/licenses/:id/allocate - Allocate seat to user
router.post(
    '/:id/allocate',
    authorize('admin', 'manager'),
    validateParams(licenseIdParamSchema),
    validate(allocateSeatSchema),
    allocateSeat
);

// POST /api/v1/licenses/:id/deallocate - Deallocate seat from user
router.post(
    '/:id/deallocate',
    authorize('admin', 'manager'),
    validateParams(licenseIdParamSchema),
    validate(deallocateSeatSchema),
    deallocateSeat
);

// ============================================
// Legacy Assignment Routes (compatibility)
// ============================================

// POST /api/v1/licenses/:id/assign - Assign license to user
router.post(
    '/:id/assign',
    authorize('admin', 'manager'),
    validateParams(licenseIdParamSchema),
    validate(assignLicenseSchema),
    assignLicense
);

// POST /api/v1/licenses/:id/unassign - Unassign license from user
router.post(
    '/:id/unassign',
    authorize('admin', 'manager'),
    validateParams(licenseIdParamSchema),
    validate(unassignLicenseSchema),
    unassignLicense
);

// ============================================
// Assignment History
// ============================================

// GET /api/v1/licenses/:id/assignment-history - Get license assignment history
router.get(
    '/:id/assignment-history',
    validateParams(licenseIdParamSchema),
    getLicenseAssignmentHistory
);

export default router;
