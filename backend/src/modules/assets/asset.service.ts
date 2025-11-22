import Asset, { IAsset } from './asset.model';

export class AssetService {

    // Create a new asset
    async createAsset(data: Partial<IAsset>): Promise<IAsset> {
        const asset = new Asset(data);
        return await asset.save();
    }

    // Get all assets
    async getAssets(filter: any = {}): Promise<IAsset[]> {
        return await Asset.find(filter);
    }

    // Get asset by ID
    async getAssetById(id: string): Promise<IAsset | null> {
        return await Asset.findById(id);
    }

    // Update asset
    async updateAsset(id: string, data: Partial<IAsset>): Promise<IAsset | null> {
        return await Asset.findByIdAndUpdate(id, data, { new: true });
    }

    // Delete asset
    async deleteAsset(id: string): Promise<IAsset | null> {
        return await Asset.findByIdAndDelete(id);
    }

    // Calculate Depreciation (Straight Line)
    async calculateDepreciation(assetId: string): Promise<{ currentValue: number; depreciationPerYear: number } | null> {
        const asset = await this.getAssetById(assetId);
        if (!asset) return null;

        const { purchasePrice, salvageValue, usefulLife, purchaseDate } = asset;

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
    }
}

export const assetService = new AssetService();
