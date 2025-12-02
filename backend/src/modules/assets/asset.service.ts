import Asset, { IAsset } from './asset.model';
import mongoose from 'mongoose';
import { PaginationOptions, PaginatedResult } from '../../core/utils/pagination';

interface AssetFilter {
    status?: string;
    category?: string;
    assignedTo?: string;
    [key: string]: string | undefined;
}

export class AssetService {

    // Create a new asset
    async createAsset(data: Partial<IAsset>): Promise<IAsset> {
        try {
            const asset = new Asset(data);
            return await asset.save();
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                throw new Error(`Validation failed: ${error.message}`);
            }
            throw new Error(`Failed to create asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Get all assets with pagination and field selection
    async getAssets(
        filter: AssetFilter = {},
        options: PaginationOptions = {}
    ): Promise<PaginatedResult<any>> {
        try {
            const { page = 1, limit = 50, sort = '-createdAt' } = options;
            const skip = (page - 1) * limit;

            // Build query
            const query = Asset.find(filter);

            // Execute count and data queries in parallel
            const [data, total] = await Promise.all([
                query
                    .select('-__v') // Exclude version key
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(), // Use lean() for better performance on read operations
                Asset.countDocuments(filter)
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
            throw new Error(`Failed to fetch assets: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Get asset by ID with field selection
    async getAssetById(id: string): Promise<any> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid asset ID format');
            }
            return await Asset.findById(id)
                .select('-__v')
                .lean();
        } catch (error) {
            throw new Error(`Failed to fetch asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Update asset
    async updateAsset(id: string, data: Partial<IAsset>): Promise<any> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid asset ID format');
            }
            return await Asset.findByIdAndUpdate(id, data, { new: true, runValidators: true })
                .select('-__v')
                .lean();
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                throw new Error(`Validation failed: ${error.message}`);
            }
            throw new Error(`Failed to update asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Delete asset
    async deleteAsset(id: string): Promise<any> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid asset ID format');
            }
            return await Asset.findByIdAndDelete(id).lean();
        } catch (error) {
            throw new Error(`Failed to delete asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Calculate Depreciation (Straight Line)
    async calculateDepreciation(assetId: string): Promise<{ currentValue: number; depreciationPerYear: number } | null> {
        try {
            const asset = await this.getAssetById(assetId);
            if (!asset) return null;

            const { purchasePrice, salvageValue, usefulLife, purchaseDate } = asset;

            // Validate required fields
            if (!purchasePrice || !purchaseDate || usefulLife === undefined || salvageValue === undefined) {
                throw new Error('Asset is missing required depreciation fields');
            }

            // Straight Line Formula: (Cost - Salvage) / Useful Life
            const depreciationPerYear = (purchasePrice - salvageValue) / usefulLife;

            // Calculate age in years
            const now = new Date();
            const ageInMilliseconds = now.getTime() - new Date(purchaseDate).getTime();
            const ageInYears = ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);

            // Calculate current value
            let currentValue = purchasePrice - (depreciationPerYear * ageInYears);

            // Value cannot be less than salvage value
            if (currentValue < salvageValue) {
                currentValue = salvageValue;
            }

            return {
                currentValue: parseFloat(currentValue.toFixed(2)),
                depreciationPerYear: parseFloat(depreciationPerYear.toFixed(2))
            };
        } catch (error) {
            throw new Error(`Failed to calculate depreciation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Assign asset to a user
    async assignAsset(assetId: string, userId: string, assignedBy: string, notes?: string): Promise<any> {
        try {
            if (!mongoose.Types.ObjectId.isValid(assetId) || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(assignedBy)) {
                throw new Error('Invalid ID format');
            }

            const asset = await Asset.findById(assetId);
            if (!asset) {
                throw new Error('Asset not found');
            }

            // If already assigned to someone, return current assignment first
            if (asset.assignedTo) {
                throw new Error('Asset is already assigned. Please return it first before reassigning.');
            }

            const now = new Date();

            // Update current assignment
            asset.assignedTo = new mongoose.Types.ObjectId(userId);
            asset.assignedDate = now;
            asset.status = 'Active';

            // Add to assignment history
            asset.assignmentHistory.push({
                userId: new mongoose.Types.ObjectId(userId),
                assignedDate: now,
                assignedBy: new mongoose.Types.ObjectId(assignedBy),
                notes
            });

            await asset.save();
            return asset;
        } catch (error) {
            throw new Error(`Failed to assign asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Return asset from user
    async returnAsset(assetId: string, returnedBy: string, notes?: string): Promise<any> {
        try {
            if (!mongoose.Types.ObjectId.isValid(assetId) || !mongoose.Types.ObjectId.isValid(returnedBy)) {
                throw new Error('Invalid ID format');
            }

            const asset = await Asset.findById(assetId);
            if (!asset) {
                throw new Error('Asset not found');
            }

            if (!asset.assignedTo) {
                throw new Error('Asset is not currently assigned');
            }

            const now = new Date();

            // Find the current assignment in history and mark it as returned
            const currentHistory = asset.assignmentHistory.find(
                h => h.userId.equals(asset.assignedTo!) && !h.returnedDate
            );

            if (currentHistory) {
                currentHistory.returnedDate = now;
                if (notes) {
                    currentHistory.notes = (currentHistory.notes ? currentHistory.notes + '; ' : '') + `Returned: ${notes}`;
                }
            }

            // Clear current assignment
            asset.assignedTo = undefined;
            asset.assignedDate = undefined;
            asset.status = 'In Stock';

            await asset.save();
            return asset;
        } catch (error) {
            throw new Error(`Failed to return asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Get assignment history for an asset
    async getAssetAssignmentHistory(assetId: string): Promise<any> {
        try {
            if (!mongoose.Types.ObjectId.isValid(assetId)) {
                throw new Error('Invalid asset ID format');
            }

            const asset = await Asset.findById(assetId)
                .select('assignmentHistory name serialNumber assetTag')
                .populate('assignmentHistory.userId', 'name email')
                .populate('assignmentHistory.assignedBy', 'name email')
                .lean();

            if (!asset) {
                throw new Error('Asset not found');
            }

            return asset;
        } catch (error) {
            throw new Error(`Failed to get assignment history: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Get all assets assigned to a specific user
    async getUserAssets(userId: string): Promise<any[]> {
        try {
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                throw new Error('Invalid user ID format');
            }

            return await Asset.find({ assignedTo: userId })
                .select('-__v')
                .lean();
        } catch (error) {
            throw new Error(`Failed to get user assets: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Get assets with expiring warranties
    async getExpiringWarranties(days: number = 30): Promise<any[]> {
        try {
            const now = new Date();
            const futureDate = new Date();
            futureDate.setDate(now.getDate() + days);

            return await Asset.find({
                'warranty.endDate': {
                    $gte: now,
                    $lte: futureDate
                }
            })
                .select('-__v')
                .sort('warranty.endDate')
                .lean();
        } catch (error) {
            throw new Error(`Failed to get expiring warranties: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Get expired warranties
    async getExpiredWarranties(): Promise<any[]> {
        try {
            const now = new Date();

            return await Asset.find({
                'warranty.endDate': { $lt: now }
            })
                .select('-__v')
                .sort('-warranty.endDate')
                .lean();
        } catch (error) {
            throw new Error(`Failed to get expired warranties: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export const assetService = new AssetService();
