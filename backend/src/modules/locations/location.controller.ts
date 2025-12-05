import { Response } from 'express';
import { locationService } from './location.service';
import { AuthRequest } from '../../core/middleware/auth.middleware';
import { validationResult } from 'express-validator';
import { ApiResponse } from '../../core/utils/response';
import { parsePaginationParams } from '../../core/utils/pagination';

export const getLocations = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { type, isActive, parentLocation } = req.query;

        const filter: Record<string, any> = {};
        if (type) filter.type = type as string;
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (parentLocation) filter.parentLocation = parentLocation as string;

        const { page, limit, sort } = parsePaginationParams(req.query);
        const result = await locationService.getLocations(filter, { page, limit, sort });

        ApiResponse.paginated(
            res,
            result.data,
            result.total,
            result.page,
            result.limit
        );
    } catch (error) {
        ApiResponse.error(res, 'Error fetching locations', error instanceof Error ? error.message : 'Unknown error');
    }
};

export const getLocationById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const location = await locationService.getLocationById(req.params.id!);

        if (!location) {
            ApiResponse.notFound(res, 'Location not found');
            return;
        }

        ApiResponse.success(res, location);
    } catch (error) {
        ApiResponse.error(res, 'Error fetching location', error instanceof Error ? error.message : 'Unknown error');
    }
};

export const createLocation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            ApiResponse.badRequest(res, 'Validation failed', errors.array());
            return;
        }

        const location = await locationService.createLocation(req.body);
        ApiResponse.created(res, location, 'Location created successfully');
    } catch (error) {
        ApiResponse.error(res, 'Error creating location', error instanceof Error ? error.message : 'Unknown error', 400);
    }
};

export const updateLocation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            ApiResponse.badRequest(res, 'Validation failed', errors.array());
            return;
        }

        const location = await locationService.updateLocation(req.params.id!, req.body);

        if (!location) {
            ApiResponse.notFound(res, 'Location not found');
            return;
        }

        ApiResponse.success(res, location, 'Location updated successfully');
    } catch (error) {
        ApiResponse.error(res, 'Error updating location', error instanceof Error ? error.message : 'Unknown error', 400);
    }
};

export const deleteLocation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const location = await locationService.deleteLocation(req.params.id!);

        if (!location) {
            ApiResponse.notFound(res, 'Location not found');
            return;
        }

        ApiResponse.deleted(res, 'Location deleted successfully');
    } catch (error) {
        ApiResponse.error(res, 'Error deleting location', error instanceof Error ? error.message : 'Unknown error', 400);
    }
};

export const getChildLocations = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const locations = await locationService.getChildLocations(req.params.id!);
        ApiResponse.success(res, locations);
    } catch (error) {
        ApiResponse.error(res, 'Error fetching child locations', error instanceof Error ? error.message : 'Unknown error');
    }
};

export const getLocationAssets = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const assets = await locationService.getLocationAssets(req.params.id!);
        ApiResponse.success(res, assets);
    } catch (error) {
        ApiResponse.error(res, 'Error fetching location assets', error instanceof Error ? error.message : 'Unknown error');
    }
};

export const getLocationPath = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const path = await locationService.getLocationPath(req.params.id!);
        ApiResponse.success(res, path);
    } catch (error) {
        ApiResponse.error(res, 'Error fetching location path', error instanceof Error ? error.message : 'Unknown error');
    }
};

export const getLocationStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const stats = await locationService.getLocationStats(req.params.id!);
        ApiResponse.success(res, stats);
    } catch (error) {
        ApiResponse.error(res, 'Error fetching location stats', error instanceof Error ? error.message : 'Unknown error');
    }
};
