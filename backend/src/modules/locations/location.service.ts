import Location, { ILocation } from './location.model';
import mongoose from 'mongoose';
import { PaginationOptions, PaginatedResult } from '../../core/utils/pagination';

interface LocationFilter {
    type?: string;
    isActive?: boolean;
    parentLocation?: string;
    [key: string]: string | boolean | undefined;
}

export class LocationService {
    // Get all locations with pagination
    async getLocations(filter: LocationFilter = {}, options: PaginationOptions = {}): Promise<PaginatedResult<any>> {
        try {
            const { page = 1, limit = 50, sort = 'name' } = options;
            const skip = (page - 1) * limit;

            const [data, total] = await Promise.all([
                Location.find(filter)
                    .select('-__v')
                    .populate('parentLocation', 'name code type')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Location.countDocuments(filter)
            ]);

            const pages = Math.ceil(total / limit);

            return {
                data,
                total,
                page,
                limit,
                pages,
                hasNext: page < pages,
                hasPrev: page > 1
            };
        } catch (error) {
            throw new Error(`Failed to fetch locations: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Get location by ID
    async getLocationById(id: string): Promise<any> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid location ID format');
            }

            return await Location.findById(id)
                .select('-__v')
                .populate('parentLocation', 'name code type')
                .lean();
        } catch (error) {
            throw new Error(`Failed to fetch location: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Create location
    async createLocation(data: Partial<ILocation>): Promise<ILocation> {
        try {
            const location = new Location(data);
            return await location.save();
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                throw new Error(`Validation failed: ${error.message}`);
            }
            if ((error as any).code === 11000) {
                throw new Error('Location code already exists');
            }
            throw new Error(`Failed to create location: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Update location
    async updateLocation(id: string, data: Partial<ILocation>): Promise<ILocation | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid location ID format');
            }

            const location = await Location.findByIdAndUpdate(
                id,
                data,
                { new: true, runValidators: true }
            ).populate('parentLocation', 'name code type');

            return location;
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                throw new Error(`Validation failed: ${error.message}`);
            }
            if ((error as any).code === 11000) {
                throw new Error('Location code already exists');
            }
            throw new Error(`Failed to update location: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Delete location
    async deleteLocation(id: string): Promise<ILocation | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid location ID format');
            }

            // Check if location has child locations
            const childCount = await Location.countDocuments({ parentLocation: id });
            if (childCount > 0) {
                throw new Error('Cannot delete location with child locations');
            }

            // Check if location has assets
            const Asset = mongoose.model('Asset');
            const assetCount = await Asset.countDocuments({ location: id });
            if (assetCount > 0) {
                throw new Error(`Cannot delete location with ${assetCount} assets`);
            }

            return await Location.findByIdAndDelete(id);
        } catch (error) {
            throw new Error(`Failed to delete location: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Get child locations
    async getChildLocations(parentId: string): Promise<any[]> {
        try {
            if (!mongoose.Types.ObjectId.isValid(parentId)) {
                throw new Error('Invalid location ID format');
            }

            return await Location.find({ parentLocation: parentId })
                .select('-__v')
                .sort('name')
                .lean();
        } catch (error) {
            throw new Error(`Failed to get child locations: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Get assets at location
    async getLocationAssets(locationId: string): Promise<any[]> {
        try {
            if (!mongoose.Types.ObjectId.isValid(locationId)) {
                throw new Error('Invalid location ID format');
            }

            const Asset = mongoose.model('Asset');
            return await Asset.find({ location: locationId })
                .select('-__v')
                .populate('assignedTo', 'name email')
                .lean();
        } catch (error) {
            throw new Error(`Failed to get location assets: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Get location hierarchy path
    async getLocationPath(locationId: string): Promise<any[]> {
        try {
            if (!mongoose.Types.ObjectId.isValid(locationId)) {
                throw new Error('Invalid location ID format');
            }

            const path: any[] = [];
            let current = await Location.findById(locationId).lean();

            while (current) {
                path.unshift({
                    id: current._id,
                    name: current.name,
                    code: current.code,
                    type: current.type
                });

                if (current.parentLocation) {
                    current = await Location.findById(current.parentLocation).lean();
                } else {
                    break;
                }
            }

            return path;
        } catch (error) {
            throw new Error(`Failed to get location path: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Get location statistics
    async getLocationStats(locationId: string): Promise<{
        assetCount: number;
        childCount: number;
        capacity?: number;
        utilizationRate?: number;
    }> {
        try {
            if (!mongoose.Types.ObjectId.isValid(locationId)) {
                throw new Error('Invalid location ID format');
            }

            const location = await Location.findById(locationId);
            if (!location) {
                throw new Error('Location not found');
            }

            const Asset = mongoose.model('Asset');
            const [assetCount, childCount] = await Promise.all([
                Asset.countDocuments({ location: locationId }),
                Location.countDocuments({ parentLocation: locationId })
            ]);

            const stats: any = {
                assetCount,
                childCount
            };

            if (location.capacity) {
                stats.capacity = location.capacity;
                stats.utilizationRate = location.capacity > 0
                    ? parseFloat(((assetCount / location.capacity) * 100).toFixed(2))
                    : 0;
            }

            return stats;
        } catch (error) {
            throw new Error(`Failed to get location stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export const locationService = new LocationService();
