import { Response } from 'express';
import { locationService } from './location.service';
import { AuthRequest } from '../../core/middleware/auth.middleware';
import { ApiResponse } from '../../core/utils/response';
import { parsePaginationParams } from '../../core/utils/pagination';

export const getLocations = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { type, isActive, parentLocation, city, state, country, search, flat } = req.query;

        const filter: Record<string, any> = {};
        if (type) filter.type = type as string;
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (parentLocation) filter.parentLocation = parentLocation as string;
        if (city) filter.city = city as string;
        if (state) filter.state = state as string;
        if (country) filter.country = country as string;
        if (search) filter.search = search as string;

        // Return tree structure if not flat and no specific filters
        if (flat !== 'true' && !parentLocation && !search) {
            const tree = await locationService.getTree();
            ApiResponse.success(res, tree);
            return;
        }

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

export const getLocationTree = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { rootId } = req.query;
        const tree = await locationService.getTree(rootId as string);
        ApiResponse.success(res, tree);
    } catch (error) {
        ApiResponse.error(res, 'Error fetching location tree', error instanceof Error ? error.message : 'Unknown error');
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
        const location = await locationService.createLocation(req.body);
        ApiResponse.created(res, location, 'Location created successfully');
    } catch (error) {
        if ((error as Error).message?.includes('already exists')) {
            ApiResponse.badRequest(res, (error as Error).message);
            return;
        }
        ApiResponse.error(res, 'Error creating location', error instanceof Error ? error.message : 'Unknown error', 400);
    }
};

export const updateLocation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const location = await locationService.updateLocation(req.params.id!, req.body);

        if (!location) {
            ApiResponse.notFound(res, 'Location not found');
            return;
        }

        ApiResponse.success(res, location, 'Location updated successfully');
    } catch (error) {
        if ((error as Error).message?.includes('circular') || (error as Error).message?.includes('parent')) {
            ApiResponse.badRequest(res, (error as Error).message);
            return;
        }
        if ((error as Error).message?.includes('already exists')) {
            ApiResponse.badRequest(res, (error as Error).message);
            return;
        }
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

        ApiResponse.success(res, location, 'Location deactivated successfully');
    } catch (error) {
        if ((error as Error).message?.includes('Cannot delete')) {
            ApiResponse.badRequest(res, (error as Error).message);
            return;
        }
        ApiResponse.error(res, 'Error deleting location', error instanceof Error ? error.message : 'Unknown error', 400);
    }
};

export const permanentDeleteLocation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const location = await locationService.permanentDelete(req.params.id!);

        if (!location) {
            ApiResponse.notFound(res, 'Location not found');
            return;
        }

        ApiResponse.deleted(res, 'Location permanently deleted');
    } catch (error) {
        if ((error as Error).message?.includes('Cannot')) {
            ApiResponse.badRequest(res, (error as Error).message);
            return;
        }
        ApiResponse.error(res, 'Error permanently deleting location', error instanceof Error ? error.message : 'Unknown error', 400);
    }
};

export const activateLocation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const location = await locationService.updateLocation(req.params.id!, { isActive: true });

        if (!location) {
            ApiResponse.notFound(res, 'Location not found');
            return;
        }

        ApiResponse.success(res, location, 'Location activated successfully');
    } catch (error) {
        ApiResponse.error(res, 'Error activating location', error instanceof Error ? error.message : 'Unknown error');
    }
};

export const moveLocation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { newParentId } = req.body;
        const location = await locationService.moveLocation(req.params.id!, newParentId);

        if (!location) {
            ApiResponse.notFound(res, 'Location not found');
            return;
        }

        ApiResponse.success(res, location, 'Location moved successfully');
    } catch (error) {
        if ((error as Error).message?.includes('circular') || (error as Error).message?.includes('parent')) {
            ApiResponse.badRequest(res, (error as Error).message);
            return;
        }
        ApiResponse.error(res, 'Error moving location', error instanceof Error ? error.message : 'Unknown error');
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

export const getDescendants = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const descendants = await locationService.getDescendants(req.params.id!);
        ApiResponse.success(res, descendants);
    } catch (error) {
        ApiResponse.error(res, 'Error fetching descendants', error instanceof Error ? error.message : 'Unknown error');
    }
};

export const getLocationAssets = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const includeChildren = req.query.includeChildren === 'true';
        const assets = await locationService.getLocationAssets(req.params.id!, includeChildren);
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
        const includeChildren = req.query.includeChildren === 'true';
        const stats = await locationService.getLocationStats(req.params.id!, includeChildren);
        ApiResponse.success(res, stats);
    } catch (error) {
        ApiResponse.error(res, 'Error fetching location stats', error instanceof Error ? error.message : 'Unknown error');
    }
};

export const updateCapacity = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const location = await locationService.updateCapacity(req.params.id!, req.body);

        if (!location) {
            ApiResponse.notFound(res, 'Location not found');
            return;
        }

        ApiResponse.success(res, location, 'Capacity updated successfully');
    } catch (error) {
        ApiResponse.error(res, 'Error updating capacity', error instanceof Error ? error.message : 'Unknown error', 400);
    }
};

export const findWithAvailableCapacity = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const minAssets = parseInt(req.query.minAssets as string) || 1;
        const locations = await locationService.findWithAvailableCapacity(minAssets);
        ApiResponse.success(res, locations);
    } catch (error) {
        ApiResponse.error(res, 'Error finding locations with capacity', error instanceof Error ? error.message : 'Unknown error');
    }
};

export const bulkUpdateLocations = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { ids, data } = req.body;
        const result = await locationService.bulkUpdate(ids, data);
        ApiResponse.success(res, result, 'Locations updated successfully');
    } catch (error) {
        ApiResponse.error(res, 'Error updating locations', error instanceof Error ? error.message : 'Unknown error');
    }
};
