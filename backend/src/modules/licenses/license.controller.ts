import { Response } from 'express';
import { licenseService } from './license.service';
import { AuthRequest } from '../../core/middleware/auth.middleware';
import { ApiResponse } from '../../core/utils/response';
import { parsePaginationParams } from '../../core/utils/pagination';

// ============================================
// CRUD Operations
// ============================================

export const getLicenses = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { 
            vendor, type, status, category, complianceStatus,
            search, includeArchived, expiringWithin, minUtilization, maxUtilization
        } = req.query;

        const filter: Record<string, any> = {};
        if (vendor) filter.vendor = vendor as string;
        if (type) filter.type = type as string;
        if (status) filter.status = status as string;
        if (category) filter.category = category as string;
        if (complianceStatus) filter.complianceStatus = complianceStatus as string;
        if (search) filter.search = search as string;
        if (includeArchived === 'true') filter.isArchived = undefined; // Include all
        if (expiringWithin) filter.expiringWithin = parseInt(expiringWithin as string);
        if (minUtilization) filter.minUtilization = parseFloat(minUtilization as string);
        if (maxUtilization) filter.maxUtilization = parseFloat(maxUtilization as string);

        const { page, limit, sort } = parsePaginationParams(req.query);
        const result = await licenseService.getLicenses(filter, { page, limit, sort });

        ApiResponse.paginated(res, result.data, result.total, result.page, result.limit);
    } catch (error) {
        ApiResponse.error(res, 'Error fetching licenses', error instanceof Error ? error.message : 'Unknown error');
    }
};

export const getLicenseById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const includeSensitive = req.query.includeSensitive === 'true' && 
            (req.user?.role === 'admin' || req.user?.role === 'manager');
        
        const license = await licenseService.getLicenseById(req.params.id!, includeSensitive);

        if (!license) {
            ApiResponse.notFound(res, 'License not found');
            return;
        }

        ApiResponse.success(res, license);
    } catch (error) {
        ApiResponse.error(res, 'Error fetching license', error instanceof Error ? error.message : 'Unknown error');
    }
};

export const createLicense = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const license = await licenseService.createLicense(req.body);
        ApiResponse.created(res, license, 'License created successfully');
    } catch (error) {
        ApiResponse.error(res, 'Error creating license', error instanceof Error ? error.message : 'Unknown error', 400);
    }
};

export const updateLicense = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const license = await licenseService.updateLicense(req.params.id!, req.body);

        if (!license) {
            ApiResponse.notFound(res, 'License not found');
            return;
        }

        ApiResponse.success(res, license, 'License updated successfully');
    } catch (error) {
        ApiResponse.error(res, 'Error updating license', error instanceof Error ? error.message : 'Unknown error', 400);
    }
};

export const deleteLicense = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const license = await licenseService.deleteLicense(req.params.id!);

        if (!license) {
            ApiResponse.notFound(res, 'License not found');
            return;
        }

        ApiResponse.deleted(res, 'License deleted successfully');
    } catch (error) {
        ApiResponse.error(res, 'Error deleting license', error instanceof Error ? error.message : 'Unknown error');
    }
};

// ============================================
// Archive/Restore Operations
// ============================================

export const archiveLicense = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) {
            ApiResponse.unauthorized(res, 'Authentication required');
            return;
        }

        const license = await licenseService.archiveLicense(
            req.params.id!,
            req.user.id,
            req.body.reason
        );

        if (!license) {
            ApiResponse.notFound(res, 'License not found');
            return;
        }

        ApiResponse.success(res, license, 'License archived successfully');
    } catch (error) {
        ApiResponse.error(res, 'Error archiving license', error instanceof Error ? error.message : 'Unknown error', 400);
    }
};

export const restoreLicense = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const license = await licenseService.restoreLicense(req.params.id!);

        if (!license) {
            ApiResponse.notFound(res, 'License not found');
            return;
        }

        ApiResponse.success(res, license, 'License restored successfully');
    } catch (error) {
        ApiResponse.error(res, 'Error restoring license', error instanceof Error ? error.message : 'Unknown error', 400);
    }
};

// ============================================
// Bulk Operations
// ============================================

