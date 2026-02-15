import Location, { ILocation } from './location.model';
import mongoose from 'mongoose';
import { PaginationOptions, PaginatedResult } from '../../core/utils/pagination';

interface LocationFilter {
    type?: string;
    isActive?: boolean;
    parentLocation?: string;
    city?: string;
    state?: string;
    country?: string;
    search?: string;
    [key: string]: string | boolean | undefined;
}

export class LocationService {
    // Get all locations with pagination
    async getLocations(filter: LocationFilter = {}, options: PaginationOptions = {}): Promise<PaginatedResult<any>> {
        try {
            const { page = 1, limit = 50, sort = 'name' } = options;
            const skip = (page - 1) * limit;

            // Build query filter
            const queryFilter: Record<string, any> = {};
            
            if (filter.type) queryFilter.type = filter.type;
            if (filter.isActive !== undefined) queryFilter.isActive = filter.isActive;
            if (filter.parentLocation) queryFilter.parentLocation = filter.parentLocation;
            if (filter.city) queryFilter['address.city'] = filter.city;
            if (filter.state) queryFilter['address.state'] = filter.state;
            if (filter.country) queryFilter['address.country'] = filter.country;

            // Text search
            if (filter.search) {
                queryFilter.$or = [
                    { name: { $regex: filter.search, $options: 'i' } },
                    { code: { $regex: filter.search, $options: 'i' } },
                    { description: { $regex: filter.search, $options: 'i' } }
                ];
            }

            const [data, total] = await Promise.all([
                Location.find(queryFilter)
                    .select('-__v')
                    .populate('parentLocation', 'name code type')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Location.countDocuments(queryFilter)
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

    // Get location tree
    async getTree(rootId?: string): Promise<any> {
        return await (Location as any).getTree(rootId);
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

            // Handle null parent for moving to root
            if (data.parentLocation === null) {
                data.parentLocation = undefined;
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
            if ((error as any).message?.includes('circular') || (error as any).message?.includes('parent')) {
                throw error;
            }
            throw new Error(`Failed to update location: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Move location to new parent
    async moveLocation(id: string, newParentId: string | null): Promise<ILocation | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid location ID format');
            }

            const location = await Location.findById(id);
            if (!location) return null;

            location.parentLocation = newParentId ? new mongoose.Types.ObjectId(newParentId) : undefined;
            await location.save(); // Triggers circular check

            return await Location.findById(id).populate('parentLocation', 'name code type');
        } catch (error) {
            throw error;
        }
    }

    // Delete location (soft delete - deactivate)
    async deleteLocation(id: string): Promise<ILocation | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid location ID format');
            }

            // Check if location has active child locations
            const childCount = await Location.countDocuments({ parentLocation: id, isActive: true });
            if (childCount > 0) {
                throw new Error('Cannot delete location with active child locations');
            }

            // Check if location has assets
            try {
                const Asset = mongoose.model('Asset');
                const assetCount = await Asset.countDocuments({ location: id });
                if (assetCount > 0) {
                    throw new Error(`Cannot delete location with ${assetCount} assets. Reassign assets first.`);
                }
            } catch (e) {
                // Asset model might not be registered yet
                if ((e as Error).message?.includes('assets')) throw e;
            }

            // Soft delete
            return await Location.findByIdAndUpdate(
                id,
                { isActive: false },
                { new: true }
            );
        } catch (error) {
            throw new Error(`Failed to delete location: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Permanently delete location
    async permanentDelete(id: string): Promise<ILocation | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid location ID format');
            }

            // Check constraints
            const childCount = await Location.countDocuments({ parentLocation: id });
            if (childCount > 0) {
                throw new Error('Cannot permanently delete location with child locations');
            }

            try {
                const Asset = mongoose.model('Asset');
                const assetCount = await Asset.countDocuments({ location: id });
                if (assetCount > 0) {
                    throw new Error(`Cannot permanently delete location with ${assetCount} assets`);
                }
            } catch (e) {
                if ((e as Error).message?.includes('assets')) throw e;
            }

            return await Location.findByIdAndDelete(id);
        } catch (error) {
            throw new Error(`Failed to permanently delete location: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Get child locations
    async getChildLocations(parentId: string): Promise<any[]> {
        try {
            if (!mongoose.Types.ObjectId.isValid(parentId)) {
                throw new Error('Invalid location ID format');
            }

            return await Location.find({ parentLocation: parentId, isActive: true })
                .select('-__v')
                .sort('name')
                .lean();
        } catch (error) {
            throw new Error(`Failed to get child locations: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Get all descendants
    async getDescendants(locationId: string): Promise<ILocation[]> {
        return await (Location as any).getDescendants(locationId);
    }

    // Get assets at location
    async getLocationAssets(locationId: string, includeChildren: boolean = false): Promise<any[]> {
        try {
            if (!mongoose.Types.ObjectId.isValid(locationId)) {
                throw new Error('Invalid location ID format');
            }

            const Asset = mongoose.model('Asset');
            
            let locationIds = [new mongoose.Types.ObjectId(locationId)];
            
            if (includeChildren) {
                const descendants = await this.getDescendants(locationId);
                locationIds = [...locationIds, ...descendants.map(d => d._id)];
            }

            return await Asset.find({ location: { $in: locationIds } })
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
    async getLocationStats(locationId: string, includeChildren: boolean = false): Promise<{
        assetCount: number;
        childCount: number;
        descendantCount?: number;
        capacity?: any;
        utilizationPercent?: number;
    }> {
        try {
            if (!mongoose.Types.ObjectId.isValid(locationId)) {
                throw new Error('Invalid location ID format');
            }

            const location = await Location.findById(locationId);
            if (!location) {
                throw new Error('Location not found');
            }

            let assetCount = 0;
            try {
                const Asset = mongoose.model('Asset');
                
                if (includeChildren) {
                    const descendants = await this.getDescendants(locationId);
                    const locationIds = [new mongoose.Types.ObjectId(locationId), ...descendants.map(d => d._id)];
                    assetCount = await Asset.countDocuments({ location: { $in: locationIds } });
                } else {
                    assetCount = await Asset.countDocuments({ location: locationId });
                }
            } catch {
                // Asset model might not exist
            }

            const childCount = await Location.countDocuments({ parentLocation: locationId, isActive: true });

            const stats: any = {
                assetCount,
                childCount
            };

            if (includeChildren) {
                const descendants = await this.getDescendants(locationId);
                stats.descendantCount = descendants.length;
            }

            if (location.capacity) {
                stats.capacity = location.capacity;
                if (location.capacity.maxAssets && location.capacity.maxAssets > 0) {
                    stats.utilizationPercent = Math.round((assetCount / location.capacity.maxAssets) * 100);
                }
            }

            return stats;
        } catch (error) {
            throw new Error(`Failed to get location stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Find locations with available capacity
    async findWithAvailableCapacity(minAssets: number = 1): Promise<any[]> {
        return await (Location as any).findWithAvailableCapacity(minAssets);
    }

    // Update capacity
    async updateCapacity(locationId: string, capacity: any): Promise<ILocation | null> {
        return await Location.findByIdAndUpdate(
            locationId,
            { capacity },
            { new: true, runValidators: true }
        );
    }

    // Bulk update locations
    async bulkUpdate(ids: string[], data: Partial<ILocation>): Promise<{ modified: number; matched: number }> {
        const result = await Location.updateMany(
            { _id: { $in: ids } },
            { $set: data }
        );
        return { modified: result.modifiedCount, matched: result.matchedCount };
    }
}

export const locationService = new LocationService();
