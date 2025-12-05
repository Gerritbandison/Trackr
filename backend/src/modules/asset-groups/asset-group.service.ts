import mongoose from 'mongoose';
import { AssetGroup, IAssetGroup } from './asset-group.model';

export const assetGroupService = {
    /**
     * Get all asset groups with optional filtering
     */
    async getAssetGroups(query: any = {}): Promise<any[]> {
        const filter: any = {};

        if (query.category) {
            filter.category = query.category;
        }

        if (query.lowStock === 'true') {
            filter.$expr = { $lt: ['$currentStock', '$minStock'] };
        }

        return await AssetGroup.find(filter)
            .populate('createdBy', 'name email')
            .populate('assets', 'assetTag name status')
            .sort('-createdAt')
            .lean();
    },

    /**
     * Get asset group by ID
     */
    async getAssetGroupById(id: string): Promise<any | null> {
        return await AssetGroup.findById(id)
            .populate('createdBy', 'name email')
            .populate('assets', 'assetTag name status category')
            .lean();
    },

    /**
     * Create new asset group
     */
    async createAssetGroup(data: Partial<IAssetGroup>): Promise<IAssetGroup> {
        const assetGroup = new AssetGroup(data);
        await assetGroup.save();
        return assetGroup.toObject();
    },

    /**
     * Update asset group
     */
    async updateAssetGroup(id: string, data: Partial<IAssetGroup>): Promise<any | null> {
        return await AssetGroup.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true, runValidators: true }
        ).lean();
    },

    /**
     * Delete asset group
     */
    async deleteAssetGroup(id: string): Promise<any | null> {
        return await AssetGroup.findByIdAndDelete(id).lean();
    },

    /**
     * Get low stock alerts
     */
    async getLowStockAlerts(): Promise<any[]> {
        return await AssetGroup.find({
            $expr: { $lt: ['$currentStock', '$minStock'] }
        })
            .populate('createdBy', 'name email')
            .sort('currentStock')
            .lean();
    },

    /**
     * Add assets to group
     */
    async addAssets(groupId: string, assetIds: string[]): Promise<any | null> {
        const group = await AssetGroup.findById(groupId);
        if (!group) return null;

        // Add unique asset IDs
        const newAssets = assetIds.filter(id =>
            !group.assets.some(existingId => existingId.toString() === id)
        );

        group.assets.push(...newAssets.map(id => new mongoose.Types.ObjectId(id)));
        group.currentStock = group.assets.length;

        await group.save();
        return group.toObject();
    },

    /**
     * Remove assets from group
     */
    async removeAssets(groupId: string, assetIds: string[]): Promise<any | null> {
        const group = await AssetGroup.findById(groupId);
        if (!group) return null;

        group.assets = group.assets.filter(assetId =>
            !assetIds.includes(assetId.toString())
        );
        group.currentStock = group.assets.length;

        await group.save();
        return group.toObject();
    }
};
