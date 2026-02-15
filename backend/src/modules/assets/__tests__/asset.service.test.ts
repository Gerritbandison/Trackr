import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import Asset from '../asset.model';
import { AssetService } from '../asset.service';

// Create a fresh service instance for testing
const assetService = new AssetService();

// Helper to create a valid asset
const createTestAsset = (overrides = {}) => ({
    name: 'Test Laptop',
    serialNumber: `SN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    assetTag: `AT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    category: 'Laptops',
    purchaseDate: new Date('2024-01-01'),
    purchasePrice: 1500,
    depreciationType: 'Straight Line' as const,
    usefulLife: 5,
    salvageValue: 100,
    status: 'In Stock' as const,
    condition: 'Excellent' as const,
    ...overrides
});

describe('AssetService', () => {
    describe('Asset Model', () => {
        it('should create an asset with valid data', async () => {
            const assetData = createTestAsset();
            const asset = await Asset.create(assetData);

            expect(asset.name).toBe('Test Laptop');
            expect(asset.category).toBe('Laptops');
            expect(asset.purchasePrice).toBe(1500);
            expect(asset.isArchived).toBe(false);
        });

        it('should require mandatory fields', async () => {
            const asset = new Asset({
                name: 'Test Asset'
            });

            await expect(asset.save()).rejects.toThrow();
        });

        it('should enforce unique serial number', async () => {
            const serialNumber = `SN-UNIQUE-${Date.now()}`;
            
            await Asset.create(createTestAsset({ serialNumber }));
            
            await expect(
                Asset.create(createTestAsset({ serialNumber }))
            ).rejects.toThrow();
        });

        it('should enforce unique asset tag', async () => {
            const assetTag = `AT-UNIQUE-${Date.now()}`;
            
            await Asset.create(createTestAsset({ assetTag }));
            
            await expect(
                Asset.create(createTestAsset({ assetTag }))
            ).rejects.toThrow();
        });

        it('should validate status enum', async () => {
            const asset = new Asset(createTestAsset({ status: 'InvalidStatus' }));
            
            await expect(asset.save()).rejects.toThrow();
        });

        it('should validate condition enum', async () => {
            const asset = new Asset(createTestAsset({ condition: 'InvalidCondition' }));
            
            await expect(asset.save()).rejects.toThrow();
        });

        it('should check warranty status correctly', async () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);
            
            const asset = await Asset.create(createTestAsset({
                warranty: {
                    provider: 'Dell',
                    startDate: new Date(),
                    endDate: futureDate
                }
            }));

            expect(asset.isUnderWarranty()).toBe(true);
        });

        it('should return false for expired warranty', async () => {
            const pastDate = new Date();
            pastDate.setFullYear(pastDate.getFullYear() - 1);
            
            const asset = await Asset.create(createTestAsset({
                warranty: {
                    provider: 'Dell',
                    startDate: new Date('2020-01-01'),
                    endDate: pastDate
                }
            }));

            expect(asset.isUnderWarranty()).toBe(false);
        });
    });

    describe('Soft Delete (Archive)', () => {
        it('should archive an asset', async () => {
            const asset = await Asset.create(createTestAsset());
            const userId = new mongoose.Types.ObjectId().toString();
            
            const archived = await assetService.archiveAsset(
                asset._id.toString(), 
                userId, 
                'No longer needed'
            );

            expect(archived.isArchived).toBe(true);
            expect(archived.archivedAt).toBeDefined();
            expect(archived.archiveReason).toBe('No longer needed');
            expect(archived.status).toBe('Retired');
        });

        it('should not allow archiving already archived asset', async () => {
            const asset = await Asset.create(createTestAsset({ isArchived: true }));
            const userId = new mongoose.Types.ObjectId().toString();

            await expect(
                assetService.archiveAsset(asset._id.toString(), userId)
            ).rejects.toThrow('Asset is already archived');
        });

        it('should restore an archived asset', async () => {
            const asset = await Asset.create(createTestAsset({ 
                isArchived: true,
                archivedAt: new Date(),
                status: 'Retired'
            }));

            const restored = await assetService.restoreAsset(asset._id.toString());

            expect(restored.isArchived).toBe(false);
            expect(restored.archivedAt).toBeUndefined();
            expect(restored.status).toBe('In Stock');
        });

        it('should exclude archived assets from getAssets by default', async () => {
            const activeAsset = await Asset.create(createTestAsset());
            const archivedAsset = await Asset.create(createTestAsset({ isArchived: true }));

            const result = await assetService.getAssets({});

            const ids = result.data.map((a: any) => a._id.toString());
            expect(ids).toContain(activeAsset._id.toString());
            expect(ids).not.toContain(archivedAsset._id.toString());
        });

        it('should not allow updating archived assets', async () => {
            const asset = await Asset.create(createTestAsset({ isArchived: true }));

            await expect(
                assetService.updateAsset(asset._id.toString(), { name: 'Updated Name' })
            ).rejects.toThrow('Cannot update an archived asset');
        });
    });

    describe('Bulk Operations', () => {
        describe('bulkCreate', () => {
            it('should create multiple assets', async () => {
                const assets = [
                    createTestAsset({ name: 'Bulk Asset 1' }),
                    createTestAsset({ name: 'Bulk Asset 2' }),
                    createTestAsset({ name: 'Bulk Asset 3' })
                ];

                const result = await assetService.bulkCreate(assets);

                expect(result.success).toBe(3);
                expect(result.failed).toBe(0);
                expect(result.created).toHaveLength(3);
            });

            it('should handle duplicate serial numbers in batch', async () => {
                const serialNumber = `SN-DUP-${Date.now()}`;
                const assets = [
                    createTestAsset({ serialNumber }),
                    createTestAsset({ serialNumber })
                ];

                await expect(
                    assetService.bulkCreate(assets)
                ).rejects.toThrow('Duplicate serial numbers in batch');
            });

            it('should skip assets with existing serial numbers', async () => {
                const existingAsset = await Asset.create(createTestAsset());
                
                const assets = [
                    createTestAsset({ serialNumber: existingAsset.serialNumber }),
                    createTestAsset({ name: 'New Asset' })
                ];

                const result = await assetService.bulkCreate(assets);

                expect(result.success).toBe(1);
                expect(result.failed).toBe(1);
                expect(result.errors[0]?.error).toContain('Serial number');
            });
        });

        describe('bulkUpdate', () => {
            it('should update multiple assets', async () => {
                const asset1 = await Asset.create(createTestAsset());
                const asset2 = await Asset.create(createTestAsset());

                const updates = [
                    { id: asset1._id.toString(), data: { name: 'Updated 1' } },
                    { id: asset2._id.toString(), data: { name: 'Updated 2' } }
                ];

                const result = await assetService.bulkUpdate(updates);

                expect(result.success).toBe(2);
                expect(result.failed).toBe(0);
                expect(result.updated[0].name).toBe('Updated 1');
                expect(result.updated[1].name).toBe('Updated 2');
            });

            it('should handle non-existent assets', async () => {
                const fakeId = new mongoose.Types.ObjectId().toString();
                const updates = [{ id: fakeId, data: { name: 'Updated' } }];

                const result = await assetService.bulkUpdate(updates);

                expect(result.failed).toBe(1);
                expect(result.errors[0]?.error).toBe('Asset not found');
            });

            it('should skip archived assets', async () => {
                const asset = await Asset.create(createTestAsset({ isArchived: true }));
                const updates = [{ id: asset._id.toString(), data: { name: 'Updated' } }];

                const result = await assetService.bulkUpdate(updates);

                expect(result.failed).toBe(1);
                expect(result.errors[0]?.error).toBe('Cannot update archived asset');
            });
        });

        describe('bulkArchive', () => {
            it('should archive multiple assets', async () => {
                const asset1 = await Asset.create(createTestAsset());
                const asset2 = await Asset.create(createTestAsset());
                const userId = new mongoose.Types.ObjectId().toString();

                const result = await assetService.bulkArchive(
                    [asset1._id.toString(), asset2._id.toString()],
                    userId,
                    'Bulk archival'
                );

                expect(result.success).toBe(2);
                expect(result.archived).toHaveLength(2);

                // Verify assets are actually archived
                const archivedAsset1 = await Asset.findById(asset1._id);
                expect(archivedAsset1?.isArchived).toBe(true);
            });

            it('should skip already archived assets', async () => {
                const asset = await Asset.create(createTestAsset({ isArchived: true }));
                const userId = new mongoose.Types.ObjectId().toString();

                const result = await assetService.bulkArchive([asset._id.toString()], userId);

                expect(result.failed).toBe(1);
                expect(result.errors[0]?.error).toBe('Asset is already archived');
            });
        });
    });

    describe('QR Code Generation', () => {
        it('should generate QR code data for an asset', async () => {
            const asset = await Asset.create(createTestAsset({
                manufacturer: 'Dell',
                modelNumber: 'XPS 15'
            }));

            const qrData = await assetService.generateQRCodeData(
                asset._id.toString(),
                'https://trackr.example.com'
            );

            expect(qrData.assetId).toBe(asset._id.toString());
            expect(qrData.assetTag).toBe(asset.assetTag);
            expect(qrData.serialNumber).toBe(asset.serialNumber);
            expect(qrData.name).toBe('Test Laptop');
            expect(qrData.manufacturer).toBe('Dell');
            expect(qrData.modelNumber).toBe('XPS 15');
            expect(qrData.url).toBe(`https://trackr.example.com/assets/${asset._id}`);
            expect(qrData.generatedAt).toBeDefined();
        });

        it('should throw error for non-existent asset', async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();

            await expect(
                assetService.generateQRCodeData(fakeId)
            ).rejects.toThrow('Asset not found');
        });
    });

    describe('Custom Fields', () => {
        it('should set a custom field on an asset', async () => {
            const asset = await Asset.create(createTestAsset());

            const updated = await assetService.setCustomField(
                asset._id.toString(),
                { key: 'department', value: 'Engineering', type: 'string' }
            );

            expect(updated.customFields).toHaveLength(1);
            expect(updated.customFields![0].key).toBe('department');
            expect(updated.customFields![0].value).toBe('Engineering');
        });

        it('should update existing custom field', async () => {
            const asset = await Asset.create(createTestAsset({
                customFields: [{ key: 'department', value: 'Sales', type: 'string' }]
            }));

            const updated = await assetService.setCustomField(
                asset._id.toString(),
                { key: 'department', value: 'Marketing', type: 'string' }
            );

            expect(updated.customFields).toHaveLength(1);
            expect(updated.customFields![0].value).toBe('Marketing');
        });

        it('should remove a custom field', async () => {
            const asset = await Asset.create(createTestAsset({
                customFields: [
                    { key: 'department', value: 'Engineering', type: 'string' },
                    { key: 'floor', value: 3, type: 'number' }
                ]
            }));

            const updated = await assetService.removeCustomField(
                asset._id.toString(),
                'department'
            );

            expect(updated.customFields).toHaveLength(1);
            expect(updated.customFields![0].key).toBe('floor');
        });

        it('should not allow custom fields on archived assets', async () => {
            const asset = await Asset.create(createTestAsset({ isArchived: true }));

            await expect(
                assetService.setCustomField(
                    asset._id.toString(),
                    { key: 'test', value: 'value', type: 'string' }
                )
            ).rejects.toThrow('Cannot modify archived asset');
        });
    });

    describe('Depreciation Calculations', () => {
        it('should calculate straight line depreciation', async () => {
            const twoYearsAgo = new Date();
            twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

            const asset = await Asset.create(createTestAsset({
                purchaseDate: twoYearsAgo,
                purchasePrice: 1000,
                salvageValue: 100,
                usefulLife: 5,
                depreciationType: 'Straight Line'
            }));

            const depreciation = await assetService.calculateDepreciation(asset._id.toString());

            expect(depreciation).not.toBeNull();
            expect(depreciation!.method).toBe('Straight Line');
            expect(depreciation!.depreciationPerYear).toBe(180); // (1000-100)/5
            expect(depreciation!.ageInYears).toBeCloseTo(2, 0);
            expect(depreciation!.currentValue).toBeCloseTo(640, -1); // 1000 - (180*2)
        });

        it('should calculate double declining depreciation', async () => {
            const twoYearsAgo = new Date();
            twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

            const asset = await Asset.create(createTestAsset({
                purchaseDate: twoYearsAgo,
                purchasePrice: 1000,
                salvageValue: 100,
                usefulLife: 5,
                depreciationType: 'Double Declining'
            }));

            const depreciation = await assetService.calculateDepreciation(asset._id.toString());

            expect(depreciation).not.toBeNull();
            expect(depreciation!.method).toBe('Double Declining');
            // Year 1: 1000 * 0.4 = 400, Value = 600
            // Year 2: 600 * 0.4 = 240, Value = 360
            expect(depreciation!.currentValue).toBeCloseTo(360, -1);
        });

        it('should not depreciate below salvage value', async () => {
            const tenYearsAgo = new Date();
            tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

            const asset = await Asset.create(createTestAsset({
                purchaseDate: tenYearsAgo,
                purchasePrice: 1000,
                salvageValue: 100,
                usefulLife: 5
            }));

            const depreciation = await assetService.calculateDepreciation(asset._id.toString());

            expect(depreciation!.currentValue).toBe(100);
            expect(depreciation!.isFullyDepreciated).toBe(true);
        });
    });

    describe('Assignment Operations', () => {
        it('should assign an asset to a user', async () => {
            const asset = await Asset.create(createTestAsset());
            const userId = new mongoose.Types.ObjectId().toString();
            const assignedBy = new mongoose.Types.ObjectId().toString();

            const assigned = await assetService.assignAsset(
                asset._id.toString(),
                userId,
                assignedBy,
                'New hire equipment'
            );

            expect(assigned.assignedTo._id.toString()).toBe(userId);
            expect(assigned.status).toBe('Active');
        });

        it('should not assign archived asset', async () => {
            const asset = await Asset.create(createTestAsset({ isArchived: true }));
            const userId = new mongoose.Types.ObjectId().toString();
            const assignedBy = new mongoose.Types.ObjectId().toString();

            await expect(
                assetService.assignAsset(asset._id.toString(), userId, assignedBy)
            ).rejects.toThrow('Cannot assign an archived asset');
        });

        it('should not assign already assigned asset', async () => {
            const existingUserId = new mongoose.Types.ObjectId();
            const asset = await Asset.create(createTestAsset({ 
                assignedTo: existingUserId,
                status: 'Active'
            }));
            const newUserId = new mongoose.Types.ObjectId().toString();
            const assignedBy = new mongoose.Types.ObjectId().toString();

            await expect(
                assetService.assignAsset(asset._id.toString(), newUserId, assignedBy)
            ).rejects.toThrow('Asset is already assigned');
        });

        it('should return an assigned asset', async () => {
            const userId = new mongoose.Types.ObjectId();
            const assignedBy = new mongoose.Types.ObjectId();
            
            const asset = await Asset.create(createTestAsset({
                assignedTo: userId,
                assignedDate: new Date(),
                status: 'Active',
                assignmentHistory: [{
                    userId,
                    assignedDate: new Date(),
                    assignedBy
                }]
            }));

            const returned = await assetService.returnAsset(
                asset._id.toString(),
                assignedBy.toString(),
                'End of project'
            );

            expect(returned.assignedTo).toBeUndefined();
            expect(returned.status).toBe('In Stock');
            expect(returned.assignmentHistory[0].returnedDate).toBeDefined();
        });
    });

    describe('Location Operations', () => {
        it('should not transfer archived asset', async () => {
            const asset = await Asset.create(createTestAsset({ isArchived: true }));
            const locationId = new mongoose.Types.ObjectId().toString();
            const movedBy = new mongoose.Types.ObjectId().toString();

            await expect(
                assetService.transferAsset(asset._id.toString(), locationId, movedBy)
            ).rejects.toThrow('Cannot transfer an archived asset');
        });
    });

    describe('Statistics', () => {
        it('should return asset statistics', async () => {
            // Create some test assets
            await Asset.create(createTestAsset({ status: 'Active', category: 'Laptops' }));
            await Asset.create(createTestAsset({ status: 'Active', category: 'Laptops' }));
            await Asset.create(createTestAsset({ status: 'In Stock', category: 'Monitors' }));
            await Asset.create(createTestAsset({ status: 'Repair', category: 'Laptops', isArchived: true }));

            const stats = await assetService.getAssetStatistics();

            expect(stats.total).toBeGreaterThanOrEqual(3);
            expect(stats.active).toBeGreaterThanOrEqual(2);
            expect(stats.archived).toBeGreaterThanOrEqual(1);
            expect(stats.byStatus).toBeDefined();
            expect(stats.byCategory).toBeDefined();
        });
    });

    describe('Query Filtering', () => {
        it('should filter by status', async () => {
            await Asset.create(createTestAsset({ status: 'Active' }));
            await Asset.create(createTestAsset({ status: 'In Stock' }));

            const result = await assetService.getAssets({ status: 'Active' });

            result.data.forEach((asset: any) => {
                expect(asset.status).toBe('Active');
            });
        });

        it('should filter by category', async () => {
            await Asset.create(createTestAsset({ category: 'Laptops' }));
            await Asset.create(createTestAsset({ category: 'Monitors' }));

            const result = await assetService.getAssets({ category: 'Monitors' });

            result.data.forEach((asset: any) => {
                expect(asset.category).toBe('Monitors');
            });
        });

        it('should paginate results', async () => {
            // Create enough assets for pagination
            for (let i = 0; i < 5; i++) {
                await Asset.create(createTestAsset({ name: `Paginated Asset ${i}` }));
            }

            const page1 = await assetService.getAssets({}, { page: 1, limit: 2 });

            expect(page1.data.length).toBeLessThanOrEqual(2);
            expect(page1.page).toBe(1);
            // page1.hasNext may be true or false depending on total assets in test DB
        });
    });
});
