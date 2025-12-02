import { Response } from 'express';
import { licenseService } from './license.service';
import { AuthRequest } from '../../core/middleware/auth.middleware';
import { validationResult } from 'express-validator';
import { ApiResponse } from '../../core/utils/response';
import { parsePaginationParams } from '../../core/utils/pagination';

export const getLicenses = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { vendor, type, status, category, complianceStatus } = req.query;

        const filter: Record<string, string> = {};
        if (vendor) filter.vendor = vendor as string;
        if (type) filter.type = type as string;
        if (status) filter.status = status as string;
        if (category) filter.category = category as string;
        if (complianceStatus) filter.complianceStatus = complianceStatus as string;

        const { page, limit, sort } = parsePaginationParams(req.query);
        const result = await licenseService.getLicenses(filter, { page, limit, sort });

        ApiResponse.paginated(
            res,
            result.data,
            result.total,
            result.page,
            result.limit
        );
    } catch (error) {
        ApiResponse.error(res, 'Error fetching licenses', error instanceof Error ? error.message : 'Unknown error');
    }
};

export const getLicenseById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const license = await licenseService.getLicenseById(req.params.id!);

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
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            ApiResponse.badRequest(res, 'Validation failed', errors.array());
            return;
        }

        const license = await licenseService.createLicense(req.body);
        ApiResponse.created(res, license, 'License created successfully');
    } catch (error) {
        ApiResponse.error(res, 'Error creating license', error instanceof Error ? error.message : 'Unknown error', 400);
    }
};

export const updateLicense = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            ApiResponse.badRequest(res, 'Validation failed', errors.array());
            return;
        }

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

export const getExpiringLicenses = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const days = req.query.days ? parseInt(req.query.days as string) : 30;
        const licenses = await licenseService.getExpiringLicenses(days);

        ApiResponse.success(res, licenses);
    } catch (error) {
        ApiResponse.error(res, 'Error fetching expiring licenses', error instanceof Error ? error.message : 'Unknown error');
    }
};

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