export const bulkCreateLicenses = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { licenses } = req.body;
        
        if (!licenses || !Array.isArray(licenses) || licenses.length === 0) {
            ApiResponse.badRequest(res, 'Array of licenses is required');
            return;
        }

        const result = await licenseService.bulkCreate(licenses);

        if (result.failed > 0) {
            ApiResponse.success(res, result, `Created ${result.success} licenses with ${result.failed} errors`);
        } else {
            ApiResponse.created(res, result, `Successfully created ${result.success} licenses`);
        }
    } catch (error) {
        ApiResponse.error(res, 'Error bulk creating licenses', error instanceof Error ? error.message : 'Unknown error', 400);
    }
};

export const bulkUpdateLicenses = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { updates } = req.body;
        
        if (!updates || !Array.isArray(updates) || updates.length === 0) {
            ApiResponse.badRequest(res, 'Array of updates is required');
            return;
        }

        const result = await licenseService.bulkUpdate(updates);

        if (result.failed > 0) {
            ApiResponse.success(res, result, `Updated ${result.success} licenses with ${result.failed} errors`);
        } else {
            ApiResponse.success(res, result, `Successfully updated ${result.success} licenses`);
        }
    } catch (error) {
        ApiResponse.error(res, 'Error bulk updating licenses', error instanceof Error ? error.message : 'Unknown error', 400);
    }
};

export const bulkArchiveLicenses = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) {
            ApiResponse.unauthorized(res, 'Authentication required');
            return;
        }

        const { ids, reason } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            ApiResponse.badRequest(res, 'Array of IDs is required');
            return;
        }

        const result = await licenseService.bulkArchive(ids, req.user.id, reason);

        if (result.failed > 0) {
            ApiResponse.success(res, result, `Archived ${result.success} licenses with ${result.failed} errors`);
        } else {
            ApiResponse.success(res, result, `Successfully archived ${result.success} licenses`);
        }
    } catch (error) {
        ApiResponse.error(res, 'Error bulk archiving licenses', error instanceof Error ? error.message : 'Unknown error', 400);
    }
};

// ============================================
// Seat Allocation
// ============================================

export const allocateSeat = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId, reason, notifyUser } = req.body;

        if (!userId) {
            ApiResponse.badRequest(res, 'User ID is required');
            return;
        }

        if (!req.user?.id) {
            ApiResponse.unauthorized(res, 'Authentication required');
            return;
        }

        const license = await licenseService.allocateSeat(req.params.id!, userId, req.user.id, reason);
        
        // TODO: If notifyUser is true, send notification to user
        
        ApiResponse.success(res, license, 'Seat allocated successfully');
    } catch (error) {
        ApiResponse.error(res, 'Error allocating seat', error instanceof Error ? error.message : 'Unknown error', 400);
    }
};

export const deallocateSeat = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId, reason, notifyUser } = req.body;

        if (!userId) {
            ApiResponse.badRequest(res, 'User ID is required');
            return;
        }

        const license = await licenseService.deallocateSeat(req.params.id!, userId, reason);
        
        // TODO: If notifyUser is true, send notification to user
        
        ApiResponse.success(res, license, 'Seat deallocated successfully');
    } catch (error) {
        ApiResponse.error(res, 'Error deallocating seat', error instanceof Error ? error.message : 'Unknown error', 400);
    }
};

// ============================================
// Legacy Assignment (compatibility)
// ============================================

export const assignLicense = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId, reason } = req.body;

        if (!userId) {
            ApiResponse.badRequest(res, 'User ID is required');
            return;
        }

        if (!req.user?.id) {
            ApiResponse.unauthorized(res, 'Authentication required');
            return;
        }

        const license = await licenseService.assignLicense(req.params.id!, userId, req.user.id, reason);
        ApiResponse.success(res, license, 'License assigned successfully');
    } catch (error) {
        ApiResponse.error(res, 'Error assigning license', error instanceof Error ? error.message : 'Unknown error', 400);
    }
};

export const unassignLicense = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId, reason } = req.body;

        if (!userId) {
            ApiResponse.badRequest(res, 'User ID is required');
            return;
        }

        const license = await licenseService.unassignLicense(req.params.id!, userId, reason);
        ApiResponse.success(res, license, 'License unassigned successfully');
    } catch (error) {
        ApiResponse.error(res, 'Error unassigning license', error instanceof Error ? error.message : 'Unknown error', 400);
    }
};

// ============================================
// Compliance & Reports
// ============================================

export const getComplianceReport = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const report = await licenseService.getComplianceReport();
        ApiResponse.success(res, report);
    } catch (error) {
        ApiResponse.error(res, 'Error generating compliance report', error instanceof Error ? error.message : 'Unknown error');
    }
};

