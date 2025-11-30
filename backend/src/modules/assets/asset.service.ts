import Asset, { IAsset } from './asset.model';
import mongoose from 'mongoose';

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

    // Get all assets
    async getAssets(filter: AssetFilter = {}): Promise<IAsset[]> {
        try {
            return await Asset.find(filter);
        } catch (error) {
            throw new Error(`Failed to fetch assets: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Get asset by ID
    async getAssetById(id: string): Promise<IAsset | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid asset ID format');
            }
            return await Asset.findById(id);
        } catch (error) {
            throw new Error(`Failed to fetch asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Update asset
    async updateAsset(id: string, data: Partial<IAsset>): Promise<IAsset | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid asset ID format');
            }
            return await Asset.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                throw new Error(`Validation failed: ${error.message}`);
            }
            throw new Error(`Failed to update asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Delete asset
    async deleteAsset(id: string): Promise<IAsset | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid asset ID format');
            }
            return await Asset.findByIdAndDelete(id);
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
}

export const assetService = new AssetService();
