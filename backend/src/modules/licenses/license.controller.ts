import { Response } from 'express';
import { licenseService } from './license.service';
import { AuthRequest } from '../../core/middleware/auth.middleware';
import { validationResult } from 'express-validator';

export const getLicenses = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { vendor, type, status, category, complianceStatus } = req.query;

        const filter: Record<string, string> = {};
        if (vendor) filter.vendor = vendor as string;
        if (type) filter.type = type as string;
        if (status) filter.status = status as string;
        if (category) filter.category = category as string;
        if (complianceStatus) filter.complianceStatus = complianceStatus as string;

        const licenses = await licenseService.getLicenses(filter);

        res.status(200).json({
            success: true,
            data: licenses,
            count: licenses.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching licenses',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getLicenseById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const license = await licenseService.getLicenseById(req.params.id);

        if (!license) {
            res.status(404).json({
                success: false,
                message: 'License not found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: license
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching license',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const createLicense = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                errors: errors.array()
            });
            return;
        }

        const license = await licenseService.createLicense(req.body);

        res.status(201).json({
            success: true,
            message: 'License created successfully',
            data: license
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating license',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const updateLicense = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                errors: errors.array()
            });
            return;
        }

        const license = await licenseService.updateLicense(req.params.id, req.body);

        if (!license) {
            res.status(404).json({
                success: false,
                message: 'License not found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'License updated successfully',
            data: license
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating license',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const deleteLicense = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const license = await licenseService.deleteLicense(req.params.id);

        if (!license) {
            res.status(404).json({
                success: false,
                message: 'License not found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'License deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting license',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const assignLicense = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.body;

        if (!userId) {
            res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
            return;
        }

        const license = await licenseService.assignLicense(req.params.id, userId);

        res.status(200).json({
            success: true,
            message: 'License assigned successfully',
            data: license
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error assigning license',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const unassignLicense = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.body;

        if (!userId) {
            res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
            return;
        }

        const license = await licenseService.unassignLicense(req.params.id, userId);

        res.status(200).json({
            success: true,
            message: 'License unassigned successfully',
            data: license
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error unassigning license',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getExpiringLicenses = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const days = req.query.days ? parseInt(req.query.days as string) : 30;
        const licenses = await licenseService.getExpiringLicenses(days);

        res.status(200).json({
            success: true,
            data: licenses,
            count: licenses.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching expiring licenses',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getComplianceReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const report = await licenseService.getComplianceReport();

        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating compliance report',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getUtilizationStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const stats = await licenseService.getUtilizationStats();

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error calculating utilization stats',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