export const getUtilizationStats = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const stats = await licenseService.getUtilizationStats();
        ApiResponse.success(res, stats);
    } catch (error) {
        ApiResponse.error(res, 'Error calculating utilization stats', error instanceof Error ? error.message : 'Unknown error');
    }
};

// ============================================
// Renewals
// ============================================

export const getExpiringLicenses = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const days = req.query.days ? parseInt(req.query.days as string) : 30;
        const licenses = await licenseService.getExpiringLicenses(days);

        ApiResponse.success(res, licenses);
    } catch (error) {
        ApiResponse.error(res, 'Error fetching expiring licenses', error instanceof Error ? error.message : 'Unknown error');
    }
};

export const getUpcomingRenewals = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const days = req.query.days ? parseInt(req.query.days as string) : 90;
        const includeAutoRenew = req.query.includeAutoRenew !== 'false';
        
        const renewals = await licenseService.getUpcomingRenewals(days, includeAutoRenew);

        ApiResponse.success(res, {
            count: renewals.length,
            totalEstimatedCost: renewals.reduce((sum, r) => sum + r.estimatedRenewalCost, 0),
            critical: renewals.filter(r => r.urgency === 'critical').length,
            high: renewals.filter(r => r.urgency === 'high').length,
            medium: renewals.filter(r => r.urgency === 'medium').length,
            low: renewals.filter(r => r.urgency === 'low').length,
            renewals
        });
    } catch (error) {
        ApiResponse.error(res, 'Error fetching upcoming renewals', error instanceof Error ? error.message : 'Unknown error');
    }
};

// ============================================
// Optimization
// ============================================

export const getOptimizationRecommendations = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const threshold = req.query.underutilizationThreshold 
            ? parseInt(req.query.underutilizationThreshold as string) 
            : 30;
        
        const recommendations = await licenseService.getOptimizationRecommendations(threshold);

        ApiResponse.success(res, recommendations);
    } catch (error) {
        ApiResponse.error(res, 'Error generating optimization recommendations', error instanceof Error ? error.message : 'Unknown error');
    }
};

// ============================================
// Statistics
// ============================================

export const getStatistics = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const includeArchived = req.query.includeArchived === 'true';
        const stats = await licenseService.getStatistics(includeArchived);

        ApiResponse.success(res, stats);
    } catch (error) {
        ApiResponse.error(res, 'Error fetching statistics', error instanceof Error ? error.message : 'Unknown error');
    }
};

// ============================================
// History & User Queries
// ============================================

export const getLicenseAssignmentHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const history = await licenseService.getLicenseAssignmentHistory(req.params.id!);
        ApiResponse.success(res, history);
    } catch (error) {
        ApiResponse.error(res, 'Error fetching assignment history', error instanceof Error ? error.message : 'Unknown error');
    }
};

export const getUserLicenses = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const licenses = await licenseService.getUserLicenses(req.params.userId!);
        ApiResponse.success(res, licenses);
    } catch (error) {
        ApiResponse.error(res, 'Error fetching user licenses', error instanceof Error ? error.message : 'Unknown error');
    }
};

// ============================================
// Import/Export
// ============================================

export const exportToCSV = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { vendor, type, status, category, complianceStatus, includeArchived } = req.query;

        const filter: Record<string, any> = {};
        if (vendor) filter.vendor = vendor as string;
        if (type) filter.type = type as string;
        if (status) filter.status = status as string;
        if (category) filter.category = category as string;
        if (complianceStatus) filter.complianceStatus = complianceStatus as string;
        if (includeArchived === 'true') filter.isArchived = undefined;

        const csv = await licenseService.exportToCSV(filter);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=licenses-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (error) {
        ApiResponse.error(res, 'Error exporting licenses', error instanceof Error ? error.message : 'Unknown error');
    }
};

export const bulkImport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.body.csvData) {
            ApiResponse.badRequest(res, 'CSV data is required');
            return;
        }

        const result = await licenseService.bulkImport(req.body.csvData);

        if (result.failed > 0) {
            ApiResponse.success(res, result, `Imported ${result.success} licenses with ${result.failed} errors`);
        } else {
            ApiResponse.success(res, result, `Successfully imported ${result.success} licenses`);
        }
    } catch (error) {
        ApiResponse.error(res, 'Error importing licenses', error instanceof Error ? error.message : 'Unknown error', 400);
    }
};
