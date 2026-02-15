import Asset, { IAsset, ICustomField } from './asset.model';
import mongoose from 'mongoose';
import { PaginationOptions, getPaginationParams } from '../../core/utils/pagination';
import { convertToCSV, parseCSV, validateImportData } from '../../core/utils/csv';

interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

interface ExtendedPaginationOptions extends PaginationOptions {
    sort?: string;
}

interface AssetFilter {
    status?: string;
    category?: string;
    assignedTo?: string;
    location?: string;
    condition?: string;
    isArchived?: boolean;
    [key: string]: string | boolean | undefined;
}

interface BulkCreateResult {
    success: number;
    failed: number;
    errors: Array<{ index: number; error: string }>;
    created: any[];
}

interface BulkUpdateResult {
    success: number;
    failed: number;
    errors: Array<{ id: string; error: string }>;
    updated: any[];
}

interface BulkArchiveResult {
    success: number;
    failed: number;
    errors: Array<{ id: string; error: string }>;
    archived: string[];
}

interface QRCodeData {
    assetId: string;
    assetTag: string;
    serialNumber: string;
    name: string;
    category: string;
    manufacturer?: string;
    modelNumber?: string;
    url: string;
    generatedAt: string;
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

    // Get all assets with pagination, field selection, and population
    async getAssets(
        filter: AssetFilter = {},
        options: ExtendedPaginationOptions = {}
    ): Promise<PaginatedResult<any>> {
        try {
            const { page, limit, skip } = getPaginationParams(options);
            const sort = options.sort || '-createdAt';

            // Build query - exclude archived by default unless explicitly requested
            const queryFilter: any = { ...filter };
            if (queryFilter.isArchived === undefined) {
                queryFilter.isArchived = { $ne: true };
            } else if (queryFilter.isArchived === false) {
                queryFilter.isArchived = { $ne: true };
            }
            // If includeArchived is true, remove the filter to show all

            // Execute count and data queries in parallel with optimized population
            const [data, total] = await Promise.all([
                Asset.find(queryFilter)
                    .select('-__v')
                    .populate('assignedTo', 'name email department')
                    .populate('location', 'name code type building floor')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Asset.countDocuments(queryFilter)
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

    // Get asset by ID with optimized population
    async getAssetById(id: string, includeArchived: boolean = false): Promise<any> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid asset ID format');
            }

            const query: any = { _id: id };
            if (!includeArchived) {
                query.isArchived = { $ne: true };
            }

            return await Asset.findOne(query)
                .select('-__v')
                .populate('assignedTo', 'name email department jobTitle')
                .populate('location', 'name code type building floor address')
                .populate('assignmentHistory.userId', 'name email')
                .populate('assignmentHistory.assignedBy', 'name email')
                .populate('locationHistory.locationId', 'name code')
                .populate('locationHistory.movedBy', 'name email')
                .populate('archivedBy', 'name email')
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
            
            // Don't allow updating archived assets without explicitly unarchiving
            const existingAsset = await Asset.findById(id);
            if (existingAsset?.isArchived) {
                throw new Error('Cannot update an archived asset. Restore it first.');
            }

            return await Asset.findByIdAndUpdate(id, data, { new: true, runValidators: true })
                .select('-__v')
                .populate('assignedTo', 'name email department')
                .populate('location', 'name code type')
                .lean();
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                throw new Error(`Validation failed: ${error.message}`);
            }
            throw new Error(`Failed to update asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Soft delete (archive) asset
    async archiveAsset(id: string, archivedBy: string, reason?: string): Promise<any> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(archivedBy)) {
                throw new Error('Invalid ID format');
            }

            const asset = await Asset.findById(id);
            if (!asset) {
                throw new Error('Asset not found');
            }

            if (asset.isArchived) {
                throw new Error('Asset is already archived');
            }

            // If asset is assigned, return it first
            if (asset.assignedTo) {
                await this.returnAsset(id, archivedBy, 'Returned due to archival');
            }

            return await Asset.findByIdAndUpdate(
                id,
                {
                    isArchived: true,
                    archivedAt: new Date(),
                    archivedBy: new mongoose.Types.ObjectId(archivedBy),
                    archiveReason: reason,
                    status: 'Retired'
                },
                { new: true }
            )
                .select('-__v')
                .lean();
        } catch (error) {
            throw new Error(`Failed to archive asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Restore archived asset
    async restoreAsset(id: string): Promise<any> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid asset ID format');
            }

            const asset = await Asset.findById(id);
            if (!asset) {
                throw new Error('Asset not found');
            }

            if (!asset.isArchived) {
                throw new Error('Asset is not archived');
            }

            return await Asset.findByIdAndUpdate(
                id,
                {
                    isArchived: false,
                    archivedAt: undefined,
                    archivedBy: undefined,
                    archiveReason: undefined,
                    status: 'In Stock'
                },
                { new: true }
            )
                .select('-__v')
                .lean();
        } catch (error) {
            throw new Error(`Failed to restore asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Hard delete asset (admin only - use with caution)
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

    // ============================================
    // Bulk Operations
    // ============================================

    // Bulk create assets
    async bulkCreate(assets: Partial<IAsset>[]): Promise<BulkCreateResult> {
        const result: BulkCreateResult = {
            success: 0,
            failed: 0,
            errors: [],
            created: []
        };

        // Validate all serial numbers and asset tags are unique within the batch
        const serialNumbers = assets.map(a => a.serialNumber);
        const assetTags = assets.map(a => a.assetTag);
        
        const duplicateSerials = serialNumbers.filter((sn, idx) => serialNumbers.indexOf(sn) !== idx);
        const duplicateTags = assetTags.filter((tag, idx) => assetTags.indexOf(tag) !== idx);

        if (duplicateSerials.length > 0) {
            throw new Error(`Duplicate serial numbers in batch: ${duplicateSerials.join(', ')}`);
        }
        if (duplicateTags.length > 0) {
            throw new Error(`Duplicate asset tags in batch: ${duplicateTags.join(', ')}`);
        }

        // Check for existing assets with same serial numbers or tags
        const existingAssets = await Asset.find({
            $or: [
                { serialNumber: { $in: serialNumbers } },
                { assetTag: { $in: assetTags } }
            ]
        }).select('serialNumber assetTag').lean();

        const existingSerials = new Set(existingAssets.map(a => a.serialNumber));
        const existingTags = new Set(existingAssets.map(a => a.assetTag));

        // Process each asset
        for (let i = 0; i < assets.length; i++) {
            const assetData = assets[i];
            
            try {
                // Check if serial or tag already exists
                if (existingSerials.has(assetData.serialNumber!)) {
                    result.failed++;
                    result.errors.push({ index: i, error: `Serial number '${assetData.serialNumber}' already exists` });
                    continue;
                }
                if (existingTags.has(assetData.assetTag!)) {
                    result.failed++;
                    result.errors.push({ index: i, error: `Asset tag '${assetData.assetTag}' already exists` });
                    continue;
                }

                const asset = new Asset(assetData);
                const saved = await asset.save();
                result.success++;
                result.created.push(saved.toObject());
                
                // Add to existing sets to prevent duplicates within the batch
                existingSerials.add(assetData.serialNumber!);
                existingTags.add(assetData.assetTag!);
            } catch (error) {
                result.failed++;
                result.errors.push({ 
                    index: i, 
                    error: error instanceof Error ? error.message : 'Unknown error' 
                });
            }
        }

        return result;
    }

    // Bulk update assets
    async bulkUpdate(updates: Array<{ id: string; data: Partial<IAsset> }>): Promise<BulkUpdateResult> {
        const result: BulkUpdateResult = {
            success: 0,
            failed: 0,
            errors: [],
            updated: []
        };

        // Validate all IDs first
        const invalidIds = updates.filter(u => !mongoose.Types.ObjectId.isValid(u.id));
        if (invalidIds.length > 0) {
            throw new Error(`Invalid asset IDs: ${invalidIds.map(u => u.id).join(', ')}`);
        }

        // Fetch all assets to check they exist and aren't archived
        const ids = updates.map(u => u.id);
        const existingAssets = await Asset.find({ _id: { $in: ids } }).select('_id isArchived').lean();
        const existingIds = new Set(existingAssets.map(a => a._id.toString()));
        const archivedIds = new Set(existingAssets.filter(a => a.isArchived).map(a => a._id.toString()));

        // Process each update
        for (const update of updates) {
            try {
                if (!existingIds.has(update.id)) {
                    result.failed++;
                    result.errors.push({ id: update.id, error: 'Asset not found' });
                    continue;
                }

                if (archivedIds.has(update.id)) {
                    result.failed++;
                    result.errors.push({ id: update.id, error: 'Cannot update archived asset' });
                    continue;
                }

                const updated = await Asset.findByIdAndUpdate(
                    update.id, 
                    update.data, 
                    { new: true, runValidators: true }
                ).select('-__v').lean();

                result.success++;
                result.updated.push(updated);
            } catch (error) {
                result.failed++;
                result.errors.push({ 
                    id: update.id, 
                    error: error instanceof Error ? error.message : 'Unknown error' 
                });
            }
        }

        return result;
    }

    // Bulk archive assets
    async bulkArchive(ids: string[], archivedBy: string, reason?: string): Promise<BulkArchiveResult> {
        const result: BulkArchiveResult = {
            success: 0,
            failed: 0,
            errors: [],
            archived: []
        };

        if (!mongoose.Types.ObjectId.isValid(archivedBy)) {
            throw new Error('Invalid archivedBy ID format');
        }

        // Validate all IDs
        const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            throw new Error(`Invalid asset IDs: ${invalidIds.join(', ')}`);
        }

        // Fetch all assets
        const assets = await Asset.find({ _id: { $in: ids } }).select('_id isArchived assignedTo').lean();
        const assetMap = new Map(assets.map(a => [a._id.toString(), a]));

        for (const id of ids) {
            try {
                const asset = assetMap.get(id);
                
                if (!asset) {
                    result.failed++;
                    result.errors.push({ id, error: 'Asset not found' });
                    continue;
                }

                if (asset.isArchived) {
                    result.failed++;
                    result.errors.push({ id, error: 'Asset is already archived' });
                    continue;
                }

                // Return asset if assigned
                if (asset.assignedTo) {
                    await this.returnAsset(id, archivedBy, 'Returned due to bulk archival');
                }

                await Asset.findByIdAndUpdate(id, {
                    isArchived: true,
                    archivedAt: new Date(),
                    archivedBy: new mongoose.Types.ObjectId(archivedBy),
                    archiveReason: reason,
                    status: 'Retired'
                });

                result.success++;
                result.archived.push(id);
            } catch (error) {
                result.failed++;
                result.errors.push({ 
                    id, 
                    error: error instanceof Error ? error.message : 'Unknown error' 
                });
            }
        }

        return result;
    }

    // ============================================
    // QR Code Operations
    // ============================================

    // Generate QR code data for an asset
    async generateQRCodeData(assetId: string, baseUrl: string = ''): Promise<QRCodeData> {
        try {
            if (!mongoose.Types.ObjectId.isValid(assetId)) {
                throw new Error('Invalid asset ID format');
            }

            const asset = await Asset.findById(assetId)
                .select('assetTag serialNumber name category manufacturer modelNumber')
                .lean();

            if (!asset) {
                throw new Error('Asset not found');
            }

            const assetUrl = baseUrl ? `${baseUrl}/assets/${assetId}` : `/assets/${assetId}`;

            return {
                assetId: asset._id.toString(),
                assetTag: asset.assetTag,
                serialNumber: asset.serialNumber,
                name: asset.name,
                category: asset.category,
                manufacturer: asset.manufacturer,
                modelNumber: asset.modelNumber,
                url: assetUrl,
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Failed to generate QR code data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // ============================================
    // Custom Fields Operations
    // ============================================

    // Set custom field on an asset
    async setCustomField(assetId: string, field: ICustomField): Promise<any> {
        try {
            if (!mongoose.Types.ObjectId.isValid(assetId)) {
                throw new Error('Invalid asset ID format');
            }

            const asset = await Asset.findById(assetId);
            if (!asset) {
                throw new Error('Asset not found');
            }

            if (asset.isArchived) {
                throw new Error('Cannot modify archived asset');
            }

            // Initialize customFields if not exists
            if (!asset.customFields) {
                asset.customFields = [];
            }

            // Update existing field or add new one
            const existingIndex = asset.customFields.findIndex(f => f.key === field.key);
            if (existingIndex >= 0) {
                asset.customFields[existingIndex] = field;
            } else {
                asset.customFields.push(field);
            }

            await asset.save();
            return asset.toObject();
        } catch (error) {
            throw new Error(`Failed to set custom field: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Remove custom field from an asset
    async removeCustomField(assetId: string, fieldKey: string): Promise<any> {
        try {
            if (!mongoose.Types.ObjectId.isValid(assetId)) {
                throw new Error('Invalid asset ID format');
            }

            const asset = await Asset.findById(assetId);
            if (!asset) {
                throw new Error('Asset not found');
            }

            if (asset.isArchived) {
                throw new Error('Cannot modify archived asset');
            }

            if (asset.customFields) {
                asset.customFields = asset.customFields.filter(f => f.key !== fieldKey);
                await asset.save();
            }

            return asset.toObject();
        } catch (error) {
            throw new Error(`Failed to remove custom field: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // ============================================
    // Depreciation Calculations
    // ============================================

    // Calculate Depreciation with support for multiple methods
    async calculateDepreciation(assetId: string): Promise<{ 
        currentValue: number; 
        depreciationPerYear: number;
        totalDepreciation: number;
        method: string;
        ageInYears: number;
        isFullyDepreciated: boolean;
    } | null> {
        try {
            const asset = await this.getAssetById(assetId);
            if (!asset) return null;

            const { purchasePrice, salvageValue, usefulLife, purchaseDate, depreciationType } = asset;

            // Validate required fields
            if (!purchasePrice || !purchaseDate || usefulLife === undefined || salvageValue === undefined) {
                throw new Error('Asset is missing required depreciation fields');
            }

            // Calculate age in years
            const now = new Date();
            const ageInMilliseconds = now.getTime() - new Date(purchaseDate).getTime();
            const ageInYears = ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);

            let depreciationPerYear: number;
            let currentValue: number;
            let totalDepreciation: number;

            switch (depreciationType) {
                case 'Double Declining':
                    // Double Declining Balance method
                    const rate = (2 / usefulLife);
                    currentValue = purchasePrice;
                    totalDepreciation = 0;
                    
                    for (let year = 0; year < Math.min(ageInYears, usefulLife); year++) {
                        const yearDepreciation = currentValue * rate;
                        if (currentValue - yearDepreciation < salvageValue) {
                            totalDepreciation += currentValue - salvageValue;
                            currentValue = salvageValue;
                            break;
                        }
                        totalDepreciation += yearDepreciation;
                        currentValue -= yearDepreciation;
                    }
                    depreciationPerYear = totalDepreciation / Math.max(ageInYears, 1);
                    break;

                case 'Sum of Years':
                    // Sum of Years' Digits method
                    const sumOfYears = (usefulLife * (usefulLife + 1)) / 2;
                    const depreciableAmount = purchasePrice - salvageValue;
                    currentValue = purchasePrice;
                    totalDepreciation = 0;

                    for (let year = 1; year <= Math.min(Math.ceil(ageInYears), usefulLife); year++) {
                        const fraction = (usefulLife - year + 1) / sumOfYears;
                        const yearDepreciation = depreciableAmount * fraction;
                        totalDepreciation += yearDepreciation;
                        currentValue -= yearDepreciation;
                    }
                    depreciationPerYear = totalDepreciation / Math.max(ageInYears, 1);
                    break;

                default: // Straight Line
                    depreciationPerYear = (purchasePrice - salvageValue) / usefulLife;
                    totalDepreciation = depreciationPerYear * Math.min(ageInYears, usefulLife);
                    currentValue = purchasePrice - totalDepreciation;
            }

            // Value cannot be less than salvage value
            if (currentValue < salvageValue) {
                currentValue = salvageValue;
            }

            return {
                currentValue: parseFloat(currentValue.toFixed(2)),
                depreciationPerYear: parseFloat(depreciationPerYear.toFixed(2)),
                totalDepreciation: parseFloat(totalDepreciation.toFixed(2)),
                method: depreciationType,
                ageInYears: parseFloat(ageInYears.toFixed(2)),
                isFullyDepreciated: currentValue <= salvageValue
            };
        } catch (error) {
            throw new Error(`Failed to calculate depreciation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // ============================================
    // Assignment Operations
    // ============================================

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

            if (asset.isArchived) {
                throw new Error('Cannot assign an archived asset');
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
            
            // Return with populated fields
            return await Asset.findById(assetId)
                .populate('assignedTo', 'name email department')
                .lean();
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
            return asset.toObject();
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
                .populate('assignmentHistory.userId', 'name email department')
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

            return await Asset.find({ assignedTo: userId, isArchived: { $ne: true } })
                .select('-__v')
                .populate('location', 'name code')
                .lean();
        } catch (error) {
            throw new Error(`Failed to get user assets: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // ============================================
    // Warranty Operations
    // ============================================

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
                },
                isArchived: { $ne: true }
            })
                .select('-__v')
                .populate('assignedTo', 'name email')
                .populate('location', 'name code')
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
                'warranty.endDate': { $lt: now },
                isArchived: { $ne: true }
            })
                .select('-__v')
                .populate('assignedTo', 'name email')
                .populate('location', 'name code')
                .sort('-warranty.endDate')
                .lean();
        } catch (error) {
            throw new Error(`Failed to get expired warranties: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // ============================================
    // Export/Import Operations
    // ============================================

    // Export assets to CSV
    async exportToCSV(filter: AssetFilter = {}): Promise<string> {
        try {
            // Add isArchived filter by default
            const queryFilter: any = { ...filter };
            if (queryFilter.isArchived === undefined) {
                queryFilter.isArchived = { $ne: true };
            }

            const assets = await Asset.find(queryFilter)
                .select('-__v -_id')
                .populate('assignedTo', 'name email')
                .populate('location', 'name code')
                .lean();

            // Flatten nested objects for CSV
            const flattenedAssets = assets.map(asset => ({
                name: asset.name,
                serialNumber: asset.serialNumber,
                assetTag: asset.assetTag,
                manufacturer: asset.manufacturer || '',
                modelNumber: asset.modelNumber || '',
                category: asset.category,
                status: asset.status,
                location: asset.location ? (asset.location as any).name : '',
                locationCode: asset.location ? (asset.location as any).code : '',
                condition: asset.condition || '',
                purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '',
                purchasePrice: asset.purchasePrice || 0,
                depreciationType: asset.depreciationType,
                usefulLife: asset.usefulLife,
                salvageValue: asset.salvageValue || 0,
                assignedTo: asset.assignedTo ? (asset.assignedTo as any).name : '',
                assignedToEmail: asset.assignedTo ? (asset.assignedTo as any).email : '',
                assignedDate: asset.assignedDate ? new Date(asset.assignedDate).toISOString().split('T')[0] : '',
                warrantyProvider: asset.warranty?.provider || '',
                warrantyStartDate: asset.warranty?.startDate ? new Date(asset.warranty.startDate).toISOString().split('T')[0] : '',
                warrantyEndDate: asset.warranty?.endDate ? new Date(asset.warranty.endDate).toISOString().split('T')[0] : '',
                warrantyNumber: asset.warranty?.warrantyNumber || '',
                isArchived: asset.isArchived ? 'Yes' : 'No',
                createdAt: new Date(asset.createdAt).toISOString(),
                updatedAt: new Date(asset.updatedAt).toISOString()
            }));

            return convertToCSV(flattenedAssets);
        } catch (error) {
            throw new Error(`Failed to export assets: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Bulk import assets from CSV
    async bulkImport(csvData: string): Promise<{
        success: number;
        failed: number;
        errors: string[];
        imported: any[];
    }> {
        try {
            // Parse CSV
            const data = parseCSV(csvData);

            // Validate required fields
            const requiredFields = ['name', 'serialNumber', 'assetTag', 'category', 'purchaseDate', 'purchasePrice'];
            const validation = validateImportData(data, requiredFields);

            if (!validation.valid) {
                return {
                    success: 0,
                    failed: data.length,
                    errors: validation.errors,
                    imported: []
                };
            }

            const results = {
                success: 0,
                failed: 0,
                errors: [] as string[],
                imported: [] as any[]
            };

            // Pre-fetch all existing serial numbers and asset tags
            const serialNumbers = data.map(row => row.serialNumber);
            const assetTags = data.map(row => row.assetTag);
            
            const existingAssets = await Asset.find({
                $or: [
                    { serialNumber: { $in: serialNumbers } },
                    { assetTag: { $in: assetTags } }
                ]
            }).select('serialNumber assetTag').lean();

            const existingSerials = new Set(existingAssets.map(a => a.serialNumber));
            const existingTags = new Set(existingAssets.map(a => a.assetTag));

            // Process each row
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                try {
                    // Check for duplicate serial number or asset tag
                    if (existingSerials.has(row.serialNumber)) {
                        results.failed++;
                        results.errors.push(
                            `Row ${i + 2}: Asset with serial number '${row.serialNumber}' already exists`
                        );
                        continue;
                    }

                    if (existingTags.has(row.assetTag)) {
                        results.failed++;
                        results.errors.push(
                            `Row ${i + 2}: Asset with asset tag '${row.assetTag}' already exists`
                        );
                        continue;
                    }

                    // Parse warranty data if present
                    const warranty = (row.warrantyProvider && row.warrantyStartDate && row.warrantyEndDate) ? {
                        provider: row.warrantyProvider,
                        startDate: new Date(row.warrantyStartDate),
                        endDate: new Date(row.warrantyEndDate),
                        warrantyNumber: row.warrantyNumber || undefined,
                        supportPhone: row.supportPhone || undefined
                    } : undefined;

                    // Create asset
                    const asset = new Asset({
                        name: row.name,
                        description: row.description || undefined,
                        serialNumber: row.serialNumber,
                        assetTag: row.assetTag,
                        manufacturer: row.manufacturer || undefined,
                        modelNumber: row.modelNumber || undefined,
                        category: row.category,
                        status: row.status || 'In Stock',
                        location: row.location || undefined,
                        condition: row.condition || 'Good',
                        conditionNotes: row.conditionNotes || undefined,
                        purchaseDate: new Date(row.purchaseDate),
                        purchasePrice: parseFloat(row.purchasePrice),
                        depreciationType: row.depreciationType || 'Straight Line',
                        usefulLife: row.usefulLife ? parseInt(row.usefulLife) : 3,
                        salvageValue: row.salvageValue ? parseFloat(row.salvageValue) : 0,
                        warranty,
                        assignmentHistory: [],
                        isArchived: false
                    });

                    const saved = await asset.save();
                    results.success++;
                    results.imported.push(saved);
                    
                    // Add to sets to prevent duplicates within the import
                    existingSerials.add(row.serialNumber);
                    existingTags.add(row.assetTag);
                } catch (error) {
                    results.failed++;
                    results.errors.push(
                        `Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`
                    );
                }
            }

            return results;
        } catch (error) {
            throw new Error(`Failed to import assets: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // ============================================
    // Location Operations
    // ============================================

    // Transfer asset to new location
    async transferAsset(assetId: string, locationId: string, movedBy: string, reason?: string): Promise<any> {
        try {
            if (!mongoose.Types.ObjectId.isValid(assetId) || !mongoose.Types.ObjectId.isValid(locationId) || !mongoose.Types.ObjectId.isValid(movedBy)) {
                throw new Error('Invalid asset, location, or movedBy ID format');
            }

            const asset = await Asset.findById(assetId);
            if (!asset) {
                throw new Error('Asset not found');
            }

            if (asset.isArchived) {
                throw new Error('Cannot transfer an archived asset');
            }

            // Verify location exists
            const Location = mongoose.model('Location');
            const location = await Location.findById(locationId);
            if (!location) {
                throw new Error('Location not found');
            }

            // Check if already at this location
            if (asset.location && asset.location.equals(new mongoose.Types.ObjectId(locationId))) {
                throw new Error('Asset is already at this location');
            }

            const now = new Date();

            // Add to location history
            asset.locationHistory.push({
                locationId: new mongoose.Types.ObjectId(locationId),
                movedDate: now,
                movedBy: new mongoose.Types.ObjectId(movedBy),
                reason
            });

            // Update current location
            asset.location = new mongoose.Types.ObjectId(locationId);

            await asset.save();
            
            // Return with populated location
            return await Asset.findById(assetId)
                .populate('location', 'name code type building floor')
                .lean();
        } catch (error) {
            throw new Error(`Failed to transfer asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Get asset location history
    async getAssetLocationHistory(assetId: string): Promise<any> {
        try {
            if (!mongoose.Types.ObjectId.isValid(assetId)) {
                throw new Error('Invalid asset ID format');
            }

            const asset = await Asset.findById(assetId)
                .select('name serialNumber assetTag location locationHistory')
                .populate('location', 'name code type building floor')
                .populate('locationHistory.locationId', 'name code type building floor')
                .populate('locationHistory.movedBy', 'name email')
                .lean();

            if (!asset) {
                throw new Error('Asset not found');
            }

            return asset;
        } catch (error) {
            throw new Error(`Failed to get location history: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Get assets by location
    async getAssetsByLocation(locationId: string): Promise<any[]> {
        try {
            if (!mongoose.Types.ObjectId.isValid(locationId)) {
                throw new Error('Invalid location ID format');
            }

            return await Asset.find({ location: locationId, isArchived: { $ne: true } })
                .select('-__v')
                .populate('assignedTo', 'name email department')
                .lean();
        } catch (error) {
            throw new Error(`Failed to get assets by location: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // ============================================
    // Statistics & Reporting
    // ============================================

    // Get asset statistics
    async getAssetStatistics(): Promise<any> {
        try {
            const [
                totalAssets,
                activeAssets,
                archivedAssets,
                byStatus,
                byCategory,
                byCondition
            ] = await Promise.all([
                Asset.countDocuments({ isArchived: { $ne: true } }),
                Asset.countDocuments({ status: 'Active', isArchived: { $ne: true } }),
                Asset.countDocuments({ isArchived: true }),
                Asset.aggregate([
                    { $match: { isArchived: { $ne: true } } },
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ]),
                Asset.aggregate([
                    { $match: { isArchived: { $ne: true } } },
                    { $group: { _id: '$category', count: { $sum: 1 } } }
                ]),
                Asset.aggregate([
                    { $match: { isArchived: { $ne: true } } },
                    { $group: { _id: '$condition', count: { $sum: 1 } } }
                ])
            ]);

            return {
                total: totalAssets,
                active: activeAssets,
                archived: archivedAssets,
                byStatus: Object.fromEntries(byStatus.map(s => [s._id, s.count])),
                byCategory: Object.fromEntries(byCategory.map(c => [c._id, c.count])),
                byCondition: Object.fromEntries(byCondition.map(c => [c._id || 'Unknown', c.count]))
            };
        } catch (error) {
            throw new Error(`Failed to get asset statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export const assetService = new AssetService();
